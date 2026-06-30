import { describe, it, expect } from "vitest";
import { createMockDepthProvider, MockDepthProvider, type DepthProvider } from "../index.js";
import {
  createImageAsset,
  validateAsset,
  type DepthAsset,
  type Dimensions,
  type ImageAsset,
} from "@atlas/shared";

const DIMS: Dimensions = { width: 320, height: 240 };
const FIXED_ID = "image-id-12345";

function makeImage(id = FIXED_ID, dimensions = DIMS): ImageAsset {
  return createImageAsset({ mimeType: "image/png", dimensions, id });
}

describe("MockDepthProvider", () => {
  it("implements the DepthProvider interface", () => {
    const provider: DepthProvider = createMockDepthProvider();
    expect(provider.name).toBe("mock");
    expect(typeof provider.generate).toBe("function");
  });

  it("is constructable directly as a class", () => {
    const provider = new MockDepthProvider();
    expect(provider.name).toBe("mock");
  });

  it("produces a DepthAsset with matching dimensions", async () => {
    const provider = createMockDepthProvider();
    const image = makeImage();

    const depth = await provider.generate(image);

    expect(depth.type).toBe("depth");
    expect(depth.dimensions).toEqual(DIMS);
    expect(depth.mimeType).toBe("application/octet-stream");
  });

  it("produces deterministic output for the same image id", async () => {
    const provider = createMockDepthProvider();
    const a = makeImage("abc-001");
    const b = makeImage("abc-001");

    const depthA = await provider.generate(a);
    const depthB = await provider.generate(b);

    expect(depthA.metadata["minDepth"]).toEqual(depthB.metadata["minDepth"]);
    expect(depthA.metadata["maxDepth"]).toEqual(depthB.metadata["maxDepth"]);
    expect(depthA.metadata["meanDepth"]).toEqual(depthB.metadata["meanDepth"]);
  });

  it("produces different metadata for different image ids", async () => {
    const provider = createMockDepthProvider();
    const a = makeImage("image-A-001");
    const b = makeImage("image-B-001");

    // Deterministic hash should differ → at least one statistic differs.
    const depthA = await provider.generate(a);
    const depthB = await provider.generate(b);

    const minA = Number(depthA.metadata["minDepth"]);
    const maxA = Number(depthA.metadata["maxDepth"]);
    const minB = Number(depthB.metadata["minDepth"]);
    const maxB = Number(depthB.metadata["maxDepth"]);
    const statsA = `${String(minA)}|${String(maxA)}`;
    const statsB = `${String(minB)}|${String(maxB)}`;
    expect(statsA).not.toBe(statsB);
  });

  it("produces a validatable DepthAsset", async () => {
    const provider = createMockDepthProvider();
    const image = makeImage();
    const depth: DepthAsset = await provider.generate(image);

    const result = validateAsset(depth);
    expect(result.ok).toBe(true);
  });

  it("records the source image id in metadata", async () => {
    const provider = createMockDepthProvider();
    const image = makeImage("source-id-42");
    const depth = await provider.generate(image);

    expect(depth.metadata["sourceImageId"]).toBe("source-id-42");
    expect(depth.metadata["provider"]).toBe("mock");
  });

  it("records depth statistics that are numbers", async () => {
    const provider = createMockDepthProvider();
    const image = makeImage();
    const depth = await provider.generate(image);

    expect(typeof depth.metadata["minDepth"]).toBe("number");
    expect(typeof depth.metadata["maxDepth"]).toBe("number");
    expect(typeof depth.metadata["meanDepth"]).toBe("number");
    expect(depth.metadata["minDepth"] as number).toBeLessThan(depth.metadata["maxDepth"] as number);
  });

  it("returns an immutable (frozen) DepthAsset", async () => {
    const provider = createMockDepthProvider();
    const depth = await provider.generate(makeImage());

    expect(Object.isFrozen(depth)).toBe(true);
    expect(Object.isFrozen(depth.metadata)).toBe(true);
    expect(Object.isFrozen(depth.dimensions)).toBe(true);
  });

  it("adapts to varying image dimensions", async () => {
    const provider = createMockDepthProvider();
    const small = makeImage("s", { width: 64, height: 64 });
    const large = makeImage("l", { width: 1920, height: 1080 });

    const depthSmall = await provider.generate(small);
    const depthLarge = await provider.generate(large);

    expect(depthSmall.dimensions).toEqual({ width: 64, height: 64 });
    expect(depthLarge.dimensions).toEqual({ width: 1920, height: 1080 });
  });
});
