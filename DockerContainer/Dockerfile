# =============================================================================
# Fitted — Project 1 static-site Docker image (Apache only)
#
# NOTE: after the Project 2 repo reorganization, the Vite frontend now
# lives in frontend/ (see ../README.md). This image still builds and
# serves ONLY that static frontend with Apache — it has nothing to do
# with the Project 2 Express/Firestore/Gemini backend, which is its own
# separate deployment (see the root Dockerfile + DockerContainer's
# sibling notes in README.md for the Cloud Run deployment used there).
#
# Two-stage build:
#   1. "build"  — a temporary Node.js container that installs frontend
#                 dependencies and runs the Vite production build
#                 (npm run build), producing static files in
#                 frontend/dist.
#   2. final    — a lightweight Apache (httpd) image that serves those
#                 static files. This is the image that actually ships;
#                 the Node.js stage is discarded afterward, so the final
#                 image contains no Node.js, no node_modules, and no
#                 source code — just HTML/CSS/JS.
#
# Build this from the REPO ROOT (not from inside DockerContainer/), e.g.:
#   docker build -t fitted -f DockerContainer/Dockerfile .
# =============================================================================

# ---- Stage 1: build the static site ----------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy only the manifest files first so Docker can cache the
# `npm install` layer whenever the source code changes but the
# dependencies don't.
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# Now copy the rest of the frontend and build it.
COPY frontend/ .
RUN npm run build

# ---- Stage 2: serve the build output with Apache ----------------------------
FROM httpd:2.4-alpine

# Apache's default document root.
COPY --from=build /app/dist/ /usr/local/apache2/htdocs/

# httpd's default config already listens on port 80 and serves
# index.html for directory requests, which is exactly what this static
# multi-page site needs.
EXPOSE 80

CMD ["httpd-foreground"]
