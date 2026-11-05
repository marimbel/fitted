/**
 * data/products.js
 *
 * Server-side copy of the same mock catalog the frontend uses
 * (src/data/products.js). The agent pipeline needs this to validate
 * looks LookBuilder proposes — checking a product id is real and
 * summing real prices for the budget rule — without the backend
 * depending on frontend source files (the two processes are deployed
 * and could be scaled separately).
 *
 * Keep this in sync with src/data/products.js. In a later version this
 * could come from a shared package or a real commerce API (Shopify,
 * etc.) instead of being duplicated.
 */
export const PRODUCTS = [
  { id: "p01", name: "Essential Cotton Tee", category: "Tops", price: 38 },
  { id: "p02", name: "Ribbed Turtleneck", category: "Tops", price: 58 },
  { id: "p03", name: "Wool-Blend Overcoat", category: "Outerwear", price: 248 },
  { id: "p04", name: "Cropped Denim Jacket", category: "Outerwear", price: 132 },
  { id: "p05", name: "Silk Slip Dress", category: "Dresses", price: 168 },
  { id: "p06", name: "Tailored Midi Dress", category: "Dresses", price: 142 },
  { id: "p07", name: "Straight-Leg Trousers", category: "Bottoms", price: 96 },
  { id: "p08", name: "Relaxed Linen Pants", category: "Bottoms", price: 88 },
  { id: "p09", name: "Oversized Button-Down", category: "Tops", price: 74 },
  { id: "p10", name: "Quilted Field Jacket", category: "Outerwear", price: 188 },
];

export function findProduct(id) {
  return PRODUCTS.find((product) => product.id === id) || null;
}
