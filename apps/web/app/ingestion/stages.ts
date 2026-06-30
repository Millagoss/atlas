// app/ingestion/stages — Placeholder pipeline stages for the ingestion pipeline.
//
// C04 establishes the end-to-end pipeline *plumbing* only: no image
// enhancement, depth estimation, or rendering is implemented. These no-op
// stages keep the pipeline contract intact (each stage consumes/produces a
// context) while future capabilities replace them with real transformations.

import { Pipeline, type PipelineStage } from "@atlas/pipeline";

/**
 * Placeholder stage that marks the point where the ingested {@link ImageAsset}
 * enters the pipeline. It does not transform anything; it only anchors the
 * canonical transformation order so the pipeline log reflects the eventual
 * real flow even while stages are no-ops.
 */
export const ingestImageStage: PipelineStage = {
  name: "ingest-image",
  execute: (ctx) => Promise.resolve(ctx),
};

/**
 * Placeholder for the future image-normalization stage. Real implementation
 * (out of scope here) will produce a `ProcessedImageAsset`.
 */
export const normalizeImageStage: PipelineStage = {
  name: "normalize-image",
  execute: (ctx) => Promise.resolve(ctx),
};

/**
 * Placeholder for the future depth-estimation stage. Real implementation will
 * produce a `DepthAsset`.
 */
export const estimateDepthStage: PipelineStage = {
  name: "estimate-depth",
  execute: (ctx) => Promise.resolve(ctx),
};

/**
 * Build the ingestion pipeline with the full set of placeholder stages,
 * registered in the canonical Atlas transformation order.
 */
export function createIngestionPipeline(): Pipeline {
  return new Pipeline({ stages: [ingestImageStage, normalizeImageStage, estimateDepthStage] });
}
