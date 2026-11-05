# =============================================================================
# Fitted — Project 2 Cloud Run image (frontend + backend, one service)
#
# Unlike DockerContainer/Dockerfile (Project 1's Apache-only static
# site), this image runs the real Express backend and has it serve the
# built frontend too, from the same origin -- the simplest way to get
# one live URL for the whole app without a second service or CORS setup
# (see src/services/apiClient.js and backend/app.js's static-serving
# block for the other half of this).
#
# Three stages:
#   1. "frontend-build" -- Node container that builds the Vite frontend
#      (frontend/.env.production supplies the public OAuth client id at
#      build time; see that file's own comments) into frontend/dist.
#   2. "backend-deps"   -- installs ONLY the backend's production
#      dependencies (no devDependencies, no frontend tooling) into a
#      throwaway layer.
#   3. final            -- a lean Node image containing just the
#      backend source, its production node_modules, and the built
#      frontend -- nothing else from the repo.
#
# Build + deploy from the REPO ROOT with Cloud Build, e.g.:
#   gcloud run deploy fitted --source . --region us-central1 \
#     --allow-unauthenticated \
#     --set-env-vars GCP_PROJECT_ID=fitted-project2,GOOGLE_OAUTH_CLIENT_ID=...,GEMINI_API_KEY=...,GEMINI_MODEL=gemini-2.0-flash
# (see README.md's Docker Deployment section for the full command and
# the one-time IAM step Firestore needs).
# =============================================================================

# ---- Stage 1: build the frontend --------------------------------------------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ---- Stage 2: install only the backend's production dependencies -----------
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

# ---- Stage 3: the image that actually ships ---------------------------------
FROM node:20-alpine
WORKDIR /app/backend

COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

# Cloud Run injects PORT itself at runtime (see app.js); 8080 is just
# the documented default/local fallback.
EXPOSE 8080
CMD ["node", "app.js"]
