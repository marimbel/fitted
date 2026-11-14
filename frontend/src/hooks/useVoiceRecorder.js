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

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // reader.result is "data:audio/webm;base64,AAAA..." — strip the
      // prefix so the backend gets raw base64, matching what
      // geminiService.parseVoiceRequest expects.
      resolve(reader.result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | recording | parsing | done | error
  const [styleRequest, setStyleRequest] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== "inactive") recorder.stop();
        recorder.stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  async function startRecording() {
    setError(null);
    setStatus("requesting");
    let stream;
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("Audio recording is unavailable. Use a supported browser on HTTPS or localhost.");
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatus("recording");
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      setError(err.name === "NotAllowedError" ? "Microphone access was denied. Allow microphone access in your browser and try again." : err.message);
      setStatus("error");
    }
  }

  function stopRecording(idToken) {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return resolve(null);

      recorder.onstop = async () => {
        setIsRecording(false);
        recorder.stream.getTracks().forEach((track) => track.stop());

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        try {
          setStatus("parsing");
          if (!blob.size) throw new Error("No audio was captured. Please record your request again.");
          const audioBase64 = await blobToBase64(blob);
          const { styleRequest: parsed } = await apiFetch("/api/audio/parse", {
            idToken,
            method: "POST",
            body: JSON.stringify({ audioBase64, mimeType: recorder.mimeType }),
          });
          setStyleRequest(parsed);
          setStatus("done");
          resolve(parsed);
        } catch (err) {
          setError(err.message);
          setStatus("error");
          resolve(null);
        }
      };

      setStatus("parsing");
      setIsRecording(false);
      recorder.stop();
    });
  }

  return { isRecording, status, styleRequest, error, startRecording, stopRecording };
}
