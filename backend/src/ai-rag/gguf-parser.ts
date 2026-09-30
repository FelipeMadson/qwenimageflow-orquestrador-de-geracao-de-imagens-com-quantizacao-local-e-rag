/**
 * GGUF Binary Header Parser, Streaming Byte Slice Reader,
 * and Q4_0 Block Dequantization Engine.
 * Author: Felipe Madison (@FelipeMadson)
 */
import fs from "node:fs";

export type GgufTensorType = "F32" | "F16" | "Q4_0" | "Q4_1" | "Q5_0" | "Q5_1" | "Q8_0" | "UNKNOWN";

export interface GgufTensorInfo {
  name: string;
  shape: number[];
  type: GgufTensorType | "Q4_0" | "F32" | "F16";
  typeCode: number;
  offset: number; // offset relative to tensor data section
  sizeBytes: number;
}

export interface GgufHeader {
  magic: number;
  version: number;
  tensorCount: number;
  metadataKvCount: number;
  metadata: Record<string, any>;
  tensors: GgufTensorInfo[];
  dataOffset: number;
}

export interface IGgufTensorEngine {
  parseHeader(buffer: Buffer): { version: number; tensorCount: number; tensors: GgufTensorInfo[]; metadata?: Record<string, any>; dataOffset?: number };
  dequantizeQ4_0(blockBytes: Uint8Array, outputFloats: Float32Array): void;
  sliceTensor(filePath: string, tensor: GgufTensorInfo, startOffset: number, length: number): Float32Array;
}

export function decodeFloat16(h: number): number {
  const sign = (h & 0x8000) ? -1 : 1;
  const exp = (h >> 10) & 0x1f;
  const mant = h & 0x03ff;

  if (exp === 0) {
    if (mant === 0) return sign * 0;
    return sign * Math.pow(2, -14) * (mant / 1024);
  }
  if (exp === 31) {
    return mant === 0 ? sign * Infinity : NaN;
  }
  return sign * Math.pow(2, exp - 15) * (1 + mant / 1024);
}

export class GgufTensorEngine implements IGgufTensorEngine {
  public static readonly GGUF_MAGIC = 0x46554747; // "GGUF" in little endian

  public static parseHeader(buffer: Buffer): GgufHeader {
    let offset = 0;
    if (buffer.length < 24) {
      throw new Error("Buffer too small for valid GGUF header.");
    }

    const magic = buffer.readUInt32LE(offset);
    offset += 4;
    if (magic !== GgufTensorEngine.GGUF_MAGIC) {
      throw new Error(`Invalid GGUF magic: expected 0x46554747, received 0x${magic.toString(16)}`);
    }

    const version = buffer.readUInt32LE(offset);
    offset += 4;
    if (version < 2 || version > 3) {
      throw new Error(`Unsupported GGUF version: ${version}`);
    }

    const tensorCount = Number(buffer.readBigUInt64LE(offset));
    offset += 8;
    const metadataKvCount = Number(buffer.readBigUInt64LE(offset));
    offset += 8;

    const metadata: Record<string, any> = {};
    for (let i = 0; i < metadataKvCount && offset < buffer.length; i++) {
      const keyLen = Number(buffer.readBigUInt64LE(offset));
      offset += 8;
      const key = buffer.toString("utf8", offset, offset + keyLen);
      offset += keyLen;

      const valType = buffer.readUInt32LE(offset);
      offset += 4;

      // Handle common GGUF value types
      if (valType === 4) { // UINT32
        metadata[key] = buffer.readUInt32LE(offset);
        offset += 4;
      } else if (valType === 8) { // STRING
        const sLen = Number(buffer.readBigUInt64LE(offset));
        offset += 8;
        metadata[key] = buffer.toString("utf8", offset, offset + sLen);
        offset += sLen;
      } else if (valType === 7) { // BOOL
        metadata[key] = buffer.readUInt8(offset) !== 0;
        offset += 1;
      } else if (valType === 10) { // UINT64
        metadata[key] = Number(buffer.readBigUInt64LE(offset));
        offset += 8;
      } else {
        // Skip unknown scalar 4 bytes as fallback
        offset += 4;
      }
    }

    const tensors: GgufTensorInfo[] = [];
    for (let i = 0; i < tensorCount && offset < buffer.length; i++) {
      const nameLen = Number(buffer.readBigUInt64LE(offset));
      offset += 8;
      const name = buffer.toString("utf8", offset, offset + nameLen);
      offset += nameLen;

      const nDims = buffer.readUInt32LE(offset);
      offset += 4;
      const shape: number[] = [];
      for (let d = 0; d < nDims; d++) {
        shape.push(Number(buffer.readBigUInt64LE(offset)));
        offset += 8;
      }

      const typeCode = buffer.readUInt32LE(offset);
      offset += 4;
      const tensorOffset = Number(buffer.readBigUInt64LE(offset));
      offset += 8;

      let type: GgufTensorType = "UNKNOWN";
      let bytesPerElement = 4;
      if (typeCode === 0) { type = "F32"; bytesPerElement = 4; }
      else if (typeCode === 1) { type = "F16"; bytesPerElement = 2; }
      else if (typeCode === 2) { type = "Q4_0"; bytesPerElement = 18 / 32; }

      const totalElements = shape.reduce((acc, dim) => acc * dim, 1);
      const sizeBytes = Math.ceil(totalElements * bytesPerElement);

      tensors.push({
        name,
        shape,
        type,
        typeCode,
        offset: tensorOffset,
        sizeBytes
      });
    }

    // Default 32-byte alignment for tensor data
    const alignment = metadata["general.alignment"] || 32;
    const remainder = offset % alignment;
    const dataOffset = remainder === 0 ? offset : offset + (alignment - remainder);

    return {
      magic,
      version,
      tensorCount,
      metadataKvCount,
      metadata,
      tensors,
      dataOffset
    };
  }

