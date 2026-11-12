/**
 * products.js
 *
 * Mock product catalog for the Virtual Fitting Room.
 *
 * Keeping this data in its own file (instead of hardcoding it inside a
 * component) mirrors how a real app would work: today this array is
 * static, but in Project 2 this same shape of data could come from an
 * API call (e.g. a Shopify Storefront query) without changing any of the
 * components that consume it.
 *
 * Each product's `image` is a real photo URL hosted on the retailer's
 * own site/CDN (found via that product's real listing page), not a
 * local placeholder -- so, unlike most of this mock data, these URLs
 * are external and could in principle go stale or change if a retailer
 * reorganizes their site. Swap any `image` value here for a local file
 * under /public/images/products/ if that ever becomes a problem.
 */
// Product catalog used by the shop and fitting room.
export const CATEGORIES = ["All", "Tops", "Outerwear", "Dresses", "Bottoms", "Shoes"];

export const PRODUCTS = [
  {
    id: "p01",
    name: "Essential Cotton Tee",
    category: "Tops",
    price: 38,
    image: "https://images.unsplash.com/photo-1722310752951-4d459d28c678?auto=format&fit=crop&w=700&q=85",
  },
  {
    id: "p02",
    name: "Ribbed Turtleneck",
    category: "Tops",
    price: 58,
    image: "https://www.grip-inter.com/img/goods/3/048-12013-012-3.jpg",
  },
  {
    id: "p03",
    name: "Wool-Blend Overcoat",
    category: "Outerwear",
    price: 248,
    image: "https://item.elandrs.com/r/image/item/2023-11-16/4e792e30-e19c-43e3-9de4-c129ffe7747c.jpg?w=700",
  },
  {
    id: "p04",
    name: "Cropped Denim Jacket",
    category: "Outerwear",
    price: 132,
    image: "https://www.thevintagetwin.com/cdn/shop/products/43364_batch27_24846.jpg?v=1678824188",
  },
  {
    id: "p05",
    name: "Silk Slip Dress",
    category: "Dresses",
    price: 168,
    image: "https://lesobjetssublimes.com/cdn/shop/files/23-SLIP-IV.jpg?v=1703749081",
  },
  {
    id: "p06",
    name: "Tailored Midi Dress",
    category: "Dresses",
    price: 142,
    image: "https://cdn.dsmcdn.com/ty1636/prod/PLM/20250212/2018925/2020919/2030889/91be46aa-aa93-4038-bc05-4974f47b3971/0_org_zoom.jpg",
  },
  {
    id: "p07",
    name: "Straight-Leg Trousers",
    category: "Bottoms",
    price: 96,
    image: "https://ds8b7s9pxr3f1.cloudfront.net/img/p/5/1/0/16147015-21769641-thickbox.jpg",
  },
  {
    id: "p08",
    name: "Relaxed Linen Pants",
    category: "Bottoms",
    price: 88,
    image: "https://parijanclothing.com/cdn/shop/files/1B92686A-800A-42CC-85AD-1CAA50791E28.jpg?v=1771618234",
  },
  {
    id: "p09",
    name: "Oversized Button-Down",
    category: "Tops",
    price: 74,
    image: "https://evankinori.com/cdn/shop/files/AW23-LINESHEET-071.jpg?v=1697594153&width=700",
  },
  {
    id: "p10",
    name: "Quilted Field Jacket",
    category: "Outerwear",
    price: 188,
    image: "https://media-assets.grailed.com/prd/listing/25585343/d917abfdb9d34524a546b660c4877e92",
  },
  {
    id: "p11",
    name: "Camp Collar Linen Shirt",
    category: "Tops",
    price: 69,
    image: "https://image.hm.com/assets/hm/47/e7/47e79233def23d027cb085039e9cffb2256e3ca3.jpg?imwidth=1260",
  },
  {
    id: "p12",
    name: "Shearling-Collar Jacket",
    category: "Outerwear",
    price: 228,
    image: "https://image.hm.com/assets/hm/20/75/2075f052c91cd89ef136e3b82fb96620ee8a7916.jpg?imwidth=1260",
  },
  {
    id: "p13",
    name: "Floral Wrap Dress",
    category: "Dresses",
    price: 118,
    image: "https://image.hm.com/assets/hm/8f/19/8f193d324141a466ddad5f798b582f20bd2aa6a7.jpg",
  },
  {
    id: "p14",
    name: "Pleated Wide-Leg Trousers",
    category: "Bottoms",
    price: 128,
    image: "https://media.stories.com/assets/005/c6/c3/c6c3bf52dee93732b3309c4a850fc4f0d6c9c717_xxl-1.jpg",
  },
  {
    id: "p15",
    name: "Leather Chelsea Boots",
    category: "Shoes",
    price: 158,
    image: "https://media.stories.com/assets/005/e7/cc/e7cc338fa129bc8579d863c9b72e7d54d0f1a505_xxl-1.jpg",
  },
  {
    id: "p16",
    name: "Canvas Low-Top Sneakers",
    category: "Shoes",
    price: 79,
    image: "https://media.cos.com/assets/001/20/82/20820ea2040ba75569b29a1ee946bb7d2f42e7ca_xxl-1.jpg",
  },
];
