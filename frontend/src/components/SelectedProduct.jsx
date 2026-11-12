/**
 * SelectedProduct.jsx
 *
 * Shows a summary of whichever product the user has selected from the
 * grid, plus the "Try It On" button that kicks off the (now real)
 * Virtual Try-On flow. This component demonstrates conditional
 * rendering: it displays a different message depending on whether a
 * product is selected, a photo is uploaded, and the user is signed in.
 *
 * Props:
 *   product     - the selected product object, or null
 *   hasPhoto    - boolean, whether the user has uploaded a front photo
 *   isSignedIn  - boolean -- try-on now calls a real, billed Vertex AI
 *                 endpoint (routes/tryOn.js), which requires sign-in
 *                 the same way generating looks or StyleScout does.
 *   onTryOn     - event handler for the "Try It On" button
 */
export default function SelectedProduct({ product, hasPhoto, isSignedIn, onTryOn }) {
  if (!product) {
    return (
      <div className="selected-product selected-product-empty">
        <p>Select a product from the right to see it here.</p>
      </div>
    );
  }

  const canTryOn = hasPhoto && isSignedIn;

  return (
    <div className="selected-product">
      <div className="selected-product-media">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="selected-product-details">
        <p className="product-card-category">{product.category}</p>
        <h3 className="h6 mb-1">{product.name}</h3>
        <p className="selected-product-price">${product.price}</p>

        <button type="button" className="btn-fitted btn-dark w-100" onClick={onTryOn} disabled={!canTryOn}>
          Try It On
        </button>

        {!hasPhoto && <p className="selected-product-hint">Upload a photo above to try this on.</p>}
        {hasPhoto && !isSignedIn && (
          <p className="selected-product-hint">Sign in with Google to try this on — it's a real AI call.</p>
        )}
      </div>
    </div>
  );
}
