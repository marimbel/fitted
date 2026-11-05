/**
 * services/logger.js
 *
 * Frontend half of the "Google Cloud Logging" requirement. The Cloud
 * Logging SDK (backend/services/loggingService.js) only runs in
 * Node, not the browser, so the frontend can't write to Cloud Logging
 * directly -- instead it POSTs to the backend's /api/logs relay
 * (backend/routes/logs.js), which forwards into the same log stream,
 * tagged source: "frontend".
 *
 * Deliberately fire-and-forget: a logging call failing (offline,
 * backend down) should never interrupt whatever the user was actually
 * doing, so every call here swallows its own errors.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function send(event, detail, error) {
  fetch(`${API_BASE}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, detail, error }),
  }).catch(() => {
    // Logging the app's own logging failure would just recurse --
    // nothing useful to do here but drop it.
  });
}

/** Logs a normal, informational event (e.g. "photo_uploaded"). */
export function logEvent(event, detail = {}) {
  send(event, detail, null);
}

/** Logs an error, e.g. a failed API call the user hit in the UI. */
export function logError(event, error, detail = {}) {
  send(event, detail, error?.message || String(error));
}
