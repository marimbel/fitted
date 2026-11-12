/**
 * authSession.js
 *
 * Persists the signed-in Google user across page loads using
 * localStorage, so signing in once (on the Login page, or inside the
 * Fitting Room) carries over to every other page on the site.
 *
 * This matters specifically because Fitted is built as several separate
 * HTML documents (login.html, app.html, ...), each with its own React
 * root (see main-login.jsx / main-app.jsx) — unlike a single-page app
 * where "is the user signed in" is just one piece of in-memory state,
 * here it has to survive an actual full page navigation between them.
 *
 * Security note: this only restores what the UI SHOWS (profile name/
 * email, whether to render "Sign in" vs "Signed in as ..."). It changes
 * nothing about what the backend trusts — every API call still sends
 * the Google ID token, and middleware/verifyGoogleToken.js independently
 * re-verifies it with Google on every single request. A tampered
 * localStorage value can only make the UI lie to itself; it can never
 * forge a request the backend will accept.
 */

const STORAGE_KEY = "fitted_google_session";

/**
 * Saves the current sign-in state so it survives a page navigation.
 */
export function saveSession({ idToken, profile, accessToken }) {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ idToken, profile, accessToken, savedAt: Date.now() })
    );
  } catch {
    // localStorage can throw in private-browsing modes or when it's
    // full/blocked — sign-in still works for the current page, it just
    // won't carry over to the next one. Not worth failing the sign-in
    // flow over.
  }
}

/**
 * Reads back a previously saved session, or null if there isn't one,
 * it's malformed, or the Google ID token inside it has expired.
 */
export function loadSession() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw);
    if (!session?.idToken) return null;

    if (isTokenExpired(session.idToken)) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Clears the saved session (called on sign-out, and automatically when
 * a stale/expired token is found on load).
 */
export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do if localStorage itself is unavailable.
  }
}

/**
 * Google ID tokens are JWTs: three base64url segments separated by
 * dots, the middle one a JSON payload that includes an `exp` field
 * (Unix seconds). Decoding it here is just reading a timestamp — NOT
 * verifying the token's signature, which only Google (and our backend,
 * via google-auth-library) can actually do. This is purely so the UI
 * doesn't show "Signed in" for a token that's already expired and
 * would be rejected by the very first real API call.
 */
function isTokenExpired(idToken) {
  try {
    const payloadBase64 = idToken.split(".")[1];
    const payloadJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    // If we can't even parse it, treat it as expired/invalid.
    return true;
  }
}
