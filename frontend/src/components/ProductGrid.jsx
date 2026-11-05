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
 *   products         - array of product objects to display
 *   selectedProductId - id of the currently-selected product (or null)
 *   favoriteIds      - array of favorited product ids
 *   onSelectProduct  - (product) => void
 *   onToggleFavorite - (product) => void
 *   emptyMessageTitle / emptyMessageBody - shown instead of the grid when
 *     `products` is empty (used by the "My Looks" page)
 */
export default function ProductGrid({
  products,
  selectedProductId,
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
        <div className="col-6 col-lg-4" key={product.id}>
          <ProductCard
            product={product}
            isSelected={product.id === selectedProductId}
            isFavorite={favoriteIds.includes(product.id)}
            onSelect={() => onSelectProduct(product)}
            onToggleFavorite={() => onToggleFavorite(product)}
          />
        </div>
      ))}
    </div>
  );
}
