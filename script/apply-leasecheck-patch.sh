#!/usr/bin/env bash
set -euo pipefail

REPO_URL=${LEASECHECK_REPO_URL:-"https://raw.githubusercontent.com/dev27-eng/Chat2DB"}
BRANCH=${LEASECHECK_REPO_BRANCH:-"work"}
PATCH_PATH=${LEASECHECK_PATCH_PATH:-"artifacts/leasecheck-workspace.patch"}
TARGET_DIR=${LEASECHECK_TARGET_DIR:-"."}
EXPECTED_SHA=${LEASECHECK_PATCH_SHA:-"529776606af3a995ceb8543f01aab1aeffef655cc313ac83465c3d69e214ad23"}
PATCH_SOURCE=${LEASECHECK_PATCH_SOURCE:-""}
BASE_COMMIT=${LEASECHECK_BASE_COMMIT:-"698323ae831e7471fab348677c768eece619d064"}

log() {
  printf "[leasecheck] %s\n" "$1"
}

err() {
  printf "[leasecheck] ERROR: %s\n" "$1" >&2
  exit 1
}

require_git_repo() {
  if ! git -C "$1" rev-parse --show-toplevel >/dev/null 2>&1; then
    err "${1} is not a Git repository. Clone Chat2DB and run the script from within that folder or set LEASECHECK_TARGET_DIR."
  fi
}

PATCH_TEMP="$(mktemp)"
trap 'rm -f "$PATCH_TEMP"' EXIT

if [[ -n "$PATCH_SOURCE" ]]; then
  if [[ ! -f "$PATCH_SOURCE" ]]; then
    err "Specified LEASECHECK_PATCH_SOURCE does not exist: $PATCH_SOURCE"
  fi
  log "Using local patch at $PATCH_SOURCE"
  cp "$PATCH_SOURCE" "$PATCH_TEMP"
else
  DOWNLOAD_URL="${REPO_URL}/${BRANCH}/${PATCH_PATH}"
  log "Downloading patch from ${DOWNLOAD_URL}..."
  HTTP_CODE=$(curl -w "%{http_code}" -L "$DOWNLOAD_URL" -o "$PATCH_TEMP")
  if [[ "$HTTP_CODE" != "200" ]]; then
    err "Failed to download patch (HTTP ${HTTP_CODE}). Adjust LEASECHECK_REPO_URL/BRANCH/PATCH_PATH or provide LEASECHECK_PATCH_SOURCE."
  fi
fi

if [[ -n "$EXPECTED_SHA" ]]; then
  ACTUAL_SHA=$(sha256sum "$PATCH_TEMP" | awk '{print $1}')
  if [[ "$ACTUAL_SHA" != "$EXPECTED_SHA" ]]; then
    err "Checksum mismatch! Expected ${EXPECTED_SHA} but got ${ACTUAL_SHA}."
  fi
else
  log "Skipping checksum verification (LEASECHECK_PATCH_SHA not set)."
fi

require_git_repo "$TARGET_DIR"

CURRENT_HEAD=$(git -C "$TARGET_DIR" rev-parse HEAD)
if [[ "$CURRENT_HEAD" != "$BASE_COMMIT" ]]; then
  log "Warning: target repo is at ${CURRENT_HEAD}, expected ${BASE_COMMIT}. The patch may still apply if you already have newer commits."
fi

log "Showing patch statistics..."
git -C "$TARGET_DIR" apply --stat "$PATCH_TEMP"

log "Applying patch to ${TARGET_DIR}..."
git -C "$TARGET_DIR" apply "$PATCH_TEMP"

log "Done. Review the working tree and commit when ready."
