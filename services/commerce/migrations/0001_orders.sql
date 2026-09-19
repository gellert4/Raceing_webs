CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  request_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  country TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  lines TEXT NOT NULL,
  terms_snapshot TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  session_id TEXT UNIQUE,
  checkout_url TEXT,
  payment_intent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
-- Durable work queue. No automatic shipment or unsupported invoice claim.
CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending',
  lease_until INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE TABLE IF NOT EXISTS withdrawals (
  id TEXT PRIMARY KEY,
  order_reference TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  language TEXT NOT NULL,
  email TEXT NOT NULL,
  items TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  receipt_status TEXT NOT NULL DEFAULT 'pending',
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS operations_pending ON operations(state, created_at);
CREATE INDEX IF NOT EXISTS order_payment ON orders(payment_intent);
