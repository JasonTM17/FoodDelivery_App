-- Prisma declares RagDocument as a pgvector-backed model, but earlier
-- migrations never created its backing table. Provision the extension and
-- table together so the application's raw vector queries have a stable
-- database contract in every environment.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "rag_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doc_type" VARCHAR(50) NOT NULL,
  "locale" VARCHAR(10) NOT NULL DEFAULT 'vi',
  "title" VARCHAR(300) NOT NULL,
  "content" TEXT NOT NULL,
  "source_id" VARCHAR(100),
  "embedding" vector(1536),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rag_documents_doc_type_locale_idx"
  ON "rag_documents" ("doc_type", "locale");

-- Retrieval orders by cosine distance. HNSW avoids a full table scan once the
-- knowledge base grows beyond local fixtures; NULL embeddings remain stored
-- for later backfill but are excluded from the ANN index.
CREATE INDEX "rag_documents_embedding_hnsw_idx"
  ON "rag_documents"
  USING hnsw ("embedding" vector_cosine_ops)
  WHERE "embedding" IS NOT NULL;
