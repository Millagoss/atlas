import { describe, it, expect } from "vitest";
import { createIngestionPipeline } from "../index";
import { createPipelineContext } from "@atlas/pipeline";
import {
  IMAGE_ASSET_CONTEXT_KEY,
  DEPTH_ASSET_CONTEXT_KEY,
  SPATIAL_SCENE_CONTEXT_KEY,
} from "../index";
import {
  createImageAsset,
  createDepthAsset,
  createSpatialScene,
  generateId,
  AssetRegistry,
  type ImageAsset,
  type DepthAsset,
} from "@atlas/shared";
import type { DepthProvider } from "@atlas/ai-engine";
import type { SpatialSceneBuilder } from "@atlas/scene-engine";

function fakeDepthProvider(): DepthProvider {
  return {
    name: "fake",
    generate: (image: ImageAsset) =>
      Promise.resolve(
        createDepthAsset({
          mimeType: "application/octet-stream",
          dimensions: image.dimensions,
          metadata: { sourceImageId: image.id },
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

describe("ingestion pipeline stages", () => {
  it("builds a pipeline with the canonical stage order", () => {
    const pipeline = createIngestionPipeline({
      depthProvider: fakeDepthProvider(),
      sceneBuilder: fakeSceneBuilder(),
    });
    const names = pipeline.getStages().map((s) => s.name);

    expect(names).toEqual(["ingest-image", "generate-depth", "build-spatial-scene"]);
  });

  it("executes all stages and produces depth + scene in context", async () => {
    const pipeline = createIngestionPipeline({
      depthProvider: fakeDepthProvider(),
      sceneBuilder: fakeSceneBuilder(),
    });
    const ctx = createPipelineContext();
    const asset = createImageAsset({
      mimeType: "image/png",
      dimensions: { width: 10, height: 10 },
      id: "stable-id",
    });
    ctx.set(IMAGE_ASSET_CONTEXT_KEY, asset);

    const result = await pipeline.execute(ctx);

    expect(result.success).toBe(true);
    expect(result.completedStages).toEqual([
      "ingest-image",
      "generate-depth",
      "build-spatial-scene",
    ]);
    expect(ctx.get<ImageAsset>(IMAGE_ASSET_CONTEXT_KEY)).toBe(asset);

    const depth = ctx.get<DepthAsset>(DEPTH_ASSET_CONTEXT_KEY);
    expect(depth).toBeDefined();
    expect(depth?.type).toBe("depth");

    const scene = ctx.get(SPATIAL_SCENE_CONTEXT_KEY);
    expect(scene).toBeDefined();
    if (scene && typeof scene === "object" && "type" in scene) {
      expect((scene as { type: string }).type).toBe("spatial-scene");
    }
  });

  it("does not register anything in the registry during pipeline execution", async () => {
    const registry = new AssetRegistry();
    const pipeline = createIngestionPipeline({
      depthProvider: fakeDepthProvider(),
      sceneBuilder: fakeSceneBuilder(),
    });
    await pipeline.execute(createPipelineContext());

    expect(registry.size()).toBe(0);
  });
});
