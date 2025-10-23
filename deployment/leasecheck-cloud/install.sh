#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Colorado Lease Check Hostinger installer

Usage: ./install.sh [--env <file>] [--no-env]

Options:
  --env <file>   Load variables from the given file (default: ./leasecheck.env if present)
  --no-env       Skip loading environment variables from a file
  -h, --help     Show this message

Environment variables consumed:
  INSTALL_DIR   Target directory for the Chat2DB repository (default: $HOME/leasecheck-cloud)
  GIT_REPO      Repository URL to clone (default: https://github.com/dev27-eng/Chat2DB.git)
  GIT_REF       Branch, tag, or commit to check out (default: work)
  APP_VERSION   Version string exposed to the UI build (default: 1.0.0)
  APP_PORT      Local port for the static site (default: 4173)
  PUBLIC_PATH   Public path prefix for assets (default: /)
  SITE_NAME     PM2 process name (default: leasecheck-cloud)
  SKIP_DEPS     true to skip npm install
  SKIP_BUILD    true to skip the production build
  EXTRA_ENV_FILE Optional path to a file sourced before building (for Stripe keys, etc.)
USAGE
}

ENV_FILE=""
LOAD_ENV=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env)
      ENV_FILE="$2"
      shift 2
      ;;
    --no-env)
      LOAD_ENV=false
      shift
      ;;
    -h|--help)
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

if [[ "$LOAD_ENV" == true ]]; then
  if [[ -z "$ENV_FILE" && -f "$(pwd)/leasecheck.env" ]]; then
    ENV_FILE="$(pwd)/leasecheck.env"
  fi
  if [[ -n "$ENV_FILE" ]]; then
    if [[ ! -f "$ENV_FILE" ]]; then
      echo "Specified env file '$ENV_FILE' does not exist." >&2
      exit 2
    fi
    echo "Loading environment from $ENV_FILE"
    set -o allexport
    # shellcheck disable=SC1090
    source "$ENV_FILE"
    set +o allexport
  fi
fi

: "${INSTALL_DIR:=$HOME/leasecheck-cloud}"
: "${GIT_REPO:=https://github.com/dev27-eng/Chat2DB.git}"
: "${GIT_REF:=work}"
: "${APP_VERSION:=1.0.0}"
: "${APP_PORT:=4173}"
: "${PUBLIC_PATH:=/}"
: "${SITE_NAME:=leasecheck-cloud}"
: "${SKIP_DEPS:=false}"
: "${SKIP_BUILD:=false}"
: "${EXTRA_ENV_FILE:=}"
: "${BACKEND_PORT:=8080}"
: "${BACKEND_HOST:=0.0.0.0}"
: "${BACKEND_PROCESS_NAME:=leasecheck-backend}"
: "${BACKEND_STORAGE_ROOT:=$HOME/leasecheck-cloud-data/storage}"
: "${BACKEND_DATABASE_PATH:=$HOME/leasecheck-cloud-data/data/leases.db}"
: "${BACKEND_ALLOWED_ORIGINS:=*}"
: "${MAX_UPLOAD_SIZE:=$((50 * 1024 * 1024))}"
: "${STRIPE_SECRET_KEY:=}"
: "${STRIPE_PRICE_ID:=}"
: "${BILLING_SUCCESS_URL:=https://leasecheck.cloud/success}"
: "${BILLING_CANCEL_URL:=https://leasecheck.cloud/cancel}"
: "${QDRANT_URL:=http://localhost:6333}"
: "${QDRANT_API_KEY:=}"
: "${QDRANT_COLLECTION:=leasecheck_chunks}"
: "${QDRANT_VECTOR_DIM:=384}"
: "${FAIRNESS_BASELINE:=0.6}"
: "${MANAGE_QDRANT_DOCKER:=false}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required but not installed. Install git via 'sudo apt-get install -y git'." >&2
  exit 3
fi

if [[ -n "$EXTRA_ENV_FILE" ]]; then
  if [[ ! -f "$EXTRA_ENV_FILE" ]]; then
    echo "EXTRA_ENV_FILE '$EXTRA_ENV_FILE' was not found." >&2
    exit 4
  fi
  echo "Sourcing extra environment from $EXTRA_ENV_FILE"
  set -o allexport
  # shellcheck disable=SC1090
  source "$EXTRA_ENV_FILE"
  set +o allexport
fi

