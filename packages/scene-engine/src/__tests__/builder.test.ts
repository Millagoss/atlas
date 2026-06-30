import { describe, it, expect } from "vitest";
import { createSceneBuilder, type SpatialSceneBuilder } from "../index.js";
import {
  createImageAsset,
  createDepthAsset,
  validateAsset,
  type Dimensions,
  type ImageAsset,
  type DepthAsset,
} from "@atlas/shared";

const DIMS: Dimensions = { width: 320, height: 240 };

function makeImage(id = "img-001"): ImageAsset {
  return createImageAsset({ mimeType: "image/png", dimensions: DIMS, id });
}

function makeDepth(id = "depth-001", sourceImageId = "img-001"): DepthAsset {
  return createDepthAsset({
    mimeType: "application/octet-stream",
    dimensions: DIMS,
    id,
    metadata: {
      sourceImageId,
      provider: "mock",
      minDepth: 0.5,
      maxDepth: 8.2,
      meanDepth: 4.35,
    },
  });
}

describe("DefaultSceneBuilder", () => {
  it("implements the SpatialSceneBuilder interface", () => {
    const builder: SpatialSceneBuilder = createSceneBuilder();
    expect(builder).toBeDefined();
    expect(typeof builder.build).toBe("function");
  });

  it("produces a SpatialScene from an image + depth pair", async () => {
    const builder = createSceneBuilder();
    const image = makeImage();
    const depth = makeDepth();

    const scene = await builder.build(image, depth);

    expect(scene.type).toBe("spatial-scene");
    expect(scene.mimeType).toBe("application/json");
    expect(scene.dimensions).toEqual(DIMS);
  });

  it("creates a scene graph with a root and two child nodes", async () => {
    const builder = createSceneBuilder();
    const scene = await builder.build(makeImage(), makeDepth());

    expect(scene.root.name).toBe("root");
    expect(scene.root.children).toHaveLength(2);
    const childNames = scene.root.children.map((n) => n.name);
    expect(childNames).toEqual(expect.arrayContaining(["image-plane", "depth-field"]));
  });

  it("generates unique node ids", async () => {
    const builder = createSceneBuilder();
    const sceneA = await builder.build(makeImage("a"), makeDepth("da", "a"));
    const sceneB = await builder.build(makeImage("b"), makeDepth("db", "b"));

    expect(sceneA.root.id).not.toBe(sceneB.root.id);
    const allIdsA = [sceneA.root.id, ...sceneA.root.children.map((n) => n.id)];
    const allIdsB = [sceneB.root.id, ...sceneB.root.children.map((n) => n.id)];
    for (const id of allIdsA) {
      expect(allIdsB).not.toContain(id);
    }
  });

  it("records source image and depth ids in metadata", async () => {
    const builder = createSceneBuilder();
    const image = makeImage("source-img-42");
    const depth = makeDepth("source-depth-99", "source-img-42");

    const scene = await builder.build(image, depth);

    expect(scene.metadata["sourceImageId"]).toBe("source-img-42");
    expect(scene.metadata["sourceDepthId"]).toBe("source-depth-99");
  });

  it("records node count in metadata", async () => {
    const builder = createSceneBuilder();
    const scene = await builder.build(makeImage(), makeDepth());

    expect(scene.metadata["nodeCount"]).toBe(3);
  });

  it("records processing time as a number", async () => {
    const builder = createSceneBuilder();
    const scene = await builder.build(makeImage(), makeDepth());

    expect(typeof scene.metadata["processingTimeMs"]).toBe("number");
    expect(scene.metadata["processingTimeMs"] as number).toBeGreaterThanOrEqual(0);
  });

  it("propagates depth statistics into scene metadata", async () => {
    const builder = createSceneBuilder();
    const depth = makeDepth("d-1", "i-1");
    const scene = await builder.build(makeImage("i-1"), depth);

    expect(scene.metadata["depthMinDepth"]).toBe(0.5);
    expect(scene.metadata["depthMaxDepth"]).toBe(8.2);
    expect(scene.metadata["depthMeanDepth"]).toBe(4.35);
    expect(scene.metadata["depthProvider"]).toBe("mock");
  });

  it("produces a validatable SpatialScene", async () => {
    const builder = createSceneBuilder();
    const scene = await builder.build(makeImage(), makeDepth());

    const result = validateAsset(scene);
    expect(result.ok).toBe(true);
  });

  it("produces an immutable (frozen) scene", async () => {
    const builder = createSceneBuilder();
    const scene = await builder.build(makeImage(), makeDepth());

    expect(Object.isFrozen(scene)).toBe(true);
    expect(Object.isFrozen(scene.root)).toBe(true);
    expect(Object.isFrozen(scene.root.children[0] ?? {})).toBe(true);
    expect(Object.isFrozen(scene.metadata)).toBe(true);
    expect(Object.isFrozen(scene.dimensions)).toBe(true);
  });

  it("adapts to varying image dimensions", async () => {
    const builder = createSceneBuilder();
    const largeDims: Dimensions = { width: 1920, height: 1080 };
    const largeImage = createImageAsset({
      mimeType: "image/jpeg",
      dimensions: largeDims,
      id: "big",
    });
    const largeDepth = createDepthAsset({
      mimeType: "application/octet-stream",
      dimensions: largeDims,
      metadata: { sourceImageId: "big" },
    });

    const scene = await builder.build(largeImage, largeDepth);

    expect(scene.dimensions).toEqual(largeDims);
  });
});
