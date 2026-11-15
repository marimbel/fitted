/**
 * StyleRequestRecorder.jsx
 *
 * Record a spoken style request, listen back, then send it to Gemini. The
 * user can delete it or record again before anything is sent; the parsed
 * style request shows below once Gemini responds.
 *
 * Props:
 *   recorder - the object returned by useVoiceRecorder()
 *   idToken  - needed to call the backend when the recording is submitted
 *   onParsed - (styleRequest | null) => void; null when the result is discarded
 */
import { useEffect, useRef, useState } from "react";

const MAX_SECONDS = 60;
// Reassuring reminders repeat while the single Gemini request is running.
const PROCESSING_MESSAGES = [
  "Your request is being processed…",
  "Thanks for your patience…",
  "This can take a little while…",
  "Please keep this page open…",
];

const clock = (total) => `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;

export default function StyleRequestRecorder({ recorder, idToken, onParsed }) {
  const { status, seconds, styleRequest, error, audioUrl, startRecording, stopRecording, submitRecording, deleteRecording } = recorder;
  const isRecording = status === "recording";
  const requesting = status === "requesting";
  const busy = status === "preparing" || status === "parsing";
  const lastReportedRef = useRef(null);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Tell the parent page whenever the parsed result appears or is discarded.
    if (styleRequest !== lastReportedRef.current) {
      lastReportedRef.current = styleRequest;
      onParsed?.(styleRequest);
    }
  }, [styleRequest, onParsed]);

  useEffect(() => {
    // Cycle the waiting reminder only while a request is in progress.
    if (!busy) {
      setMessageIndex(0);
      return undefined;
    }
    const timer = window.setInterval(() => setMessageIndex((index) => (index + 1) % PROCESSING_MESSAGES.length), 4000);
    return () => window.clearInterval(timer);
  }, [busy]);

  return (
    <div className="style-request-recorder">
      {(!audioUrl || isRecording || requesting) && (
        <button
          type="button"
          className={`btn-fitted ${isRecording ? "btn-outline" : "btn-dark"} w-100`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={requesting || busy}
        >
          {isRecording ? "Stop recording" : requesting ? "Waiting for microphone permission…" : "Record your style request"}
        </button>
      )}

      {requesting && (
        <p className="style-request-status" role="status">
          Your browser is asking for microphone access. Choose “Allow” to start recording.
        </p>
      )}

      {isRecording && (
        <p className="style-request-status" role="status">
          Recording: {clock(seconds)} / {clock(MAX_SECONDS)}
        </p>
      )}

      {audioUrl && !isRecording && (
        <div className="style-request-review">
          <p className="style-request-status">Your recording ({clock(seconds)}) — listen back before sending it:</p>
          <audio className="style-request-audio" controls src={audioUrl} preload="metadata" />
          <div className="style-request-actions">
            {status !== "done" && (
              <button type="button" className="btn-fitted btn-dark" onClick={() => submitRecording(idToken)} disabled={busy}>
                {status === "error" ? "Try submitting again" : "Submit to Gemini"}
              </button>
            )}
            <button type="button" className="btn-fitted btn-outline" onClick={startRecording} disabled={busy}>
              Re-record
            </button>
            <button type="button" className="btn-fitted btn-outline" onClick={deleteRecording} disabled={busy}>
              Delete
            </button>
          </div>
        </div>
      )}

      {busy && (
        <div className="style-request-progress">
          <p className="style-request-status" aria-hidden="true">{PROCESSING_MESSAGES[messageIndex]}</p>
          <p className="style-request-status style-request-stage" role="status" aria-live="polite">
            Current stage: {status === "preparing" ? "Preparing your audio recording." : "Waiting for Gemini to transcribe it and extract your preferences."}
          </p>
        </div>
      )}

      {status === "error" && error && <p className="style-request-status style-request-error" role="alert">{error}</p>}

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
