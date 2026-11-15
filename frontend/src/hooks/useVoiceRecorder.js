/**
 * hooks/useVoiceRecorder.js
 *
 * Records a short voice clip with the browser's MediaRecorder API, lets the
 * user review it, and only then sends it to the backend for Gemini to
 * transcribe and parse (POST /api/audio/parse). The clip is always recorded
 * live by the user, never a pre-recorded file.
 *
 * status: idle -> requesting (mic permission) -> recording -> recorded
 *         -> preparing -> parsing -> done   (or "error" at any point)
 *
 * Only one recording can be active at a time, and leaving the page stops the
 * microphone and cancels any pending permission prompt or upload.
 */
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

const MAX_SECONDS = 60;
// First format the browser supports wins (Chrome: webm, Safari: mp4).
const FORMATS = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
const MIC_ERRORS = {
  NotAllowedError: "Microphone access was denied. Allow it in your browser's site settings and try again.",
  NotFoundError: "No microphone was found. Connect one and try again.",
  NotReadableError: "Your microphone is busy. Close other apps using it and try again.",
};

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  const [status, setStatus] = useState("idle");
  const [seconds, setSeconds] = useState(0);
  const [styleRequest, setStyleRequest] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null); // playback URL for the saved clip

  // Mutable state that must not wait for a re-render: `busy` blocks a second
  // recording, and `session` changes whenever work is cancelled so late async
  // results can tell they're stale. Also holds recorder, stream, timer, abort, blob, url.
  const ref = useRef({ busy: false, session: 0 });

  function fail(message) {
    ref.current.busy = false;
    setError(message);
    setStatus("error");
  }

  function release() {
    const s = ref.current;
    clearInterval(s.timer);
    s.stream?.getTracks().forEach((track) => track.stop());
    s.stream = s.recorder = null;
  }

  function discardClip() {
    URL.revokeObjectURL(ref.current.url);
    ref.current.url = ref.current.blob = null;
    setAudioUrl(null);
  }

  // Cancels everything in flight. Sets no React state, so it's safe on unmount.
  function cancel() {
    const s = ref.current;
    s.session++;
    s.busy = false;
    s.abort?.abort();
    s.abort = null;
    if (s.recorder) {
      s.recorder.onstop = s.recorder.onerror = null; // skip the normal "finished" path
      if (s.recorder.state !== "inactive") s.recorder.stop();
    }
    release();
  }

  useEffect(() => () => {
    cancel();
    URL.revokeObjectURL(ref.current.url);
  }, []);

  async function startRecording() {
    const s = ref.current;
    if (s.busy) return; // permission pending, already recording, or uploading
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      return fail("Audio recording is not supported in this browser. Try Chrome or Safari.");
    }

    s.busy = true;
    const session = ++s.session;
    const stale = () => session !== s.session;
    discardClip(); // recording again replaces the previous clip
    setError(null);
    setStyleRequest(null);
    setSeconds(0);
    setStatus("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stale()) return stream.getTracks().forEach((track) => track.stop()); // user left while the prompt was open
      s.stream = stream;

      const mimeType = FORMATS.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = (s.recorder = new MediaRecorder(stream, mimeType && { mimeType }));
      const chunks = [];
      recorder.ondataavailable = (event) => event.data.size && chunks.push(event.data);
      recorder.onerror = () => {
        if (stale()) return;
        release();
        fail("Recording failed. Please try again.");
      };
      recorder.onstop = () => {
        if (stale()) return;
        release();
        s.busy = false;
        if (!chunks.length) return fail("No audio was recorded. Please try again.");
        s.blob = new Blob(chunks, { type: recorder.mimeType || mimeType });
        s.url = URL.createObjectURL(s.blob);
        setAudioUrl(s.url);
        setStatus("recorded");
      };

      recorder.start();
      const startedAt = Date.now();
      s.timer = setInterval(() => {
        const elapsed = Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAt) / 1000));
        setSeconds(elapsed);
        if (elapsed >= MAX_SECONDS) stopRecording(); // automatic stop at one minute
      }, 250);
      setStatus("recording");
    } catch (err) {
      if (stale()) return;
      release();
      fail(MIC_ERRORS[err.name] || err.message || "Unable to start recording.");
    }
  }

  function stopRecording() {
    const { recorder, timer } = ref.current;
    if (recorder?.state !== "recording") return;
    clearInterval(timer);
    recorder.stop(); // onstop then saves the clip for review
  }

  // Sends the saved clip to Gemini. The clip is kept, so a failure can be retried.
  async function submitRecording(idToken) {
    const s = ref.current;
    const blob = s.blob;
    if (!blob || s.busy) return;

    s.busy = true;
    const session = s.session;
    const controller = (s.abort = new AbortController());
    setError(null);
    setStatus("preparing");
    try {
      const audioBase64 = await blobToBase64(blob);
      if (session !== s.session) return;
      setStatus("parsing");
      const { styleRequest: parsed } = await apiFetch("/api/audio/parse", {
        idToken,
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({ audioBase64, mimeType: blob.type }),
      });
      if (session !== s.session) return;
      s.busy = false;
      setStyleRequest(parsed);
      setStatus("done");
    } catch (err) {
      if (session !== s.session || err.name === "AbortError") return;
      fail(err instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : err.message || "Could not process the recording.");
    }
  }

  function deleteRecording() {
    cancel();
    discardClip();
    setStyleRequest(null);
    setError(null);
    setSeconds(0);
    setStatus("idle");
  }

  return { status, seconds, styleRequest, error, audioUrl, startRecording, stopRecording, submitRecording, deleteRecording };
}
