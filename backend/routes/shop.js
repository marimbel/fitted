/**
 * routes/shop.js
 *
 * GET /api/shop/products
 *   Returns Fitted's standalone Shop page catalog, sourced live from
 *   Shopify's Mock Shop (see services/mockShopService.js) -- a real
 *   external commerce API, not data stored in this repo. Public, same
 *   as browsing the Shop page itself (no sign-in required).
 */
import { Router } from "express";
import { fetchMockShopProducts } from "../services/mockShopService.js";

const router = Router();

router.get("/products", async (req, res) => {
  try {
    const products = await fetchMockShopProducts();
    res.json({ products });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
