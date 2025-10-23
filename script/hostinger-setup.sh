#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: hostinger-setup.sh [--skip-build] [--skip-deps]

Prepares the Colorado Lease Check front-end for deployment on Hostinger and optionally restarts a PM2 site process.

Environment variables:
  APP_VERSION     Version string exposed to the UI (default: 1.0.0)
  APP_PORT        Local port for the static site (default: 4173)
  PUBLIC_PATH     Public path prefix when serving assets (default: /)
  SITE_NAME       PM2 process name if pm2 is installed (default: colorado-lease-check)
USAGE
}

SKIP_BUILD=false
SKIP_DEPS=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$REPO_ROOT/chat2db-client"

if [[ ! -d "$CLIENT_DIR" ]]; then
  echo "Unable to find chat2db-client directory relative to script." >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required but was not detected. Install Node.js 18+ before running this script." >&2
  exit 2
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required but was not detected. Install Node.js 18+ (which ships with npm)." >&2
  exit 2
fi

APP_VERSION=${APP_VERSION:-1.0.0}
APP_PORT=${APP_PORT:-4173}
PUBLIC_PATH=${PUBLIC_PATH:-/}
SITE_NAME=${SITE_NAME:-colorado-lease-check}

pushd "$CLIENT_DIR" >/dev/null

if [[ "$SKIP_DEPS" != true ]]; then
  echo "Installing npm dependencies (this may take a moment)..."
  npm install --legacy-peer-deps
fi

if [[ "$SKIP_BUILD" != true ]]; then
  echo "Building production assets..."
  npm_config_app_version="$APP_VERSION" \
  npm_config_app_port="$APP_PORT" \
  npm_config_public_path="$PUBLIC_PATH" \
    npm run build:web:prod
fi

popd >/dev/null

if command -v pm2 >/dev/null 2>&1; then
  echo "Configuring PM2 to serve the static build on port $APP_PORT..."
  pm2 delete "$SITE_NAME" >/dev/null 2>&1 || true
  pm2 start npx --name "$SITE_NAME" -- serve -s "$CLIENT_DIR/dist" -l "$APP_PORT"
  pm2 save >/dev/null || true
  echo "PM2 process '$SITE_NAME' is running. Use 'pm2 logs $SITE_NAME' to inspect logs."
else
  cat <<NOTICE
PM2 is not installed. To serve the static files manually run:
  cd "$CLIENT_DIR" && npx serve -s dist -l $APP_PORT
For persistent hosting consider installing PM2: npm install -g pm2
NOTICE
fi

echo "Static assets ready at $CLIENT_DIR/dist"
