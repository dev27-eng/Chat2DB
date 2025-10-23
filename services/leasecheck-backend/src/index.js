const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const dayjs = require('dayjs');
const { v4: uuidv4 } = require('uuid');
const Stripe = require('stripe');
const Database = require('better-sqlite3');
const pdfParse = require('pdf-parse');
const { QdrantClient } = require('@qdrant/js-client-rest');

require('dotenv').config();

const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(__dirname, '..', 'storage');
const DATABASE_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'leases.db');
const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const QDRANT_API_KEY = process.env.QDRANT_API_KEY || undefined;
const QDRANT_COLLECTION = process.env.QDRANT_COLLECTION || 'leasecheck_chunks';
const QDRANT_VECTOR_DIM = parseInt(process.env.QDRANT_VECTOR_DIM || '384', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*').split(',').map((origin) => origin.trim());
const FAIRNESS_BASELINE = parseFloat(process.env.FAIRNESS_BASELINE || '0.6');
const BILLING_SUCCESS_URL = process.env.BILLING_SUCCESS_URL || 'https://leasecheck.cloud';
const BILLING_CANCEL_URL = process.env.BILLING_CANCEL_URL || 'https://leasecheck.cloud/cancelled';

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

const uploadsDir = path.join(STORAGE_ROOT, 'leases');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const db = new Database(DATABASE_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS leases (
  id TEXT PRIMARY KEY,
  tenant_name TEXT,
  property_address TEXT,
  uploaded_at TEXT,
  original_filename TEXT,
  stored_path TEXT,
  compliance_summary TEXT,
  risk_flags TEXT,
  fairness_rating REAL,
  billing_customer_id TEXT,
  billing_subscription_id TEXT
);

CREATE TABLE IF NOT EXISTS lease_chunks (
  id TEXT PRIMARY KEY,
  lease_id TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  qdrant_point_id TEXT,
  text TEXT,
  FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE CASCADE
);
`);

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || null;
const stripePriceId = process.env.STRIPE_PRICE_ID || null;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const qdrant = new QdrantClient({
  url: QDRANT_URL,
  apiKey: QDRANT_API_KEY,
  timeout: 10_000,
});

async function ensureCollection() {
  try {
    await qdrant.getCollection(QDRANT_COLLECTION);
  } catch (error) {
    if (error?.response?.status === 404 || error?.status === 404) {
      await qdrant.createCollection(QDRANT_COLLECTION, {
        vectors: {
          size: QDRANT_VECTOR_DIM,
          distance: 'Cosine',
        },
      });
    } else {
      console.error('Failed to verify Qdrant collection', error);
      throw error;
    }
  }
}

function chunkText(content, chunkSize = 1200, overlap = 100) {
  const cleaned = content.replace(/\r\n/g, '\n');
  const chunks = [];
  let position = 0;
  while (position < cleaned.length) {
    const end = Math.min(cleaned.length, position + chunkSize);
    const chunk = cleaned.slice(position, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    position += chunkSize - overlap;
  }
  return chunks;
}

function generateEmbedding(text) {
  const hash = crypto.createHash('sha256').update(text).digest();
  const vector = new Array(QDRANT_VECTOR_DIM);
  for (let i = 0; i < QDRANT_VECTOR_DIM; i += 1) {
    const byte = hash[i % hash.length];
    vector[i] = (byte / 255) * 2 - 1;
  }
  return vector;
}

function analyseLeaseText(text) {
  const lower = text.toLowerCase();
  const risks = [];
  if (lower.includes('late fee')) {
    risks.push('Late fee clause detected');
  }
  if (lower.includes('automatic renewal') || lower.includes('auto-renew')) {
    risks.push('Automatic renewal clause detected');
  }
  if (lower.includes('termination') && lower.includes('landlord sole discretion')) {
    risks.push('Termination at landlord sole discretion');
  }
  if (lower.includes('maintenance') && lower.includes('tenant responsible')) {
    risks.push('Tenant responsible for structural maintenance');
  }
  if (lower.includes('arbitration')) {
    risks.push('Binding arbitration clause present');
  }

  const coverageScore = Math.min(1, (text.length / 8000)).toFixed(2);
  const balanceScore = (1 - risks.length * 0.07).toFixed(2);
  const rawFairness = (parseFloat(coverageScore) + parseFloat(balanceScore)) / 2;
  const fairnessRating = Math.max(0, Math.min(1, rawFairness * 0.7 + FAIRNESS_BASELINE * 0.3));

  const summary = `Automated review completed on ${dayjs().format('YYYY-MM-DD')}. Coverage score ${coverageScore}, balance score ${balanceScore}.`;

  return {
    summary,
    risks,
    fairnessRating,
  };
}

async function storeChunks({ leaseId, chunks }) {
  const insert = db.prepare('INSERT INTO lease_chunks (id, lease_id, chunk_index, qdrant_point_id, text) VALUES (?, ?, ?, ?, ?)');
  let index = 0;
  for (const chunk of chunks) {
    const embedding = generateEmbedding(chunk);
    const pointId = uuidv4();
    await qdrant.upsert(QDRANT_COLLECTION, {
      wait: true,
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            lease_id: leaseId,
            chunk_index: index,
            text: chunk,
          },
        },
      ],
    });
    insert.run(uuidv4(), leaseId, index, pointId, chunk);
    index += 1;
  }
}

async function searchLeaseChunks({ leaseId, query, limit = 5 }) {
  const vector = generateEmbedding(query);
  const response = await qdrant.search(QDRANT_COLLECTION, {
    vector,
    limit,
    filter: {
      must: [
        { key: 'lease_id', match: { value: leaseId } },
      ],
    },
  });
  return response?.result || response || [];
}

async function ensureBackendReady() {
  await ensureCollection();
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: (origin, callback) => {
  if (!origin || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Origin not allowed by CORS'));
  }
} }));

const upload = multer({
  dest: path.join(STORAGE_ROOT, 'tmp'),
  limits: { fileSize: parseInt(process.env.MAX_UPLOAD_SIZE || `${25 * 1024 * 1024}`, 10) },
});

app.get('/healthz', async (req, res) => {
  try {
    await ensureCollection();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/api/leases', (req, res) => {
  const rows = db.prepare('SELECT id, tenant_name AS tenantName, property_address AS propertyAddress, uploaded_at AS uploadedAt, compliance_summary AS complianceSummary, risk_flags AS riskFlags, fairness_rating AS fairnessRating FROM leases ORDER BY uploaded_at DESC').all();
  res.json(rows.map((row) => ({
    ...row,
    riskFlags: row.riskFlags ? JSON.parse(row.riskFlags) : [],
  })));
});

app.get('/api/leases/:leaseId/report', (req, res) => {
  const leaseId = req.params.leaseId;
  const lease = db.prepare('SELECT * FROM leases WHERE id = ?').get(leaseId);
  if (!lease) {
    res.status(404).json({ message: 'Lease not found' });
    return;
  }
  res.json({
    id: lease.id,
    tenantName: lease.tenant_name,
    propertyAddress: lease.property_address,
    complianceSummary: lease.compliance_summary,
    riskFlags: lease.risk_flags ? JSON.parse(lease.risk_flags) : [],
    fairnessRating: lease.fairness_rating,
    uploadedAt: lease.uploaded_at,
  });
});

app.post('/api/leases', upload.single('file'), async (req, res) => {
  const { tenantName = 'Unknown tenant', propertyAddress = 'Unknown property' } = req.body;
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'Lease file is required' });
    return;
  }

  try {
    const leaseId = uuidv4();
    const storedFilename = `${leaseId}-${file.originalname}`;
    const targetPath = path.join(uploadsDir, storedFilename);
    fs.renameSync(file.path, targetPath);

    let textContent = '';
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(targetPath);
      const parsed = await pdfParse(dataBuffer);
      textContent = parsed.text;
    } else {
      textContent = fs.readFileSync(targetPath, 'utf-8');
    }

    const analysis = analyseLeaseText(textContent);
    const uploadedAt = dayjs().toISOString();

    db.prepare('INSERT INTO leases (id, tenant_name, property_address, uploaded_at, original_filename, stored_path, compliance_summary, risk_flags, fairness_rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(leaseId, tenantName, propertyAddress, uploadedAt, file.originalname, targetPath, analysis.summary, JSON.stringify(analysis.risks), analysis.fairnessRating);

    const chunks = chunkText(textContent);
    if (chunks.length > 0) {
      await storeChunks({ leaseId, chunks });
    }

    res.status(201).json({
      id: leaseId,
      tenantName,
      propertyAddress,
      uploadedAt,
      complianceSummary: analysis.summary,
      riskFlags: analysis.risks,
      fairnessRating: analysis.fairnessRating,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error('Failed to process lease upload', error);
    res.status(500).json({ message: 'Failed to process lease upload', details: error.message });
  } finally {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.post('/api/chat', async (req, res) => {
  const { leaseId, question } = req.body;
  if (!leaseId || !question) {
    res.status(400).json({ message: 'leaseId and question are required' });
    return;
  }

  try {
    const lease = db.prepare('SELECT tenant_name, property_address FROM leases WHERE id = ?').get(leaseId);
    if (!lease) {
      res.status(404).json({ message: 'Lease not found' });
      return;
    }
    const matches = await searchLeaseChunks({ leaseId, query: question, limit: 5 });
    const answerParts = matches.map((match, index) => `${index + 1}. ${match.payload?.text || ''}`);
    const answer = answerParts.length > 0
      ? `The following clauses address your question:\n${answerParts.join('\n')}\n\nAlways consult a licensed attorney for final interpretation.`
      : 'No relevant clauses were retrieved for the question provided.';

    res.json({
      answer,
      matches: matches.map((match) => ({
        score: match.score,
        payload: match.payload,
      })),
      lease: {
        tenantName: lease.tenant_name,
        propertyAddress: lease.property_address,
      },
    });
  } catch (error) {
    console.error('Chat query failed', error);
    res.status(500).json({ message: 'Chat query failed', details: error.message });
  }
});

app.post('/api/billing/session', async (req, res) => {
  if (!stripe || !stripePriceId) {
    res.status(503).json({ message: 'Stripe billing is not configured' });
    return;
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: req.body.successUrl || BILLING_SUCCESS_URL,
      cancel_url: req.body.cancelUrl || BILLING_CANCEL_URL,
      metadata: req.body.metadata || {},
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Failed to create Stripe session', error);
    res.status(500).json({ message: 'Failed to create billing session', details: error.message });
  }
});

app.delete('/api/leases/:leaseId', async (req, res) => {
  const leaseId = req.params.leaseId;
  const lease = db.prepare('SELECT stored_path FROM leases WHERE id = ?').get(leaseId);
  if (!lease) {
    res.status(404).json({ message: 'Lease not found' });
    return;
  }

  const chunkIds = db.prepare('SELECT qdrant_point_id FROM lease_chunks WHERE lease_id = ?').all(leaseId);
  try {
    db.prepare('DELETE FROM leases WHERE id = ?').run(leaseId);
    db.prepare('DELETE FROM lease_chunks WHERE lease_id = ?').run(leaseId);
    if (lease.stored_path && fs.existsSync(lease.stored_path)) {
      fs.unlinkSync(lease.stored_path);
    }
    if (chunkIds.length > 0) {
      await qdrant.delete(QDRANT_COLLECTION, {
        points: chunkIds.map((row) => row.qdrant_point_id),
      });
    }
    res.json({ status: 'deleted' });
  } catch (error) {
    console.error('Failed to delete lease', error);
    res.status(500).json({ message: 'Failed to delete lease', details: error.message });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof Error && err.message.includes('Origin not allowed')) {
    res.status(403).json({ message: err.message });
    return;
  }
  console.error('Unhandled error', err);
  res.status(500).json({ message: 'Internal server error' });
});

ensureBackendReady()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`LeaseCheck backend listening on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Backend failed to start', error);
    process.exit(1);
  });
