-- Dynamic RAG documents are keyed by their source business record. Remove any
-- duplicates created by the former conflict-less insert before enforcing the
-- idempotency contract used by the incremental worker.
WITH ranked_documents AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY doc_type, locale, source_id
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS duplicate_rank
  FROM rag_documents
  WHERE source_id IS NOT NULL
)
DELETE FROM rag_documents AS document
USING ranked_documents AS ranked
WHERE document.id = ranked.id
  AND ranked.duplicate_rank > 1;

ALTER TABLE rag_documents
  ADD COLUMN content_hash CHAR(64);

CREATE UNIQUE INDEX rag_documents_source_key
  ON rag_documents (doc_type, locale, source_id)
  WHERE source_id IS NOT NULL;

-- The worker scans only currently searchable business rows in stable ID order.
-- Partial indexes keep those cursor scans bounded as inactive history grows.
CREATE INDEX menu_items_rag_sync_idx
  ON menu_items (id)
  WHERE is_available = true;

CREATE INDEX restaurants_rag_sync_idx
  ON restaurants (id)
  WHERE is_active = true
    AND is_open = true
    AND approval_status = 'approved';
