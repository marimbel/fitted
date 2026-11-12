import { useMemo, useState } from "react";
import PhotoUploader from "../components/PhotoUploader.jsx";
import SelectedProduct from "../components/SelectedProduct.jsx";
import TryOnPanel from "../components/TryOnPanel.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import GoogleSignInButton from "../components/GoogleSignInButton.jsx";
import StyleRequestRecorder from "../components/StyleRequestRecorder.jsx";
import LookResultsPanel from "../components/LookResultsPanel.jsx";
import { NavLink } from "react-router-dom";
import { CATEGORIES, PRODUCTS } from "../data/products.js";
import { requestTryOn, requestImaginedAngle } from "../services/tryOnService.js";
import { apiFetch } from "../services/apiClient.js";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder.js";
import { trackEvent } from "../services/analytics.js";
import { logEvent, logError } from "../services/logger.js";

/**
 * FittingRoomPage.jsx
 *
 * The centerpiece of the App. Two things live here now:
 *
 *   1. The original Project 1 flow, restyled as one full-width "Stage"
 *      at the top of the page (TryOnPanel.jsx) instead of a two-column
 *      layout -- the uploaded photo and the real Virtual Try-On result
 *      both display there, with a product picker below it. The picker
 *      is a QUEUE, not a single pick: clicking "Select" (or dragging a
 *      card onto the Stage) adds/removes a product from
 *      `selectedProducts`, and "Try It On" chains one real Virtual
 *      Try-On call per queued item (see handleTryOn below), layering
 *      each result onto the last so more than one piece can be tried
 *      on at once.
 *   2. The Project 2 flow: sign in with Google, record a spoken style
 *      request, and (using photos imported from the separate Google
 *      Photos tab -- GooglePhotosPage.jsx) let the agent pipeline
 *      (backend/agents/orchestrator.js) recommend whole looks instead
 *      of one item at a time.
 *
 * Props (all Project 1 state, still lifted to App.jsx):
 *   photo, onPhotoSelected   - the uploaded photo
 *   selectedProducts         - the Stage's try-on queue (array of product
 *                              objects, not just one -- see above)
 *   onToggleSelectedProduct  - (product) => void, adds/removes a product
 *                              from the queue; App.jsx also keeps the
 *                              single cross-page `selectedProduct` pointer
 *                              (Shop/My Looks) in sync when this is called
 *   onRemoveSelectedProduct  - (product) => void, removes one queued item
 *                              (used by the remove button in the queue list)
 *   favoriteIds, onToggleFavorite - the user's saved products ("My Closet")
 *   photoAnalyses                 - photos imported from the Google
 *                                    Photos tab (GooglePhotosPage.jsx),
 *                                    each already analyzed by Gemini
 */
