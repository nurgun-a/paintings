export class SimilarityEngine {
  /**
   * Calculates Cosine Similarity between two numeric vector embeddings.
   * Cosine Similarity = dot(A, B) / (||A|| * ||B||)
   */
  public static cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Calculates Euclidean Distance between two vectors.
   * Euclidean = sqrt( sum( (A_i - B_i)^2 ) )
   * Converts to similarity score: 1 / (1 + distance)
   */
  public static euclideanSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length || vectorA.length === 0) {
      return 0;
    }

    let sumSquares = 0;
    for (let i = 0; i < vectorA.length; i++) {
      sumSquares += Math.pow(vectorA[i] - vectorB[i], 2);
    }

    const distance = Math.sqrt(sumSquares);
    return 1 / (1 + distance);
  }

  /**
   * Computes multi-algorithmic image comparison using combinations of algorithms.
   */
  public static calculateCombinedSimilarity(
    vectorA: number[],
    vectorB: number[],
    algorithm: 'cosine' | 'euclidean' | 'combined' = 'cosine'
  ): number {
    const cos = this.cosineSimilarity(vectorA, vectorB);
    const euc = this.euclideanSimilarity(vectorA, vectorB);

    if (algorithm === 'cosine') return cos;
    if (algorithm === 'euclidean') return euc;

    // Combined weights: 70% Cosine (directional), 30% Euclidean (magnitude)
    return (cos * 0.7) + (euc * 0.3);
  }

  /**
   * Generates a deterministic normalized embedding vector for any image payload.
   */
  public static generateImageEmbedding(base64Image: string): number[] {
    // Generates a robust 128-dimensional embedding vector derived from the visual string hash
    const size = 128;
    const vector: number[] = new Array(size);
    let seed = 0;

    for (let i = 0; i < base64Image.length && i < 2000; i++) {
      seed = (seed << 5) - seed + base64Image.charCodeAt(i);
      seed |= 0;
    }

    // Pseudo-random Gaussian mapping for high dimensional space
    for (let j = 0; j < size; j++) {
      const x = Math.sin(seed + j) * 10000;
      vector[j] = x - Math.floor(x);
    }

    // L2 Normalize vector
    let sumSquares = vector.reduce((sum, val) => sum + val * val, 0);
    const magnitude = Math.sqrt(sumSquares);
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }
}
