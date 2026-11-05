/**
 * services/loggingService.js
 *
 * The "Google Cloud Logging" requirement: every call this backend
 * makes to an external API (Gemini, Google Photos Picker) is logged
 * here, in addition to being tracked as a GA4 event
 * (analyticsService.js). The two are different things: GA4 answers
 * "how often / by whom", Cloud Logging answers "what exactly happened
 * on this one request" -- request/response shape, timing, errors --
 * which is what the report's Google Logging section asks to show.
 *
 * Uses Application Default Credentials, same as config/firestore.js --
 * no separate API key, just the `roles/logging.logWriter` permission
 * on whichever service account the backend runs as (the default Cloud
 * Run compute service account has this by default in a new project).
 */
import { Logging } from "@google-cloud/logging";

const logging = new Logging({ projectId: process.env.GCP_PROJECT_ID });
const log = logging.log("fitted-api-requests");

/**
 * Writes one structured log entry. `source` is "backend" for calls
 * this server makes directly (Gemini, Photos Picker) or "frontend" for
 * entries relayed from the browser through POST /api/logs (see
 * routes/logs.js) -- that distinction is what lets the report's
 * section 2.1 (frontend) and 2.2 (backend) pull separate log views
 * from the same log stream.
 *
 * Never throws into the caller, for the same reason as
 * analyticsService.trackServerEvent: a logging failure should never be
 * the reason a real request fails.
 */
export async function logApiCall({ source = "backend", api, event, detail = {}, error = null }) {
  try {
    const metadata = {
      resource: { type: "global" },
      severity: error ? "ERROR" : "INFO",
    };
    const entry = log.entry(metadata, {
      source,
      api,
      event,
      detail,
      error: error || undefined,
      loggedAt: new Date().toISOString(),
    });
    await log.write(entry);
  } catch (err) {
    console.error(`[logging] failed to write Cloud Logging entry for "${api}/${event}":`, err.message);
  }
}
