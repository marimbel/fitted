/**
 * SelectedProduct.jsx
 *
 * Shows the Fitting Room's current try-on QUEUE -- every product the
 * user has selected (click "Select" on a card, or drag one onto the
 * Stage), not just one. Each item can be removed individually, and the
 * "Try It On" button kicks off FittingRoomPage.handleTryOn, which calls
 * the real Virtual Try-On endpoint once per queued item, layering each
 * result onto the last.
 *
 * This still demonstrates conditional rendering (an empty-queue message
 * vs. the list vs. the various hint messages below the button), just
 * over an array instead of a single value.
 *
 * Props:
 *   products    - array of selected product objects (may be empty)
 *   hasPhoto    - boolean, whether the user has uploaded a front photo
 *   isSignedIn  - boolean -- try-on now calls a real, billed Vertex AI
 *                 endpoint (routes/tryOn.js) once per item, which
 *                 requires sign-in the same way generating looks does.
 *   onTryOn     - event handler for the "Try It On" button
 *   onRemove    - (product) => void, removes one item from the queue
 */
export default function SelectedProduct({ products, hasPhoto, isSignedIn, onTryOn, onRemove }) {
  if (products.length === 0) {
    return (
      <div className="selected-product selected-product-empty">
        <p>Select one or more products below to try them on — click "Select," or drag a card onto the Stage.</p>
      </div>
    );
  }

  const canTryOn = hasPhoto && isSignedIn;
  const total = products.reduce((sum, product) => sum + product.price, 0);
  const isMulti = products.length > 1;

  return (
    <div className="selected-product">
      <ul className="selected-product-list">
        {products.map((product) => (
          <li key={product.id} className="selected-product-item">
            <img src={product.image} alt={product.name} />
            <div className="selected-product-item-details">
              <p className="product-card-category">{product.category}</p>
              <h3 className="h6 mb-1">{product.name}</h3>
              <p className="selected-product-price">${product.price}</p>
            </div>
            <button
              type="button"
              className="selected-product-remove"
              onClick={() => onRemove(product)}
              aria-label={`Remove ${product.name} from the try-on queue`}
            >
              &times;
            </button>
          </li>
        ))}
      </ul>

      {isMulti && (
        <p className="selected-product-total">
          Total: ${total} across {products.length} items
        </p>
      )}

      <button type="button" className="btn-fitted btn-dark w-100" onClick={onTryOn} disabled={!canTryOn}>
        {isMulti ? `Try On ${products.length} Items` : "Try It On"}
      </button>

      {!hasPhoto && <p className="selected-product-hint">Upload a photo above to try this on.</p>}
      {hasPhoto && !isSignedIn && (
        <p className="selected-product-hint">Sign in with Google to try this on — it's a real AI call.</p>
      )}
      {isMulti && (
        <p className="selected-product-hint">
          Each item is layered on with its own real Virtual Try-On call, in the order listed above.
        </p>
      )}
    </div>
  );
}
