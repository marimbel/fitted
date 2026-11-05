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
 * Each product's `image` path points at a local SVG placeholder under
 * /images/products/ so nothing here depends on an external URL that
 * could break.
 */
export const CATEGORIES = ["All", "Tops", "Outerwear", "Dresses", "Bottoms"];

export const PRODUCTS = [
  {
    id: "p01",
    name: "Essential Cotton Tee",
    category: "Tops",
    price: 38,
    image: "/images/products/product-01.svg",
  },
  {
    id: "p02",
    name: "Ribbed Turtleneck",
    category: "Tops",
    price: 58,
    image: "/images/products/product-02.svg",
  },
  {
    id: "p03",
    name: "Wool-Blend Overcoat",
    category: "Outerwear",
    price: 248,
    image: "/images/products/product-03.svg",
  },
  {
    id: "p04",
    name: "Cropped Denim Jacket",
    category: "Outerwear",
    price: 132,
    image: "/images/products/product-04.svg",
  },
  {
    id: "p05",
    name: "Silk Slip Dress",
    category: "Dresses",
    price: 168,
    image: "/images/products/product-05.svg",
  },
  {
    id: "p06",
    name: "Tailored Midi Dress",
    category: "Dresses",
    price: 142,
    image: "/images/products/product-06.svg",
  },
  {
    id: "p07",
    name: "Straight-Leg Trousers",
    category: "Bottoms",
    price: 96,
    image: "/images/products/product-07.svg",
  },
  {
    id: "p08",
    name: "Relaxed Linen Pants",
    category: "Bottoms",
    price: 88,
    image: "/images/products/product-08.svg",
  },
  {
    id: "p09",
    name: "Oversized Button-Down",
    category: "Tops",
    price: 74,
    image: "/images/products/product-09.svg",
  },
  {
    id: "p10",
    name: "Quilted Field Jacket",
    category: "Outerwear",
    price: 188,
    image: "/images/products/product-10.svg",
  },
];
