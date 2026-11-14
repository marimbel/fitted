import { useState } from "react";
import { PRODUCTS } from "../data/products.js";
import "../styles/explore-style.css";

const aesthetics = [
  ["coastal-minimalism", "Coastal Minimalism", "coastal-minimalism.webp", "Airy linen and relaxed silhouettes"],
  ["minimalist", "Minimalist", "minimalist.jpg", "Simple shapes and understated details"],
  ["quiet-luxury", "Quiet Luxury", "quiet-luxury.jpg", "Refined textures and timeless pieces"],
  ["tailored", "Tailored", "tailored.webp", "Sharp lines and structured layers"],
  ["romantic", "Romantic", "romantic.jpg", "Soft fabrics and expressive details"],
  ["streetwear", "Streetwear", "streetwear.jpg", "Relaxed fits and bold combinations"],
];

export default function ExploreStyle({ onBrowseCategory }) {
  const [mode, setMode] = useState("aesthetics");
  return (
    <section className="explore-style" aria-labelledby="explore-style-title">
      <span className="voice-style-eyebrow">Find your next direction</span>
      <h2 id="explore-style-title">Explore your style</h2>
      <p>What are you looking for? Start with an aesthetic or find a specific piece.</p>
      <div className="explore-style-choices" role="group" aria-label="Browse by">
        <button type="button" className={`btn-fitted ${mode === "aesthetics" ? "btn-dark" : "btn-outline"}`} aria-pressed={mode === "aesthetics"} onClick={() => setMode("aesthetics")}>Aesthetics</button>
        <button type="button" className={`btn-fitted ${mode === "items" ? "btn-dark" : "btn-outline"}`} aria-pressed={mode === "items"} onClick={() => setMode("items")}>Clothing categories</button>
      </div>
      {mode === "aesthetics" ? <>
        <p className="explore-style-hint">Choose a mood to explore its Inspiration collection.</p>
        <div className="explore-style-grid">
          {aesthetics.map(([slug, label, image, description]) => (
            <a className="explore-style-tile" key={slug} href={`/inspiration.html?category=${slug}`}>
              <img src={`/images/inspiration/${image}`} alt="" loading="lazy" />
              <div><h3>{label}</h3><p>{description}</p><span>Explore inspiration →</span></div>
            </a>
          ))}
        </div>
        <a className="explore-style-all" href="/inspiration.html">Browse all Inspiration styles →</a>
      </> : <div className="explore-category-grid">
        {["Tops", "Bottoms", "Outerwear", "Dresses", "Shoes"].map((category) => {
          const count = PRODUCTS.filter((product) => product.category === category).length;
          return <button key={category} type="button" className="explore-category" disabled={!count} onClick={() => onBrowseCategory(category)}>
            <strong>{category}</strong><span>{count ? `${count} items · Browse →` : "Not in the catalog yet"}</span>
          </button>;
        })}
      </div>}
    </section>
  );
}
