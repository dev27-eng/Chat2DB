#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Usage: hostinger-backend-setup.sh [--env <file>] [--skip-install]

Bootstraps the LeaseCheck backend service on Hostinger. Installs dependencies, copies environment variables,
 and manages the PM2 process used to run the API server.

Environment variables:
  BACKEND_PROCESS_NAME  Optional PM2 process name (default: leasecheck-backend)
USAGE
}

ENV_FILE=""
SKIP_INSTALL=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --skip-install)
      SKIP_INSTALL=true
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
BACKEND_DIR="$REPO_ROOT/services/leasecheck-backend"

if [[ ! -d "$BACKEND_DIR" ]]; then
  echo "LeaseCheck backend directory not found at $BACKEND_DIR" >&2
  exit 2
fi

if [[ "$SKIP_INSTALL" != true ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm is required but not installed. Install Node.js 18+ before running this script." >&2
    exit 3
  fi

  pushd "$BACKEND_DIR" >/dev/null
  npm install --omit=dev
  popd >/dev/null
fi

if [[ -n "$ENV_FILE" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Provided env file '$ENV_FILE' does not exist." >&2
    exit 4
  fi
  cp "$ENV_FILE" "$BACKEND_DIR/.env"
  chmod 600 "$BACKEND_DIR/.env"
fi

if command -v pm2 >/dev/null 2>&1; then
  PROCESS_NAME=${BACKEND_PROCESS_NAME:-leasecheck-backend}
  pushd "$BACKEND_DIR" >/dev/null
  pm2 delete "$PROCESS_NAME" >/dev/null 2>&1 || true
  pm2 start npm --name "$PROCESS_NAME" -- start
  pm2 save >/dev/null || true
  popd >/dev/null
  echo "PM2 process '$PROCESS_NAME' is running for the LeaseCheck backend."
else
  cat <<NOTICE
PM2 is not installed. To run the backend manually execute:
  cd "$BACKEND_DIR" && npm start
For persistent hosting consider installing PM2: npm install -g pm2
NOTICE
fi
