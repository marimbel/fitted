import ProductCard from "./ProductCard.jsx";

/**
 * ProductGrid.jsx
 *
 * Lays out a list of products as ProductCards using Bootstrap's responsive
 * grid classes (col-6 / col-md-4 / col-lg-4 below). This is "component
 * composition": ProductGrid doesn't know how a single product looks, it
 * just repeats ProductCard once per product and passes each one its props.
 *
 * Props:
 *   products          - array of product objects to display
 *   selectedProductIds - array of currently-selected product ids. Shop and
 *     My Looks only ever put at most one id in here (single selection,
 *     shared with the Fitting Room via lifted state); the Fitting Room's
 *     own grid passes its whole multi-item try-on queue, so more than one
 *     card can show as selected at once -- ProductGrid/ProductCard don't
 *     need to know which case they're in, they just highlight whatever
 *     ids are in the array.
 *   favoriteIds       - array of favorited product ids
 *   onSelectProduct   - (product) => void -- called on click/drag-start;
 *     each page decides whether this REPLACES its single selection or
 *     TOGGLES membership in a queue, ProductGrid doesn't care.
 *   onToggleFavorite  - (product) => void
 *   emptyMessageTitle / emptyMessageBody - shown instead of the grid when
 *     `products` is empty (used by the "My Looks" page)
 */
export default function ProductGrid({
  products,
  selectedProductIds,
  favoriteIds,
  onSelectProduct,
  onToggleFavorite,
  emptyMessageTitle = "No products found.",
  emptyMessageBody = "Try a different category.",
}) {
  if (products.length === 0) {
    return (
      <div className="product-grid-empty">
        <h3 className="h5">{emptyMessageTitle}</h3>
        <p>{emptyMessageBody}</p>
      </div>
    );
  }

  return (
    <div className="row g-3 g-lg-4">
      {products.map((product) => (
        <div className="col-6 col-lg-4 col-xl-3" key={product.id}>
          <ProductCard
            product={product}
            isSelected={selectedProductIds.includes(product.id)}
            isFavorite={favoriteIds.includes(product.id)}
            onSelect={() => onSelectProduct(product)}
            onToggleFavorite={() => onToggleFavorite(product)}
          />
        </div>
      ))}
    </div>
  );
}
