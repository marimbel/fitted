/**
 * hooks/useGoogleAuth.js
 *
 * Wraps Google Identity Services (the <script src="https://accounts.
 * google.com/gsi/client"> tag in app.html — see window.google there).
 * This one script provides two separate things we need:
 *
 *   1. google.accounts.id       - "Sign in with Google" -> an ID token
 *      that says WHO this person is. The backend verifies it in
 *      middleware/verifyGoogleToken.js.
 *   2. google.accounts.oauth2   - a separate consent flow for an
 *      OAuth *access* token with the Google Photos Picker scope, so
 *      the backend can call the Picker API on this person's behalf.
 *
 * Custom hooks (functions starting with `use`) are how React shares
 * stateful logic between components without repeating it — this one
 * encapsulates "how do we sign in with Google" so FittingRoomPage can
 * just call useGoogleAuth() and get back simple values/functions.
 */
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/apiClient.js";
import { trackEvent } from "../services/analytics.js";
import { logEvent, logError } from "../services/logger.js";

const PHOTOS_SCOPE = "https://www.googleapis.com/auth/photospicker.mediaitems.readonly";

export function useGoogleAuth() {
  const [idToken, setIdToken] = useState(null);
  const [profile, setProfile] = useState(null); // { uid, email, name, picture }
  const [accessToken, setAccessToken] = useState(null);
  const buttonRef = useRef(null);
  const tokenClientRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

  useEffect(() => {
    if (!clientId || !window.google || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setIdToken(response.credential);
        // Ask the backend to verify the token and send back the
        // trusted profile, rather than trusting whatever we decode
        // client-side ourselves.
        try {
          const { user } = await apiFetch("/api/auth/me", { idToken: response.credential });
          setProfile(user);
          trackEvent({ category: "Auth", action: "Signed In", label: "Google Sign-In" });
          logEvent("sign_in_succeeded", { uid: user?.uid });
        } catch (err) {
          setProfile(null);
          logError("sign_in_failed", err);
        }
      },
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
    });

    // The access-token client is separate from sign-in: it's only
    // requested (and only prompts the user) when something that
    // actually needs Photos access is clicked.
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: PHOTOS_SCOPE,
      callback: (tokenResponse) => setAccessToken(tokenResponse.access_token),
    });
  }, [clientId]);

  function requestPhotosAccess() {
    tokenClientRef.current?.requestAccessToken();
  }

  function signOut() {
    setIdToken(null);
    setProfile(null);
    setAccessToken(null);
  }

  return {
    buttonRef,
    idToken,
    profile,
    isSignedIn: Boolean(idToken && profile),
    accessToken,
    requestPhotosAccess,
    signOut,
  };
}
