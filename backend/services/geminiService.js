/**
 * services/geminiService.js
 *
 * Every call to the Gemini API goes through this one file — mirrors the
 * same "single point of integration" idea as Project 1's
 * simulateTryOn() in tryOnService.js. If Gemini's SDK or API shape
 * changes, this is the only file that needs to change.
 *
 * TODO: before building against a specific model, verify the exact
 * model identifier in https://aistudio.google.com — read it from
 * process.env.GEMINI_MODEL (see .env.example), never hard-code it.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes a single uploaded outfit photo and returns a structured
 * description (garment types, colors, formality, etc.) that the ADK
 * agents will later use. Result shape is up to you — define it as a
 * Gemini structured-output schema once you know what StyleAnalyst needs.
 *
 * TODO: implement. Saves its own result to Firestore at
 * users/{uid}/photoAnalyses — see config/firestore.js.
 */
export async function analyzeOutfitPhoto(uid, imageBase64) {
  throw new Error("analyzeOutfitPhoto not implemented yet");
}

/**
 * Takes a recorded audio clip (from the frontend's MediaRecorder,
 * see the frontend TODO in useVoiceRecorder) and returns a structured
 * style request: what the user is asking for, any budget/occasion/
 * weather constraints mentioned, etc.
 *
 * TODO: implement. Saves its own result to Firestore at
 * users/{uid}/styleRequests.
 */
export async function parseVoiceRequest(uid, audioBase64) {
  throw new Error("parseVoiceRequest not implemented yet");
}
