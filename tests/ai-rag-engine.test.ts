import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GgufTensorEngine, decodeFloat16 } from "../src/engines/ai-rag/gguf-parser.ts";
import { DeterministicKvCache } from "../src/engines/ai-rag/kv-cache.ts";
import { VectorSimilarityEngine } from "../src/engines/ai-rag/vector-similarity.ts";

describe("AI & RAG Engine Suite", () => {
  describe("1. GGUF Parser & Q4_0", () => {
    it("Decodifica Float16 corretamente", () => {
      assert.strictEqual(decodeFloat16(0x3C00), 1.0);
    });

    it("Dequantiza bloco Q4_0", () => {
      const block = new Uint8Array(18);
      block[0] = 0x00; block[1] = 0x3C; // d = 1.0
      block.fill(0x88, 2);
      const out = new Float32Array(32);
      GgufTensorEngine.dequantizeQ4_0(block, out);
      assert.strictEqual(out.length, 32);
      assert.strictEqual(out[0], 0.0);
    });
  });

  describe("2. Deterministic KV Cache", () => {
    it("Armazena tensores e calcula hash deterministico", () => {
      const kv = new DeterministicKvCache(1, 1, 4, 8);
      const dummy = new Float32Array(4).fill(1);
      kv.append(0, 0, dummy, dummy, 42);
      assert.strictEqual(kv.getKeys(0, 0).length, 4);
      assert.ok(kv.getPrefixHash().length > 0);
    });
  });

  describe("3. Vector Cosine Similarity", () => {
    it("Calcula similaridade e top-k", () => {
      const a = new Float32Array([1, 0, 0]);
      const b = new Float32Array([1, 0, 0]);
      assert.strictEqual(VectorSimilarityEngine.cosineSimilarity(a, b), 1.0);
      const top = VectorSimilarityEngine.searchTopK(a, [b], 1);
      assert.strictEqual(top[0].score, 1.0);
    });
  });
});
