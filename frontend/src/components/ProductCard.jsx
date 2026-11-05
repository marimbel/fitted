import FavoritesButton from "./FavoritesButton.jsx";

/**
 * ProductCard.jsx
 *
 * Renders a single product. This component is deliberately "dumb": it
 * receives everything it needs through props and never manages its own
 * state. All the interesting state (which product is selected, which
 * products are favorited) is lifted up to the App component, and this
 * card just reflects that state visually and calls the callback props
 * (`onSelect`, `onToggleFavorite`) when the user interacts with it.
 *
 * Props:
 *   product          - { id, name, category, price, image }
 *   isSelected       - boolean, true when this is the app's selectedProduct
 *   isFavorite       - boolean, true when this product's id is in favorites
 *   onSelect         - event handler, called when "Select" is clicked
 *   onToggleFavorite - event handler, called when the heart icon is clicked
 */
export default function ProductCard({ product, isSelected, isFavorite, onSelect, onToggleFavorite }) {
  return (
    <div className={`product-card${isSelected ? " is-selected" : ""}`}>
      <div className="product-card-image">
        <img src={product.image} alt={product.name} />
        <div className="product-card-favorite">
          <FavoritesButton isFavorite={isFavorite} onToggle={onToggleFavorite} />
        </div>
        {isSelected && <span className="product-card-badge">Selected</span>}
      </div>

      <div className="product-card-body">
        <p className="product-card-category">{product.category}</p>
        <h3 className="product-card-name">{product.name}</h3>
        <div className="product-card-footer">
          <span className="product-card-price">${product.price}</span>
          <button type="button" className="btn-fitted btn-outline btn-sm" onClick={onSelect}>
            {isSelected ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}
