/**
 * routes/tryOn.js
 *
 * POST /api/try-on
 *   Body: { personImageBase64, productImageUrl }
 *   Runs the real Vertex AI Virtual Try-On model (services/
 *   virtualTryOnService.js) and returns one generated image. Signed-in
 *   only, like StyleScout and look generation -- this is a real,
 *   billed Vertex AI call, not a free endpoint.
 *
 * Takes the product's image URL directly (not a product id), so it
 * works identically whether the product came from Fitted's own
 * curated catalog (data/products.js) or the live Shop page (Shopify
 * Mock Shop, routes/shop.js) -- this route doesn't need to know or
 * care which catalog a product came from.
 *
 * See services/virtualTryOnService.js's doc comment for an important
 * limitation: one call produces ONE image following whatever pose is
 * in personImageBase64 -- there's no "angle" parameter. Genuine
 * front/side/back results mean calling this once per angle-photo the
 * user supplies (frontend/src/services/tryOnService.js does this).
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { generateTryOnImage } from "../services/virtualTryOnService.js";
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

export default router;
