/**
 * LookResultsPanel.jsx
 *
 * Shows the result of the agent pipeline (POST /api/looks/generate):
 * the recommended looks, which rule checks each one passed or failed,
 * and the critique summary — including how many loop iterations it
 * took, which is the concrete evidence of the LookBuilder/LookCritic
 * loop actually running (useful for the Wiki's ADK screenshots page).
 *
 * Props:
 *   status  - "idle" | "loading" | "done" | "error"
 *   result  - the object returned by the backend, or null
 *   error   - error message string, or null
 *   onSaveLook - (look) => void
 */
import { PRODUCTS } from "../data/products.js";

function productsFor(look) {
  return look.productIds.map((id) => PRODUCTS.find((product) => product.id === id)).filter(Boolean);
}

export default function LookResultsPanel({ status, result, error, onSaveLook }) {
  if (status === "idle") return null;

  if (status === "loading") {
    return (
      <div className="look-results-panel">
        <div className="try-on-loading">
          <span className="try-on-spinner" aria-hidden="true"></span>
          <p>StyleAnalyst and LookBuilder are putting looks together…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="look-results-panel">
        <p className="style-request-error">{error}</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="look-results-panel">
      <div className="look-results-header">
        <h3 className="h6 mb-1">Recommended Looks</h3>
        <p className="look-results-meta">
          {result.critique.iterations} loop iteration{result.critique.iterations === 1 ? "" : "s"} · verdict:{" "}
          <strong>{result.critique.verdict}</strong>
        </p>
        {result.critique.summary && <p className="look-results-summary">{result.critique.summary}</p>}
      </div>

      <div className="look-results-grid">
        {result.looks.map((look, index) => {
          const products = productsFor(look);
          const total = products.reduce((sum, p) => sum + p.price, 0);
          return (
            <div className="look-card" key={index}>
              <h4 className="h6">{look.name}</h4>
              <ul className="look-card-items">
                {products.map((product) => (
                  <li key={product.id}>
                    {product.name} — ${product.price}
                  </li>
                ))}
              </ul>
              <p className="look-card-total">Total: ${total}</p>
              <p className="look-card-reasoning">{look.reasoning}</p>
              <button type="button" className="btn-fitted btn-outline btn-sm" onClick={() => onSaveLook(look)}>
                Save to My Looks
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
