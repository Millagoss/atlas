import { describe, it, expect } from "vitest";
import {
  createImageAsset,
  createProcessedImageAsset,
  createDepthAsset,
  validateAsset,
  serializeAsset,
  deserializeAsset,
} from "../index.js";
import type { Asset, AtlasError, AtlasResult } from "../index.js";

const PNG = "image/png";
const DIMENSIONS = { width: 640, height: 480 } as const;
const FIXED_ID = "11111111-1111-4111-8111-111111111111";
const FIXED_TIMESTAMP = "2025-06-29T12:00:00.000Z";

function expectError(result: AtlasResult<unknown>): AtlasError {
  expect(result.ok).toBe(false);
  if (result.ok) throw new Error("expected a failed result");
  return result.error;
}

describe("Asset System", () => {
  describe("factory creation", () => {
    it("createImageAsset produces an ImageAsset with defaults", () => {
      const asset = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });

      expect(asset.type).toBe("image");
      expect(asset.mimeType).toBe(PNG);
      expect(asset.dimensions).toEqual(DIMENSIONS);
      expect(typeof asset.id).toBe("string");
      expect(asset.id.length).toBeGreaterThan(0);
      expect(asset.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(asset.metadata).toEqual({});
    });

    it("createProcessedImageAsset produces a ProcessedImageAsset", () => {
      const asset = createProcessedImageAsset({
        mimeType: PNG,
        dimensions: DIMENSIONS,
        id: FIXED_ID,
        createdAt: FIXED_TIMESTAMP,
      });

      expect(asset.type).toBe("processed-image");
      expect(asset.id).toBe(FIXED_ID);
      expect(asset.createdAt).toBe(FIXED_TIMESTAMP);
    });

    it("createDepthAsset produces a DepthAsset with metadata", () => {
      const asset = createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: DIMENSIONS,
        metadata: { sourceAssetId: FIXED_ID, minDepth: 0.1, maxDepth: 42.0 },
      });

      expect(asset.type).toBe("depth");
      expect(asset.metadata["sourceAssetId"]).toBe(FIXED_ID);
      expect(asset.metadata["maxDepth"]).toBe(42.0);
    });

    it("supports the full transformation chain via factories", () => {
      const image = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });
      const processed = createProcessedImageAsset({
        mimeType: PNG,
        dimensions: DIMENSIONS,
        metadata: { sourceAssetId: image.id },
      });
      const depth = createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: DIMENSIONS,
        metadata: { sourceAssetId: processed.id },
      });

      expect(depth.metadata["sourceAssetId"] as string).toBe(processed.id);
      expect(processed.metadata["sourceAssetId"] as string).toBe(image.id);
    });

    it("does not share metadata references between assets", () => {
      const shared = { stage: "preprocess" };
      const a = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS, metadata: shared });
      const b = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS, metadata: shared });

      expect(a.metadata).not.toBe(b.metadata);
      expect(a.metadata).toEqual(b.metadata);
    });
  });

  describe("immutability", () => {
    it("produces deeply frozen objects", () => {
      const asset = createImageAsset({
        mimeType: PNG,
        dimensions: DIMENSIONS,
        metadata: { stage: "raw" },
      });

      expect(Object.isFrozen(asset)).toBe(true);
      expect(Object.isFrozen(asset.metadata)).toBe(true);
      expect(Object.isFrozen(asset.dimensions)).toBe(true);
    });

    it("rejects mutation of base fields in strict mode", () => {
      "use strict";
      const asset = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });

      expect(() => {
        // @ts-expect-error -- verifying runtime immutability of a readonly field
        asset.id = "tampered";
      }).toThrow(TypeError);
    });

    it("rejects mutation of metadata in strict mode", () => {
      "use strict";
      const asset = createImageAsset({
        mimeType: PNG,
        dimensions: DIMENSIONS,
        metadata: { stage: "raw" },
      });

      expect(() => {
        // @ts-expect-error -- verifying runtime immutability of a readonly field
        asset.metadata["stage"] = "tampered";
      }).toThrow(TypeError);
    });

    it("rejects mutation of dimensions in strict mode", () => {
      "use strict";
      const asset = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });

      expect(() => {
        // @ts-expect-error -- verifying runtime immutability of a readonly field
        asset.dimensions.width = 9999;
      }).toThrow(TypeError);
    });
  });

  describe("validation", () => {
    it("validates a well-formed ImageAsset", () => {
      const asset = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });
      const result = validateAsset(asset);

      expect(result.ok).toBe(true);
      expect(result.ok && result.data.type).toBe("image");
    });

    it("validates each asset type", () => {
      const image = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });
      const processed = createProcessedImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });
      const depth = createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: DIMENSIONS,
      });

      expect(validateAsset(image).ok).toBe(true);
      expect(validateAsset(processed).ok).toBe(true);
      expect(validateAsset(depth).ok).toBe(true);
    });

    it("rejects a non-object input", () => {
      const result = validateAsset(null);
      expect(expectError(result).code).toBe("ASSET_INVALID");
    });

    it("rejects an empty id", () => {
      const result = validateAsset({
        id: "",
        type: "image",
        createdAt: FIXED_TIMESTAMP,
        mimeType: PNG,
        metadata: {},
        dimensions: DIMENSIONS,
      });

      expect(expectError(result).message).toMatch(/id/);
    });

    it("rejects an unknown asset type", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "spatial-scene",
        createdAt: FIXED_TIMESTAMP,
        mimeType: PNG,
        metadata: {},
      });

      expect(expectError(result).message).toMatch(/type/);
    });

    it("rejects a malformed timestamp", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "image",
        createdAt: "yesterday",
        mimeType: PNG,
        metadata: {},
        dimensions: DIMENSIONS,
      });

      expect(expectError(result).message).toMatch(/createdAt/);
    });

    it("rejects a missing mimeType", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "image",
        createdAt: FIXED_TIMESTAMP,
        mimeType: "",
        metadata: {},
        dimensions: DIMENSIONS,
      });

      expect(expectError(result).message).toMatch(/mimeType/);
    });

    it("rejects non-object metadata", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "image",
        createdAt: FIXED_TIMESTAMP,
        mimeType: PNG,
        metadata: null,
        dimensions: DIMENSIONS,
      });

      expect(expectError(result).message).toMatch(/metadata/);
    });

    it("rejects invalid dimensions on image-like assets", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "image",
        createdAt: FIXED_TIMESTAMP,
        mimeType: PNG,
        metadata: {},
        dimensions: { width: 0, height: 480 },
      });

      expect(expectError(result).message).toMatch(/dimensions/);
    });

    it("rejects non-integer dimensions", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "image",
        createdAt: FIXED_TIMESTAMP,
        mimeType: PNG,
        metadata: {},
        dimensions: { width: 640.5, height: 480 },
      });

      expect(expectError(result).message).toMatch(/dimensions/);
    });

    it("rejects missing dimensions on image-like assets", () => {
      const result = validateAsset({
        id: FIXED_ID,
        type: "depth",
        createdAt: FIXED_TIMESTAMP,
        mimeType: "application/octet-stream",
        metadata: {},
      });

      expect(expectError(result).message).toMatch(/dimensions/);
    });
  });

  describe("serialization", () => {
    it("round-trips an ImageAsset through JSON", () => {
      const asset = createImageAsset({
        mimeType: PNG,
        dimensions: DIMENSIONS,
        id: FIXED_ID,
        createdAt: FIXED_TIMESTAMP,
        metadata: { source: "upload" },
      });

      const json = serializeAsset(asset);
      const result = deserializeAsset(json);

      expect(result.ok).toBe(true);
      const restored = result.ok ? result.data : (undefined as unknown as Asset);
      expect(restored.id).toBe(FIXED_ID);
      expect(restored.type).toBe("image");
      expect(restored.createdAt).toBe(FIXED_TIMESTAMP);
      expect(restored.metadata["source"]).toBe("upload");
    });

    it("serializeAsset outputs a JSON string", () => {
      const asset = createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: DIMENSIONS,
      });

      const json = serializeAsset(asset);
      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json) as { type: string };
      expect(parsed.type).toBe("depth");
    });

    it("deserializeAsset restores a frozen asset", () => {
      const asset = createImageAsset({ mimeType: PNG, dimensions: DIMENSIONS });
      const restoredResult = deserializeAsset(serializeAsset(asset));
      expect(restoredResult.ok).toBe(true);
      const restored = restoredResult.ok ? restoredResult.data : (undefined as unknown as Asset);
      expect(Object.isFrozen(restored)).toBe(true);
    });

    it("deserializeAsset rejects invalid JSON", () => {
      const result = deserializeAsset("{ not json }");
      expect(expectError(result).code).toBe("ASSET_INVALID_JSON");
    });

    it("deserializeAsset rejects structurally invalid asset payloads", () => {
      const result = deserializeAsset(JSON.stringify({ id: FIXED_ID }));
      expect(result.ok).toBe(false);
    });
  });
});
