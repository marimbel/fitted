/**
 * routes/audio.js
 *
 * POST /api/audio/parse
 *   Body: { audioBase64, mimeType } — a clip recorded live by the frontend's
 *   useVoiceRecorder (MediaRecorder API). The clip is checked (missing,
 *   unsupported format, damaged, too large/short), parsed by Gemini, and
 *   Gemini's answer is checked before it is returned as { styleRequest }.
 *   Errors are { error } with a plain-language message:
 *   400 bad/missing/short audio, 413 too large, 415 unsupported format,
 *   422 no speech heard, 429 Gemini busy, 502 Gemini failed/unreadable.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { parseVoiceRequest } from "../services/geminiService.js";

const router = Router();

const AUDIO_TYPES = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3", "audio/aac", "audio/flac"];
const MAX_BYTES = 10 * 1024 * 1024; // a 60s clip is under 2 MB; this also fits app.js's 15 MB body limit
const MIN_BYTES = 1000;

// Allow unsigned requests only when local testing is explicitly enabled.
const allowLocalVoiceTesting = process.env.AUDIO_DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production";

// Returns [status, message] if the upload is unusable, otherwise null.
function checkUpload(audioBase64, type) {
  if (typeof audioBase64 !== "string" || !audioBase64) return [400, "No recording was received. Please record again."];
  if (!AUDIO_TYPES.includes(type)) return [415, `This audio format (${type || "unknown"}) isn't supported. Please record again in Chrome or Safari.`];
  if (audioBase64.length % 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) return [400, "The recording appears to be damaged. Please record again."];
  const bytes = Buffer.byteLength(audioBase64, "base64");
  if (bytes > MAX_BYTES) return [413, "This recording is too large (limit 10 MB). Try a shorter recording."];
  if (bytes < MIN_BYTES) return [400, "That recording was too short to understand. Please record again."];
  return null;
}

const cleanList = (list) => (Array.isArray(list) ? list.filter((item) => typeof item === "string" && item.trim()) : []);

router.post("/parse", allowLocalVoiceTesting ? (req, _res, next) => {
  req.user = { uid: "local-dev" };
  next();
} : verifyGoogleToken, async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  const type = String(mimeType || "").split(";")[0].trim().toLowerCase(); // drop ";codecs=..."
  const problem = checkUpload(audioBase64, type);
  if (problem) return res.status(problem[0]).json({ error: problem[1] });

  let result;
  try {
    result = await parseVoiceRequest(req.user.uid, audioBase64, type);
  } catch (err) {
    console.error("Voice request parsing failed:", err.message); // real reason stays in the server log
    if (err.status === 429 || /\b429\b|quota|rate.?limit/i.test(err.message)) {
      return res.status(429).json({ error: "Gemini is busy right now. Wait a moment and try again." });
    }
    const unreadable = err instanceof SyntaxError;
    return res.status(502).json({
      error: unreadable ? "Gemini sent back something we couldn't read. Please try again." : "We couldn't process your recording with Gemini. Please try again.",
    });
  }

  if (typeof result?.rawTranscript !== "string") {
    return res.status(502).json({ error: "Gemini sent back something we couldn't read. Please try again." });
  }
  if (!result.rawTranscript.trim()) {
    return res.status(422).json({ error: "We couldn't hear any speech in that recording. Please record again, closer to your microphone." });
  }
  res.json({ styleRequest: { ...result, budget: result.budget > 0 ? result.budget : 0, mustHaves: cleanList(result.mustHaves), avoid: cleanList(result.avoid) } });
});

export default router;
