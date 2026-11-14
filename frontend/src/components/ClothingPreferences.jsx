const categories = ["Tops", "Bottoms", "Outerwear", "Dresses", "Sweaters", "Shoes", "Boots", "Hats", "Scarves", "Swimwear", "Shorts", "Tank tops", "Shirts", "Jackets"];
const seasonal = {
  spring: ["Jackets", "Shirts", "Dresses", "Shoes"],
  summer: ["Swimwear", "Shorts", "Tank tops", "Shirts", "Shoes"],
  fall: ["Outerwear", "Sweaters", "Bottoms", "Boots", "Scarves"],
  winter: ["Outerwear", "Sweaters", "Boots", "Hats", "Scarves"],
};

export const categoryMatches = (product, category) => {
  if (product.category === category) return true;
  const aliases = { Sweaters: /turtleneck/i, Shirts: /tee|button-down/i, Jackets: /jacket/i };
  return Boolean(aliases[category]?.test(product.name));
};

export default function ClothingPreferences({ value, onChange }) {
  const suggestions = seasonal[value.season] || [];
  return <section className="clothing-preferences" aria-labelledby="clothing-preferences-title">
    <h2 id="clothing-preferences-title" className="h4">Make it yours</h2>
    <p>Optional preferences for your next looks. Leave anything open to explore more.</p>
    <div className="clothing-preference-selects">
      <label>1. Clothing market
        <select className="fitted-input" value={value.market} onChange={(event) => onChange({ ...value, market: event.target.value })}>
          <option value="">No preference</option><option value="men">Men’s</option><option value="women">Women’s</option><option value="unisex">Unisex</option>
        </select>
      </label>
      <label>2. Season
        <select className="fitted-input" value={value.season} onChange={(event) => onChange({ ...value, season: event.target.value })}>
          <option value="">Any season</option>{["spring", "summer", "fall", "winter"].map((season) => <option key={season} value={season}>{season[0].toUpperCase() + season.slice(1)}</option>)}
        </select>
      </label>
    </div>
    <fieldset><legend>3. Categories to focus on</legend>
      {suggestions.length > 0 && <p>Ideas for {value.season}: {suggestions.join(", ")}. All categories remain available.</p>}
      <div className="clothing-category-options">{categories.map((category) => <label key={category}>
        <input type="checkbox" checked={value.categories.includes(category)} onChange={(event) => onChange({ ...value, categories: event.target.checked ? [...value.categories, category] : value.categories.filter((item) => item !== category) })} /> {category}
      </label>)}</div>
    </fieldset>
    <p className="style-request-status">Categories filter the clothing grid. Market and season guide recommendations; the catalog does not provide verified market labels. Shoes, boots, hats, scarves, swimwear, shorts, and tank tops are not stocked yet.</p>
    <button type="button" className="btn-fitted btn-outline btn-sm" onClick={() => onChange({ market: "", season: "", categories: [] })}>Clear preferences</button>
  </section>;
}
