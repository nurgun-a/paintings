import { RAGDocument } from '../types.js';
import { EmbeddingService } from '../embeddings/embeddings.service.js';
import { CacheService } from '../cache/cache.service.js';
import { QuestProject } from '../../types/index.js';

export class RetrievalService {
  private embeddingService: EmbeddingService;
  private cache = CacheService.getInstance();
  // In-memory document store representing our indexed vector database
  private documentVectorDB: Map<string, RAGDocument[]> = new Map();

  constructor(embeddingService: EmbeddingService) {
    this.embeddingService = embeddingService;
  }

  /**
   * Indexes and builds vector databases for all available quest projects.
   */
  public async indexProjectKnowledge(project: QuestProject, provider: 'gemini' | 'openai' | 'local'): Promise<void> {
    const documents: Omit<RAGDocument, 'embedding'>[] = [];

    // 1. Index Lore Story chunks
    const storyChunks = this.chunkText(project.lore.story, 300);
    storyChunks.forEach((chunk, idx) => {
      documents.push({
        id: `${project.id}:story:chunk-${idx}`,
        content: chunk,
        metadata: { type: 'story', projectId: project.id, chunkIndex: idx }
      });
    });

    // 2. Index Rules
    const rulesChunks = this.chunkText(project.lore.rules, 300);
    rulesChunks.forEach((chunk, idx) => {
      documents.push({
        id: `${project.id}:rules:chunk-${idx}`,
        content: chunk,
        metadata: { type: 'rules', projectId: project.id, chunkIndex: idx }
      });
    });

    // 3. Index NPC Lore & Descriptions
    project.npcs.forEach(npc => {
      documents.push({
        id: `${project.id}:npc:${npc.id}`,
        content: `NPC Личность: Имя: ${npc.name}, Роль: ${npc.role}. Характер: ${npc.personality}.`,
        metadata: { type: 'npc', projectId: project.id, npcId: npc.id }
      });
    });

    // 4. Index Steps Descriptions (to let AI understand what challenges are ahead without loading full tasks)
    project.steps.forEach((step, idx) => {
      documents.push({
        id: `${project.id}:step:${step.id}`,
        content: `Испытание Квеста #${idx + 1}: Название: "${step.title}". Описание задачи: "${step.description}". Награда за решение: ${step.reward.xp} XP${step.reward.item ? `, Предмет: ` + step.reward.item : ''}.`,
        metadata: { type: 'step', projectId: project.id, stepIndex: idx, stepId: step.id }
      });
    });

    // Generate embeddings for all documents
    const rawTexts = documents.map(doc => doc.content);
    if (rawTexts.length === 0) return;

    try {
      const embeddings = await this.embeddingService.getEmbeddings(rawTexts, provider);
      
      const finalizedDocs: RAGDocument[] = documents.map((doc, idx) => ({
        ...doc,
        embedding: embeddings[idx]
      }));

      this.documentVectorDB.set(project.id, finalizedDocs);
      console.log(`[RAG Service] Successfully indexed ${finalizedDocs.length} vector records for project: ${project.name}`);
    } catch (err) {
      console.error(`[RAG Service] Indexing failed for project ${project.id}:`, err);
    }
  }

  /**
   * Retrieves top relevant knowledge documents matching user's prompt query.
   */
  public async searchKnowledge(
    projectId: string,
    query: string,
    limit: number = 3,
    threshold: number = 0.35,
    provider: 'gemini' | 'openai' | 'local' = 'local'
  ): Promise<RAGDocument[]> {
    const docs = this.documentVectorDB.get(projectId);
    if (!docs || docs.length === 0) {
      return [];
    }

    // Check query embeddings
    try {
      const queryEmbeddingArr = await this.embeddingService.getEmbeddings([query], provider);
      const queryEmbedding = queryEmbeddingArr[0];

      if (!queryEmbedding) return [];

      // Rank documents by cosine similarity
      const hits = docs.map(doc => {
        const docEmbedding = doc.embedding || [];
        const similarity = this.embeddingService.cosineSimilarity(queryEmbedding, docEmbedding);
        return { doc, similarity };
      });

      // Sort, filter by threshold, and limit
      return hits
        .filter(h => h.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(h => h.doc);
    } catch (err) {
      console.error('[RAG Service] Search retrieval failed:', err);
      // Fallback search: simple keyword matching if vector similarity throws
      return docs
        .filter(doc => doc.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
    }
  }

  /**
   * Splits text into overlapping paragraphs or chunks of a given max size.
   */
  private chunkText(text: string, maxChunkLen: number): string[] {
    if (!text) return [];
    const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkLen) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }
    return chunks;
  }
}
