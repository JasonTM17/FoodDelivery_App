import { Module } from '@nestjs/common'
import { RagEmbeddingService } from './rag-embedding.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { RagIndexerService } from './rag-indexer.service'
import { RagDocumentRepository } from './rag-document.repository'

@Module({
  providers: [RagEmbeddingService, RagRetrievalService, RagDocumentRepository, RagIndexerService],
  exports: [RagRetrievalService, RagIndexerService],
})
export class RagModule {}
