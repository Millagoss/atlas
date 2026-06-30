// app/ingestion/constants — Shared constants for the image ingestion workflow.

/**
 * MIME types accepted by the ingestion workflow.
 *
 * Kept as a readonly tuple so it is both exhaustive (for type narrowing) and
 * iterable (for building lookup sets).
 */
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedImageType = (typeof SUPPORTED_IMAGE_TYPES)[number];

/** Lookup set for O(1) membership checks. */
export const SUPPORTED_IMAGE_TYPE_SET: ReadonlySet<string> = new Set(SUPPORTED_IMAGE_TYPES);

/**
 * Maximum accepted file size. 25 MiB is a reasonable default for source images
 * and keeps ingestion responsive without streaming support.
 */
export const MAX_IMAGE_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Key under which the ingested {@link ImageAsset} is stored in the
 * {@link PipelineContext} so downstream stages can retrieve it.
 */
export const IMAGE_ASSET_CONTEXT_KEY = "imageAsset";

/** Key under which the {@link DepthAsset} produced by the depth stage is stored. */
export const DEPTH_ASSET_CONTEXT_KEY = "depthAsset";

/** Key under which the {@link SpatialScene} produced by the scene stage is stored. */
export const SPATIAL_SCENE_CONTEXT_KEY = "spatialScene";
