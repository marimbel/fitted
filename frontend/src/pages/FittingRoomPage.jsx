import { useMemo, useRef, useState } from "react";
import PhotoUploader from "../components/PhotoUploader.jsx";
import SelectedProduct from "../components/SelectedProduct.jsx";
import TryOnPanel from "../components/TryOnPanel.jsx";
import CategoryFilter from "../components/CategoryFilter.jsx";
import ProductGrid from "../components/ProductGrid.jsx";
import StyleSearchModal from "../components/StyleSearchModal.jsx";
import ExploreStyle from "../components/ExploreStyle.jsx";
import LookBuilderQuiz from "../components/LookBuilderQuiz.jsx";
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
 *      both display there, with a product picker below it.
 *   2. The Project 2 flow: sign in with Google, record a spoken style
 *      request, and (using photos imported from the separate Google
 *      Photos tab -- GooglePhotosPage.jsx) let the agent pipeline
 *      (backend/agents/orchestrator.js) recommend whole looks instead
 *      of one item at a time.
 *
 * Props (all Project 1 state, still lifted to App.jsx):
 *   photo, onPhotoSelected           - the uploaded photo
 *   selectedProduct, onSelectProduct - the product chosen from the grid
 *   favoriteIds, onToggleFavorite    - the user's saved products
 *   photoAnalyses                    - photos imported from the Google
 *                                       Photos tab (GooglePhotosPage.jsx),
 *                                       each already analyzed by Gemini
 */
