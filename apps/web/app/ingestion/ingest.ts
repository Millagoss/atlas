// app/ingestion/ingest — End-to-end image ingestion orchestrator.
//
// The orchestrator wires the discrete ingestion steps together:
//
//   File → validate → extract metadata → create ImageAsset → register
//        → submit to Pipeline → report lifecycle logs
//
// It is framework-independent and synchronous-friendly in its pure parts; the
// only async boundary is metadata extraction. All browser concerns live behind
// the injectable {@link ImageMetadataExtractor}, so the orchestrator can be
// fully unit-tested with a fake extractor and no DOM.

import {
  createImageAsset,
  type AtlasResult,
  type DepthAsset,
  type ImageAsset,
  type SpatialScene,
} from "@atlas/shared";
import { createPipelineContext, type Pipeline } from "@atlas/pipeline";
import type { AssetRegistry } from "@atlas/shared";

import {
  DEPTH_ASSET_CONTEXT_KEY,
  IMAGE_ASSET_CONTEXT_KEY,
  SPATIAL_SCENE_CONTEXT_KEY,
} from "./constants.js";
import type { ImageMetadataExtractor } from "./extract.js";
import type { ImageFileInput } from "./validate.js";
import { validateImageFile } from "./validate.js";

/** Severity levels mirroring the sandbox log entries. */
export type IngestionLogLevel = "info" | "warn" | "error";

/** A minimal logger the orchestrator calls for lifecycle events. */
export interface IngestionLogger {
  log(level: IngestionLogLevel, message: string): void;
}

/** Dependencies injected into {@link ingestImage}. */
export interface IngestionDeps {
  readonly registry: AssetRegistry;
  readonly pipeline: Pipeline;
  readonly extractor: ImageMetadataExtractor;
  readonly logger: IngestionLogger;
}

/** Successful ingestion result: the immutable assets produced by the pipeline. */
export interface IngestionSuccess {
  readonly asset: ImageAsset;
  readonly previewUrl: string;
  readonly depth: DepthAsset;
  readonly scene: SpatialScene;
}

export type IngestionOutcome = AtlasResult<IngestionSuccess>;

/**
 * Run the full ingestion workflow for a single image file.
 *
 * Emits lifecycle logs (File Selected → Validation Passed → ImageAsset Created
 * → Asset Registered → Pipeline Started → Pipeline Completed/Failed) via the
 * supplied logger. Never throws on bad user input: all failures are returned as
 * `AtlasResult` errors with descriptive messages.
 */
export async function ingestImage(file: File, deps: IngestionDeps): Promise<IngestionOutcome> {
  const { registry, pipeline, extractor, logger } = deps;

  logger.log("info", `File Selected: ${(file as ImageFileInput).name}`);

  // 1. Validate.
  const validation = validateImageFile(file);
  if (!validation.ok) {
    logger.log("error", `Validation Failed: ${validation.error.message}`);
    return validation;
  }
  logger.log("info", "Validation Passed");

  // 2. Extract metadata (dimensions + preview).
  const extracted = await extractor.extract(file);
  if (!extracted.ok) {
    logger.log("error", `Metadata Extraction Failed: ${extracted.error.message}`);
    return extracted;
  }

  const { dimensions, previewUrl } = extracted.data;

  // 3. Create an immutable ImageAsset, populating metadata useful downstream.
  const asset = createImageAsset({
    mimeType: file.type,
    dimensions,
    metadata: {
      filename: file.name,
      fileSize: file.size,
    },
  });
  logger.log("info", `ImageAsset Created: ${asset.id}`);

  // 4. Register in the Asset Registry.
  registry.register(asset);
  logger.log("info", "Asset Registered");

  // 5. Submit to the pipeline via the shared context.
  const context = createPipelineContext();
  context.set(IMAGE_ASSET_CONTEXT_KEY, asset);

  logger.log("info", "Pipeline Started");
  const result = await pipeline.execute(context);

  if (!result.success) {
    const message = result.error?.message ?? "Pipeline failed";
    logger.log("error", `Pipeline Failed: ${message}`);
    return { ok: false, error: { code: "PIPELINE_FAILED", message } };
  }

  const depth = context.get<DepthAsset>(DEPTH_ASSET_CONTEXT_KEY);
  const scene = context.get<SpatialScene>(SPATIAL_SCENE_CONTEXT_KEY);

  if (!depth || !scene) {
    const message = "Pipeline completed but did not produce a depth or scene asset";
    logger.log("error", `Pipeline Incomplete: ${message}`);
    return { ok: false, error: { code: "PIPELINE_INCOMPLETE", message } };
  }

  logger.log("info", `Pipeline Completed (${String(result.completedStages.length)} stages)`);
  logger.log("info", `SpatialScene Created: ${scene.id}`);
  return { ok: true, data: { asset, previewUrl, depth, scene } };
}
