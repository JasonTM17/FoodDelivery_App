export type RagDocType = 'faq' | 'policy' | 'menu' | 'restaurant'

export interface RagDocumentRecord {
  id: string
  docType: RagDocType
  locale: string
  title: string
  content: string
  sourceId?: string | null
  isActive: boolean
}

export interface RagChunk {
  id: string
  docType: RagDocType
  locale: string
  title: string
  content: string
  sourceId?: string | null
  similarity: number
}

export interface RagSearchOptions {
  locale?: string
  topK?: number
  minSimilarity?: number
  docTypes?: RagDocType[]
}

export interface KnowledgeEntry {
  docType: RagDocType
  locale: string
  title: string
  content: string
  sourceId: string
}
