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
import { trackServerEvent } from "./analyticsService.js";
import { logApiCall } from "./loggingService.js";

const PICKER_API_BASE = "https://photospicker.googleapis.com/v1";

// `label` names the call for analytics/logs (e.g. "CreateSession"); `uid`
// ties the GA4 event to a real user (routes/photos.js passes
// req.user.uid, set by verifyGoogleToken). Every Picker API call funnels
// through this one function, same idea as geminiService.generateStructured.
async function pickerFetch(path, accessToken, options = {}, label = "PickerCall", uid = "server") {
  const startedAt = Date.now();
  try {
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
    const data = await response.json();
    const durationMs = Date.now() - startedAt;
    await Promise.all([
      trackServerEvent("photos_picker_api_call", { label, duration_ms: durationMs, status: "success" }, uid),
      logApiCall({ source: "backend", api: "googlePhotosPicker", event: label, detail: { durationMs, status: "success" } }),
    ]);
    return data;
  } catch (err) {
    const durationMs = Date.now() - startedAt;
    await Promise.all([
      trackServerEvent("photos_picker_api_call", { label, duration_ms: durationMs, status: "error" }, uid),
      logApiCall({ source: "backend", api: "googlePhotosPicker", event: label, detail: { durationMs }, error: err.message }),
    ]);
    throw err;
  }
}

/** Creates a new picking session. The frontend opens `pickerUri` in a
 * popup so the user can choose photos in Google's own UI. */
export async function createPickingSession(accessToken, uid = "server") {
  return pickerFetch("/sessions", accessToken, { method: "POST", body: "{}" }, "CreateSession", uid);
}

/** Polls a session's status. `mediaItemsSet` becomes true once the user
 * has finished picking in the popup. */
export async function getSession(accessToken, sessionId, uid = "server") {
  return pickerFetch(`/sessions/${sessionId}`, accessToken, {}, "GetSession", uid);
}

/** Lists the media items the user picked in a finished session. */
export async function listPickedMediaItems(accessToken, sessionId, uid = "server") {
  const data = await pickerFetch(
    `/mediaItems?sessionId=${encodeURIComponent(sessionId)}`,
    accessToken,
    {},
    "ListMediaItems",
    uid
  );
  return data.mediaItems || [];
}

/**
 * Downloads the actual bytes for each picked media item and returns
 * them as base64 — ready to hand straight to
 * geminiService.analyzeOutfitPhoto(). Picker API media items carry a
 * `baseUrl` that must be requested with a width/height or download
 * parameter (`=d` for the original file) and the same access token.
 */
export async function fetchPickedPhotos(accessToken, mediaItems, uid = "server") {
  const photos = [];
  for (const item of mediaItems) {
    const baseUrl = item.mediaFile?.baseUrl;
    const mimeType = item.mediaFile?.mimeType || "image/jpeg";
    if (!baseUrl) continue;

    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}=d`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const durationMs = Date.now() - startedAt;

    if (!response.ok) {
      await Promise.all([
        trackServerEvent("photos_picker_api_call", { label: "DownloadPhoto", duration_ms: durationMs, status: "error" }, uid),
        logApiCall({ source: "backend", api: "googlePhotosPicker", event: "DownloadPhoto", detail: { durationMs }, error: `HTTP ${response.status}` }),
      ]);
      continue;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    photos.push({ mimeType, base64: buffer.toString("base64") });

    await Promise.all([
      trackServerEvent("photos_picker_api_call", { label: "DownloadPhoto", duration_ms: durationMs, status: "success" }, uid),
      logApiCall({ source: "backend", api: "googlePhotosPicker", event: "DownloadPhoto", detail: { durationMs, status: "success" } }),
    ]);
  }
  return photos;
}
