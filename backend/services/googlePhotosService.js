/**
 * services/googlePhotosService.js
 *
 * Wraps the Google Photos Picker API. The Picker itself is a frontend
 * flow (the user picks photos in a Google-hosted popup window); this
 * file is what the backend uses to create that picking session and,
 * once the user has picked, fetch the actual photo bytes.
 *
 * Docs: https://developers.google.com/photos/picker/guides/get-started
 *
 * Every call needs the user's Google OAuth *access* token for the
 * `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`
 * scope — a different token from the ID token verifyGoogleToken.js
 * checks (see that file's comment). The frontend gets this access
 * token from Google Identity Services' separate token client and sends
 * it in the request body, never in the Authorization header.
 */
const PICKER_API_BASE = "https://photospicker.googleapis.com/v1";

async function pickerFetch(path, accessToken, options = {}) {
  const response = await fetch(`${PICKER_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Photos Picker API ${path} failed (${response.status}): ${body}`);
  }
  return response.json();
}

/** Creates a new picking session. The frontend opens `pickerUri` in a
 * popup so the user can choose photos in Google's own UI. */
export async function createPickingSession(accessToken) {
  return pickerFetch("/sessions", accessToken, { method: "POST", body: "{}" });
}

/** Polls a session's status. `mediaItemsSet` becomes true once the user
 * has finished picking in the popup. */
export async function getSession(accessToken, sessionId) {
  return pickerFetch(`/sessions/${sessionId}`, accessToken);
}

/** Lists the media items the user picked in a finished session. */
export async function listPickedMediaItems(accessToken, sessionId) {
  const data = await pickerFetch(`/mediaItems?sessionId=${encodeURIComponent(sessionId)}`, accessToken);
  return data.mediaItems || [];
}

/**
 * Downloads the actual bytes for each picked media item and returns
 * them as base64 — ready to hand straight to
 * geminiService.analyzeOutfitPhoto(). Picker API media items carry a
 * `baseUrl` that must be requested with a width/height or download
 * parameter (`=d` for the original file) and the same access token.
 */
export async function fetchPickedPhotos(accessToken, mediaItems) {
  const photos = [];
  for (const item of mediaItems) {
    const baseUrl = item.mediaFile?.baseUrl;
    const mimeType = item.mediaFile?.mimeType || "image/jpeg";
    if (!baseUrl) continue;

    const response = await fetch(`${baseUrl}=d`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) continue;

    const buffer = Buffer.from(await response.arrayBuffer());
    photos.push({ mimeType, base64: buffer.toString("base64") });
  }
  return photos;
}
