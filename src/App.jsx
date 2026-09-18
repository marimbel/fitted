import { useState } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import SpaTabs from "./components/SpaTabs.jsx";
import FittingRoomPage from "./pages/FittingRoomPage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import MyLooksPage from "./pages/MyLooksPage.jsx";

/**
 * App.jsx
 *
 * The root component of the Virtual Fitting Room SPA. This is where all
 * of the shared state lives ("lifted state"): the uploaded photo, the
 * selected product, and the list of favorited product ids. Lifting this
 * state up to the common ancestor of every page that needs it is the
 * standard React pattern for sharing data between sibling components
 * (Shop, Fitting Room, and My Looks all need to read/update it).
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
              />
            }
          />
        </Routes>
      </div>
    </HashRouter>
  );
}
