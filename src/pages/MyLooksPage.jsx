import { Link } from "react-router-dom";
import ProductGrid from "../components/ProductGrid.jsx";
import { PRODUCTS } from "../data/products.js";

/**
 * MyLooksPage.jsx
 *
 * Displays whichever products the user has favorited. `favoriteIds` is
 * just an array of product id strings (lifted state, owned by App.jsx),
 * so this page filters the full catalog down to the matching products
 * every render — there's no separate "favorited products" list to keep
 * in sync.
 */
export default function MyLooksPage({ favoriteIds, onToggleFavorite, selectedProduct, onSelectProduct }) {
  const favoriteProducts = PRODUCTS.filter((product) => favoriteIds.includes(product.id));

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>My Looks</h1>
        <p>Pieces you've saved from the shop and fitting room.</p>
      </div>

      {favoriteProducts.length === 0 ? (
        <div className="my-looks-empty">
          <h2 className="h4">Your closet is waiting.</h2>
          <p>Save pieces you love and they'll appear here.</p>
          <Link to="/shop" className="btn-fitted btn-dark mt-2">
            Browse the Shop
          </Link>
        </div>
      ) : (
        <ProductGrid
          products={favoriteProducts}
          selectedProductId={selectedProduct?.id ?? null}
          favoriteIds={favoriteIds}
          onSelectProduct={onSelectProduct}
          onToggleFavorite={onToggleFavorite}
        />
      )}
    </div>
  );
}