mkdir -p "${INSTALL_DIR%/*}"

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "Updating existing repository at $INSTALL_DIR"
  pushd "$INSTALL_DIR" >/dev/null
  git fetch --tags origin
  git checkout "$GIT_REF"
  git pull --ff-only origin "$GIT_REF" || true
  popd >/dev/null
else
  echo "Cloning $GIT_REPO into $INSTALL_DIR"
  git clone "$GIT_REPO" "$INSTALL_DIR"
fi

pushd "$INSTALL_DIR" >/dev/null

git checkout "$GIT_REF"

if [[ -x script/hostinger-setup.sh ]]; then
  echo "Running hostinger-setup.sh"
else
  echo "Expected script/hostinger-setup.sh to exist. Ensure the repository includes the Colorado Lease Check scripts." >&2
  exit 5
fi

HOSTINGER_ARGS=()
if [[ "$SKIP_DEPS" == true ]]; then
  HOSTINGER_ARGS+=(--skip-deps)
fi
if [[ "$SKIP_BUILD" == true ]]; then
  HOSTINGER_ARGS+=(--skip-build)
fi

export APP_VERSION APP_PORT PUBLIC_PATH SITE_NAME
./script/hostinger-setup.sh "${HOSTINGER_ARGS[@]}"

COMPOSE_CMD=()
if [[ "$MANAGE_QDRANT_DOCKER" == true ]]; then
  if command -v docker >/dev/null 2>&1; then
    if docker compose version >/dev/null 2>&1; then
      COMPOSE_CMD=(docker compose)
    elif command -v docker-compose >/dev/null 2>&1; then
      COMPOSE_CMD=(docker-compose)
    fi
    if [[ ${#COMPOSE_CMD[@]} -gt 0 ]]; then
      COMPOSE_FILE="$INSTALL_DIR/deployment/leasecheck-cloud/docker-compose.yml"
      if [[ -f "$COMPOSE_FILE" ]]; then
        echo "Starting Qdrant via Docker compose..."
        "${COMPOSE_CMD[@]}" -f "$COMPOSE_FILE" up -d qdrant
      else
        echo "Docker compose file not found at $COMPOSE_FILE; skipping Qdrant startup."
      fi
    else
      echo "docker compose is not available. Install Docker Compose to manage Qdrant automatically." >&2
    fi
  else
    echo "Docker was not detected on this host; skipping automated Qdrant start."
  fi
fi

BACKEND_DIR="$INSTALL_DIR/services/leasecheck-backend"
if [[ -d "$BACKEND_DIR" ]]; then
  echo "Configuring LeaseCheck backend service..."
  mkdir -p "$(dirname "$BACKEND_STORAGE_ROOT")"
  mkdir -p "$BACKEND_STORAGE_ROOT" "$(dirname "$BACKEND_DATABASE_PATH")"
  BACKEND_ENV_FILE="$BACKEND_DIR/.env.hostinger"
  cat > "$BACKEND_ENV_FILE" <<EOF
NODE_ENV=production
PORT=$BACKEND_PORT
HOST=$BACKEND_HOST
STORAGE_ROOT=$BACKEND_STORAGE_ROOT
DATABASE_PATH=$BACKEND_DATABASE_PATH
ALLOWED_ORIGINS=$BACKEND_ALLOWED_ORIGINS
MAX_UPLOAD_SIZE=$MAX_UPLOAD_SIZE
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PRICE_ID=$STRIPE_PRICE_ID
BILLING_SUCCESS_URL=$BILLING_SUCCESS_URL
BILLING_CANCEL_URL=$BILLING_CANCEL_URL
QDRANT_URL=$QDRANT_URL
QDRANT_API_KEY=$QDRANT_API_KEY
QDRANT_COLLECTION=$QDRANT_COLLECTION
QDRANT_VECTOR_DIM=$QDRANT_VECTOR_DIM
FAIRNESS_BASELINE=$FAIRNESS_BASELINE
EOF
  chmod 600 "$BACKEND_ENV_FILE"
  export BACKEND_PROCESS_NAME
  if [[ -x ./script/hostinger-backend-setup.sh ]]; then
    ./script/hostinger-backend-setup.sh --env "$BACKEND_ENV_FILE"
  else
    echo "hostinger-backend-setup.sh not found or not executable; skipping backend bootstrap." >&2
  fi
else
  echo "LeaseCheck backend directory not found at $BACKEND_DIR; skipping backend setup."
fi

popd >/dev/null

echo "Colorado Lease Check deployment completed."

