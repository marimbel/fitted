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
 *
 * Each product's `image` URL (same ones src/data/products.js uses) is
 * also what agents/styleScout.js embeds for visual-similarity search
 * -- see services/embeddingsService.js.
 */
export const PRODUCTS = [
  { id: "p01", name: "Essential Cotton Tee", category: "Tops", price: 38, image: "https://images.unsplash.com/photo-1722310752951-4d459d28c678?auto=format&fit=crop&w=700&q=85" },
  { id: "p02", name: "Ribbed Turtleneck", category: "Tops", price: 58, image: "https://www.grip-inter.com/img/goods/3/048-12013-012-3.jpg" },
  { id: "p03", name: "Wool-Blend Overcoat", category: "Outerwear", price: 248, image: "https://item.elandrs.com/r/image/item/2023-11-16/4e792e30-e19c-43e3-9de4-c129ffe7747c.jpg?w=700" },
  { id: "p04", name: "Cropped Denim Jacket", category: "Outerwear", price: 132, image: "https://www.thevintagetwin.com/cdn/shop/products/43364_batch27_24846.jpg?v=1678824188" },
  { id: "p05", name: "Silk Slip Dress", category: "Dresses", price: 168, image: "https://lesobjetssublimes.com/cdn/shop/files/23-SLIP-IV.jpg?v=1703749081" },
  { id: "p06", name: "Tailored Midi Dress", category: "Dresses", price: 142, image: "https://cdn.dsmcdn.com/ty1636/prod/PLM/20250212/2018925/2020919/2030889/91be46aa-aa93-4038-bc05-4974f47b3971/0_org_zoom.jpg" },
  { id: "p07", name: "Straight-Leg Trousers", category: "Bottoms", price: 96, image: "https://ds8b7s9pxr3f1.cloudfront.net/img/p/5/1/0/16147015-21769641-thickbox.jpg" },
  { id: "p08", name: "Relaxed Linen Pants", category: "Bottoms", price: 88, image: "https://parijanclothing.com/cdn/shop/files/1B92686A-800A-42CC-85AD-1CAA50791E28.jpg?v=1771618234" },
  { id: "p09", name: "Oversized Button-Down", category: "Tops", price: 74, image: "https://evankinori.com/cdn/shop/files/AW23-LINESHEET-071.jpg?v=1697594153&width=700" },
  { id: "p10", name: "Quilted Field Jacket", category: "Outerwear", price: 188, image: "https://media-assets.grailed.com/prd/listing/25585343/d917abfdb9d34524a546b660c4877e92" },
];

export function findProduct(id) {
  return PRODUCTS.find((product) => product.id === id) || null;
}
