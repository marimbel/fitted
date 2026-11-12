/**
 * inspiration.js
 * Vanilla-JS click-through routing for the Inspiration (Look Book) page.
 *
 * Each Season card, Runway Edit, and Style tile is a link to
 * "inspiration.html?category=<slug>". Rather than building 15 separate
 * HTML pages for Project 1, a single query param decides which category
 * to show and this script swaps the homepage content (#mainContent) for
 * a shared detail-view template (#detailView), filling in that
 * category's title/description/photo from the categoryData object below.
 *
 * categoryData mirrors what would live in a real categories data file —
 * the same pattern frontend/src/data/products.js uses for the Fitting
 * Room — and the detail grid's repeated tiles are an explicit
 * placeholder (see the note rendered on the page itself), standing in
 * for a real catalog filter that would come later.
 */

const categoryData = {
  spring: {
    kind: "Season",
    title: "Spring",
    meta: "32 looks",
    desc: "Pastels, linen, and the year's first lightness.",
    img: "/images/inspiration/spring.jpg",
    alt: "Denim jacket, white top and jeans, boardwalk summer style",
  },
  summer: {
    kind: "Season",
    title: "Summer",
    meta: "28 looks",
    desc: "Effortless dressing, built for heat and light.",
    img: "/images/inspiration/summer.webp",
    alt: "Yellow linen shirt with denim shorts and loafers, classic-casual menswear",
  },
  fall: {
    kind: "Season",
    title: "Fall",
    meta: "41 looks",
    desc: "Texture, layering, and warmer neutrals.",
    img: "/images/inspiration/fall.jpg",
    alt: "Couple wrapped in blankets with a thermos in an autumn forest",
  },
  winter: {
    kind: "Season",
    title: "Winter",
    meta: "35 looks",
    desc: "Structured outerwear and rich tailoring.",
    img: "/images/inspiration/winter.jpg",
    alt: "Couple in dark tailored coats and snakeskin over-the-knee boots on a city street",
  },
  "quiet-luxury": {
    kind: "Runway Edit",
    title: "Quiet Luxury",
    meta: "Fall / Winter 2026",
    desc: "Minimal silhouettes and expensive-looking basics — nothing here is shouting for attention, and that's the point.",
    img: "/images/inspiration/quiet-luxury.jpg",
    alt: "Tweed blazer, knit tie and tailored trousers, quiet luxury menswear styling",
  },
  "coastal-minimalism": {
    kind: "Runway Edit",
    title: "Coastal Minimalism",
    meta: "Resort",
    desc: "Linen, soft neutrals, and clothing that moves like it's already on vacation.",
    img: "/images/inspiration/coastal-minimalism.webp",
    alt: "White linen set on a beach at the shoreline",
  },
  "modern-tailoring": {
    kind: "Runway Edit",
    title: "Modern Tailoring",
    meta: "Spring 2027 Preview",
    desc: "Sharp shoulders and structured waists, softened with fabrics you wouldn't expect on a blazer.",
    img: "/images/inspiration/modern-tailoring.jpg",
    alt: "Sculptural black tailored blazer and cropped wide-leg trousers, modern editorial styling",
  },
  minimalist: {
    kind: "Style",
    title: "Minimalist",
    meta: "Archetype",
    desc: "Clean lines, quiet colors, nothing extra.",
    img: "/images/inspiration/minimalist.jpg",
    alt: "Cream knit sweater and rust trousers, minimalist styling",
  },
  tailored: {
    kind: "Style",
    title: "Tailored",
    meta: "Archetype",
    desc: "Sharp structure and considered details.",
    img: "/images/inspiration/tailored.webp",
    alt: "Navy double-breasted blazer with tie, pocket square and watch",
  },
  romantic: {
    kind: "Style",
    title: "Romantic",
    meta: "Archetype",
    desc: "Soft fabrics, delicate detail, and a little drama.",
    img: "/images/inspiration/romantic.jpg",
    alt: "Embellished pale lavender tulle gown",
  },
  streetwear: {
    kind: "Style",
    title: "Streetwear",
    meta: "Archetype",
    desc: "Bold proportions, utility, and confidence.",
    img: "/images/inspiration/streetwear.jpg",
    alt: "Denim jacket and cargo pants, bold urban styling",
  },
  bohemian: {
    kind: "Style",
    title: "Bohemian",
    meta: "Archetype",
    desc: "Pattern, movement, and free-spirited layering.",
    img: "/images/inspiration/bohemian.jpg",
    alt: "Purple printed kaftan dress in a Moroccan courtyard",
  },
  "avant-garde": {
    kind: "Style",
    title: "Avant-Garde",
    meta: "Archetype",
    desc: "Sculptural shapes that challenge the everyday silhouette.",
    img: "/images/inspiration/avant-garde.webp",
    alt: "Oversized black tailored blazer, avant-garde runway styling",
  },
  classic: {
    kind: "Style",
    title: "Classic",
    meta: "Archetype",
    desc: "Timeless pieces that don't chase a trend.",
    img: "/images/inspiration/classic.jpg",
    alt: "Vintage-inspired floral blouse, beret and linen skirt, classic styling",
  },
  edgy: {
    kind: "Style",
    title: "Edgy",
    meta: "Archetype",
    desc: "Hardware, leather, and a little attitude.",
    img: "/images/inspiration/edgy.jpg",
    alt: "Leather jacket with a plaid shirt tied at the waist, street style",
  },
};

document.addEventListener("DOMContentLoaded", renderFromUrl);

// Re-run whenever the user navigates with back/forward between
// "?category=..." states, since this is a client-side swap rather
// than a real page load for each category.
window.addEventListener("popstate", renderFromUrl);

/**
 * Reads ?category=<slug> from the URL and shows either the main
 * Inspiration page (#mainContent) or the shared detail template
 * (#detailView), filled in with that category's data.
 */
function renderFromUrl() {
  const params = new URLSearchParams(location.search);
  const slug = params.get("category");
  const mainContent = document.getElementById("mainContent");
  const detailView = document.getElementById("detailView");
  const data = slug && categoryData[slug];

  if (!mainContent || !detailView) return;

  if (!data) {
    mainContent.hidden = false;
    detailView.hidden = true;
    return;
  }

  mainContent.hidden = true;
  detailView.hidden = false;

  document.getElementById("detailKind").textContent = data.kind;
  document.getElementById("detailTitle").textContent = data.title;
  document.getElementById("detailMeta").textContent = data.meta;
  document.getElementById("detailDesc").textContent = data.desc;

  const hero = document.getElementById("detailHero");
  hero.innerHTML =
    '<img src="' + data.img + '" alt="' + data.alt + '" />' +
    '<span class="photo-tile-label">' + data.title + "</span>";

  // The six tiles below reuse the same category photo as a stand-in
  // for a real filtered catalog grid — see the italic note rendered
  // under the grid in inspiration.html for the honest explanation.
  const grid = document.getElementById("detailGrid");
  grid.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const tile = document.createElement("div");
    tile.className = "img-zoom photo-tile detail-tile";
    tile.innerHTML =
      '<img src="' + data.img + '" alt="' + data.title + " look " + i + '" />' +
      '<span class="photo-tile-label">Look 0' + i + "</span>";
    grid.appendChild(tile);
  }

  window.scrollTo(0, 0);
}
