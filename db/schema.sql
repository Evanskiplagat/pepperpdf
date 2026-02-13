CREATE TABLE IF NOT EXISTS temporary_documents (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  doc_id TEXT NOT NULL DEFAULT 'editor-main',
  title TEXT NOT NULL DEFAULT 'Untitled Design',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
  CONSTRAINT temporary_documents_session_doc_unique UNIQUE (session_id, doc_id)
);

CREATE INDEX IF NOT EXISTS temporary_documents_expires_idx
  ON temporary_documents (expires_at);

-- Optional (managed Postgres that supports pg_cron):
-- SELECT cron.schedule(
--   'cleanup-temporary-documents-hourly',
--   '0 * * * *',
--   $$DELETE FROM temporary_documents WHERE expires_at <= NOW()$$
-- );
