import FavoritesButton from "./FavoritesButton.jsx";

/**
 * ProductCard.jsx
 *
 * Renders a single product. This component is deliberately "dumb": it
 * receives everything it needs through props and never manages its own
 * state. All the interesting state (which product(s) are selected, which
 * products are favorited) is lifted up to the App component, and this
 * card just reflects that state visually and calls the callback props
 * (`onSelect`, `onToggleFavorite`) when the user interacts with it.
 *
 * Cards are also HTML5-draggable: dragging one onto the Fitting Room's
 * Stage (TryOnPanel.jsx) is an alternative to clicking "Select" for
 * adding it to the try-on queue. The drag payload is just the product
 * id (text/plain) -- the drop target looks it up, this component doesn't
 * need to know anything about where it might get dropped.
 *
 * Props:
 *   product          - { id, name, category, price, image }
 *   isSelected       - boolean, true when this product's id is in the
 *                      page's current selection (see ProductGrid.jsx)
 *   isFavorite       - boolean, true when this product's id is in favorites
 *                      ("My Closet") -- the heart icon and the "Add to
 *                      Closet" button both reflect/toggle this SAME state,
 *                      they're two controls for one favorite, not two
 *                      separate lists.
 *   onSelect         - event handler, called when "Select" is clicked or
 *                      the card is dropped onto the Stage
 *   onToggleFavorite - event handler, called when the heart icon or the
 *                      "Add to Closet" button is clicked
 */
export default function ProductCard({ product, isSelected, isFavorite, onSelect, onToggleFavorite }) {
  return (
    <div
      className={`product-card${isSelected ? " is-selected" : ""}`}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", product.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
    >
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
        <button
          type="button"
          className={`product-card-closet-btn${isFavorite ? " is-active" : ""}`}
          onClick={onToggleFavorite}
        >
          {isFavorite ? "In Closet" : "Add to Closet"}
        </button>
      </div>
    </div>
  );
}
