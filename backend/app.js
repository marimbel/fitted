/**
 * app.js
 *
 * Entry point for the Fitted backend. This is a single Express app —
 * per the Project 2 proposal review feedback, the ADK agents run
 * in-process here rather than as a separate Cloud Run service.
 *
 * Route responsibilities (see routes/ for each):
 *   /api/auth    - verify Google ID tokens from the frontend
 *   /api/photos  - Google Photos Picker + Gemini photo analysis
 *   /api/audio   - audio upload + Gemini voice-request parsing
 *   /api/looks   - run the agent pipeline, save/read recommended looks
 *
 * TODO (Project 2 core workflow, in build order — see the roadmap):
 *   1. Wire up real Google auth verification (middleware/verifyGoogleToken.js)
 *   2. Wire up the Google Photos Picker service (services/googlePhotosService.js)
 *   3. Wire up Gemini photo + audio analysis (services/geminiService.js)
 *   4. Wire up the ADK agent pipeline (agents/stylistPipeline.js)
 *   5. Wire up Firestore reads/writes (config/firestore.js)
 */
import express from "express";
import cors from "cors";
import "dotenv/config";

import authRoutes from "./routes/auth.js";
import photosRoutes from "./routes/photos.js";
import audioRoutes from "./routes/audio.js";
import looksRoutes from "./routes/looks.js";

const app = express();

// Cloud Run sets PORT for you at deploy time; 8080 is just the local default.
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: "15mb" })); // photos/audio can be sizable as base64

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/looks", looksRoutes);

app.listen(PORT, () => {
  console.log(`Fitted backend listening on port ${PORT}`);
});
