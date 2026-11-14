const categories = ["Tops", "Bottoms", "Outerwear", "Dresses", "Sweaters", "Shoes", "Boots", "Hats", "Scarves", "Swimwear", "Shorts", "Tank tops", "Shirts", "Jackets"];
export function normalizeClothingPreferences(value) {
  if (value == null) return { market: "", season: "", categories: [] };
  if (typeof value !== "object" || !["", "men", "women", "unisex"].includes(value.market)
    || !["", "spring", "summer", "fall", "winter"].includes(value.season)
    || !Array.isArray(value.categories) || value.categories.some((category) => !categories.includes(category))) {
    throw new Error("Invalid clothing preferences");
  }
  return { market: value.market, season: value.season, categories: [...new Set(value.categories)] };
}
export function clothingPreferencePrompt(value) {
  return "\n\nOptional clothing preferences: " + JSON.stringify(value) +
    "\nUse these as requested shopping preferences, not inferred personal identity. " +
    "Season is guidance; explicit weather and avoid constraints take precedence. " +
    "Categories are focus items: still build complete outfits. Never invent catalog items or market labels. " +
    "If a requested category is unavailable, explain the limitation in your existing explanation fields.";
}
