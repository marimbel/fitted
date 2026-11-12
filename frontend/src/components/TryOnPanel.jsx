import { useRef, useState } from "react";
import { useBackgroundRemoval } from "../hooks/useBackgroundRemoval.js";

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
 * Whatever photo/result is on screen is run through
 * useBackgroundRemoval.js (client-side, in the browser) so the person
 * shows as a clean cutout against the Stage's own colored backdrop,
 * instead of carrying along whatever background was in the original
 * photo. It also gets a subtle mouse-driven 3D tilt, like tilting a
 * photo in your hands -- a CSS perspective effect on one real image,
 * not a second camera angle.
 *
 * Once a real front result exists, Side/Back tabs appear. These are
 * NOT real photos -- Google's Virtual Try-On model has no "angle"
 * parameter and no API can derive a real side/back view from one front
 * photo -- so clicking them asks Gemini to IMAGINE a plausible one
 * (services/tryOnService.js's requestImaginedAngle, backend/services/
 * imaginedAngleService.js). Every imagined image gets a visible
 * "AI-Imagined" badge directly on the stage so it's never mistaken for
 * an actual photo of the user.
 *
 * `stageColor` is local UI state (useState), not lifted to App.jsx --
 * nothing else in the app needs to know what backdrop color is
 * selected, so it doesn't belong in shared/lifted state.
 *
 * Props:
 *   photo         - data URL of the uploaded photo, or null
 *   status        - "idle" | "loading" | "done" (the real FRONT try-on)
 *   result        - { imageDataUrl } | { error } | null, once status is "done"
 *   product       - the selected product (for the result caption), or null
 *   uploadControl - a rendered PhotoUploader element
 *   imaginedAngles - { side?: angleState, back?: angleState }, where
 *                    angleState is { status: "loading"|"done", imageDataUrl?, error? }
 *   activeView    - "front" | "side" | "back"
 *   onViewChange  - (view) => void -- FittingRoomPage decides whether
 *                   switching views needs to kick off a new Gemini call
 */
const STAGE_COLORS = [
  { key: "white", label: "White", value: "#ffffff" },
  { key: "cream", label: "Cream", value: "#f8f7f4" },
  { key: "gray", label: "Soft Gray", value: "#efeee9" },
  { key: "taupe", label: "Taupe", value: "#dddad3" },
  { key: "pink", label: "Pale Pink", value: "#f3e3df" },
  { key: "blue", label: "Pale Blue", value: "#e4ebee" },
  { key: "yellow", label: "Pale Yellow", value: "#f4eed9" },
  { key: "charcoal", label: "Charcoal", value: "#292826" },
];

// How far the image tilts, in degrees, at the very edge of the stage.
// Kept small on purpose -- "subtle", per the site's design direction,
// not a flashy effect.
const MAX_TILT_DEG = 8;

export default function TryOnPanel({
  photo,
  status,
  result,
  product,
  uploadControl,
  imaginedAngles = {},
  activeView = "front",
  onViewChange,
}) {
  const [stageColor, setStageColor] = useState(STAGE_COLORS[0].value);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const stageRef = useRef(null);

  const isDarkStage = stageColor === "#292826";

  // What's showing for the FRONT view specifically (the real result).
  let frontState = "empty";
  if (status === "loading") frontState = "loading";
  else if (status === "done" && result?.imageDataUrl) frontState = "result";
  else if (status === "done" && result && !result.imageDataUrl) frontState = "error";
  else if (photo) frontState = "photo";

  // Side/Back tabs only make sense once there's a real front result to
  // imagine other angles OF.
  const showAngleTabs = frontState === "result";

  // Resolve what the stage actually shows right now, folding together
  // the front state above and the (separate) imagined-angle state for
  // whichever tab is active.
  let view; // { kind: "image" | "loading" | "error" | "empty", src?, isImagined?, caption?, message? }
  if (activeView === "front") {
    if (frontState === "loading") view = { kind: "loading", caption: "Preparing your look..." };
    else if (frontState === "result") view = { kind: "image", src: result.imageDataUrl, isImagined: false };
    else if (frontState === "error")
      view = { kind: "error", message: result?.error || "Something went wrong generating this look." };
    else if (frontState === "photo") view = { kind: "image", src: photo, isImagined: false };
    else view = { kind: "empty" };
  } else {
    const angle = imaginedAngles[activeView];
    if (!angle || angle.status === "loading") {
      view = { kind: "loading", caption: `Imagining the ${activeView} view...` };
    } else if (angle.imageDataUrl) {
      view = { kind: "image", src: angle.imageDataUrl, isImagined: true };
    } else {
      view = { kind: "error", message: angle.error || "Couldn't imagine this view." };
    }
  }

  // Strip the background out of whatever image is showing (client-side
  // -- see useBackgroundRemoval.js) so it reads as a cutout on the
  // Stage's own colored backdrop rather than its own photographed one.
  // Falls back to the original image immediately, then swaps in the
  // cutout once it's ready, instead of showing nothing while it works.
  const { cutoutUrl } = useBackgroundRemoval(view.kind === "image" ? view.src : null);
  const displaySrc = view.kind === "image" ? cutoutUrl || view.src : null;

  // Mouse-driven 3D tilt: converts the cursor's position within the
  // stage into a small rotation, so the image appears to tip toward
  // wherever the mouse is.
  function handleMouseMove(event) {
    if (!displaySrc || !stageRef.current) return;
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
        {view.kind === "loading" && (
          <div className="try-on-loading">
            <span className="try-on-spinner" aria-hidden="true"></span>
            <p>{view.caption}</p>
          </div>
        )}

        {view.kind === "image" && (
          <div className="try-on-result">
            {view.isImagined && (
              <span className="try-on-imagined-badge">AI-Imagined — not a real photo</span>
            )}
            <img
              className="try-on-stage-image"
              style={tiltStyle}
              src={displaySrc}
              alt={view.isImagined ? `AI-imagined ${activeView} view` : frontState === "result" ? `You wearing ${product?.name || "this item"}` : "Your uploaded photo"}
            />
            {!view.isImagined && frontState === "result" && product && (
              <p className="try-on-result-product">
                {product.name} — ${product.price}
              </p>
            )}
          </div>
        )}

        {view.kind === "error" && (
          <div className="try-on-result">
            {/* A generic standing-figure glyph, NOT a rendering of the
                user -- shown only when generation failed (e.g. a
                safety filter declined this specific photo). */}
            <svg className="try-on-figure" width="64" height="120" viewBox="0 0 64 120" aria-hidden="true">
              <circle cx="32" cy="16" r="13" fill="currentColor" opacity="0.35" />
              <path d="M14 112 L18 48 Q32 38 46 48 L50 112" fill="currentColor" opacity="0.35" />
            </svg>
            <p className="try-on-result-message try-on-result-error">{view.message}</p>
          </div>
        )}

        {view.kind === "empty" && (
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

      {showAngleTabs && (
        <div className="try-on-view-tabs" role="tablist" aria-label="Stage view">
          {["front", "side", "back"].map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeView === key}
              className={`try-on-view-tab${activeView === key ? " is-active" : ""}`}
              onClick={() => onViewChange?.(key)}
            >
              {key === "front" ? "Front" : key === "side" ? "Side" : "Back"}
            </button>
          ))}
          <span className="try-on-view-tabs-note">Side and Back are AI-imagined, not real photos.</span>
        </div>
      )}
    </div>
  );
}
