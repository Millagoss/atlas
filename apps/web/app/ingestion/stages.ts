// app/ingestion/stages — Pipeline stages wiring the spatial transformation chain.
//
//   ImageAsset → DepthAsset → SpatialScene
//
// C05 replaces the C04 placeholder stages with real transformations that
// delegate to a {@link DepthProvider} and a {@link SpatialSceneBuilder}. The
// stages are closures over those dependencies so the pipeline stays pure and
// testable: the stages only read/write assets through the pipeline context.

import { Pipeline, type PipelineStage } from "@atlas/pipeline";
import type { DepthProvider } from "@atlas/ai-engine";
import type { SpatialSceneBuilder } from "@atlas/scene-engine";
import type { DepthAsset, ImageAsset } from "@atlas/shared";

import {
  DEPTH_ASSET_CONTEXT_KEY,
  IMAGE_ASSET_CONTEXT_KEY,
  SPATIAL_SCENE_CONTEXT_KEY,
} from "./constants.js";

/**
 * Marker stage that represents the point where the ingested {@link ImageAsset}
 * enters the pipeline. It does not transform anything; it anchors the
 * canonical transformation order so the pipeline log reflects the real flow.
 */
export const ingestImageStage: PipelineStage = {
  name: "ingest-image",
  execute: (ctx) => Promise.resolve(ctx),
};

/**
 * Create the depth-generation stage. Reads the {@link ImageAsset} from the
 * context, calls the {@link DepthProvider}, and stores the resulting
 * {@link DepthAsset} under {@link DEPTH_ASSET_CONTEXT_KEY}.
 */
export function createGenerateDepthStage(provider: DepthProvider): PipelineStage {
  return {
    name: "generate-depth",
    execute: async (ctx) => {
      const image = ctx.get<ImageAsset>(IMAGE_ASSET_CONTEXT_KEY);
      if (image) {
        const depth = await provider.generate(image);
        ctx.set(DEPTH_ASSET_CONTEXT_KEY, depth);
      }
      return ctx;
    },
  };
}

/**
 * Create the spatial-scene builder stage. Reads the {@link ImageAsset} and
 * {@link DepthAsset} from the context, calls the {@link SpatialSceneBuilder},
 * and stores the resulting {@link SpatialScene} under
 * {@link SPATIAL_SCENE_CONTEXT_KEY}.
 */
export function createBuildSpatialSceneStage(builder: SpatialSceneBuilder): PipelineStage {
  return {
    name: "build-spatial-scene",
    execute: async (ctx) => {
      const image = ctx.get<ImageAsset>(IMAGE_ASSET_CONTEXT_KEY);
      const depth = ctx.get<DepthAsset>(DEPTH_ASSET_CONTEXT_KEY);
      if (image && depth) {
        const scene = await builder.build(image, depth);
        ctx.set(SPATIAL_SCENE_CONTEXT_KEY, scene);
      }
      return ctx;
    },
  };
}

/**
 * Dependencies required to build the ingestion pipeline.
 */
export interface IngestionPipelineDeps {
  readonly depthProvider: DepthProvider;
  readonly sceneBuilder: SpatialSceneBuilder;
}

/**
 * Build the ingestion pipeline with real depth + scene stages, registered in
 * the canonical Atlas transformation order.
 */
export function createIngestionPipeline(deps: IngestionPipelineDeps): Pipeline {
  return new Pipeline({
    stages: [
      ingestImageStage,
      createGenerateDepthStage(deps.depthProvider),
      createBuildSpatialSceneStage(deps.sceneBuilder),
    ],
  });
}
