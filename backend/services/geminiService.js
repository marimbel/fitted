/**
 * services/geminiService.js
 *
 * Every call to the Gemini API goes through this one file — mirrors the
 * same "single point of integration" idea as Project 1's
 * simulateTryOn() in tryOnService.js. If Gemini's SDK or API shape
 * changes, this is the only file that needs to change.
 *
 * The model name is read from process.env.GEMINI_MODEL (see
 * .env.example), never hard-coded — per the proposal review, verify the
 * exact model identifier in https://aistudio.google.com before the demo.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../config/firestore.js";
import { photoAnalysisSchema, styleRequestSchema } from "../agents/schemas.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Shared low-level helper: call Gemini with multimodal input and get
 * back JSON guaranteed to match `schema`. Used both by this file (photo
 * + audio analysis) and by agents/stylistPipeline.js (StyleAnalyst,
 * LookBuilder, LookCritic) — every structured Gemini call in the app
 * goes through this one function.
 */
export async function generateStructured(parts, schema) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const result = await model.generateContent(parts);
  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * Analyzes a single uploaded/picked outfit photo and returns a
 * structured description (garment types, colors, formality, etc.) that
 * the ADK agents will later use as part of the user's "Style DNA".
 *
 * imageBase64 is the raw base64 image data (no "data:image/...;base64,"
 * prefix — strip that on the frontend before sending).
 */
export async function analyzeOutfitPhoto(uid, imageBase64, mimeType = "image/jpeg") {
  const prompt =
    "You are a fashion stylist analyzing a photo of a person's outfit or " +
    "personal style. Describe the garments you see, the dominant colors, " +
    "how formal the outfit is on a 1-5 scale, a few style keywords " +
    "(e.g. 'minimalist', 'streetwear', 'preppy'), and any notes useful for " +
    "recommending future outfits in a similar style.";

  const analysis = await generateStructured(
    [{ inlineData: { data: imageBase64, mimeType } }, { text: prompt }],
    photoAnalysisSchema
  );

  const docRef = await db.collection(`users/${uid}/photoAnalyses`).add({
    ...analysis,
    analyzedAt: new Date().toISOString(),
  });

  return { id: docRef.id, ...analysis };
}

/**
 * Takes a recorded audio clip (from the frontend's useVoiceRecorder,
 * which wraps the browser's MediaRecorder API) and returns a structured
 * style request: what the user is asking for, plus any budget/occasion/
 * weather constraints they mentioned.
 *
 * audioBase64 is the raw base64 audio data, no data-URL prefix.
 */
export async function parseVoiceRequest(uid, audioBase64, mimeType = "audio/webm") {
  const prompt =
    "Listen to this voice recording of someone describing what they want " +
    "to wear. Transcribe it, then extract: the occasion, a budget in USD " +
    "(0 if not mentioned), a list of things they specifically want " +
    "(mustHaves), a list of things to avoid, how formal the outfit should " +
    "be on a 1-5 scale, and the weather/season they mentioned (empty " +
    "string if not mentioned).";

  const styleRequest = await generateStructured(
    [{ inlineData: { data: audioBase64, mimeType } }, { text: prompt }],
    styleRequestSchema
  );

  const docRef = await db.collection(`users/${uid}/styleRequests`).add({
    ...styleRequest,
    parsedAt: new Date().toISOString(),
  });

  return { id: docRef.id, ...styleRequest };
}
