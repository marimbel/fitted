import { useMemo, useState } from "react";
import PhotoUploader from "../components/PhotoUploader.jsx";
import SelectedProduct from "../components/SelectedProduct.jsx";
import TryOnPanel from "../components/TryOnPanel.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import { CATEGORIES, PRODUCTS } from "../data/products.js";
import { simulateTryOn } from "../services/tryOnService.js";

/**
 * FittingRoomPage.jsx
 *
 * The centerpiece of the App: a two-column layout (see fitting-room-grid
 * in app.css) with the user's photo + selected product on the left, and
 * product discovery on the right. On small screens the CSS grid collapses
 * to a single column automatically (no JS needed for that part).
 *
 * Props (all state is lifted to App.jsx and passed down):
 *   photo, onPhotoSelected           - the uploaded photo
 *   selectedProduct, onSelectProduct - the product chosen from the grid
 *   favoriteIds, onToggleFavorite    - the user's saved products
 */
export default function FittingRoomPage({
  photo,
  onPhotoSelected,
  selectedProduct,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
}) {
  const [activeCategory, setActiveCategory] = useState("All");

  // useState for the try-on request's lifecycle: "idle" | "loading" | "done".
  // This lives here (not in TryOnPanel) because FittingRoomPage is the
  // component that actually calls the simulateTryOn() service.
  const [tryOnStatus, setTryOnStatus] = useState("idle");
  const [tryOnMessage, setTryOnMessage] = useState("");

  // Recompute the filtered list only when the category or catalog changes.
  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  async function handleTryOn() {
    setTryOnStatus("loading");
    // PROJECT 2: Replace this simulated operation with the Express API
    // endpoint for Google Virtual Try-On (see src/services/tryOnService.js).
    const result = await simulateTryOn(photo, selectedProduct);
    setTryOnMessage(result.message);
    setTryOnStatus("done");
  }

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Virtual Fitting Room</h1>
        <p>Find something you love. See how it fits your style.</p>
      </div>

      <div className="fitting-room-grid">
        {/* LEFT SIDE: photo + selection + try-on result */}
        <div className="fitting-room-left">
          <PhotoUploader photo={photo} onPhotoSelected={onPhotoSelected} />

          <SelectedProduct product={selectedProduct} hasPhoto={Boolean(photo)} onTryOn={handleTryOn} />

          <TryOnPanel status={tryOnStatus} product={selectedProduct} resultMessage={tryOnMessage} />
        </div>

        {/* RIGHT SIDE: product discovery */}
        <div className="fitting-room-right">
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
      </div>
    </div>
  );
}
