/**
 * routes/photos.js
 *
 * POST /api/photos/analyze
 *   Body: { mediaItemIds: string[] } (from the frontend's Google Photos
 *   Picker session) or { imageBase64 } for a direct upload fallback.
 *   Fetches the photo(s) via googlePhotosService, runs them through
 *   geminiService.analyzeOutfitPhoto, and returns the saved analysis.
 *
 * TODO: implement the route body once googlePhotosService and
 * geminiService are filled in. Keep this route thin — it should mostly
 * just call those two services and shape the response.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";

const router = Router();

router.post("/analyze", verifyGoogleToken, async (req, res) => {
  res.status(501).json({ error: "POST /api/photos/analyze not implemented yet" });
});

export default router;
