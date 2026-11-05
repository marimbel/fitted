/**
 * services/analytics.js
 *
 * Client-side half of the GA4 "Analytics Implementation & Comparison"
 * requirement, using Google's own react-ga4 SDK. The backend's
 * counterpart (backend/services/analyticsService.js) sends the same
 * kind of events from the server instead, using GA4's Measurement
 * Protocol -- comparing what each one can and can't see is the
 * "Comparison" part of the assignment (see the Analytics&Logging
 * report).
 *
 * VITE_GA4_MEASUREMENT_ID is public (it's embedded in every GA4 site's
 * page source regardless), so -- same reasoning as
 * VITE_GOOGLE_OAUTH_CLIENT_ID -- it lives in .env.production
 * (committed) as well as the local .env.
 */
import ReactGA from "react-ga4";

const MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;
let initialized = false;

/** Call once, as early as possible (see main-app.jsx / main-login.jsx).
 * No-ops if the GA4 property hasn't been configured yet, so local dev
 * before that's set up doesn't throw. */
export function initAnalytics() {
  if (!MEASUREMENT_ID || initialized) return;
  ReactGA.initialize(MEASUREMENT_ID);
  initialized = true;
}

/** Tracks one "page" view -- called on initial load and again on every
 * client-side route change inside the Fitting Room SPA (App.jsx), since
 * HashRouter navigation never triggers a real page load GA4 could see
 * on its own. */
export function trackPageview(path) {
  if (!initialized) return;
  ReactGA.send({ hitType: "pageview", page: path });
}

/** Tracks one interaction, GA4's standard {category, action, label}
 * shape -- e.g. trackEvent({ category: "API Request", action: "Called
 * Gemini API", label: "Generate Looks" }), straight from the syllabus's
 * own example. */
export function trackEvent({ category, action, label }) {
  if (!initialized) return;
  ReactGA.event({ category, action, label });
}
