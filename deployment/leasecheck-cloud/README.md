# Colorado Lease Check Hostinger Package

This directory contains automation that provisions the Colorado Lease Check experience on a Hostinger VPS.

The package provides:

- `install.sh` – a bootstrapper that clones the Chat2DB fork, checks out the specified branch, and runs the production build script.
- `leasecheck.env.example` – environment variables you can copy to `.env` to avoid retyping settings on the server.
- `docker-compose.yml` – optional helper to start Qdrant on the VPS when Docker is available.
- `documentation/hostinger-deployment.md` – the full deployment guide.
- `scripts/hostinger-setup.sh` – the front-end build helper that lives in the repository for convenience.
- `scripts/hostinger-backend-setup.sh` – automation for the LeaseCheck API, Stripe integration, and PM2 process.

## Running directly from the repository

1. SSH into your Hostinger VPS and clone your fork if you have not already:
   ```bash
   git clone https://github.com/dev27-eng/Chat2DB.git
   cd Chat2DB/deployment/leasecheck-cloud
   ```
   Replace the URL if you maintain a different remote.
2. Copy the sample environment file and edit it with your values:
   ```bash
   cp leasecheck.env.example leasecheck.env
   nano leasecheck.env
   ```
3. Launch the installer:
   ```bash
   bash install.sh
   ```

The installer clones (or updates) the Chat2DB repository into the directory defined by `INSTALL_DIR`, installs dependencies, builds the Colorado Lease Check front-end, launches the backend API, and optionally starts Qdrant via Docker before restarting PM2 processes to serve the site.

## Creating a distributable archive (optional)

If you prefer to upload a self-contained package to the VPS, run the bundler locally:

```bash
./script/build-hostinger-package.sh /tmp/leasecheck-cloud-package.tar.gz
```

Transfer the generated archive to your server and extract it before running `install.sh`. The tarball is intentionally excluded from the repository so pull requests only contain text files.

## Customisation tips

- Set `INSTALL_DIR` in `.env` to control where the repository lives on the server.
- Use `GIT_REF` to target a tag or branch (defaults to `work`).
- Toggle `SKIP_BUILD=true` or `SKIP_DEPS=true` when you only need to restart PM2 without rebuilding.
- Provide Stripe keys and price IDs in `.env` so the installer can wire billing end-to-end automatically.
- Enable `MANAGE_QDRANT_DOCKER=true` to have the installer run `docker compose up -d qdrant` and provision vector storage.
- Adjust `FAIRNESS_BASELINE` or `MAX_UPLOAD_SIZE` in `.env` to tune compliance scoring sensitivity and payload limits.

Refer to the deployment guide for full infrastructure requirements, TLS, Stripe configuration, Chat2DB server requirements, and the LeaseCheck backend endpoints.
