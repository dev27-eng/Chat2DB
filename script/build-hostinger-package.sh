#!/usr/bin/env bash
set -euo pipefail

OUTPUT_PATH=${1:-deployment/leasecheck-cloud/leasecheck-cloud-package.tar.gz}

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_ROOT="$(mktemp -d)"
PACKAGE_NAME="leasecheck-cloud-package"
PACKAGE_DIR="$PACKAGE_ROOT/$PACKAGE_NAME"

cleanup() {
  rm -rf "$PACKAGE_ROOT"
}
trap cleanup EXIT

mkdir -p "$PACKAGE_DIR/scripts" "$PACKAGE_DIR/documentation"

cp "$ROOT_DIR/deployment/leasecheck-cloud/README.md" "$PACKAGE_DIR/README.md"
cp "$ROOT_DIR/deployment/leasecheck-cloud/install.sh" "$PACKAGE_DIR/install.sh"
cp "$ROOT_DIR/deployment/leasecheck-cloud/leasecheck.env.example" "$PACKAGE_DIR/leasecheck.env.example"
cp "$ROOT_DIR/deployment/leasecheck-cloud/docker-compose.yml" "$PACKAGE_DIR/docker-compose.yml"
cp "$ROOT_DIR/script/hostinger-setup.sh" "$PACKAGE_DIR/scripts/hostinger-setup.sh"
cp "$ROOT_DIR/script/hostinger-backend-setup.sh" "$PACKAGE_DIR/scripts/hostinger-backend-setup.sh"
cp "$ROOT_DIR/document/hostinger-deployment.md" "$PACKAGE_DIR/documentation/hostinger-deployment.md"

chmod +x "$PACKAGE_DIR/install.sh" "$PACKAGE_DIR/scripts/hostinger-setup.sh" "$PACKAGE_DIR/scripts/hostinger-backend-setup.sh"

mkdir -p "$(dirname "$OUTPUT_PATH")"

if command -v tar >/dev/null 2>&1; then
  TAR_ARGS=(--sort=name)
  if tar --help 2>&1 | grep -q -- '--mtime'; then
    TAR_ARGS+=(--mtime='@0')
  fi
  if tar --help 2>&1 | grep -q -- '--owner'; then
    TAR_ARGS+=(--owner=0 --group=0 --numeric-owner)
  fi
  tar "${TAR_ARGS[@]}" -czf "$OUTPUT_PATH" -C "$PACKAGE_ROOT" "$PACKAGE_NAME"
else
  echo "tar command not available. Cannot create archive." >&2
  exit 1
fi

echo "Created Hostinger package at $OUTPUT_PATH"
