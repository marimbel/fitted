/**
 * routes/audio.js
 *
 * POST /api/audio/parse
 *   Body: { audioBase64, mimeType } — a recorded clip from the
 *   frontend's useVoiceRecorder (MediaRecorder API). Runs it through
 *   geminiService.parseVoiceRequest and returns the structured result.
 *
 * Reminder from the spec: a fixed set of pre-recorded audio files does
 * NOT satisfy the "audio content" requirement — this must be recorded
 * live by the user (which is what useVoiceRecorder does).
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { parseVoiceRequest } from "../services/geminiService.js";

const router = Router();

// Allow unsigned requests only when local testing is explicitly enabled.
const allowLocalVoiceTesting = process.env.AUDIO_DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";

router.post("/parse", allowLocalVoiceTesting ? (req, _res, next) => {
  req.user = { uid: "local-dev" };
  next();
} : verifyGoogleToken, async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    // Make sure the request contains audio before asking Gemini to parse it.
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 is required" });

    const styleRequest = await parseVoiceRequest(req.user.uid, audioBase64, mimeType);
    res.json({ styleRequest });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