export default function FittingRoomPage({
  photo,
  onPhotoSelected,
  selectedProducts,
  onToggleSelectedProduct,
  onRemoveSelectedProduct,
  favoriteIds,
  onToggleFavorite,
  auth,
  photoAnalyses,
}) {
  const [activeCategory, setActiveCategory] = useState("All");

  // useState for the try-on request's lifecycle: "idle" | "loading" | "done".
  const [tryOnStatus, setTryOnStatus] = useState("idle");
  const [tryOnResult, setTryOnResult] = useState(null);
  // Shown in the Stage's loading state while multiple queued items are
  // being layered on one at a time (see handleTryOn) -- null outside
  // of a multi-item chain, where the generic "Preparing your look..."
  // caption is enough.
  const [tryOnStepLabel, setTryOnStepLabel] = useState(null);

  // Which Stage view is active ("front" | "side" | "back"), and the
  // Gemini-imagined results for side/back (keyed by angle). Side/Back
  // are speculative -- see TryOnPanel.jsx and tryOnService.js's
  // requestImaginedAngle -- so they're kept completely separate from
  // tryOnResult above, which is the one REAL Vertex AI result.
  const [activeStageView, setActiveStageView] = useState("front");
  const [imaginedAngles, setImaginedAngles] = useState({});

  // --- Project 2: voice style request. `auth` itself is now a prop
  // (lifted up to App.jsx) so My Looks can read back what's saved
  // under the same signed-in account; `photoAnalyses` is a prop for
  // the same reason -- it's imported from the Google Photos tab, not
  // owned by this page. ---
  const recorder = useVoiceRecorder();

  const [styleRequest, setStyleRequest] = useState(null);
  const [lookStatus, setLookStatus] = useState("idle"); // idle | loading | done | error
  const [lookResult, setLookResult] = useState(null);
  const [lookError, setLookError] = useState(null);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((product) => product.category === activeCategory);
  }, [activeCategory]);

  // Queuing/dequeuing a product clears whatever try-on result is
  // currently on the Stage -- otherwise it would keep showing a result
  // that no longer matches what's queued.
  function resetStageResult() {
    setTryOnStatus("idle");
    setTryOnResult(null);
    setActiveStageView("front");
    setImaginedAngles({});
  }

  function handleToggleProduct(product) {
    onToggleSelectedProduct(product);
    resetStageResult();
  }

  function handleRemoveProduct(product) {
    onRemoveSelectedProduct(product);
    resetStageResult();
  }

  // Dropping a ProductCard onto the Stage (see TryOnPanel.jsx's
  // onProductDrop) is an alternative to clicking "Select" -- the drag
  // payload is just the product id, so it's resolved back to a real
  // product object here before queuing it the same way a click would.
  function handleProductDrop(productId) {
    const product = PRODUCTS.find((item) => item.id === productId);
    if (product) handleToggleProduct(product);
  }

  // Chains one real Virtual Try-On call per queued item: the first
  // call uses the uploaded photo, and each call after that uses the
  // PREVIOUS call's generated image as its "photo" input, so each
  // item layers onto whatever's already on screen instead of
  // overwriting it. Vertex AI's Virtual Try-On model only ever takes
  // one photo + one garment per call (see tryOnService.js) -- this is
  // how "try on more than one item" is built on top of that, at the
  // cost of one real, billed API call per item instead of one call total.
  async function handleTryOn() {
    if (selectedProducts.length === 0) return;

    setTryOnStatus("loading");
    setActiveStageView("front");
    setImaginedAngles({});
    setTryOnResult(null);

    let currentPhoto = photo;
    let finalResult = null;

    for (let i = 0; i < selectedProducts.length; i++) {
      const product = selectedProducts[i];
      setTryOnStepLabel(
        selectedProducts.length > 1
          ? `Adding ${product.name} (${i + 1} of ${selectedProducts.length})...`
          : null
      );
      try {
        // Deliberately awaited inside the loop, not run in parallel --
        // each call needs the PREVIOUS call's output image as its input.
        finalResult = await requestTryOn({ idToken: auth.idToken, photo: currentPhoto, product });
      } catch (err) {
        finalResult = { success: false, error: err.message };
      }
      if (!finalResult.success) break; // stop the chain; whatever layered before this stays on screen
      currentPhoto = finalResult.imageDataUrl;
    }

    setTryOnStepLabel(null);
    setTryOnResult(finalResult);
    setTryOnStatus("done");

    if (finalResult?.success) {
      trackEvent({
        category: "API Request",
        action: "Called Virtual Try-On API",
        label:
          selectedProducts.length > 1
            ? `${selectedProducts.length} items layered`
            : selectedProducts[0]?.name,
      });
    } else {
      logError("try_on_failed", new Error(finalResult?.error || "unknown error"));
    }
  }

  // Switching to Side/Back the first time (or after a failed attempt)
  // kicks off a new Gemini call; switching back to a view that's
  // already been imagined this round just redisplays the cached result
  // -- TryOnPanel.jsx doesn't need to know the difference, it just
  // calls this and waits for `imaginedAngles` to update.
  async function handleStageViewChange(view) {
    setActiveStageView(view);
    if (view === "front") return;

    const existing = imaginedAngles[view];
    if (existing && existing.status === "loading") return; // already in flight
    if (existing && existing.status === "done" && existing.success) return; // already have a real result, don't re-spend a call

    setImaginedAngles((current) => ({ ...current, [view]: { status: "loading" } }));
    const result = await requestImaginedAngle({
      idToken: auth.idToken,
      frontImageDataUrl: tryOnResult?.imageDataUrl,
      angle: view,
    });
    setImaginedAngles((current) => ({ ...current, [view]: { status: "done", ...result } }));
    if (result.success) {
      trackEvent({ category: "API Request", action: "Called Gemini Image Generation", label: `Imagined ${view} view` });
    } else {
      logError("imagine_angle_failed", new Error(result.error));
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

      {/* The Stage: full width, at the top -- the uploaded photo and the
          real Virtual Try-On result both display here (TryOnPanel.jsx),
          on a backdrop whose color is a swatch picker away. */}
      <TryOnPanel
        photo={photo}
        status={tryOnStatus}
        result={tryOnResult}
        products={selectedProducts}
        stepLabel={tryOnStepLabel}
        imaginedAngles={imaginedAngles}
        activeView={activeStageView}
        onViewChange={handleStageViewChange}
        onProductDrop={handleProductDrop}
        uploadControl={<PhotoUploader photo={photo} onPhotoSelected={onPhotoSelected} />}
      />

      <div className="fitting-room-below-stage">
        <SelectedProduct
          products={selectedProducts}
          hasPhoto={Boolean(photo)}
          isSignedIn={auth.isSignedIn}
          onTryOn={handleTryOn}
          onRemove={handleRemoveProduct}
        />
      </div>

      <div className="fitting-room-shop">
        <CategoryFilter categories={CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />

        <ProductGrid
          products={filteredProducts}
          selectedProductIds={selectedProducts.map((product) => product.id)}
          favoriteIds={favoriteIds}
          onSelectProduct={handleToggleProduct}
          onToggleFavorite={onToggleFavorite}
          emptyMessageTitle="No products in this category yet."
          emptyMessageBody="Try selecting a different filter above."
        />
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
                Import at least one photo from the <NavLink to="/photos">Google Photos</NavLink> tab and
                record a style request to generate looks.
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
