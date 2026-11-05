/**
 * StyleRequestRecorder.jsx
 *
 * A record/stop button plus the resulting structured style request,
 * once Gemini has parsed the recording. Keeps the recording lifecycle
 * (idle/recording/parsing/done) visible to the user the same way
 * TryOnPanel shows the simulated try-on's loading state.
 *
 * Props:
 *   recorder - the object returned by useVoiceRecorder()
 *   idToken  - needed to call the backend once recording stops
 *   onParsed - (styleRequest) => void, called once Gemini returns a result
 */
import { useEffect, useRef } from "react";

export default function StyleRequestRecorder({ recorder, idToken, onParsed }) {
  const { isRecording, status, styleRequest, error, startRecording, stopRecording } = recorder;
  const lastReportedRef = useRef(null);

  // Report a newly-parsed style request up to the parent exactly once,
  // instead of every render — this is the same "lift state up, notify
  // via a callback prop" pattern as FavoritesButton's onToggle.
  useEffect(() => {
    if (styleRequest && styleRequest !== lastReportedRef.current) {
      lastReportedRef.current = styleRequest;
      onParsed(styleRequest);
    }
  }, [styleRequest, onParsed]);

  async function handleClick() {
    if (isRecording) {
      await stopRecording(idToken);
    } else {
      await startRecording();
    }
  }

  return (
    <div className="style-request-recorder">
      <button type="button" className={`btn-fitted ${isRecording ? "btn-outline" : "btn-dark"} w-100`} onClick={handleClick}>
        {isRecording ? "Stop recording" : "Record your style request"}
      </button>

      {status === "parsing" && <p className="style-request-status">Listening to what you said…</p>}
      {status === "error" && <p className="style-request-status style-request-error">{error}</p>}

      {status === "done" && styleRequest && (
        <div className="style-request-summary">
          <p className="style-request-transcript">"{styleRequest.rawTranscript}"</p>
          <ul className="style-request-facts">
            {styleRequest.occasion && <li>Occasion: {styleRequest.occasion}</li>}
            {styleRequest.budget > 0 && <li>Budget: ${styleRequest.budget}</li>}
            {styleRequest.mustHaves?.length > 0 && <li>Must-haves: {styleRequest.mustHaves.join(", ")}</li>}
            {styleRequest.avoid?.length > 0 && <li>Avoid: {styleRequest.avoid.join(", ")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
