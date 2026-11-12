/**
 * tryOnService.js
 *
 * This file isolates the "virtual try-on" operation behind a single
 * function, `requestMultiAngleTryOn`, so the rest of the app never
 * calls the backend's /api/try-on endpoint directly.
 *
 * This is now REAL: each angle (front, plus side/back if the user
 * supplied those photos too) is one call to the backend, which calls
 * Vertex AI's Virtual Try-On model (backend/services/
 * virtualTryOnService.js) and returns one generated image. There is no
 * "angle" the model can be asked for -- it only redresses whatever
 * pose is already in the photo you give it -- so a genuine
 * front/side/back result means one real call PER angle-photo the user
 * actually uploaded (see PhotoUploader.jsx's optional side/back
 * slots), not one call pretending to rotate a single photo.
 *
 * Calls run in parallel (Promise.all) rather than one-after-another --
 * each call measured around 30s on its own in Google's own docs, so
 * three sequential calls could take 90s; running them together keeps
 * the total wait close to whatever the slowest single one takes.
 *
 * NOTE: this is a real, billed Vertex AI call per angle -- that's part
 * of why /api/try-on requires sign-in (routes/tryOn.js), same as
 * generating looks or running StyleScout.
 */
import { apiFetch } from "./apiClient.js";

/**
 * `photos` is { front, side, back } -- data URL strings or null/undefined
 * for angles the user didn't supply. `front` is required; `side`/`back`
 * are optional and simply don't appear in the result if omitted.
 */
export async function requestMultiAngleTryOn({ idToken, photos, product }) {
  if (!photos?.front) {
    throw new Error("A front photo is required to try something on");
  }

  const anglesToRequest = [
    { key: "front", label: "Front", photo: photos.front },
    { key: "side", label: "Side", photo: photos.side },
    { key: "back", label: "Back", photo: photos.back },
  ].filter((angle) => Boolean(angle.photo));

  const results = await Promise.all(
    anglesToRequest.map(async (angle) => {
      try {
        const { imageBase64, mimeType } = await apiFetch("/api/try-on", {
          idToken,
          method: "POST",
          body: JSON.stringify({
            personImageBase64: toBase64Body(angle.photo),
            productImageUrl: product.image,
          }),
        });
        return { key: angle.key, label: angle.label, imageDataUrl: `data:${mimeType};base64,${imageBase64}` };
      } catch (err) {
        // One angle failing (e.g. Vertex AI's safety filter declines
        // that specific photo) shouldn't take down the other angles --
        // this one just shows its own error instead of an image.
        return { key: angle.key, label: angle.label, error: err.message };
      }
    })
  );

  return { success: true, angles: results };
}

/**
 * PhotoUploader.jsx stores photos as full data URLs
 * ("data:image/jpeg;base64,/9j/4AAQ..."), but the backend/Vertex AI
 * only wants the base64 payload itself -- this strips the data URL
 * prefix off.
 */
function toBase64Body(dataUrl) {
  const commaIndex = dataUrl.indexOf(",");
  return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
}
