# Hostinger Deployment Guide for Colorado Lease Check

This guide explains how to install the Colorado Lease Check experience on a Hostinger VPS and expose it at **leasecheck.cloud.nexgenagency.us**. The setup serves the marketing experience that explains onboarding, Stripe billing, lease ingestion, compliance analysis, reporting, and conversational reviews backed by Chat2DB + Qdrant. It also covers the supporting services required to store leases, analyse them, and answer follow-up questions.

## 1. Architecture overview

| Component | Purpose | Notes |
| --- | --- | --- |
| `chat2db-client` (this repo) | Static web client built with Umi + Ant Design. | Built by `script/hostinger-setup.sh`; served via `pm2` + `npx serve` or your preferred web server. |
| `services/leasecheck-backend` | Node.js API that handles Stripe billing, lease uploads, compliance heuristics, and Qdrant-powered chat. | Started by `script/hostinger-backend-setup.sh`; stores binaries on disk + metadata in SQLite. |
| Chat2DB server (`chat2db-server`) *(optional)* | Original Chat2DB automation suite if you want deeper SQL tooling or to integrate with existing workflows. | Requires Java 17 + database; can run alongside the new backend if needed. |
| Qdrant | Vector database that holds embeddings for every uploaded lease used for Retrieval Augmented Generation (RAG). | Hosted Qdrant Cloud or self-managed Docker container. |
| Object storage (S3/MinIO) *(optional)* | Persist original leases externally if you do not want to rely on the VPS filesystem. | Configure buckets with encryption at rest. |
| Stripe | Handles payments, subscriptions, and tenant pass-through billing. | Create Products/Prices and restrict keys to the deployment environment. |

All leases, embeddings, and generated reports are anchored inside Chat2DB, which orchestrates the Qdrant lease knowledge base for conversational follow-up.

## 2. Prerequisites on the Hostinger VPS

1. **Operating system**: Ubuntu 22.04 LTS (Hostinger default).
2. **Packages** (install via Hostinger terminal):
   ```bash
   sudo apt-get update
   sudo apt-get install -y git build-essential curl
   ```
3. **Node.js 18+** (used by both the front-end build and the backend API). Either:
   - `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`, or
   - install with `nvm` if you prefer per-user management.
4. **PM2** (optional but recommended for uptime):
   ```bash
   sudo npm install -g pm2
   ```
5. **Docker + Docker Compose plugin** (optional) if you want the installer to launch Qdrant for you:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker "$USER"
   ```
   Log out/in after enabling the Docker group.
6. **Stripe API keys** (publishable + secret) and webhook signing secret for production.
7. **Optional extras**:
   - Java 17 + Maven if you plan to co-host the original Chat2DB Spring Boot server.
   - External object storage (S3/MinIO) if you prefer not to store leases on the VPS filesystem.
   - Managed Qdrant cluster if you do not want to run the bundled Docker container.

## 3. DNS and TLS checklist

1. In the Hostinger panel, create an A record for `leasecheck.cloud.nexgenagency.us` that points to the VPS IP.
2. Once the app is reachable, issue certificates with **Let’s Encrypt** or Hostinger’s built-in SSL manager (proxy traffic to the Node/PM2 port).

## 4. Quick installer package

Clone the repository on the Hostinger VPS (or download the plain-text patch) and execute the installer from `deployment/leasecheck-cloud`.
The script bootstraps the repo inside `INSTALL_DIR`, runs the front-end build, and prepares the backend/PM2 processes.

> Need the Colorado Lease Check files outside of this repo? Run `./script/apply-leasecheck-patch.sh` (or fetch it via the raw GitHub
> URL). It downloads the plain-text patch, validates the checksum, and applies it to the target clone so you can transfer the
> workspace into another environment before running the installer.

If you still want a distributable tarball, generate it locally with `./script/build-hostinger-package.sh /tmp/leasecheck-cloud-package.tar.gz`
and upload it manually—the archive is intentionally excluded from version control so pull requests remain text-only.

## 5. Clone the repository on the VPS

```bash
cd ~
git clone https://github.com/dev27-eng/Chat2DB.git leasecheck-cloud
cd leasecheck-cloud
```

> Replace the URL with your fork so you can adjust configuration independently of upstream.

## 6. Build & serve the front-end

The repository includes a helper script tailored for Hostinger.

```bash
cd ~/leasecheck-cloud
chmod +x script/hostinger-setup.sh
APP_VERSION=1.0.0 APP_PORT=4173 PUBLIC_PATH=/ SITE_NAME=leasecheck-cloud \
  ./script/hostinger-setup.sh
