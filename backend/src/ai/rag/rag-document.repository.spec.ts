import { PrismaService } from '../../database/prisma.service'
import { RagEmbeddingService } from './rag-embedding.service'
import { RagDocumentRepository } from './rag-document.repository'
import type { KnowledgeEntry } from './rag-document.types'

const entry: KnowledgeEntry = {
  docType: 'menu',
  locale: 'vi',
  title: 'Phở bò',
  content: 'Dữ liệu từ menu production',
  sourceId: 'menu-1',
}

describe('RagDocumentRepository', () => {
  it('uses the source uniqueness contract for idempotent vector upserts', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1)
    const prisma = { $executeRaw: executeRaw } as unknown as PrismaService
    const embedding = {
      embed: jest.fn().mockResolvedValue([0.1, 0.2]),
      vectorLiteral: jest.fn().mockReturnValue('[0.1,0.2]'),
    } as unknown as RagEmbeddingService

    await new RagDocumentRepository(prisma, embedding).upsert(entry, 'a'.repeat(64))

    const sql = (executeRaw.mock.calls[0]?.[0] as TemplateStringsArray).join(' ')
    expect(sql).toContain('ON CONFLICT (doc_type, locale, source_id)')
    expect(sql).toContain('DO UPDATE SET')
    expect(sql).toContain('embedding = EXCLUDED.embedding')
  })

  it('stores a null embedding without discarding the live source document', async () => {
    const executeRaw = jest.fn().mockResolvedValue(1)
    const prisma = { $executeRaw: executeRaw } as unknown as PrismaService
    const embedding = { embed: jest.fn().mockResolvedValue(null) } as unknown as RagEmbeddingService

    await new RagDocumentRepository(prisma, embedding).upsert(entry, 'a'.repeat(64))

    const sql = (executeRaw.mock.calls[0]?.[0] as TemplateStringsArray).join(' ')
    expect(sql).toContain('embedding = NULL')
    expect(sql).toContain('is_active = true')
  })

  it('skips unchanged source documents before calling the embedding provider', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{
      sourceId: entry.sourceId,
      contentHash: 'e72ec724d615a6fdf1b66b4497cd3bf926851be5f8b8b713d884906596aaac8e',
      hasEmbedding: true,
    }])
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService
    const embedding = { embed: jest.fn() } as unknown as RagEmbeddingService
    const repository = new RagDocumentRepository(prisma, embedding)

    const first = await repository.prepareChanged([entry])
    const computedHash = first.changed[0]?.contentHash
    queryRaw.mockResolvedValueOnce([{
      sourceId: entry.sourceId,
      contentHash: computedHash,
      hasEmbedding: true,
    }])
    const second = await repository.prepareChanged([entry])

    expect(first).toEqual({
      changed: [{ entry, contentHash: expect.stringMatching(/^[a-f0-9]{64}$/) }],
      unchanged: 0,
    })
    expect(second).toEqual({ changed: [], unchanged: 1 })
    expect(embedding.embed).not.toHaveBeenCalled()
  })

  it('retries an unchanged document when its embedding is still missing', async () => {
    const queryRaw = jest.fn().mockResolvedValue([])
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService
    const embedding = { embed: jest.fn() } as unknown as RagEmbeddingService
    const repository = new RagDocumentRepository(prisma, embedding)
    const initial = await repository.prepareChanged([entry])
    const contentHash = initial.changed[0]?.contentHash
    queryRaw.mockResolvedValueOnce([{
      sourceId: entry.sourceId,
      contentHash,
      hasEmbedding: false,
    }])

    const retry = await repository.prepareChanged([entry])

    expect(retry).toEqual({
      changed: [{ entry, contentHash }],
      unchanged: 0,
    })
  })
})
