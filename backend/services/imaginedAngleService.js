/**
 * services/imaginedAngleService.js
 *
 * Generates a SPECULATIVE side or back view of a person from their real
 * front Virtual Try-On result (services/virtualTryOnService.js). This
 * is deliberately NOT presented as a real photo: there is no Google API
 * that can derive an actual side/back view of a specific person from a
 * single front photo (see virtualTryOnService.js's doc comment), so
 * this asks Gemini's image generation to imagine a plausible one
 * instead -- the frontend labels every image this produces
 * "AI-imagined" (see TryOnPanel.jsx), never as an actual photo.
 *
 * Uses the same Gemini SDK (`@google/generative-ai`) and
 * `GEMINI_API_KEY` as every other Gemini call in the app
 * (services/geminiService.js) -- image OUTPUT needs a model that
 * supports it and `responseModalities: ["Text", "Image"]`, which is
 * why this doesn't go through generateStructured() (that helper is
 * built around Gemini returning JSON, not image bytes).
 *
 * TODO (per the same README caveat as GEMINI_MODEL): verify
 * GEMINI_IMAGE_MODEL is still a valid, available model id in
 * https://aistudio.google.com before the demo -- image-generation
 * model names and availability change faster than the text models.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { trackServerEvent } from "./analyticsService.js";
import { logApiCall } from "./loggingService.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const ANGLE_PROMPTS = {
  side: "Imagine and generate a plausible image of this exact same person, wearing " +
    "the exact same outfit, as seen from a side (profile) view instead of the front. " +
    "Keep the same person, the same garment, the same stage backdrop and lighting style " +
    "-- you are inventing a reasonable side view, not changing who they are or what " +
    "they're wearing.",
  back: "Imagine and generate a plausible image of this exact same person, wearing " +
    "the exact same outfit, as seen from directly behind instead of the front. " +
    "Keep the same person's build, hair, and the same garment and stage backdrop/" +
    "lighting style -- you are inventing a reasonable back view, not changing who " +
    "they are or what they're wearing.",
};

/**
 * `frontImageBase64` is the real Virtual Try-On result (no data-URL
 * prefix). `angle` is "side" or "back". Returns { imageBase64, mimeType }
 * -- same shape as virtualTryOnService.generateTryOnImage, so the
 * frontend's handling code doesn't need to know which one produced a
 * given result, only whether it's labeled real or imagined.
 */
export async function generateImaginedAngle({ frontImageBase64, mimeType = "image/png", angle }, deps = {}) {
  if (!frontImageBase64 || !angle) {
    throw new Error("frontImageBase64 and angle are required");
  }
  const prompt = ANGLE_PROMPTS[angle];
  if (!prompt) {
    throw new Error(`Unknown angle "${angle}" -- expected "side" or "back"`);
  }

  const generate =
    deps.generate ||
    (async (parts) => {
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
        generationConfig: { responseModalities: ["Text", "Image"] },
      });
      const result = await model.generateContent(parts);
      return result.response;
    });

  const startedAt = Date.now();
  try {
    const response = await generate([
      { inlineData: { data: frontImageBase64, mimeType } },
      { text: prompt },
    ]);

    const parts = response?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part) => part.inlineData);
    if (!imagePart) {
      throw new Error("Gemini didn't return an image for this angle -- it may have declined the request.");
    }

    const durationMs = Date.now() - startedAt;
    await Promise.all([
      trackServerEvent("gemini_api_call", { label: `ImaginedAngle:${angle}`, duration_ms: durationMs, status: "success" }),
      logApiCall({ source: "backend", api: "gemini", event: `ImaginedAngle:${angle}`, detail: { durationMs, status: "success" } }),
    ]);

    return { imageBase64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || "image/png" };
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    await Promise.all([
      trackServerEvent("gemini_api_call", { label: `ImaginedAngle:${angle}`, duration_ms: durationMs, status: "error" }),
      logApiCall({ source: "backend", api: "gemini", event: `ImaginedAngle:${angle}`, detail: { durationMs }, error: err.message }),
    ]);
    throw err;
  }
}
