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
import { useEffect, useRef, useState } from "react";

// Reassuring reminders repeat while the single Gemini request is running.
const PROCESSING_MESSAGES = [
  "Your request is being processed…",
  "Thanks for your patience…",
  "This can take a little while…",
  "Please keep this page open…",
];

export default function StyleRequestRecorder({ recorder, idToken, onParsed }) {
  const { isRecording, seconds, status, styleRequest, error, startRecording, stopRecording } = recorder;
  const lastReportedRef = useRef(null);
  const [processingMessageIndex, setProcessingMessageIndex] = useState(0);
  const busy = status === "preparing" || status === "parsing";

  useEffect(() => {
    // Send completed preferences to the parent page once per new result.
    if (styleRequest && styleRequest !== lastReportedRef.current) {
      lastReportedRef.current = styleRequest;
      onParsed?.(styleRequest);
    }
  }, [styleRequest, onParsed]);

  useEffect(() => {
    // Cycle the waiting reminder only while a request is in progress.
    if (!busy) {
      setProcessingMessageIndex(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setProcessingMessageIndex((current) => (current + 1) % PROCESSING_MESSAGES.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [busy]);

  function handleClick() {
    if (isRecording) stopRecording();
    else startRecording(idToken);
  }

  // Show the matching control, progress, error, or parsed preferences.
  return (
    <div className="style-request-recorder">
      <button
        type="button"
        className={`btn-fitted ${isRecording ? "btn-outline" : "btn-dark"} w-100`}
        onClick={handleClick}
        disabled={busy}
      >
        {isRecording ? "Stop recording" : busy ? "Processing recording…" : "Record your style request"}
      </button>
      {isRecording && (
        <p className="style-request-status" role="status">
          Recording: {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} / 1:00
        </p>
      )}
      {busy && (
        <div className="style-request-progress">
          <p className="style-request-status" aria-hidden="true">
            {PROCESSING_MESSAGES[processingMessageIndex]}
          </p>
          <p className="style-request-status style-request-stage" role="status" aria-live="polite">
            {/* The stage is real status; the rotating reminders are not separate processing steps. */}
            Current stage: {status === "preparing"
              ? "Preparing your audio recording."
              : "Waiting for Gemini to transcribe it and extract your preferences."}
          </p>
        </div>
      )}
      {status === "error" && <p className="style-request-status style-request-error" role="alert">{error}</p>}
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
