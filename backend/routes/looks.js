/**
 * routes/looks.js
 *
 * POST /api/looks/generate
 *   Body: { photoAnalyses, styleRequest } — runs the full agent
 *   pipeline (agents/orchestrator.js) and returns the generated
 *   looks plus the critique trace (how many loop iterations, what
 *   LookCritic flagged each round).
 *
 * GET    /api/looks/saved      -> read users/{uid}/savedLooks
 * POST   /api/looks/saved      -> save one look (My Looks, persisted)
 * DELETE /api/looks/saved/:id  -> remove a saved look
 */
import { Router } from "express";
import { verifyGoogleToken } from "../middleware/verifyGoogleToken.js";
import { runOrchestrator } from "../agents/orchestrator.js";
import { db } from "../config/firestore.js";
import { normalizeVisualPreferences } from "../services/visualPreferences.js";

const router = Router();

router.post("/generate", verifyGoogleToken, async (req, res) => {
  try {
    const { photoAnalyses = [], styleRequest = null } = req.body;
    let visualPreferences;
    try { visualPreferences = normalizeVisualPreferences(req.body.visualPreferences); }
    catch (err) { return res.status(400).json({ error: err.message }); }
    if (!Array.isArray(photoAnalyses) || (!visualPreferences.length && (!photoAnalyses.length || !styleRequest))) {
      return res.status(400).json({ error: "Complete the visual quiz, or provide photoAnalyses and a styleRequest" });
    }

    const result = await runOrchestrator({ uid: req.user.uid, photoAnalyses, styleRequest, visualPreferences });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get("/saved", verifyGoogleToken, async (req, res) => {
  try {
    const snapshot = await db.collection(`users/${req.user.uid}/savedLooks`).get();
    const looks = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ looks });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post("/saved", verifyGoogleToken, async (req, res) => {
  try {
    const { look } = req.body;
    if (!look) return res.status(400).json({ error: "look is required" });

    const docRef = await db.collection(`users/${req.user.uid}/savedLooks`).add({
      ...look,
      savedAt: new Date().toISOString(),
    });
    res.json({ id: docRef.id });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.delete("/saved/:id", verifyGoogleToken, async (req, res) => {
  try {
    await db.collection(`users/${req.user.uid}/savedLooks`).doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

export default router;
