/**
 * routes/tryOn.js
 *
 * POST /api/try-on
 *   Body: { personImageBase64, productImageUrl }
 *   Runs the real Vertex AI Virtual Try-On model (services/
 *   virtualTryOnService.js) and returns one real generated image, in
 *   whatever pose was in personImageBase64 -- there's no "angle"
 *   parameter on this model, so this always produces a front-on result
 *   when given a front photo.
 *
 *   Takes the product's image URL directly (not a product id), so it
 *   works identically whether the product came from Fitted's own
 *   curated catalog (data/products.js) or the live Shop page (Shopify
 *   Mock Shop, routes/shop.js) -- this route doesn't need to know or
 *   care which catalog a product came from.
 *
 * POST /api/try-on/imagine-angle
 *   Body: { frontImageBase64, mimeType, angle }  (angle: "side" | "back")
 *   Runs services/imaginedAngleService.js -- Gemini SPECULATIVELY
 *   imagining what that same person/outfit might look like from the
 *   given angle, since no API can derive a real one from a single
 *   front photo. The frontend (TryOnPanel.jsx) always labels whatever
 *   this returns "AI-imagined," never as a real photo.
 *
 * Both routes are signed-in only, like StyleScout and look generation
 * -- these are real, billed Gemini/Vertex AI calls, not free endpoints.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { generateTryOnImage } from "../services/virtualTryOnService.js";
import { generateImaginedAngle } from "../services/imaginedAngleService.js";
import { fetchImageAsBase64 } from "../utils/fetchImage.js";

const router = Router();

router.post("/", verifyGoogleToken, async (req, res) => {
  try {
    const { personImageBase64, productImageUrl } = req.body;
    if (!personImageBase64 || !productImageUrl) {
      return res.status(400).json({ error: "personImageBase64 and productImageUrl are required" });
    }

    const productImageBase64 = await fetchImageAsBase64(productImageUrl);
    const result = await generateTryOnImage({ personImageBase64, productImageBase64 });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post("/imagine-angle", verifyGoogleToken, async (req, res) => {
  try {
    const { frontImageBase64, mimeType, angle } = req.body;
    if (!frontImageBase64 || !angle) {
      return res.status(400).json({ error: "frontImageBase64 and angle are required" });
    }

    const result = await generateImaginedAngle({ frontImageBase64, mimeType, angle });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
