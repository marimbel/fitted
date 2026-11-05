import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import SpaTabs from "./components/SpaTabs.jsx";
import FittingRoomPage from "./pages/FittingRoomPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import MyLooksPage from "./pages/MyLooksPage.jsx";
import { useGoogleAuth } from "./hooks/useGoogleAuth.js";

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

  // Project 2: one Google sign-in shared by every page that needs it —
  // calling useGoogleAuth() here once (instead of separately inside
  // FittingRoomPage and MyLooksPage) avoids rendering two independent
  // "Sign in with Google" buttons with two different auth states.
  const auth = useGoogleAuth();

  function handleToggleFavorite(product) {
    setFavoriteIds((currentIds) =>
      currentIds.includes(product.id)
        ? currentIds.filter((id) => id !== product.id) // remove
        : [...currentIds, product.id] // add
    );
  }

  return (
    <HashRouter>
      <Navbar activePage="app" />

      <div className="container-fitted spa-shell">
        <SpaTabs />

        <Routes>
          <Route
            path="/"
            element={
              <FittingRoomPage
                photo={photo}
                onPhotoSelected={setPhoto}
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
                auth={auth}
              />
            }
          />
          <Route
            path="/shop"
            element={
              <ShopPage
                selectedProduct={selectedProduct}
                onSelectProduct={setSelectedProduct}
                favoriteIds={favoriteIds}
                onToggleFavorite={handleToggleFavorite}
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
              />
            }
          />
        </Routes>
      </div>
    </HashRouter>
  );
}
