import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";

/**
 * ShopPage.jsx
 *
 * A dedicated full-catalog browsing view, reusing the exact same
 * CategoryFilter and ProductGrid components as the Fitting Room page.
 * Selecting a product here updates the same lifted `selectedProduct`
 * state in App.jsx, so the choice is already waiting in the Fitting
 * Room when the user heads over there to try it on.
 *
 * PROJECT 2: unlike the Fitting Room's catalog (data/products.js,
 * curated and validated by the agent pipeline), this page's products
 * come from a REAL external commerce API -- Shopify's Mock Shop (see
 * backend/services/mockShopService.js) -- fetched once in App.jsx and
 * passed down as props, rather than imported as static data. That's
 * why this component takes `products`/`status`/`error` instead of
 * reaching for a local data file: it's purely presentational, the same
 * "dumb component" pattern ProductCard already uses.
 */
export default function ShopPage({ products, status, error, selectedProduct, onSelectProduct, favoriteIds, onToggleFavorite }) {
  const [activeCategory, setActiveCategory] = useState("All");

  // Mock Shop's own catalog doesn't share Fitted's fashion categories
  // (Tops/Outerwear/Dresses/Bottoms), so the filter list is built from
  // whatever categories the live API actually returned, instead of a
  // fixed list -- see mockShopService.js's normalizeMockShopProduct().
  const categories = useMemo(() => {
    const unique = [...new Set(products.map((product) => product.category))].sort();
    return ["All", ...unique];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return products;
    return products.filter((product) => product.category === activeCategory);
  }, [products, activeCategory]);

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Shop</h1>
        <p>Live from Shopify's Mock Shop API — a real external product catalog, not Fitted's own demo data.</p>
      </div>

      {selectedProduct && (
        <div className="shop-selection-note">
          <strong>{selectedProduct.name}</strong> is selected —{" "}
          <Link to="/">head to the Fitting Room to try it on</Link>.
        </div>
      )}

      {status === "loading" && <p className="shop-status">Loading the live catalog…</p>}

      {status === "error" && (
        <p className="shop-status shop-status-error">Couldn't reach Mock Shop right now ({error}). Try refreshing in a moment.</p>
      )}

      {status === "done" && (
        <>
          <CategoryFilter categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} />

          <ProductGrid
            products={filteredProducts}
            selectedProductIds={selectedProduct ? [selectedProduct.id] : []}
            favoriteIds={favoriteIds}
            onSelectProduct={onSelectProduct}
            onToggleFavorite={onToggleFavorite}
            emptyMessageTitle="No products in this category yet."
            emptyMessageBody="Try selecting a different filter above."
          />
        </>
      )}
    </div>
  );
}
