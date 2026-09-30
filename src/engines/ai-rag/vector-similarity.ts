/**
 * 4-Way Loop Unrolled Float32Array Cosine Similarity,
 * L2 Normalization, and Top-K Vector Search Engine.
 * Author: Felipe Madison (@FelipeMadson)
 */
export interface VectorMatch {
  index: number;
  score: number;
}

export interface IVectorSimilarityEngine {
  cosineSimilarity(a: Float32Array, b: Float32Array, preNormalized?: boolean): number;
  normalize(vec: Float32Array): Float32Array;
  searchTopK(query: Float32Array, corpus: Float32Array[], k: number, preNormalized?: boolean): VectorMatch[];
}

export class VectorSimilarityEngine implements IVectorSimilarityEngine {
  public static cosineSimilarity(a: Float32Array, b: Float32Array, preNormalized = false): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: vector A length (${a.length}) !== vector B length (${b.length})`);
    }

    const len = a.length;
    if (len === 0) return 0;

    const len4 = len & ~3;

    if (preNormalized) {
      let dot0 = 0, dot1 = 0, dot2 = 0, dot3 = 0;
      for (let i = 0; i < len4; i += 4) {
        dot0 += a[i] * b[i];
        dot1 += a[i + 1] * b[i + 1];
        dot2 += a[i + 2] * b[i + 2];
        dot3 += a[i + 3] * b[i + 3];
      }
      let dot = (dot0 + dot1) + (dot2 + dot3);
      for (let i = len4; i < len; i++) {
        dot += a[i] * b[i];
      }
      return Math.max(-1, Math.min(1, dot));
    }

    let dot0 = 0, dot1 = 0, dot2 = 0, dot3 = 0;
    let normA0 = 0, normA1 = 0, normA2 = 0, normA3 = 0;
    let normB0 = 0, normB1 = 0, normB2 = 0, normB3 = 0;

    for (let i = 0; i < len4; i += 4) {
      const a0 = a[i], b0 = b[i];
      const a1 = a[i + 1], b1 = b[i + 1];
      const a2 = a[i + 2], b2 = b[i + 2];
      const a3 = a[i + 3], b3 = b[i + 3];

      dot0 += a0 * b0; normA0 += a0 * a0; normB0 += b0 * b0;
      dot1 += a1 * b1; normA1 += a1 * a1; normB1 += b1 * b1;
      dot2 += a2 * b2; normA2 += a2 * a2; normB2 += b2 * b2;
      dot3 += a3 * b3; normA3 += a3 * a3; normB3 += b3 * b3;
    }

    let dot = (dot0 + dot1) + (dot2 + dot3);
    let normA = (normA0 + normA1) + (normA2 + normA3);
    let normB = (normB0 + normB1) + (normB2 + normB3);

    for (let i = len4; i < len; i++) {
      const ai = a[i], bi = b[i];
      dot += ai * bi;
      normA += ai * ai;
      normB += bi * bi;
    }

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0;

    const sim = dot / denom;
    return Math.max(-1, Math.min(1, sim));
  }

  public cosineSimilarity(a: Float32Array, b: Float32Array, preNormalized = false): number {
    return VectorSimilarityEngine.cosineSimilarity(a, b, preNormalized);
  }

  public static normalize(vec: Float32Array): Float32Array {
    const len = vec.length;
    let sumSq0 = 0, sumSq1 = 0, sumSq2 = 0, sumSq3 = 0;
    const len4 = len & ~3;

    for (let i = 0; i < len4; i += 4) {
      const v0 = vec[i], v1 = vec[i + 1], v2 = vec[i + 2], v3 = vec[i + 3];
      sumSq0 += v0 * v0;
      sumSq1 += v1 * v1;
      sumSq2 += v2 * v2;
      sumSq3 += v3 * v3;
    }

    let sumSq = (sumSq0 + sumSq1) + (sumSq2 + sumSq3);
    for (let i = len4; i < len; i++) {
      sumSq += vec[i] * vec[i];
    }

    const norm = Math.sqrt(sumSq);
    const out = new Float32Array(len);
    if (norm === 0) return out;

    const invNorm = 1.0 / norm;
    for (let i = 0; i < len; i++) {
      out[i] = vec[i] * invNorm;
    }
    return out;
  }

  public normalize(vec: Float32Array): Float32Array {
    return VectorSimilarityEngine.normalize(vec);
  }

  public static searchTopK(
    query: Float32Array,
    corpus: Float32Array[],
    k: number,
    preNormalized = false
  ): VectorMatch[] {
    const scores: VectorMatch[] = new Array(corpus.length);
    for (let i = 0; i < corpus.length; i++) {
      scores[i] = {
        index: i,
        score: this.cosineSimilarity(query, corpus[i], preNormalized)
      };
    }

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, Math.min(k, scores.length));
  }

  public searchTopK(
    query: Float32Array,
    corpus: Float32Array[],
    k: number,
    preNormalized = false
  ): VectorMatch[] {
    return VectorSimilarityEngine.searchTopK(query, corpus, k, preNormalized);
  }
}
