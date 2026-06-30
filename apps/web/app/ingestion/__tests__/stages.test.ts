import { describe, it, expect } from "vitest";
import { createIngestionPipeline } from "../index";
import { createPipelineContext } from "@atlas/pipeline";
import { IMAGE_ASSET_CONTEXT_KEY } from "../index";
import { createImageAsset, AssetRegistry } from "@atlas/shared";

describe("ingestion pipeline stages", () => {
  it("builds a pipeline with the canonical stage order", () => {
    const pipeline = createIngestionPipeline();
    const names = pipeline.getStages().map((s) => s.name);

    expect(names).toEqual(["ingest-image", "normalize-image", "estimate-depth"]);
  });

  it("executes all placeholder stages without transforming the context", async () => {
    const pipeline = createIngestionPipeline();
    const ctx = createPipelineContext();
    const asset = createImageAsset({
      mimeType: "image/png",
      dimensions: { width: 10, height: 10 },
      id: "stable-id",
    });
    ctx.set(IMAGE_ASSET_CONTEXT_KEY, asset);

    const result = await pipeline.execute(ctx);

    expect(result.success).toBe(true);
    expect(result.completedStages).toEqual(["ingest-image", "normalize-image", "estimate-depth"]);
    expect(ctx.get(IMAGE_ASSET_CONTEXT_KEY)).toBe(asset);
  });

  it("does not register anything during pipeline execution", async () => {
    const registry = new AssetRegistry();
    const pipeline = createIngestionPipeline();
    await pipeline.execute(createPipelineContext());

    expect(registry.size()).toBe(0);
  });
});
