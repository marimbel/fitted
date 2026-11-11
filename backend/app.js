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
 *   /api/style-search - StyleScout: visual-similarity search against
 *                  the product catalog (Vertex AI embeddings + Gemini
 *                  curation), independent of the /api/looks pipeline
 *
 * TODO (Project 2 core workflow, in build order — see the roadmap):
 *   1. Wire up real Google auth verification (middleware/verifyGoogleToken.js)
 *   2. Wire up the Google Photos Picker service (services/googlePhotosService.js)
 *   3. Wire up Gemini photo + audio analysis (services/geminiService.js)
 *   4. Wire up the ADK agent pipeline (agents/orchestrator.js)
 *   5. Wire up Firestore reads/writes (config/firestore.js)
 */
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import photosRoutes from "./routes/photos.js";
import audioRoutes from "./routes/audio.js";
import looksRoutes from "./routes/looks.js";
import logsRoutes from "./routes/logs.js";
import styleSearchRoutes from "./routes/styleSearch.js";

// ESM doesn't have __dirname built in the way CommonJS does -- this is
// the standard way to reconstruct it, needed below to point express at
// the frontend's build output on disk.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
app.use("/api/logs", logsRoutes);
app.use("/api/style-search", styleSearchRoutes);

// Serve the built frontend (frontend/dist) as static files, AFTER the
// /api routes above so those always win. This only matters for the
// single-container Cloud Run deployment (see the root Dockerfile) --
// in local dev the frontend runs on its own Vite server (port 5173)
// and frontend/dist usually doesn't exist, so express.static here
// simply finds nothing and every request falls through to the 404
// below, same as if this block weren't here at all.
//
// Fitted is a multi-page app (home/about/contact/app/login), not a
// single-page app with client-side routing on the server side, so no
// catch-all "serve index.html for everything" route is needed --
// express.static already serves /about.html, /app.html, etc. by their
// real filenames, and "/" automatically serves index.html.
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

app.listen(PORT, () => {
  console.log(`Fitted backend listening on port ${PORT}`);
});
