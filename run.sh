#!/usr/bin/env bash
# =============================================================================
# run.sh — helper script for the Fitted project (CS651 Project 1)
#
# Wraps the commands this project uses (npm/Vite, Docker, AWS) so each one
# is a single, memorable command. Run it from the project root:
#
#   ./run.sh help
#
# Commands:
#   install       Install npm dependencies (React, React Router, Vite)
#   dev           Start the Vite dev server (http://localhost:5173)
#   build         Production build -> dist/ (all 5 pages)
#   preview       Serve the built dist/ folder locally (http://localhost:4173)
#   docker-build  Build the Apache Docker image from DockerContainer/Dockerfile
#   docker-run    Run the container (default http://localhost:8080)
#   docker-stop   Stop and remove the running container
#   docker        docker-build + docker-run in one step
#   ec2-setup     (Ubuntu EC2 only) install Docker + Git on the instance
#   ec2-deploy    (Ubuntu EC2 only) build + run the container on port 80
#   s3-deploy     Build, then upload dist/ to an S3 bucket (needs AWS CLI)
# =============================================================================

set -e  # stop immediately if any command fails

# Always run from the folder this script lives in (the project root),
# so the commands work no matter where you call the script from.
cd "$(dirname "$0")"

IMAGE_NAME="fitted"        # Docker image tag
CONTAINER_NAME="fitted"    # Docker container name
PORT="${PORT:-8080}"       # host port for docker-run (override: PORT=80 ./run.sh docker-run)

# Use sudo for Docker on Linux (EC2) unless we're already root.
# Docker Desktop on macOS doesn't need sudo.
DOCKER="docker"
if [ "$(uname)" = "Linux" ] && [ "$(id -u)" -ne 0 ]; then
  DOCKER="sudo docker"
fi

# The Vite frontend lives in frontend/ since the Project 2 reorganization
# (see README.md); the Express backend lives in backend/ and is run
# separately (cd backend && npm run dev) — this script only drives the
# frontend static build + Docker steps that were part of Project 1.
install_deps() {
  echo "==> Installing npm dependencies (frontend/)..."
  (cd frontend && npm install)
}

ensure_deps() {
  # Install dependencies only if node_modules is missing.
  [ -d frontend/node_modules ] || install_deps
}

build_site() {
  ensure_deps
  echo "==> Building production site into frontend/dist/ ..."
  (cd frontend && npm run build)
  echo "==> Done. Built files are in frontend/dist/"
}

docker_build() {
  echo "==> Building Docker image '$IMAGE_NAME'..."
  # The build context is the project root (.), and -f points at the
  # Dockerfile inside DockerContainer/ (see DockerContainer/README.md).
  $DOCKER build -t "$IMAGE_NAME" -f DockerContainer/Dockerfile .
}

docker_stop() {
  # Remove an old container with the same name, if one exists.
  if $DOCKER ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "==> Removing existing container '$CONTAINER_NAME'..."
    $DOCKER rm -f "$CONTAINER_NAME" >/dev/null
  fi
}

docker_run() {
  docker_stop
  echo "==> Starting container on port $PORT (Apache listens on 80 inside)..."
  # -d: run in the background
  # -p HOST:CONTAINER: map the host port to Apache's port 80
  # --restart unless-stopped: bring the site back after a reboot
  $DOCKER run -d -p "$PORT:80" --restart unless-stopped --name "$CONTAINER_NAME" "$IMAGE_NAME"
  $DOCKER ps --filter "name=$CONTAINER_NAME"
  echo "==> Site running at http://localhost:$PORT"
}

ec2_setup() {
  echo "==> Installing Docker and Git (Ubuntu)..."
  sudo apt update
  sudo apt install -y docker.io git
  sudo systemctl enable --now docker
  echo "==> Docker installed: $(docker --version)"
}

ec2_deploy() {
  PORT=80
  docker_build
  docker_run
  # Look up this instance's public IP (works on EC2 with IMDSv2).
  TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" \
    -H "X-aws-ec2-metadata-token-ttl-seconds: 60" || true)
  PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" \
    http://169.254.169.254/latest/meta-data/public-ipv4 || true)
  echo "==> Deployed. Visit: http://${PUBLIC_IP:-<your-ec2-public-ip>}/"
}

s3_deploy() {
  BUCKET="$1"
  if [ -z "$BUCKET" ]; then
    echo "Usage: ./run.sh s3-deploy <bucket-name>"
    exit 1
  fi
  build_site
  echo "==> Uploading dist/ to s3://$BUCKET ..."
  # sync uploads the CONTENTS of dist/ to the bucket root and
  # --delete removes files from the bucket that no longer exist locally.
  aws s3 sync frontend/dist/ "s3://$BUCKET" --delete
  echo "==> Uploaded. Open the bucket's Static website hosting endpoint to view it."
}

show_help() {
  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
}

case "${1:-help}" in
  install)      install_deps ;;
  dev)          ensure_deps; (cd frontend && npm run dev) ;;
  build)        build_site ;;
  preview)      build_site; (cd frontend && npm run preview) ;;
  docker-build) docker_build ;;
  docker-run)   docker_run ;;
  docker-stop)  docker_stop; echo "==> Stopped." ;;
  docker)       docker_build; docker_run ;;
  ec2-setup)    ec2_setup ;;
  ec2-deploy)   ec2_deploy ;;
  s3-deploy)    s3_deploy "$2" ;;
  help|-h|--help) show_help ;;
  *) echo "Unknown command: $1"; echo; show_help; exit 1 ;;
esac