```

What the script does:

1. Installs npm dependencies for `chat2db-client` (unless `--skip-deps`).
2. Builds a production bundle with `npm run build:web:prod`.
3. If PM2 is available, (re)starts `npx serve -s dist -l $APP_PORT` under the configured `SITE_NAME`.
4. Leaves the static assets at `chat2db-client/dist` for integration with Nginx/Hostinger file manager if you prefer.

### Serving through Nginx (recommended)

1. Create `/etc/nginx/sites-available/leasecheck-cloud.conf`:
   ```nginx
   server {
       listen 80;
       server_name leasecheck.cloud.nexgenagency.us;

       location / {
           proxy_pass http://127.0.0.1:4173;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```
2. Enable and reload:
   ```bash
   sudo ln -s /etc/nginx/sites-available/leasecheck-cloud.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```
3. After HTTP is up, secure with Let’s Encrypt (`sudo certbot --nginx -d leasecheck.cloud.nexgenagency.us`).

## 7. Provision the LeaseCheck backend API

The installer automatically creates `services/leasecheck-backend/.env` using the values from `leasecheck.env` and restarts the PM2 process `leasecheck-backend`. To configure or troubleshoot manually:

1. Copy the env template and edit it with your production secrets:
   ```bash
   cd ~/leasecheck-cloud/services/leasecheck-backend
   cp .env.hostinger .env
   nano .env
   ```
2. Start (or restart) the backend:
   ```bash
   cd ~/leasecheck-cloud
   BACKEND_PROCESS_NAME=leasecheck-backend \
     ./script/hostinger-backend-setup.sh --env services/leasecheck-backend/.env
   ```
3. Confirm it is healthy:
   ```bash
   curl http://127.0.0.1:8080/healthz
   ```
   A JSON payload with `{ "status": "ok" }` indicates the API can reach Qdrant and is ready to accept uploads.

Key endpoints now available:

- `POST /api/billing/session` – creates Stripe Checkout sessions using `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID`.
- `POST /api/leases` – accepts PDF/text uploads, performs heuristic compliance analysis, stores the file on disk, and indexes text in Qdrant.
- `POST /api/chat` – returns retrieved snippets and an answer synthesised from the top clauses.

Tune the heuristics with environment variables such as `FAIRNESS_BASELINE` (minimum tenant-fairness score) and `MAX_UPLOAD_SIZE` (bytes).

### Stripe webhooks

Stripe Checkout sessions redirect automatically, but you still need to register a webhook (Dashboard → Developers → Webhooks). Point it at `https://leasecheck.cloud/api/webhooks/stripe` if you extend the backend with webhook handling, or run the `stripe listen` CLI and forward events to the VPS while developing.

### Optional: Run the legacy Chat2DB server

If you want advanced SQL automation from upstream Chat2DB, you can still deploy the Java service alongside the new backend:

```bash
cd ~/leasecheck-cloud/chat2db-server
./mvnw clean package -DskipTests
java -jar chat2db-server-start/target/chat2db-server-start-*.jar \
  --server.port=8088 \
  --chat2db.storage.type=minio \
  --chat2db.minio.endpoint=https://your-minio-endpoint \
  --chat2db.minio.access-key=... \
  --chat2db.minio.secret-key=... \
  --chat2db.qdrant.url=$QDRANT_URL \
  --chat2db.qdrant.api-key=$QDRANT_API_KEY
```

### Qdrant hosting options

- **Installer-managed Docker**: with `MANAGE_QDRANT_DOCKER=true` the Hostinger package executes `docker compose up -d qdrant` using the bundled `docker-compose.yml`.
- **Managed service**: supply `QDRANT_URL` and `QDRANT_API_KEY` that point at Qdrant Cloud or a different cluster and set `MANAGE_QDRANT_DOCKER=false`.
- **Manual Docker run**: if you prefer, launch Qdrant yourself:
  ```bash
  docker run -d --name qdrant \
    -p 6333:6333 \
    -v $HOME/qdrant_storage:/qdrant/storage:z \
    qdrant/qdrant
  ```

## 8. Connecting the UI to the APIs

1. Update the Umi proxy/API configuration (`chat2db-client/.umirc.ts`) so the `/api` prefix targets the backend service (e.g., `https://leasecheck.cloud/api`).
2. Re-run `./script/hostinger-setup.sh --skip-deps` to rebuild with the updated configuration.
3. Verify that uploads appear in `services/leasecheck-backend/data/leases.db`, the `storage/leases` directory contains binaries, and new chunks are visible in Qdrant via the `/healthz` or `/api/chat` endpoints.

## 9. Operational checklist

- **Backups**: schedule database dumps, object storage lifecycle policies, and Qdrant snapshot exports.
- **Monitoring**: enable PM2 logs, Nginx access logs, and integrate with Hostinger alerts or an external provider (Grafana/Prometheus).
- **Security**: rotate API keys, enforce HTTPS, and restrict SSH to key-based auth.
- **Stripe**: configure webhook endpoints and test tenant pass-through charges before launch.
- **Disaster recovery drills**: test restoring Chat2DB data and Qdrant collections in a staging environment.

## 10. Troubleshooting tips

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `npm run build:web:prod` fails with memory errors | VPS has low RAM | Add swap (`sudo fallocate -l 2G /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`). |
| `npx serve` exits immediately | PM2 not installed or script invoked without PM2 | Install PM2 or run the `npx serve` command manually and keep the shell alive. |
| UI cannot chat with leases | Backend cannot reach Qdrant or embeddings not configured | Verify `QDRANT_URL`, `QDRANT_API_KEY`, and check that `/healthz` returns status ok. |
| Stripe payment links missing | Environment variables for Stripe keys not set | Populate `STRIPE_SECRET_KEY` and `STRIPE_PRICE_ID` in `leasecheck.env` before installing. |

## 11. Next steps

- Brand the page content by updating `/chat2db-client/src/pages/colorado-lease-check`.
- Integrate single sign-on (SAML/SCIM) if targeting enterprise property managers.
- Build automation around lease ingestion (SFTP polling, email forwarding) using Chat2DB workflows.

With the above setup the Hostinger VPS becomes the central hub for storing leases in the LeaseCheck backend, analysing compliance, generating reports, and powering conversational Q&A for Colorado Lease Check.
