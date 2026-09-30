/**
 * Deterministic Typed Float32Array Key-Value Cache
 * with Sliding Window Attention Sinks and Rolling Prefix Hash.
 * Author: Felipe Madison (@FelipeMadson)
 */
import { createHash } from "node:crypto";

export interface KvCacheOptions {
  layers: number;
  heads: number;
  headDim: number;
  maxSeqLen: number;
  sinkTokens?: number; // default: 4 (attention sinks)
}

export interface KvCacheStats {
  layers: number;
  heads: number;
  headDim: number;
  maxSeqLen: number;
  currentSeqLen: number;
  sinkTokens: number;
  prefixHash: string;
  allocatedBytes: number;
}

export interface IDeterministicKvCache {
  append(layer: number, head: number, keys: Float32Array, values: Float32Array, tokenId?: number): void;
  getKeys(layer: number, head: number): Float32Array;
  getValues(layer: number, head: number): Float32Array;
  getPrefixHash(): string;
  reset(): void;
  getStats?(): KvCacheStats;
}

export class DeterministicKvCache implements IDeterministicKvCache {
  private layers: number;
  private heads: number;
  private headDim: number;
  private maxSeqLen: number;
  private sinkTokens: number;
  private currentSeqLen = 0;
  private keyBuffer: Float32Array;
  private valBuffer: Float32Array;
  private tokenHistory: number[] = [];

  constructor(layers: number, heads: number, headDim: number, maxSeqLen: number, sinkTokens = 4) {
    this.layers = layers;
    this.heads = heads;
    this.headDim = headDim;
    this.maxSeqLen = maxSeqLen;
    this.sinkTokens = Math.min(sinkTokens, maxSeqLen);

    const totalFloats = layers * heads * maxSeqLen * headDim;
    this.keyBuffer = new Float32Array(totalFloats);
    this.valBuffer = new Float32Array(totalFloats);
  }

  private getSlotOffset(layer: number, head: number, tokenIdx: number): number {
    return (((layer * this.heads + head) * this.maxSeqLen) + tokenIdx) * this.headDim;
  }

  public append(layer: number, head: number, keys: Float32Array, values: Float32Array, tokenId?: number): void {
    const numTokens = Math.floor(keys.length / this.headDim);
    if (numTokens === 0) return;

    if (tokenId !== undefined) {
      this.tokenHistory.push(tokenId);
    }

    if (this.currentSeqLen + numTokens <= this.maxSeqLen) {
      const destOffset = this.getSlotOffset(layer, head, this.currentSeqLen);
      this.keyBuffer.set(keys, destOffset);
      this.valBuffer.set(values, destOffset);
      if (layer === 0 && head === 0) {
        this.currentSeqLen += numTokens;
      }
    } else {
      // Sliding window with attention sinks
      const sinkCount = this.sinkTokens;
      const windowCapacity = this.maxSeqLen - sinkCount;
      const keepRecent = windowCapacity - numTokens;

      if (keepRecent > 0) {
        const srcStart = this.getSlotOffset(layer, head, this.currentSeqLen - keepRecent);
        const srcEnd = srcStart + (keepRecent * this.headDim);
        const destStart = this.getSlotOffset(layer, head, sinkCount);

        this.keyBuffer.copyWithin(destStart, srcStart, srcEnd);
        this.valBuffer.copyWithin(destStart, srcStart, srcEnd);
      }

      const appendDest = this.getSlotOffset(layer, head, this.maxSeqLen - numTokens);
      this.keyBuffer.set(keys, appendDest);
      this.valBuffer.set(values, appendDest);

      if (layer === 0 && head === 0) {
        this.currentSeqLen = this.maxSeqLen;
      }
    }
  }

  public getKeys(layer: number, head: number): Float32Array {
    const start = this.getSlotOffset(layer, head, 0);
    const end = start + (this.currentSeqLen * this.headDim);
    return this.keyBuffer.subarray(start, end);
  }

  public getValues(layer: number, head: number): Float32Array {
    const start = this.getSlotOffset(layer, head, 0);
    const end = start + (this.currentSeqLen * this.headDim);
    return this.valBuffer.subarray(start, end);
  }

  public getPrefixHash(): string {
    const hasher = createHash("sha256");
    const buf = Buffer.alloc(this.tokenHistory.length * 4);
    for (let i = 0; i < this.tokenHistory.length; i++) {
      buf.writeInt32LE(this.tokenHistory[i], i * 4);
    }
    return hasher.update(buf).digest("hex");
  }

  public getStats(): KvCacheStats {
    const allocatedBytes = (this.keyBuffer.byteLength + this.valBuffer.byteLength);
    return {
      layers: this.layers,
      heads: this.heads,
      headDim: this.headDim,
      maxSeqLen: this.maxSeqLen,
      currentSeqLen: this.currentSeqLen,
      sinkTokens: this.sinkTokens,
      prefixHash: this.getPrefixHash(),
      allocatedBytes
    };
  }

  public reset(): void {
    this.keyBuffer.fill(0);
    this.valBuffer.fill(0);
    this.currentSeqLen = 0;
    this.tokenHistory = [];
  }
}