export default function FittingRoomPage({
  photo,
  onPhotoSelected,
  selectedProduct,
  onSelectProduct,
  favoriteIds,
  onToggleFavorite,
  auth,
  photoAnalyses,
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const tryOnRef = useRef(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quizOpen, setQuizOpen] = useState(false);
  const [visualPreferences, setVisualPreferences] = useState(null);

  // useState for the try-on request's lifecycle: "idle" | "loading" | "done".
  const [tryOnStatus, setTryOnStatus] = useState("idle");
  const [tryOnResult, setTryOnResult] = useState(null);

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

  // Picking a new product clears whatever try-on result is currently
  // on the Stage -- otherwise the previous item's generated image
  // would stay up even though it's no longer what's selected below.
  function handleSelectProduct(product) {
    onSelectProduct(product);
    setTryOnStatus("idle");
    setTryOnResult(null);
    setActiveStageView("front");
    setImaginedAngles({});
    const stage = tryOnRef.current;
    if (stage) {
      const navHeight = document.querySelector(".fitted-navbar")?.getBoundingClientRect().height ?? 0;
      window.scrollTo({
        top: Math.max(0, window.scrollY + stage.getBoundingClientRect().top - navHeight - 16),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }
  }

  function handleClothingDrop(event) {
    const productId = event.dataTransfer.getData("application/x-fitted-product");
    if (!productId) return;
    event.preventDefault();
    const product = PRODUCTS.find((item) => String(item.id) === productId);
    if (product) handleSelectProduct(product);
  }

  async function handleTryOn() {
    setTryOnStatus("loading");
    setActiveStageView("front");
    setImaginedAngles({});
    try {
      // Real Vertex AI Virtual Try-On call (see src/services/tryOnService.js
      // and backend/services/virtualTryOnService.js) -- one real image,
      // from the one photo the user uploaded.
      const result = await requestTryOn({ idToken: auth.idToken, photo, product: selectedProduct });
      setTryOnResult(result);
      setTryOnStatus("done");
      trackEvent({ category: "API Request", action: "Called Virtual Try-On API", label: selectedProduct?.name });
    } catch (err) {
      setTryOnResult({ success: false, error: err.message });
      setTryOnStatus("done");
      logError("try_on_failed", err);
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
    if (!canGenerateLooks) return;
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
        body: JSON.stringify({ photoAnalyses, styleRequest, visualPreferences }),
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

  const canGenerateLooks = auth.isSignedIn && (Boolean(visualPreferences?.length) || (photoAnalyses.length > 0 && Boolean(styleRequest)))
    && !["requesting", "recording", "parsing"].includes(recorder.status);

  return (
    <div>
      <div className="fitting-room-heading">
        <h1>Virtual Fitting Room</h1>
        <p>Find something you love. See how it fits your style.</p>
      </div>

      <ExploreStyle onBrowseCategory={(category) => { setSearchQuery(category); setSearchOpen(true); }} />

      <section className="look-builder-entry" aria-labelledby="look-builder-entry-title">
        <h2 id="look-builder-entry-title" className="h4">Find your style with LookBuilder</h2>
        <p>Prefer pictures to words? Compare five pairs of outfits and choose the looks you love.</p>
        {visualPreferences && <><p role="status">Your selections: {visualPreferences.map((choice) => choice.label).join(", ")}. These will guide your generated looks.</p>
          <button type="button" className="btn-fitted btn-dark" disabled={!canGenerateLooks || lookStatus === "loading"} onClick={handleGenerateLooks}>{lookStatus === "loading" ? "Generating…" : "Generate looks from my choices"}</button>
          {!auth.isSignedIn && <p>Sign in below to generate looks from your choices.</p>}
          <p><a href="#generated-looks">View generated looks and status ↓</a></p>
        </>}
        <button type="button" className="btn-fitted btn-outline" onClick={() => setQuizOpen(true)}>{visualPreferences ? "Retake LookBuilder quiz" : "Open LookBuilder"}</button>
        {quizOpen && <LookBuilderQuiz onClose={() => setQuizOpen(false)} onComplete={(choices) => { setVisualPreferences(choices); setQuizOpen(false); }} />}
      </section>

      <section className="voice-style-card" aria-labelledby="voice-style-heading">
        <span className="voice-style-eyebrow">Your personal style brief</span>
        <h2 id="voice-style-heading" className="h4">Tell us your style</h2>
        <p>Record what you are looking for, then review your request before generating looks.</p>
        <p className="voice-style-example">“A casual summer outfit under $150, with linen pants and no wool.”</p>
        {auth.isSignedIn ? (
          <StyleRequestRecorder recorder={recorder} idToken={auth.idToken} onParsed={setStyleRequest} />
        ) : (
          <>
            <p>Sign in with Google to record your style request.</p>
            <GoogleSignInButton auth={auth} />
          </>
        )}
      </section>

      {/* The Stage: full width, at the top -- the uploaded photo and the
          real Virtual Try-On result both display here (TryOnPanel.jsx),
          on a backdrop whose color is a swatch picker away. */}
      <div
        ref={tryOnRef}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes("application/x-fitted-product")) {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }
        }}
        onDrop={handleClothingDrop}
      >
      <TryOnPanel
        photo={photo}
        status={tryOnStatus}
        result={tryOnResult}
        product={selectedProduct}
        imaginedAngles={imaginedAngles}
        activeView={activeStageView}
        onViewChange={handleStageViewChange}
        uploadControl={<PhotoUploader photo={photo} onPhotoSelected={onPhotoSelected} />}
      />
      </div>

      <div className="fitting-room-below-stage">
        <button type="button" className="btn-fitted btn-outline" onClick={() => { setSearchQuery(""); setSearchOpen(true); }}>Add more styles</button>
        {searchOpen && <StyleSearchModal initialQuery={searchQuery} onClose={() => setSearchOpen(false)} onSelectProduct={handleSelectProduct}
          selectedProductId={selectedProduct?.id} favoriteIds={favoriteIds} onToggleFavorite={onToggleFavorite} />}
        <SelectedProduct
          product={selectedProduct}
          hasPhoto={Boolean(photo)}
          isSignedIn={auth.isSignedIn}
          onTryOn={handleTryOn}
        />
      </div>

      <div className="fitting-room-shop">
        <CategoryFilter categories={CATEGORIES} activeCategory={activeCategory} onChange={setActiveCategory} />

        <ProductGrid
          products={filteredProducts}
          selectedProductId={selectedProduct?.id ?? null}
          favoriteIds={favoriteIds}
          onSelectProduct={handleSelectProduct}
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
            <p><a href="#voice-style-heading">Record or review your voice style request above</a>, then generate your looks here.</p>

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
                Complete the LookBuilder quiz, or import a photo from <NavLink to="/photos">Google Photos</NavLink> and record a style request. Wait for any recording to finish before generating.
              </p>
            )}
          </div>

          <div id="generated-looks" className="ai-recommendations-results">
            <LookResultsPanel status={lookStatus} result={lookResult} error={lookError} onSaveLook={handleSaveLook} />
          </div>
        </div>
      </section>
    </div>
  );
}
