// @atlas/shared/assets — Core Asset System: the canonical data model for every
// Atlas pipeline stage.

export type {
  Asset,
  AssetType,
  AssetMetadata,
  Dimensions,
  ImageAsset,
  ProcessedImageAsset,
  DepthAsset,
  AnyAsset,
  AssetInitOptions,
  DimensionedAssetInitOptions,
} from "./types.js";

export { createImageAsset, createProcessedImageAsset, createDepthAsset } from "./factories.js";

export { validateAsset } from "./validation.js";

export { serializeAsset, deserializeAsset } from "./serialization.js";
