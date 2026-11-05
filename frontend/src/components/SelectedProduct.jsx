/**
 * SelectedProduct.jsx
 *
 * Shows a summary of whichever product the user has selected from the
 * grid, plus the "Try It On" button that kicks off the simulated try-on
 * flow. This component demonstrates conditional rendering: it displays a
 * different message depending on whether a product has been selected and
 * whether a photo has been uploaded yet.
 *
 * Props:
 *   product   - the selected product object, or null
 *   hasPhoto  - boolean, whether the user has uploaded a photo
 *   onTryOn   - event handler for the "Try It On" button
 */
export default function SelectedProduct({ product, hasPhoto, onTryOn }) {
  if (!product) {
    return (
      <div className="selected-product selected-product-empty">
        <p>Select a product from the right to see it here.</p>
      </div>
    );
  }

  const canTryOn = hasPhoto;

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

        {!canTryOn && <p className="selected-product-hint">Upload a photo above to try this on.</p>}
      </div>
    </div>
  );
}
