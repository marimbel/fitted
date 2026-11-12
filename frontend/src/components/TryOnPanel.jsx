import { useRef, useState } from "react";

/**
 * TryOnPanel.jsx
 *
 * The Fitting Room's full-width "Stage": a photo-studio-style backdrop
 * (with a swatch picker for its color) that shows, in order:
 *
 *   1. An empty placeholder ("Upload your photo") before any photo is
 *      selected -- `uploadControl` (PhotoUploader.jsx, passed in as a
 *      prop) renders right inside it.
 *   2. The user's own uploaded photo, once one exists but no try-on
 *      has run yet.
 *   3. A loading state while the real Vertex AI Virtual Try-On call
 *      is in flight (see services/tryOnService.js).
 *   4. The generated result image once it comes back -- or an error
 *      message if Vertex AI declined that photo.
 *
 * Whatever image is on the stage (the raw upload OR the generated
 * result) gets a subtle mouse-driven 3D tilt: moving the cursor over
 * the stage rotates the image slightly toward the pointer, like
 * tilting a photo in your hands. This is a CSS perspective effect on
 * one real image, not a second camera angle -- Google's Virtual Try-On
 * model takes one photo in and returns one photo out, with no "angle"
 * control, so there's no way to generate a genuine side/back/aerial
 * view from a single uploaded photo. See tryOnService.js.
 *
 * `stageColor` is local UI state (useState), not lifted to App.jsx --
 * nothing else in the app needs to know what backdrop color is
 * selected, so it doesn't belong in shared/lifted state.
 *
 * Props:
 *   photo         - data URL of the uploaded photo, or null
 *   status        - "idle" | "loading" | "done"
 *   result        - { imageDataUrl } | { error } | null, once status is "done"
 *   product       - the selected product (for the result caption), or null
 *   uploadControl - a rendered PhotoUploader element
 */
const STAGE_COLORS = [
  { key: "white", label: "White", value: "#ffffff" },
  { key: "cream", label: "Cream", value: "#f8f7f4" },
  { key: "gray", label: "Soft Gray", value: "#efeee9" },
  { key: "taupe", label: "Taupe", value: "#dddad3" },
  { key: "charcoal", label: "Charcoal", value: "#292826" },
];

// How far the image tilts, in degrees, at the very edge of the stage.
// Kept small on purpose -- "subtle", per the site's design direction,
// not a flashy effect.
const MAX_TILT_DEG = 8;

export default function TryOnPanel({ photo, status, result, product, uploadControl }) {
  const [stageColor, setStageColor] = useState(STAGE_COLORS[0].value);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const isDarkStage = stageColor === "#292826";

  // One discriminator instead of a chain of fallbacks, so a failed
  // try-on shows its error message rather than silently falling back
  // to the plain uploaded photo with no explanation.
  let stageState = "empty";
  if (status === "loading") stageState = "loading";
  else if (status === "done" && result?.imageDataUrl) stageState = "result";
  else if (status === "done" && result && !result.imageDataUrl) stageState = "error";
  else if (photo) stageState = "photo";

  const displayImage = stageState === "result" ? result.imageDataUrl : stageState === "photo" ? photo : null;

  // Mouse-driven 3D tilt: converts the cursor's position within the
  // stage into a small rotation, so the image appears to tip toward
  // wherever the mouse is -- a presentation effect on the one real
  // photo/result on screen, not a different camera angle.
  function handleMouseMove(event) {
    if (!displayImage || !stageRef.current) return;
    const bounds = stageRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5; // -0.5..0.5
    const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5; // -0.5..0.5
    setTilt({ x: relativeX * MAX_TILT_DEG * 2, y: relativeY * MAX_TILT_DEG * 2 });
  }

  function resetTilt() {
    setTilt({ x: 0, y: 0 });
  }

  const tiltStyle = {
    transform: `perspective(1000px) rotateX(${-tilt.y}deg) rotateY(${tilt.x}deg)`,
  };

  return (
    <div className="try-on-stage-section">
      <div className="try-on-stage-toolbar">
        <div className="try-on-upload-control">{uploadControl}</div>
        <div className="try-on-swatches" role="group" aria-label="Stage background color">
          {STAGE_COLORS.map((color) => (
            <button
              key={color.key}
              type="button"
              className={`try-on-swatch${stageColor === color.value ? " is-active" : ""}`}
              style={{ backgroundColor: color.value }}
              title={color.label}
              aria-label={`${color.label} background`}
              aria-pressed={stageColor === color.value}
              onClick={() => setStageColor(color.value)}
            />
          ))}
        </div>
      </div>

      <div
        ref={stageRef}
        className={`try-on-stage${isDarkStage ? " is-dark" : ""}`}
        style={{ backgroundColor: stageColor }}
        onMouseMove={handleMouseMove}
        onMouseLeave={resetTilt}
      >
        {stageState === "loading" && (
          <div className="try-on-loading">
            <span className="try-on-spinner" aria-hidden="true"></span>
            <p>Preparing your look...</p>
          </div>
        )}

        {(stageState === "result" || stageState === "photo") && (
          <div className="try-on-result">
            <img
              className="try-on-stage-image"
              style={tiltStyle}
              src={displayImage}
              alt={stageState === "result" ? `You wearing ${product?.name || "this item"}` : "Your uploaded photo"}
            />
            {stageState === "result" && product && (
              <p className="try-on-result-product">
                {product.name} — ${product.price}
              </p>
            )}
          </div>
        )}

        {stageState === "error" && (
          <div className="try-on-result">
            {/* A generic standing-figure glyph, NOT a rendering of the
                user -- shown only when the real generation failed
                (e.g. Vertex AI's safety filter declined this photo). */}
            <svg className="try-on-figure" width="64" height="120" viewBox="0 0 64 120" aria-hidden="true">
              <circle cx="32" cy="16" r="13" fill="currentColor" opacity="0.35" />
              <path d="M14 112 L18 48 Q32 38 46 48 L50 112" fill="currentColor" opacity="0.35" />
            </svg>
            <p className="try-on-result-message try-on-result-error">
              {result?.error || "Something went wrong generating this look."}
            </p>
          </div>
        )}

        {stageState === "empty" && (
          <div className="try-on-stage-placeholder">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" />
              <path d="M12 15V4" />
              <path d="M7 8l5-5 5 5" />
            </svg>
            <p>Upload your photo</p>
          </div>
        )}
      </div>
    </div>
  );
}
