/**
 * routes/photos.js
 *
 * All routes here are protected by verifyGoogleToken, which checks the
 * Google ID token (Authorization header) and sets req.user. The
 * *separate* Google OAuth access token needed for the Photos Picker API
 * itself is sent in the request body as `accessToken` — see the comment
 * in middleware/verifyGoogleToken.js for why these are two different
 * tokens.
 *
 * POST /api/photos/session        -> create a new Picker session
 * GET  /api/photos/session/:id    -> poll a session's status
 * POST /api/photos/analyze        -> fetch picked photos + run Gemini
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import {
  createPickingSession,
  getSession,
  listPickedMediaItems,
  fetchPickedPhotos,
} from "../services/googlePhotosService.js";
import { analyzeOutfitPhoto } from "../services/geminiService.js";

const router = Router();

router.post("/session", verifyGoogleToken, async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ error: "accessToken is required" });

    const session = await createPickingSession(accessToken);
    res.json({ id: session.id, pickerUri: session.pickerUri, mediaItemsSet: session.mediaItemsSet });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get("/session/:id", verifyGoogleToken, async (req, res) => {
  try {
    const { accessToken } = req.query;
    if (!accessToken) return res.status(400).json({ error: "accessToken query param is required" });

    const session = await getSession(accessToken, req.params.id);
    res.json({ id: session.id, mediaItemsSet: Boolean(session.mediaItemsSet) });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post("/analyze", verifyGoogleToken, async (req, res) => {
  try {
    const { accessToken, sessionId } = req.body;
    if (!accessToken || !sessionId) {
      return res.status(400).json({ error: "accessToken and sessionId are required" });
    }

    const mediaItems = await listPickedMediaItems(accessToken, sessionId);
    const photos = await fetchPickedPhotos(accessToken, mediaItems);

    const analyses = [];
    for (const photo of photos) {
      const analysis = await analyzeOutfitPhoto(req.user.uid, photo.base64, photo.mimeType);
      // Include a small preview so the frontend can show the picked
      // photo without re-fetching it from Google.
      analyses.push({ ...analysis, previewBase64: photo.base64, mimeType: photo.mimeType });
    }

    res.json({ analyses });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
