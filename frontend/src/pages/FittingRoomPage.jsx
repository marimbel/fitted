import { useMemo, useState } from "react";
import PhotoUploader from "../components/PhotoUploader.jsx";
import SelectedProduct from "../components/SelectedProduct.jsx";
import TryOnPanel from "../components/TryOnPanel.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import StyleRequestRecorder from "../components/StyleRequestRecorder.jsx";
import LookResultsPanel from "../components/LookResultsPanel.jsx";
import { CATEGORIES, PRODUCTS } from "../data/products.js";
import { simulateTryOn } from "../services/tryOnService.js";
import { apiFetch } from "../services/apiClient.js";
import { useGooglePhotosPicker } from "../hooks/useGooglePhotosPicker.js";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder.js";
import { trackEvent } from "../services/analytics.js";
import { logEvent, logError } from "../services/logger.js";

/**
 * FittingRoomPage.jsx
 *
 * The centerpiece of the App. Two things live here now:
 *
 *   1. The original Project 1 flow (two-column layout: photo + product
 *      picker on the left/right, simulated single-item try-on) —
 *      unchanged below.
 *   2. The new Project 2 flow: sign in with Google, pull in a photo
 *      from Google Photos and/or record a spoken style request, then
 *      let the ADK-style agent pipeline (backend/agents/stylistPipeline.js)
 *      recommend whole looks instead of one item at a time.
 *
 * Props (all Project 1 state, still lifted to App.jsx):
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
  auth,
}) {
  const [activeCategory, setActiveCategory] = useState("All");

  // useState for the try-on request's lifecycle: "idle" | "loading" | "done".
  const [tryOnStatus, setTryOnStatus] = useState("idle");
  const [tryOnMessage, setTryOnMessage] = useState("");

  // --- Project 2: Photos import + voice style request. `auth` itself is
  // now a prop (lifted up to App.jsx) so My Looks can read back what's
  // saved under the same signed-in account. ---
  const photosPicker = useGooglePhotosPicker({ idToken: auth.idToken, accessToken: auth.accessToken });
  const recorder = useVoiceRecorder();

  const [photoAnalyses, setPhotoAnalyses] = useState([]);
  const [styleRequest, setStyleRequest] = useState(null);
  const [lookStatus, setLookStatus] = useState("idle"); // idle | loading | done | error
  const [lookResult, setLookResult] = useState(null);
  const [lookError, setLookError] = useState(null);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  async function handleTryOn() {
    setTryOnStatus("loading");
    // PROJECT 2: Replace this simulated operation with the Express API
    // endpoint for Google Virtual Try-On (see src/services/tryOnService.js) —
    // deferred per the proposal review until the core workflow below is solid.
    const result = await simulateTryOn(photo, selectedProduct);
    setTryOnMessage(result.message);
    setTryOnStatus("done");
  }

  async function handleImportFromGooglePhotos() {
    const newAnalyses = await photosPicker.pickPhotos();
    if (newAnalyses?.length) {
      setPhotoAnalyses((current) => [...current, ...newAnalyses]);
      // Show the first picked photo in the same preview the local-file
      // path uses, so the rest of the page doesn't need to know where
      // the photo came from.
      const first = newAnalyses[0];
      onPhotoSelected(`data:${first.mimeType};base64,${first.previewBase64}`);
    }
  }

  async function handleGenerateLooks() {
    if (!photoAnalyses.length || !styleRequest) return;
    // This click is the clearest "Called Gemini API" moment in the
    // whole app — it kicks off the full StyleAnalyst -> loop(LookBuilder
    // <-> LookCritic) pipeline — so it's the headline example event
    // straight from the syllabus's own GA4 sample code.
    trackEvent({ category: "API Request", action: "Called Gemini API", label: "Generate Looks" });
    const startedAt = Date.now();
    try {
      setLookStatus("loading");
      setLookError(null);
      const result = await apiFetch("/api/looks/generate", {
        idToken: auth.idToken,
        method: "POST",
        body: JSON.stringify({ photoAnalyses, styleRequest }),
      });
      setLookResult(result);
      setLookStatus("done");
      logEvent("looks_generated", {
        iterations: result?.critique?.iterations,
        verdict: result?.critique?.verdict,
        durationMs: Date.now() - startedAt,
      });
    } catch (err) {
      setLookError(err.message);
      setLookStatus("error");
      logError("looks_generate_failed", err);
    }
  }

  async function handleSaveLook(look) {
    try {
      await apiFetch("/api/looks/saved", {
        idToken: auth.idToken,
        method: "POST",
        body: JSON.stringify({ look }),
      });
      trackEvent({ category: "Engagement", action: "Saved Look", label: "My Looks" });
    } catch (err) {
      // A failed save here is non-critical to the rest of the page —
      // the look is still visible in the results panel either way —
      // but it's still worth a log entry to notice if this starts
      // failing often.
      logError("look_save_failed", err);
    }
  }

  const canGenerateLooks = auth.isSignedIn && photoAnalyses.length > 0 && Boolean(styleRequest);

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Virtual Fitting Room</h1>
        <p>Find something you love. See how it fits your style.</p>
      </div>

      <div className="fitting-room-grid">
        {/* LEFT SIDE: photo + selection + try-on result */}
        <div className="fitting-room-left">
          <PhotoUploader
            photo={photo}
            onPhotoSelected={onPhotoSelected}
            onImportFromGooglePhotos={auth.isSignedIn ? handleImportFromGooglePhotos : undefined}
            googlePhotosStatus={photosPicker.status}
          />

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

      {/* Project 2: AI style recommendations, built on top of the Project 1
          layout above rather than replacing it. */}
      <section className="ai-recommendations">
        <div className="fitting-room-heading">
          <h2 className="h4">Get AI Style Recommendations</h2>
          <p>Sign in, bring in a photo, tell us what you're after — the agent pipeline does the rest.</p>
        </div>

        <div className="ai-recommendations-grid">
          <div className="ai-recommendations-controls">
            <GoogleSignInButton auth={auth} />

            {auth.isSignedIn && (
              <StyleRequestRecorder recorder={recorder} idToken={auth.idToken} onParsed={setStyleRequest} />
            )}

            {auth.isSignedIn && (
              <button
                type="button"
                className="btn-fitted btn-dark w-100 mt-2"
                onClick={handleGenerateLooks}
                disabled={!canGenerateLooks || lookStatus === "loading"}
              >
                Generate Looks
              </button>
            )}

            {auth.isSignedIn && !canGenerateLooks && (
              <p className="style-request-status">
                Import at least one photo and record a style request to generate looks.
              </p>
            )}
          </div>

          <div className="ai-recommendations-results">
            <LookResultsPanel status={lookStatus} result={lookResult} error={lookError} onSaveLook={handleSaveLook} />
          </div>
        </div>
      </section>
    </div>
  );
}
