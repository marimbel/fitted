import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { CATEGORIES, PRODUCTS } from "../data/products.js";

/**
 * ShopPage.jsx
 *
 * A dedicated full-catalog browsing view, reusing the exact same
 * CategoryFilter and ProductGrid components as the Fitting Room page.
 * Selecting a product here updates the same lifted `selectedProduct`
 * state in App.jsx, so the choice is already waiting in the Fitting Room
 * when the user heads over there to try it on.
 */
export default function ShopPage({ selectedProduct, onSelectProduct, favoriteIds, onToggleFavorite }) {
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Shop</h1>
        <p>Browse the full Fitted catalog.</p>
      </div>

      {selectedProduct && (
        <div className="shop-selection-note">
          <strong>{selectedProduct.name}</strong> is selected —{" "}
          <Link to="/">head to the Fitting Room to try it on</Link>.
        </div>
      )}

      <CategoryFilter categories={CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />

      <ProductGrid
        products={filteredProducts}
        selectedProductId={selectedProduct?.id ?? null}
        favoriteIds={favoriteIds}
        onSelectProduct={onSelectProduct}
        onToggleFavorite={onToggleFavorite}
        emptyMessageTitle="No products in this category yet."
        emptyMessageBody="Try selecting a different filter above."
      />
    </div>
  );
}
