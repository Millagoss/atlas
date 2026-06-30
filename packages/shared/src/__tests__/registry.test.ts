import { describe, it, expect } from "vitest";
import { AssetRegistry, createImageAsset, createDepthAsset, type AnyAsset } from "../index.js";

const PNG = "image/png";
const DIMS = { width: 100, height: 100 } as const;

function makeImage(idSuffix = ""): AnyAsset {
  return createImageAsset({
    mimeType: PNG,
    dimensions: DIMS,
    id: idSuffix ? `id-${idSuffix}` : undefined,
    metadata: { filename: `photo-${idSuffix}.png` },
  });
}

describe("AssetRegistry", () => {
  it("starts empty", () => {
    const registry = new AssetRegistry();
    expect(registry.size()).toBe(0);
    expect(registry.all()).toHaveLength(0);
  });

  it("register stores an asset and returns it", () => {
    const registry = new AssetRegistry();
    const image = makeImage();
    const returned = registry.register(image);

    expect(returned).toBe(image);
    expect(registry.size()).toBe(1);
    expect(registry.has(image.id)).toBe(true);
  });

  it("register replaces an asset with the same id", () => {
    const registry = new AssetRegistry();
    const first = createImageAsset({ mimeType: PNG, dimensions: DIMS, id: "fixed-id" });
    const second = createImageAsset({
      mimeType: PNG,
      dimensions: { width: 50, height: 50 },
      id: "fixed-id",
      metadata: { note: "replacement" },
    });

    registry.register(first);
    registry.register(second);

    expect(registry.size()).toBe(1);
    expect(registry.get("fixed-id")).toBe(second);
    expect(registry.get("fixed-id")?.metadata["note"]).toBe("replacement");
  });

  it("get returns undefined for unknown ids", () => {
    const registry = new AssetRegistry();
    expect(registry.get("missing")).toBeUndefined();
    expect(registry.has("missing")).toBe(false);
  });

  it("remove deletes an asset", () => {
    const registry = new AssetRegistry();
    const image = makeImage();
    registry.register(image);

    expect(registry.remove(image.id)).toBe(true);
    expect(registry.has(image.id)).toBe(false);
    expect(registry.size()).toBe(0);
  });

  it("remove returns false for unknown ids", () => {
    const registry = new AssetRegistry();
    expect(registry.remove("missing")).toBe(false);
  });

  it("clear empties the registry", () => {
    const registry = new AssetRegistry();
    registry.register(makeImage("1"));
    registry.register(makeImage("2"));

    registry.clear();

    expect(registry.size()).toBe(0);
    expect(registry.all()).toHaveLength(0);
  });

  it("all returns a snapshot in insertion order", () => {
    const registry = new AssetRegistry();
    const a = registry.register(makeImage("1"));
    const b = registry.register(makeImage("2"));

    const snapshot = registry.all();
    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]).toBe(a);
    expect(snapshot[1]).toBe(b);
  });

  it("query filters by predicate", () => {
    const registry = new AssetRegistry();
    const image = registry.register(createImageAsset({ mimeType: PNG, dimensions: DIMS }));
    const depth = registry.register(
      createDepthAsset({ mimeType: "application/octet-stream", dimensions: DIMS }),
    );

    const images = registry.query((asset) => asset.type === "image");

    expect(images).toEqual([image]);
    expect(images).not.toContain(depth);
  });

  it("getByType returns assets of a single type", () => {
    const registry = new AssetRegistry();
    registry.register(createImageAsset({ mimeType: PNG, dimensions: DIMS }));
    registry.register(createImageAsset({ mimeType: "image/webp", dimensions: DIMS }));
    registry.register(createDepthAsset({ mimeType: "application/octet-stream", dimensions: DIMS }));

    expect(registry.getByType("image")).toHaveLength(2);
    expect(registry.getByType("depth")).toHaveLength(1);
    expect(registry.getByType("processed-image")).toHaveLength(0);
  });

  it("returns a fresh snapshot array on each call", () => {
    const registry = new AssetRegistry();
    registry.register(makeImage());

    const first = registry.all();
    const second = registry.all();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
    expect(registry.size()).toBe(1);
  });
});
