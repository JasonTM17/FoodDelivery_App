import { Module } from '@nestjs/common'
import { RagEmbeddingService } from './rag-embedding.service'
import { RagRetrievalService } from './rag-retrieval.service'
import { RagIndexerService } from './rag-indexer.service'

@Module({
  providers: [RagEmbeddingService, RagRetrievalService, RagIndexerService],
  exports: [RagRetrievalService, RagIndexerService],
})
export class RagModule {}
