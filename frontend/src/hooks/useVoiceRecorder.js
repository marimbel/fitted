/**
 * hooks/useVoiceRecorder.js
 *
 * Wraps the browser's native MediaRecorder API to record a short voice
 * clip describing a style request, then sends it to the backend to be
 * transcribed and parsed by Gemini (POST /api/audio/parse).
 *
 * This satisfies the spec's audio requirement: the clip is recorded
 * live by the user each time, never a fixed pre-recorded file.
 */
import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../services/apiClient.js";

const MAX_SECONDS = 60;
// Try common browser audio formats in order; the first supported one wins.
const FORMATS = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];

function blobToBase64(blob) {
  // Convert the clip to the base64 format expected by the backend.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read the recording."));
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  // Keep recording, timing, result, and error state together in one hook.
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("idle");
  const [styleRequest, setStyleRequest] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  // MediaRecorder can deliver a clip in several pieces, so collect them here.
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const tokenRef = useRef(null);

  function clearTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => () => {
    // Release the microphone if the user leaves while recording.
    clearTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    recorder?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  async function startRecording(idToken) {
    setError(null);
    setStyleRequest(null);
    setSeconds(0);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Audio recording is not supported in this browser.");
      setStatus("error");
      return;
    }
    let stream;
    try {
      // Ask for microphone access, then create a recorder in a supported format.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = FORMATS.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      tokenRef.current = idToken;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        clearTimer();
        setError("Recording failed. Please try again.");
        setStatus("error");
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onstop = async () => {
        clearTimer();
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
        if (!chunksRef.current.length) {
          setError("No audio was recorded. Please try again.");
          setStatus("error");
          return;
        }
        try {
          // Join the audio pieces, prepare them for upload, then ask Gemini to parse them.
          setStatus("preparing");
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          const audioBase64 = await blobToBase64(blob);
          setStatus("parsing");
          const { styleRequest: parsed } = await apiFetch("/api/audio/parse", {
            idToken: tokenRef.current,
            method: "POST",
            body: JSON.stringify({ audioBase64, mimeType: recorder.mimeType }),
          });
          setStyleRequest(parsed);
          setStatus("done");
        } catch (err) {
          setError(err.message || "Could not process the recording.");
          setStatus("error");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setIsRecording(true);
      setStatus("recording");
      timerRef.current = setInterval(() => {
        const elapsed = Math.min(MAX_SECONDS, Math.floor((Date.now() - startedAtRef.current) / 1000));
        setSeconds(elapsed);
        // End the recording automatically at the one-minute limit.
        if (elapsed >= MAX_SECONDS) stopRecording();
      }, 250);
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      setError(err.name === "NotAllowedError" ? "Microphone access was denied. Allow microphone access and try again." : (err.message || "Unable to start recording."));
      setStatus("error");
    }
  }

  function stopRecording() {
    // Stop only an active recording; the recorder handles sending it afterward.
    const recorder = mediaRecorderRef.current;
    if (recorder?.state !== "recording") return;
    clearTimer();
    recorder.stop();
  }

  return { isRecording, seconds, status, styleRequest, error, startRecording, stopRecording };
}
