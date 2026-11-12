import { useState } from "react";

/**
 * TryOnPanel.jsx
 *
 * Shows the result of the (currently simulated) multi-angle try-on
 * request inside a photo-studio-style "stage": a solid-color backdrop
 * with a small swatch picker, and a Front/Side/Back angle switcher once
 * a result comes back -- see tryOnService.js for what's simulated here
 * and what a real implementation would plug in.
 *
 * Three visual states, driven by the `status` prop from FittingRoomPage:
 *
 *   "idle"    - nothing has been requested yet
 *   "loading" - simulateMultiAngleTryOn() is in flight
 *   "done"    - resolved; `angles` holds one entry per angle
 *
 * `stageColor` is local UI state (useState), not lifted to App.jsx --
 * nothing else in the app needs to know what backdrop color is
 * selected, so it doesn't belong in shared/lifted state. This is the
 * same "keep state as close to where it's used as possible" principle
 * that keeps `activeCategory` local to CategoryFilter's parent instead
 * of living in App.jsx too.
 */
const STAGE_COLORS = [
  { key: "white", label: "White", value: "#ffffff" },
  { key: "cream", label: "Cream", value: "#f8f7f4" },
  { key: "gray", label: "Soft Gray", value: "#efeee9" },
  { key: "taupe", label: "Taupe", value: "#dddad3" },
  { key: "charcoal", label: "Charcoal", value: "#292826" },
];

export default function TryOnPanel({ status, product, angles }) {
  const [stageColor, setStageColor] = useState(STAGE_COLORS[0].value);
  const [activeAngle, setActiveAngle] = useState("front");

  if (status === "idle") {
    return null;
  }

  const activeResult = angles?.find((angle) => angle.key === activeAngle);
  const isDarkStage = stageColor === "#292826";

  return (
    <div className="try-on-panel">
      <div className="try-on-stage-header">
        <h3 className="h6 mb-0">Virtual Try-On Preview</h3>
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

      <div className={`try-on-stage${isDarkStage ? " is-dark" : ""}`} style={{ backgroundColor: stageColor }}>
        {status === "loading" && (
          <div className="try-on-loading">
            <span className="try-on-spinner" aria-hidden="true"></span>
            <p>Preparing your look...</p>
          </div>
        )}

        {status === "done" && (
          <div className="try-on-result">
            {/* A generic standing-figure glyph, NOT a rendering of the
                user -- real per-angle images are what PROJECT 2 would
                replace this stage's contents with (see tryOnService.js). */}
            <svg className="try-on-figure" width="64" height="120" viewBox="0 0 64 120" aria-hidden="true">
              <circle cx="32" cy="16" r="13" fill="currentColor" opacity="0.35" />
              <path d="M14 112 L18 48 Q32 38 46 48 L50 112" fill="currentColor" opacity="0.35" />
            </svg>
            {product && (
              <p className="try-on-result-product">
                {product.name} — ${product.price}
              </p>
            )}
            <p className="try-on-result-message">{activeResult?.message}</p>
          </div>
        )}
      </div>

      {status === "done" && angles?.length > 0 && (
        <div className="try-on-angle-tabs" role="tablist" aria-label="Try-on angle">
          {angles.map((angle) => (
            <button
              key={angle.key}
              type="button"
              role="tab"
              aria-selected={activeAngle === angle.key}
              className={`try-on-angle-tab${activeAngle === angle.key ? " is-active" : ""}`}
              onClick={() => setActiveAngle(angle.key)}
            >
              {angle.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
