/**
 * routes/looks.js
 *
 * POST /api/looks/generate
 *   Runs the full ADK agent pipeline (agents/stylistPipeline.js) against
 *   the user's latest photoAnalyses + styleRequests, and returns the
 *   generated looks plus the critique trace (how many loop iterations,
 *   what LookCritic flagged each round).
 *
 * GET /api/looks/saved
 *   Reads users/{uid}/savedLooks from Firestore for the My Looks page.
 *
 * POST /api/looks/save
 *   Body: { look } — writes one look into users/{uid}/savedLooks.
 *   This is the Project 2 replacement for Project 1's client-only
 *   FavoritesButton state — same user action, now persisted.
 *
 * TODO: implement all three once agents/stylistPipeline.js and
 * config/firestore.js are wired up.
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";

const router = Router();

router.post("/generate", verifyGoogleToken, async (req, res) => {
  res.status(501).json({ error: "POST /api/looks/generate not implemented yet" });
});

router.get("/saved", verifyGoogleToken, async (req, res) => {
  res.status(501).json({ error: "GET /api/looks/saved not implemented yet" });
});

router.post("/save", verifyGoogleToken, async (req, res) => {
  res.status(501).json({ error: "POST /api/looks/save not implemented yet" });
});

export default router;
