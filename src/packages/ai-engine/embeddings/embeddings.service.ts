import { GoogleGenAI } from '@google/genai';
import { OpenAI } from 'openai';
import { CacheService } from '../cache/cache.service.js';

export class EmbeddingService {
  private geminiClient: GoogleGenAI | null = null;
  private openaiClient: OpenAI | null = null;
  private cache = CacheService.getInstance();

  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiClient = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    }
  }

  /**
   * Generates embeddings for a batch of texts.
   * Leverages caching to optimize speed and cost.
   */
  public async getEmbeddings(texts: string[], provider: 'gemini' | 'openai' | 'local'): Promise<number[][]> {
    const results: number[][] = [];
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    // Check Cache first
    for (let i = 0; i < texts.length; i++) {
      const cacheKey = `embedding:${provider}:${Buffer.from(texts[i]).toString('base64')}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        results[i] = JSON.parse(cached);
      } else {
        missingIndices.push(i);
        missingTexts.push(texts[i]);
      }
    }

    if (missingTexts.length > 0) {
      let fetchedEmbeddings: number[][] = [];
      
      if (provider === 'gemini' && this.geminiClient) {
        try {
          fetchedEmbeddings = await this.fetchGeminiEmbeddings(missingTexts);
        } catch (err) {
          console.warn('[EmbeddingService] Gemini Embeddings failed, falling back to local:', err);
          fetchedEmbeddings = this.generateLocalEmbeddings(missingTexts);
        }
      } else if (provider === 'openai' && this.openaiClient) {
        try {
          fetchedEmbeddings = await this.fetchOpenAIEmbeddings(missingTexts);
        } catch (err) {
          console.warn('[EmbeddingService] OpenAI Embeddings failed, falling back to local:', err);
          fetchedEmbeddings = this.generateLocalEmbeddings(missingTexts);
        }
      } else {
        fetchedEmbeddings = this.generateLocalEmbeddings(missingTexts);
      }

      // Populate results and cache them
      for (let j = 0; j < fetchedEmbeddings.length; j++) {
        const originalIndex = missingIndices[j];
        const embedding = fetchedEmbeddings[j];
        results[originalIndex] = embedding;

        const cacheKey = `embedding:${provider}:${Buffer.from(missingTexts[j]).toString('base64')}`;
        await this.cache.set(cacheKey, JSON.stringify(embedding), 86400 * 30); // Cache for 30 days
      }
    }

    return results;
  }

  private async fetchGeminiEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.geminiClient) throw new Error('Gemini API unconfigured');
    
    const embeddings: number[][] = [];
    // The @google/genai SDK provides ai.models.embedContent
    for (const text of texts) {
      const res = await this.geminiClient.models.embedContent({
        model: 'text-embedding-004',
        contents: text
      });
      const resAny = res as any;
      const values = resAny.embedding?.values || resAny.embeddings?.values;
      if (values) {
        embeddings.push(values);
      } else {
        throw new Error('No embedding values returned from Gemini');
      }
    }
    return embeddings;
  }

  private async fetchOpenAIEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openaiClient) throw new Error('OpenAI API unconfigured');

    const res = await this.openaiClient.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts
    });
    return res.data.map(d => d.embedding);
  }

  /**
   * Generates offline TF-IDF bag-of-words styled cosine-comparable embeddings.
   * Returns a 128-dimensional normalized pseudo-vector representing word frequencies.
   */
  public generateLocalEmbeddings(texts: string[]): number[][] {
    const vocabulary = new Set<string>();
    
    // Build local mini vocab for current batch
    texts.forEach(t => {
      this.tokenize(t).forEach(w => vocabulary.add(w));
    });
    
    const vocabArray = Array.from(vocabulary);

    return texts.map(text => {
      const tokens = this.tokenize(text);
      const vector = new Array(128).fill(0); // Production-standard 128 dimension for local embeddings

      tokens.forEach(token => {
        // Simple deterministic hash mapping string to index 0-127
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
          hash = (hash << 5) - hash + token.charCodeAt(i);
          hash |= 0;
        }
        const index = Math.abs(hash) % 128;
        vector[index] += 1; // Count frequency
      });

      // Normalize vector
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        return vector.map(v => v / magnitude);
      }
      return vector;
    });
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, '') // Keep letters/numbers
      .split(/\s+/)
      .filter(w => w.length > 2); // Filter small stopwords/connectors
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  public cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
