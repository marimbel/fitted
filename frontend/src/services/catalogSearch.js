// Editorial keywords describe the existing catalog; they add no new inventory.
const keywords = {
  p01: "minimalist casual summer shirt t-shirt basic",
  p02: "minimalist winter sweater knit quiet luxury",
  p03: "winter coat classic quiet luxury formal",
  p04: "casual denim spring jacket",
  p05: "elegant summer evening dress quiet luxury",
  p06: "formal classic dress quiet luxury",
  p07: "formal minimalist trousers pants quiet luxury",
  p08: "coastal minimalist summer linen pants relaxed",
  p09: "coastal casual shirt relaxed summer",
  p10: "casual autumn fall winter jacket outdoors",
};

export function searchCatalog(products, query) {
  const terms = query.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const ignored = new Set(["i", "am", "looking", "for", "a", "an", "the", "some", "show", "me", "please", "want", "style", "styles"]);
  const meaningful = terms.filter((term) => !ignored.has(term));
  return products.filter((product) => {
    const text = `${product.name} ${product.category} ${keywords[product.id] ?? ""}`.toLowerCase();
    return meaningful.every((term) => text.includes(term));
  });
}
