// @atlas/shared/assets/types — Canonical asset type contracts for the Atlas pipeline.
//
// Assets are the lingua franca of the platform. Every pipeline stage consumes
// and produces well-defined assets rather than raw browser objects (File, Blob,
// ImageBitmap, ...). These contracts intentionally describe *data* only: they
// carry no decoding, storage, rendering, or browser-API concerns.
//
// All asset fields are `readonly`. Assets are immutable by contract and are
// deep-frozen by their factories (see `factories.ts`).

/**
 * Discriminator for the different asset kinds.
 *
 * Future stages will extend this union with additional kinds such as
 * `"spatial-scene"`, `"runtime-scene"`, `"mesh"`, and `"texture"`. Those asset
 * models are intentionally NOT implemented yet.
 */
export type AssetType = "image" | "processed-image" | "depth";

/**
 * Free-form metadata record. This is the extension point pipeline stages use to
 * attach stage-specific data (processing parameters, lineage, depth statistics,
 * ...) without bloating the base schema.
 */
export type AssetMetadata = Readonly<Record<string, unknown>>;

/**
 * Base contract shared by every Atlas asset.
 *
 * Fields are chosen to be genuinely useful for future pipeline stages without
 * over-designing the schema:
 * - `id` — stable unique identifier (UUID v7 recommended via `generateId`).
 * - `type` — discriminator used by validators and downstream stages.
 * - `createdAt` — creation timestamp in ISO 8601.
 * - `mimeType` — original media type of the underlying data.
 * - `metadata` — open extension point for stage-specific information.
 */
export interface Asset {
  /** Unique identifier (UUID). */
  readonly id: string;
  /** Asset kind discriminator. */
  readonly type: AssetType;
  /** Creation timestamp (ISO 8601). */
  readonly createdAt: string;
  /** Media type of the underlying data, e.g. `image/png`. */
  readonly mimeType: string;
  /** Open extension point for stage-specific metadata. */
  readonly metadata: AssetMetadata;
}

/** Pixel / sample dimensions for image-like assets. */
export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/**
 * Raw image input — typically the first asset produced in the pipeline
 * (e.g. from an uploaded file). Decoding is deliberately out of scope.
 */
export interface ImageAsset extends Asset {
  readonly type: "image";
  /** Pixel dimensions of the source image. */
  readonly dimensions: Dimensions;
}

/**
 * Normalized / preprocessed image produced by an image-processing stage.
 * Carries the same shape as `ImageAsset` but is semantically a distinct stage
 * output that downstream depth-estimation stages depend on.
 */
export interface ProcessedImageAsset extends Asset {
  readonly type: "processed-image";
  /** Pixel dimensions of the processed image. */
  readonly dimensions: Dimensions;
}

/**
 * Per-pixel depth estimate produced by a depth-estimation stage. The depth
 * buffer itself is owned by a future storage/loader layer; this asset describes
 * its shape and metadata only.
 */
export interface DepthAsset extends Asset {
  readonly type: "depth";
  /** Dimensions of the depth map (rows = height, columns = width). */
  readonly dimensions: Dimensions;
}

/**
 * Union of all currently implemented asset kinds. Downstream stages typing their
 * inputs/outputs should prefer this union (or a specific member) so the
 * compiler tracks the full set of supported assets.
 */
export type AnyAsset = ImageAsset | ProcessedImageAsset | DepthAsset;

/**
 * Shared input options for asset factories. `id` and `createdAt` default to a
 * freshly generated UUID and the current time respectively when omitted.
 */
export interface AssetInitOptions {
  /** Override the auto-generated id. */
  readonly id?: string;
  /** Override the auto-generated ISO 8601 timestamp. */
  readonly createdAt?: string;
  /** Media type of the underlying data. */
  readonly mimeType: string;
  /** Stage-specific metadata. Defaults to an empty record. */
  readonly metadata?: AssetMetadata;
}

/** Input options for image-like assets that carry pixel dimensions. */
export interface DimensionedAssetInitOptions extends AssetInitOptions {
  /** Pixel dimensions. */
  readonly dimensions: Dimensions;
}
