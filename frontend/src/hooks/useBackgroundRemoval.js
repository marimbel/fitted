import { useEffect, useRef, useState } from "react";
import { removeBackground } from "@imgly/background-removal";

/**
 * hooks/useBackgroundRemoval.js
 *
 * Strips the background out of whatever image is currently on the
 * Stage (the uploaded photo, or the real Virtual Try-On result) so the
 * person shows as a clean cutout against the Stage's own colored
 * backdrop, instead of carrying along a studio-gray (or whatever)
 * background baked into the original photo.
 *
 * This runs entirely in the browser -- @imgly/background-removal is a
 * client-side image-segmentation model (WebAssembly + ONNX Runtime),
 * not a server call. The model files (tens of MB) download lazily from
 * IMG.LY's CDN the first time this runs on a given page load, then the
 * browser caches them, so the first cutout in a session is slower than
 * later ones.
 *
 * `cache` is a plain module-level Map (not React state) keyed by the
 * SOURCE image, so switching back and forth between the uploaded photo
 * and a generated result -- or re-selecting the same product -- never
 * reprocesses an image this component has already cut out once.
 *
 * Returns the cutout as an object URL once ready; `status` lets the
 * caller show the original image immediately and swap to the cutout
 * when it's done, rather than showing nothing while processing.
 */
const cache = new Map();

export function useBackgroundRemoval(imageSrc) {
  const [cutoutUrl, setCutoutUrl] = useState(() => (imageSrc ? cache.get(imageSrc) ?? null : null));
  const [status, setStatus] = useState(cutoutUrl ? "done" : "idle"); // idle | processing | done | error

  // Guards against a slow removal for an OLD image finishing after the
  // user has already moved on to a new one (e.g. picked a different
  // product mid-process) and overwriting the newer image's state.
  const requestedSrcRef = useRef(imageSrc);

  useEffect(() => {
    requestedSrcRef.current = imageSrc;

    if (!imageSrc) {
      setCutoutUrl(null);
      setStatus("idle");
      return;
    }

    if (cache.has(imageSrc)) {
      setCutoutUrl(cache.get(imageSrc));
      setStatus("done");
      return;
    }

    setStatus("processing");
    removeBackground(imageSrc)
      .then((blob) => {
        if (requestedSrcRef.current !== imageSrc) return; // superseded
        const url = URL.createObjectURL(blob);
        cache.set(imageSrc, url);
        setCutoutUrl(url);
        setStatus("done");
      })
      .catch(() => {
        if (requestedSrcRef.current !== imageSrc) return;
        // Background removal failing (e.g. the model couldn't load) is
        // not fatal -- the Stage just falls back to the original image
        // with its own background, instead of showing nothing.
        setStatus("error");
      });
  }, [imageSrc]);

  return { cutoutUrl, status };
}
