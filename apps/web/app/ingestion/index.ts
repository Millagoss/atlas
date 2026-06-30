// app/ingestion — Image ingestion workflow: File → ImageAsset → Registry → Pipeline.

export {
  SUPPORTED_IMAGE_TYPES,
  MAX_IMAGE_FILE_SIZE,
  IMAGE_ASSET_CONTEXT_KEY,
} from "./constants.js";
export type { SupportedImageType } from "./constants.js";

export { validateImageFile } from "./validate.js";
export type { ImageFileInput, ImageFileError } from "./validate.js";

export { createBrowserImageExtractor } from "./extract.js";
export type { ExtractedImageMeta, ImageMetadataExtractor } from "./extract.js";

export {
  createIngestionPipeline,
  ingestImageStage,
  normalizeImageStage,
  estimateDepthStage,
} from "./stages.js";

export { ingestImage } from "./ingest.js";
export type {
  IngestionLogger,
  IngestionLogLevel,
  IngestionDeps,
  IngestionSuccess,
  IngestionOutcome,
} from "./ingest.js";
