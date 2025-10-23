# LeaseCheck Backend Service

This service exposes the Colorado Lease Check APIs for billing, lease ingestion, automated compliance heuristics, and
Qdrant-backed retrieval chat. It is designed to run on the Hostinger VPS alongside the marketing site.

## Endpoints

- `POST /api/leases` – Upload a lease document (PDF or text) with optional `tenantName` and `propertyAddress` fields.
- `GET /api/leases` – List stored leases and their computed compliance metadata.
- `GET /api/leases/:id/report` – Retrieve the detailed compliance report for a specific lease.
- `DELETE /api/leases/:id` – Remove a lease, associated chunks, and any stored file payloads.
- `POST /api/chat` – Perform RAG-style retrieval over a stored lease to answer a user question.
- `POST /api/billing/session` – Create a Stripe Checkout session for the configured subscription price.
- `GET /healthz` – Health probe that ensures the Qdrant collection exists.

## Environment

Create a `.env` file in the service root or pass one via the Hostinger installer with the following keys:

```
PORT=8080
HOST=0.0.0.0
STORAGE_ROOT=/var/lib/leasecheck/storage
DATABASE_PATH=/var/lib/leasecheck/data/leases.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
BILLING_SUCCESS_URL=https://leasecheck.cloud/success
BILLING_CANCEL_URL=https://leasecheck.cloud/cancel
ALLOWED_ORIGINS=https://leasecheck.cloud,https://leasecheck.app
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
QDRANT_COLLECTION=leasecheck_chunks
QDRANT_VECTOR_DIM=384
MAX_UPLOAD_SIZE=52428800
```

The backend stores uploaded leases on disk and writes metadata into a local SQLite database. Qdrant is used to persist
text chunks for retrieval. The embedding function is deterministic and does not depend on external AI services so the
system can run offline.

## Development

```bash
npm install
npm run dev
```

The dev command uses `nodemon` to reload automatically.
