import { describe, it, expect } from "vitest";
import {
  AssetRegistry,
  createDepthAsset,
  createSpatialScene,
  generateId,
  type ImageAsset,
  type DepthAsset,
} from "@atlas/shared";
import { createIngestionPipeline, ingestImage } from "../index";
import type {
  ExtractedImageMeta,
  ImageMetadataExtractor,
  IngestionLogger,
  IngestionLogLevel,
} from "../index";
import type { DepthProvider } from "@atlas/ai-engine";
import type { SpatialSceneBuilder } from "@atlas/scene-engine";

interface CapturedLog {
  level: IngestionLogLevel;
  message: string;
}

function capturingLogger(): { logger: IngestionLogger; logs: CapturedLog[] } {
  const logs: CapturedLog[] = [];
  return {
    logs,
    logger: {
      log: (level, message) => {
        logs.push({ level, message });
      },
    },
  };
}

function fakeExtractor(output: ExtractedImageMeta): ImageMetadataExtractor {
  return {
    extract: () => Promise.resolve({ ok: true, data: output }),
  };
}

function failingExtractor(message: string): ImageMetadataExtractor {
  return {
    extract: () =>
      Promise.resolve({
        ok: false,
        error: { code: "IMAGE_DECODE_FAILED", message },
      }),
  };
}

function fakeDepthProvider(): DepthProvider {
  return {
    name: "fake",
    generate: (image: ImageAsset) =>
      Promise.resolve(
        createDepthAsset({
          mimeType: "application/octet-stream",
          dimensions: image.dimensions,
          metadata: { sourceImageId: image.id, minDepth: 0, maxDepth: 1 },
        }),
      ),
  };
}

function fakeSceneBuilder(): SpatialSceneBuilder {
  return {
    build: (image: ImageAsset, depth: DepthAsset) =>
      Promise.resolve(
        createSpatialScene({
          mimeType: "application/json",
          dimensions: image.dimensions,
          root: {
            id: generateId(),
            name: "root",
            children: [{ id: generateId(), name: "plane", children: [] }],
          },
          metadata: { sourceImageId: image.id, sourceDepthId: depth.id, nodeCount: 2 },
        }),
      ),
  };
}

function fakePipeline() {
  return createIngestionPipeline({
    depthProvider: fakeDepthProvider(),
    sceneBuilder: fakeSceneBuilder(),
  });
}

function makeFile(name: string, type: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type });
}

describe("ingestImage", () => {
  it("runs the full ingestion workflow successfully", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = fakeExtractor({
      dimensions: { width: 640, height: 480 },
      previewUrl: "blob:preview",
    });
    const logger = capturingLogger().logger;
    const file = makeFile("photo.png", "image/png");

    const result = await ingestImage(file, { registry, pipeline, extractor, logger });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const asset: ImageAsset = result.data.asset;
      expect(asset.type).toBe("image");
      expect(asset.mimeType).toBe("image/png");
      expect(asset.dimensions).toEqual({ width: 640, height: 480 });
      expect(result.data.previewUrl).toBe("blob:preview");
      expect(asset.metadata["filename"]).toBe("photo.png");
      expect(asset.metadata["fileSize"]).toBe(1024);
      expect(result.data.depth.type).toBe("depth");
      expect(result.data.scene.type).toBe("spatial-scene");
    }
    expect(registry.size()).toBe(1);
    expect(registry.getByType("image")).toHaveLength(1);
  });

  it("emits the full lifecycle log sequence", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = fakeExtractor({ dimensions: { width: 1, height: 1 }, previewUrl: "blob" });
    const { logger, logs } = capturingLogger();

    await ingestImage(makeFile("a.png", "image/png"), { registry, pipeline, extractor, logger });

    const messages = logs.map((l) => l.message);
    expect(messages).toContain("Validation Passed");
    expect(messages.some((m) => m.startsWith("ImageAsset Created:"))).toBe(true);
    expect(messages).toContain("Asset Registered");
    expect(messages).toContain("Pipeline Started");
    expect(messages.some((m) => m.startsWith("Pipeline Completed"))).toBe(true);
    expect(messages.some((m) => m.startsWith("SpatialScene Created:"))).toBe(true);
  });

  it("rejects an unsupported file type without registering or running the pipeline", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = fakeExtractor({ dimensions: { width: 1, height: 1 }, previewUrl: "blob" });
    const { logger, logs } = capturingLogger();

    const result = await ingestImage(makeFile("doc.gif", "image/gif"), {
      registry,
      pipeline,
      extractor,
      logger,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FILE_UNSUPPORTED_TYPE");
    expect(registry.size()).toBe(0);

    const messages = logs.map((l) => l.message);
    expect(messages.some((m) => m.startsWith("File Selected:"))).toBe(true);
    expect(messages.some((m) => m.startsWith("Validation Failed:"))).toBe(true);
    expect(messages).not.toContain("Pipeline Started");
  });

  it("rejects an empty file", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = fakeExtractor({ dimensions: { width: 1, height: 1 }, previewUrl: "blob" });
    const logger = capturingLogger().logger;

    const result = await ingestImage(makeFile("empty.png", "image/png", 0), {
      registry,
      pipeline,
      extractor,
      logger,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FILE_EMPTY");
  });

  it("rejects extraction failure as a corrupted file", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = failingExtractor("corrupt");
    const logger = capturingLogger().logger;

    const result = await ingestImage(makeFile("broken.png", "image/png"), {
      registry,
      pipeline,
      extractor,
      logger,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("IMAGE_DECODE_FAILED");
    expect(registry.size()).toBe(0);
  });

  it("registers metadata from the real file (filename and fileSize)", async () => {
    const registry = new AssetRegistry();
    const pipeline = fakePipeline();
    const extractor = fakeExtractor({ dimensions: { width: 2, height: 2 }, previewUrl: "blob" });
    const logger = capturingLogger().logger;
    const file = makeFile("landscape.webp", "image/webp", 4096);

    const result = await ingestImage(file, { registry, pipeline, extractor, logger });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.asset.metadata["filename"]).toBe("landscape.webp");
      expect(result.data.asset.metadata["fileSize"]).toBe(4096);
    }
  });

  it("puts the created ImageAsset into the pipeline context", async () => {
    const registry = new AssetRegistry();
    // Use pre-configured pipeline; add a probe stage AFTER the scene builder
    const pipeline = createIngestionPipeline({
      depthProvider: fakeDepthProvider(),
      sceneBuilder: fakeSceneBuilder(),
    });
    let seenAsset: unknown = undefined;
    pipeline.addStage({
      name: "probe",
      execute: (ctx) => {
        seenAsset = ctx.get("imageAsset");
        return Promise.resolve(ctx);
      },
    });
    const extractor = fakeExtractor({ dimensions: { width: 8, height: 8 }, previewUrl: "blob" });
    const logger = capturingLogger().logger;

    const result = await ingestImage(makeFile("p.png", "image/png"), {
      registry,
      pipeline,
      extractor,
      logger,
    });

    expect(result.ok).toBe(true);
    expect(seenAsset).toBe(result.ok ? result.data.asset : null);
  });
});
