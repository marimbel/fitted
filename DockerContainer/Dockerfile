# =============================================================================
# Fitted — production Docker image
#
# Two-stage build:
#   1. "build"  — a temporary Node.js container that installs dependencies
#                 and runs the Vite production build (npm run build),
#                 producing static files in /app/dist.
#   2. final    — a lightweight Apache (httpd) image that serves those
#                 static files. This is the image that actually ships;
#                 the Node.js stage is discarded afterward, so the final
#                 image contains no Node.js, no node_modules, and no
#                 source code — just HTML/CSS/JS.
#
# Because every page in this project (Home, About, Contact, App, Login)
# is a plain static file after the build, and the React "App" SPA uses
# a hash-based router (HashRouter, e.g. app.html#/shop), a stock Apache
# config with no special rewrite rules is enough to serve the whole site.
# =============================================================================

# ---- Stage 1: build the static site ----------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy only the manifest files first so Docker can cache the
# `npm install` layer whenever the source code changes but the
# dependencies don't.
COPY package.json package-lock.json* ./
RUN npm install

# Now copy the rest of the project and build it.
COPY . .
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