  public parseHeader(buffer: Buffer): GgufHeader {
    return GgufTensorEngine.parseHeader(buffer);
  }

  public static dequantizeQ4_0(blockBytes: Uint8Array, outputFloats: Float32Array): void {
    const blockCount = Math.floor(blockBytes.length / 18);
    let outIdx = 0;

    for (let b = 0; b < blockCount; b++) {
      const bOffset = b * 18;
      const rawD = blockBytes[bOffset] | (blockBytes[bOffset + 1] << 8);
      const d = decodeFloat16(rawD);

      for (let j = 0; j < 16; j++) {
        const byte = blockBytes[bOffset + 2 + j];
        const q0 = byte & 0x0f;
        const q1 = (byte >> 4) & 0x0f;
        outputFloats[outIdx + j] = (q0 - 8) * d;
        outputFloats[outIdx + 16 + j] = (q1 - 8) * d;
      }
      outIdx += 32;
    }
  }

  public dequantizeQ4_0(blockBytes: Uint8Array, outputFloats: Float32Array): void {
    GgufTensorEngine.dequantizeQ4_0(blockBytes, outputFloats);
  }

  public static sliceTensor(
    filePath: string,
    tensor: GgufTensorInfo,
    startOffset: number,
    length: number
  ): Float32Array {
    const fd = fs.openSync(filePath, "r");
    try {
      const readBuffer = Buffer.alloc(length);
      fs.readSync(fd, readBuffer, 0, length, tensor.offset + startOffset);

      if (tensor.type === "Q4_0") {
        const elementCount = Math.floor(length / 18) * 32;
        const output = new Float32Array(elementCount);
        this.dequantizeQ4_0(new Uint8Array(readBuffer.buffer, readBuffer.byteOffset, length), output);
        return output;
      }

      if (tensor.type === "F32") {
        return new Float32Array(readBuffer.buffer, readBuffer.byteOffset, length / 4);
      }

      throw new Error(`Unsupported tensor type for slicing: ${tensor.type}`);
    } finally {
      fs.closeSync(fd);
    }
  }

  public sliceTensor(
    filePath: string,
    tensor: GgufTensorInfo,
    startOffset: number,
    length: number
  ): Float32Array {
    return GgufTensorEngine.sliceTensor(filePath, tensor, startOffset, length);
  }
}
