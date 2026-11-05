/**
 * hooks/useGooglePhotosPicker.js
 *
 * Drives the Google Photos Picker flow end to end:
 *   1. Ask the backend to create a picking session.
 *   2. Open Google's own picker UI in a popup.
 *   3. Poll the session until the user has finished picking.
 *   4. Ask the backend to fetch the picked photo(s) and run them
 *      through Gemini (POST /api/photos/analyze).
 *
 * Needs both an idToken (to call our backend) and a Photos accessToken
 * (which the backend forwards to Google's Picker API) — see
 * useGoogleAuth.js for where those come from.
 */
import { useCallback, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 30; // ~1 minute total

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function useGooglePhotosPicker({ idToken, accessToken }) {
  const [status, setStatus] = useState("idle"); // idle | opening | waiting | analyzing | done | error
  const [analyses, setAnalyses] = useState([]);
  const [error, setError] = useState(null);

  const pickPhotos = useCallback(async () => {
    if (!idToken || !accessToken) {
      setError("Sign in and grant Google Photos access first.");
      setStatus("error");
      return;
    }

    try {
      setStatus("opening");
      setError(null);

      const session = await apiFetch("/api/photos/session", {
        idToken,
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });

      window.open(session.pickerUri, "_blank", "width=480,height=640");

      setStatus("waiting");
      let picked = false;
      for (let i = 0; i < MAX_POLLS; i++) {
        await wait(POLL_INTERVAL_MS);
        const polled = await apiFetch(
          `/api/photos/session/${session.id}?accessToken=${encodeURIComponent(accessToken)}`,
          { idToken }
        );
        if (polled.mediaItemsSet) {
          picked = true;
          break;
        }
      }

      if (!picked) {
        throw new Error("Timed out waiting for a photo to be picked.");
      }

      setStatus("analyzing");
      const { analyses: newAnalyses } = await apiFetch("/api/photos/analyze", {
        idToken,
        method: "POST",
        body: JSON.stringify({ accessToken, sessionId: session.id }),
      });

      setAnalyses(newAnalyses);
      setStatus("done");
      return newAnalyses;
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [idToken, accessToken]);

  return { pickPhotos, status, analyses, error };
}
