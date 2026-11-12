import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductGrid from "../components/ProductGrid.jsx";
import { PRODUCTS } from "../data/products.js";
import { apiFetch } from "../services/apiClient.js";

/**
 * MyLooksPage.jsx
 *
 * Two things live here now:
 *
 *   1. Project 1's favorited single products — `favoriteIds` is just an
 *      array of product id strings (lifted state, owned by App.jsx),
 *      so this page filters the full catalog down to the matching
 *      products every render. A favorite can now come from EITHER
 *      catalog -- the local data/products.js (Fitting Room) or the
 *      live Mock Shop API (Shop page, see App.jsx) -- so both are
 *      combined before filtering by id, otherwise a Mock Shop product
 *      favorited from Shop would silently vanish here.
 *   2. Project 2's saved AI-generated looks — these are persisted in
 *      Firestore (users/{uid}/savedLooks) rather than client state, so
 *      they survive a page refresh and are the same for the same
 *      Google account on any device. `auth` is the same object
 *      FittingRoomPage uses (lifted to App.jsx), so this page reads
 *      back looks saved under that same sign-in.
 */
export default function MyLooksPage({ favoriteIds, onToggleFavorite, selectedProduct, onSelectProduct, auth, shopProducts }) {
  const allProducts = [...PRODUCTS, ...shopProducts];
  const favoriteProducts = allProducts.filter((product) => favoriteIds.includes(product.id));

  const [savedLooks, setSavedLooks] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | done | error

  // Fetch saved looks once sign-in is available, and again any time the
  // signed-in account changes (e.g. after sign-out/sign-in). This is a
  // standard React "fetch on mount / on dependency change" effect.
  useEffect(() => {
    if (!auth?.isSignedIn) {
      setSavedLooks([]);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    apiFetch("/api/looks/saved", { idToken: auth.idToken })
      .then(({ looks }) => {
        if (!cancelled) {
          setSavedLooks(looks);
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [auth?.isSignedIn, auth?.idToken]);

  async function handleRemoveLook(id) {
    try {
      await apiFetch(`/api/looks/saved/${id}`, { idToken: auth.idToken, method: "DELETE" });
      setSavedLooks((current) => current.filter((look) => look.id !== id));
    } catch {
      // Leave the list as-is — the user can try again.
    }
  }

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>My Looks</h1>
        <p>Pieces you've saved from the shop and fitting room.</p>
      </div>

      {favoriteProducts.length === 0 && savedLooks.length === 0 && status !== "loading" ? (
        <div className="my-looks-empty">
          <h2 className="h4">Your closet is waiting.</h2>
          <p>Save pieces you love and they'll appear here.</p>
          <Link to="/shop" className="btn-fitted btn-dark mt-2">
            Browse the Shop
          </Link>
        </div>
      ) : (
        <>
          {favoriteProducts.length > 0 && (
            <ProductGrid
              products={favoriteProducts}
              selectedProductIds={selectedProduct ? [selectedProduct.id] : []}
              favoriteIds={favoriteIds}
              onSelectProduct={onSelectProduct}
              onToggleFavorite={onToggleFavorite}
            />
          )}

          {auth?.isSignedIn && (
            <div className="saved-looks-section">
              <h2 className="h5 mt-3">Saved Looks</h2>
              {status === "loading" && <p className="style-request-status">Loading your saved looks…</p>}
              {status === "error" && <p className="style-request-error">Couldn't load saved looks.</p>}

              {status === "done" && savedLooks.length === 0 && (
                <p className="style-request-status">
                  No saved looks yet — generate some in the Fitting Room and save one.
                </p>
              )}

              <div className="look-results-grid">
                {savedLooks.map((look) => {
                  const products = look.productIds.map((id) => PRODUCTS.find((p) => p.id === id)).filter(Boolean);
                  const total = products.reduce((sum, p) => sum + p.price, 0);
                  return (
                    <div className="look-card" key={look.id}>
                      <h4 className="h6">{look.name}</h4>
                      <ul className="look-card-items">
                        {products.map((product) => (
                          <li key={product.id}>
                            {product.name} — ${product.price}
                          </li>
                        ))}
                      </ul>
                      <p className="look-card-total">Total: ${total}</p>
                      <p className="look-card-reasoning">{look.reasoning}</p>
                      <button type="button" className="btn-fitted btn-outline btn-sm" onClick={() => handleRemoveLook(look.id)}>
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
