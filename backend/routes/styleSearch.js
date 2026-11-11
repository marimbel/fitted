/**
 * routes/styleSearch.js
 *
 * POST /api/style-search
 *   Body: { imageBase64, styleDna?, styleRequest? }
 *   Runs the StyleScout agent (agents/styleScout.js): embeds the
 *   uploaded reference photo with Vertex AI's multimodal embeddings
 *   model, ranks the product catalog by visual similarity, then has
 *   Gemini curate and explain the best matches.
 *
 * Mirrors routes/looks.js's auth pattern -- this is a signed-in-only
 * feature, same as look generation.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { runStyleScout } from "../agents/styleScout.js";

const router = Router();

router.post("/", verifyGoogleToken, async (req, res) => {
  try {
    const { imageBase64, styleDna, styleRequest } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const result = await runStyleScout({
      queryImage: { imageBase64 },
      styleDna,
      styleRequest,
      uid: req.user.uid,
    });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
