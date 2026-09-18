/**
 * TryOnPanel.jsx
 *
 * Purely presentational component that shows the result of the simulated
 * try-on request. It has three visual states driven entirely by the
 * `status` prop coming from FittingRoomPage:
 *
 *   "idle"    - nothing has been requested yet
 *   "loading" - simulateTryOn() is in flight ("Preparing your look...")
 *   "done"    - simulateTryOn() resolved; show the demo preview message
 *
 * Keeping the loading/async logic in the page component (which owns the
 * state) and keeping this component "dumb" makes it trivial to swap the
 * simulated request for a real one later without touching this file.
 */
export default function TryOnPanel({ status, product, resultMessage }) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="try-on-panel">
      {status === "loading" && (
        <div className="try-on-loading">
          <span className="try-on-spinner" aria-hidden="true"></span>
          <p>Preparing your look...</p>
        </div>
      )}

      {status === "done" && (
        <div className="try-on-result">
          <h3 className="h6">Virtual Try-On Preview</h3>
          {product && (
            <p className="try-on-result-product">
              {product.name} — ${product.price}
            </p>
          )}
          <p className="try-on-result-message">{resultMessage}</p>
        </div>
      )}
    </div>
  );
}
