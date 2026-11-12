import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import SpaTabs from "./components/SpaTabs.jsx";
import FittingRoomPage from "./pages/FittingRoomPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import MyLooksPage from "./pages/MyLooksPage.jsx";
import GooglePhotosPage from "./pages/GooglePhotosPage.jsx";
import { useGoogleAuth } from "./hooks/useGoogleAuth.js";
import { trackPageview, trackEvent } from "./services/analytics.js";
import { apiFetch } from "./services/apiClient.js";

// HashRouter navigation (e.g. #/shop) never triggers a real browser page
// load, so GA4 can't see those "page" changes on its own -- this small
// component sends one manually every time the SPA's route changes.
// useLocation() only works inside a Router, which is why this is its
// own component rendered under <HashRouter> below, rather than logic
// inside App() itself.
function RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(`/app.html#${location.pathname}`);
  }, [location.pathname]);
  return null;
}

/**
 * App.jsx
 *
 * The root component of the Virtual Fitting Room SPA. This is where all
 * of the shared state lives ("lifted state"): the uploaded photo, the
 * selected product, the list of favorited product ids, and — for
 * Project 2 — the signed-in Google user. Lifting this up to the common
 * ancestor of every page that needs it is the standard React pattern
 * for sharing data between sibling components: Fitting Room needs auth
 * to call the backend, and My Looks needs the SAME auth (not a second,
 * independent sign-in) to read back what was saved under that account.
 *
 * We use HashRouter instead of BrowserRouter so that client-side routes
 * like #/shop work correctly when the site is served as static files
 * from Apache (see DockerContainer/) without any server-side rewrite
 * rules — a real requirement once this gets deployed to EC2.
 */
export default function App() {
  // useState returns [currentValue, setterFunction]. Every time a setter
  // is called, React re-renders this component (and its children) with
  // the new value.
  const [photo, setPhoto] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);

  // The Fitting Room's try-on QUEUE -- unlike `selectedProduct` above
  // (a single pointer shared with Shop/My Looks for cross-page
  // continuity), this can hold more than one product at once, so the
  // user can layer several items onto the same photo in one "Try It
  // On" (see FittingRoomPage.handleTryOn, which chains one real
  // Virtual Try-On call per queued item). Lifted here rather than kept
  // local to FittingRoomPage for the same reason `photo` is: it's part
  // of this page's shared, persisted-across-navigation state.
  const [selectedProducts, setSelectedProducts] = useState([]);

  function handleToggleSelectedProduct(product) {
    setSelectedProducts((current) => {
      const alreadyQueued = current.some((item) => item.id === product.id);
      return alreadyQueued
        ? current.filter((item) => item.id !== product.id) // already queued -> remove
        : [...current, product]; // not queued yet -> add
    });
    // Keep the single cross-page pointer in sync too, so Shop/My Looks
    // still reflect "the last thing picked in the Fitting Room" the
    // same way they already reflect picks made on each other.
    setSelectedProduct(product);
  }

  function handleRemoveSelectedProduct(product) {
    setSelectedProducts((current) => current.filter((item) => item.id !== product.id));
  }

  // Google Photos imports (each one Gemini-analyzed) -- lifted here,
  // not local to either page that touches it, so the dedicated Google
  // Photos tab (GooglePhotosPage.jsx) and the Fitting Room's "Generate
  // Looks" flow (FittingRoomPage.jsx) both see the same list, the same
  // way `photo` and `shopProducts` are shared across pages below.
  const [photoAnalyses, setPhotoAnalyses] = useState([]);

  function handleAnalysesAdded(newAnalyses) {
    setPhotoAnalyses((current) => [...current, ...newAnalyses]);
  }

  // Project 2: the Shop page's catalog, fetched once here (not inside
  // ShopPage itself) from a REAL external commerce API -- Shopify's
  // Mock Shop (see backend/services/mockShopService.js) -- and lifted
  // up for the same reason `auth` is: My Looks needs to resolve a
  // favorited Mock Shop product by id too, so it can't only know about
  // the local data/products.js catalog the Fitting Room still uses.
  const [shopProducts, setShopProducts] = useState([]);
  const [shopStatus, setShopStatus] = useState("loading"); // loading | done | error
  const [shopError, setShopError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/shop/products")
      .then(({ products }) => {
        if (!cancelled) {
          setShopProducts(products);
          setShopStatus("done");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setShopError(err.message);
          setShopStatus("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Project 2: one Google sign-in shared by every page that needs it —
  // calling useGoogleAuth() here once (instead of separately inside
  // FittingRoomPage and MyLooksPage) avoids rendering two independent
  // "Sign in with Google" buttons with two different auth states.
  const auth = useGoogleAuth();

  function handleToggleFavorite(product) {
    const willFavorite = !favoriteIds.includes(product.id);
    setFavoriteIds((currentIds) =>
      currentIds.includes(product.id)
        ? currentIds.filter((id) => id !== product.id) // remove
        : [...currentIds, product.id] // add
    );
    trackEvent({
      category: "Engagement",
      action: willFavorite ? "Favorited Product" : "Unfavorited Product",
      label: product.name,
    });
  }

  return (
    <HashRouter>
      <RouteTracker />
      <Navbar activePage="app" />

      <div className="spa-shell-wide">
        <SpaTabs />

        <Routes>
          <Route
            path="/"
            element={
              <FittingRoomPage
                photo={photo}
                onPhotoSelected={setPhoto}
                selectedProducts={selectedProducts}
                onToggleSelectedProduct={handleToggleSelectedProduct}
                onRemoveSelectedProduct={handleRemoveSelectedProduct}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                auth={auth}
                photoAnalyses={photoAnalyses}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                products={shopProducts}
                status={shopStatus}
                error={shopError}
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
              />
            }
          />
          <Route
            path="/photos"
            element={
              <GooglePhotosPage
                auth={auth}
                photoAnalyses={photoAnalyses}
                onAnalysesAdded={handleAnalysesAdded}
                activePhoto={photo}
                onPhotoSelected={setPhoto}
              />
            }
          />
          <Route
            path="/my-looks"
            element={
              <MyLooksPage
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                auth={auth}
                shopProducts={shopProducts}
              />
            }
          />
        </Routes>
      </div>
    </HashRouter>
  );
}
