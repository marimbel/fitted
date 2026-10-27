/**
 * routes/audio.js
 *
 * POST /api/audio/parse
 *   Body: { audioBase64 } — a recorded clip from the frontend's
 *   useVoiceRecorder (MediaRecorder API). Runs it through
 *   geminiService.parseVoiceRequest and returns the structured result.
 *
 * Reminder from the spec: a fixed set of pre-recorded audio files does
 * NOT satisfy the "audio content" requirement — this must be either
 * recorded live by the user or pulled from a SocialNetwork source.
 *
 * TODO: implement once geminiService.parseVoiceRequest is filled in.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";

const router = Router();

router.post("/parse", verifyGoogleToken, async (req, res) => {
  res.status(501).json({ error: "POST /api/audio/parse not implemented yet" });
});

export default router;
