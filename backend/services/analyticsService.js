/**
 * services/analyticsService.js
 *
 * Server-side half of the GA4 "Analytics Implementation & Comparison"
 * requirement. The frontend (src/services/analytics.js) tracks what
 * happens in the browser using the react-ga4 SDK; this file tracks
 * what happens on the server -- most importantly, every Gemini API
 * call -- using GA4's Measurement Protocol, which is just a plain
 * HTTPS POST (no SDK needed), since GA4's own SDKs are browser/mobile
 * only.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 *
 * Comparing this file with src/services/analytics.js is the "Analytics
 * & Comparison" part of the assignment: client-side events can be lost
 * (ad blockers, the tab closing mid-request, JS errors) in a way
 * server-side events can't, but server-side events don't have a real
 * per-visitor client_id to tie events to a session the way the browser
 * SDK automatically does -- see the Analytics&Logging report for the
 * full writeup.
 */
import axios from "axios";

const MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID;
const API_SECRET = process.env.GA4_API_SECRET;
const GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect";

/**
 * Sends one event to GA4 via the Measurement Protocol. `clientId`
 * identifies the "visitor" for GA4's reports -- we use the Google
 * account's uid when we have one (signed-in requests), or a fixed
 * "server" id for calls that aren't tied to a particular user yet.
 *
 * This never throws into the caller: analytics failing is not a
 * reason to fail the actual API request it's describing, so any error
 * is only logged to the console.
 */
export async function trackServerEvent(eventName, params = {}, clientId = "server") {
  if (!MEASUREMENT_ID || !API_SECRET) {
    // Analytics isn't configured yet (e.g. local dev before the GA4
    // property exists) -- skip silently rather than erroring.
    return;
  }

  try {
    await axios.post(
      `${GA4_ENDPOINT}?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        client_id: clientId,
        events: [{ name: eventName, params }],
      }
    );
  } catch (err) {
    console.error(`[analytics] failed to send GA4 event "${eventName}":`, err.message);
  }
}
