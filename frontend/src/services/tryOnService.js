/**
 * tryOnService.js
 *
 * Isolates the "virtual try-on" operation behind a single function,
 * `requestTryOn`, so the rest of the app never calls the backend's
 * /api/try-on endpoint directly.
 *
 * This is REAL: one call to the backend, which calls Vertex AI's
 * Virtual Try-On model (backend/services/virtualTryOnService.js) and
 * returns one generated image of the uploaded photo wearing the
 * selected product. The model has no "angle" parameter -- it only
 * redresses whatever pose is already in the photo you give it -- so
 * this is intentionally a single front-on result, not a fake rotation.
 * The Fitting Room's "rotate" effect on the Stage (TryOnPanel.jsx) is
 * a CSS mouse-tilt on this one real image, not a second/third angle.
 *
 * NOTE: this is a real, billed Vertex AI call -- that's part of why
 * /api/try-on requires sign-in (routes/tryOn.js), same as generating
 * looks or running StyleScout.
 */
import { apiFetch } from "./apiClient.js";

export async function requestTryOn({ idToken, photo, product }) {
  if (!photo) {
    throw new Error("A photo is required to try something on");
  }

  try {
    const { imageBase64, mimeType } = await apiFetch("/api/try-on", {
      idToken,
      method: "POST",
      body: JSON.stringify({
        personImageBase64: toBase64Body(photo),
        productImageUrl: product.image,
      }),
    });
    return { success: true, imageDataUrl: `data:${mimeType};base64,${imageBase64}` };
  } catch (err) {
    // The Stage shows this error in place of the generated image
    // (e.g. Vertex AI's safety filter declined this specific photo).
    return { success: false, error: err.message };
  }
}

/**
 * PhotoUploader.jsx stores the photo as a full data URL
 * ("data:image/jpeg;base64,/9j/4AAQ..."), but the backend/Vertex AI
 * only wants the base64 payload itself -- this strips the data URL
 * prefix off.
 */
function toBase64Body(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}
