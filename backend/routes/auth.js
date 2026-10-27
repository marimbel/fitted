/**
 * routes/auth.js
 *
 * Thin route — the real work happens in middleware/verifyGoogleToken.js.
 * This endpoint just lets the frontend confirm a token is still valid
 * (e.g. on app load) without hitting a protected resource.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";

const router = Router();

router.get("/me", verifyGoogleToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
