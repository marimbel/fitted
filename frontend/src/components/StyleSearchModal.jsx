import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ProductGrid from "./ProductGrid.jsx";
import { PRODUCTS } from "../data/products.js";
import { searchCatalog } from "../services/catalogSearch.js";
import "../styles/style-search.css";

export default function StyleSearchModal({ onClose, onSelectProduct, selectedProductId, favoriteIds, onToggleFavorite, initialQuery = "" }) {
  const dialogRef = useRef(null);
  const recognitionRef = useRef(null);
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const results = searchCatalog(PRODUCTS, query);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      const recognition = recognitionRef.current;
      if (recognition) {
        recognition.onresult = recognition.onerror = recognition.onend = null;
        recognition.abort();
      }
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);

  function startVoiceSearch() {
    if (listening) { recognitionRef.current?.stop(); return; }
    setError("");
    const recognition = new Recognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => setQuery(event.results[0][0].transcript);
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error !== "aborted") setError(event.error === "not-allowed"
        ? "Microphone access was denied. Allow it in browser settings or type your search."
        : "Voice search could not hear your request. Try again or type your search.");
    };
    recognition.onend = () => setListening(false);
    try { recognition.start(); setListening(true); }
    catch { setError("Voice search could not start. Please type your search."); }
  }

  return createPortal(
    <dialog ref={dialogRef} className="style-search-modal" aria-labelledby="style-search-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.target === event.currentTarget && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) onClose();
      }}>
      <div className="style-search-heading">
        <h2 id="style-search-title">Add more styles</h2>
        <button type="button" className="btn-fitted btn-outline" onClick={onClose} aria-label="Close style search">×</button>
      </div>
      <label htmlFor="style-search-query">What are you looking for?</label>
      <div className="style-search-controls">
        <input autoFocus id="style-search-query" className="fitted-input" type="search" value={query}
          onChange={(event) => setQuery(event.target.value)} placeholder="Try linen pants, outerwear, or minimalist" />
        <button type="button" className="btn-fitted btn-outline" disabled={!Recognition} onClick={startVoiceSearch}>
          {listening ? "Stop listening" : "Speak your search"}
        </button>
        {query && <button type="button" className="btn-fitted btn-outline" onClick={() => setQuery("")}>Clear</button>}
      </div>
      {!Recognition && <p>Voice search is unavailable in this browser. You can type your search above.</p>}
      {error && <p role="alert">{error}</p>}
      <p role="status">{listening ? "Listening… Describe the clothing or style you want." : `${results.length} items in the fitting room catalog`}</p>
      <ProductGrid products={results} selectedProductId={selectedProductId} favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite} onSelectProduct={(product) => { onClose(); requestAnimationFrame(() => onSelectProduct(product)); }}
        emptyMessageTitle="No matching styles" emptyMessageBody="Try a broader term such as tops, linen, or casual, or clear your search." />
    </dialog>, document.body
  );
}
