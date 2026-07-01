import type { DepthAsset, ImageAsset } from "@atlas/shared";
import { createDepthAsset } from "@atlas/shared";
import type { DepthProvider } from "../depth.js";

import { IMAGE_PREVIEW_URL_METADATA_KEY, MODEL_INPUT_SIZE } from "./constants.js";
import { loadRgbaFromUrl } from "./image.js";
import { createConsoleDepthLogger, type DepthInferenceLogger } from "./logger.js";
import {
  computeDepthStatistics,
  depthMapToPreviewDataUrl,
  resizeDepthMap,
  validateDepthOutput,
} from "./postprocess.js";
import { rgbaToNchwTensor } from "./preprocess.js";
import {
  getDefaultModelConfig,
  getOrCreateDepthSession,
  type DepthModelConfig,
  type DepthOnnxSession,
  type ExecutionBackend,
} from "./session.js";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export interface DepthAnythingProviderOptions {
  readonly model?: DepthModelConfig;
  readonly logger?: DepthInferenceLogger;
  readonly loadImage?: typeof loadRgbaFromUrl;
  readonly getSession?: (
    model: DepthModelConfig,
    logger: DepthInferenceLogger,
  ) => Promise<DepthOnnxSession>;
}

export interface DepthAnythingProviderState {
  readonly modelStatus: ModelStatus;
  readonly executionBackend: ExecutionBackend | null;
  readonly lastInferenceDurationMs: number | null;
  readonly lastInferenceError: string | null;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function fallbackDepthAsset(
  image: ImageAsset,
  error: string,
  extra: Record<string, unknown> = {},
): DepthAsset {
  return createDepthAsset({
    mimeType: "application/octet-stream",
    dimensions: image.dimensions,
    metadata: {
      sourceImageId: image.id,
      provider: "depth-anything-v2",
      minDepth: 0,
      maxDepth: 0,
      meanDepth: 0,
      modelStatus: "error",
      inferenceError: error,
      ...extra,
    },
  });
}

/**
 * Browser ONNX depth provider using Depth Anything V2 Small.
 *
 * Loads the model lazily, caches the session, and produces a canonical
 * {@link DepthAsset} with depth statistics and an optional grayscale preview.
 */
export class DepthAnythingProvider implements DepthProvider {
  readonly name = "depth-anything-v2";

  private modelStatus: ModelStatus = "idle";
  private executionBackend: ExecutionBackend | null = null;
  private lastInferenceDurationMs: number | null = null;
  private lastInferenceError: string | null = null;

  private readonly model: DepthModelConfig;
  private readonly logger: DepthInferenceLogger;
  private readonly loadImage: typeof loadRgbaFromUrl;
  private readonly getSession: (
    model: DepthModelConfig,
    logger: DepthInferenceLogger,
  ) => Promise<DepthOnnxSession>;

  constructor(options: DepthAnythingProviderOptions = {}) {
    this.model = options.model ?? getDefaultModelConfig();
    this.logger = options.logger ?? createConsoleDepthLogger();
    this.loadImage = options.loadImage ?? loadRgbaFromUrl;
    this.getSession = options.getSession ?? getOrCreateDepthSession;
  }

  getState(): DepthAnythingProviderState {
    return {
      modelStatus: this.modelStatus,
      executionBackend: this.executionBackend,
      lastInferenceDurationMs: this.lastInferenceDurationMs,
      lastInferenceError: this.lastInferenceError,
    };
  }

  async generate(image: ImageAsset): Promise<DepthAsset> {
    const previewUrl = image.metadata[IMAGE_PREVIEW_URL_METADATA_KEY];
    if (typeof previewUrl !== "string" || previewUrl.length === 0) {
      const message = "ImageAsset is missing previewUrl metadata required for inference";
      this.lastInferenceError = message;
      this.logger.log("error", `Inference failed: ${message}`);
      return fallbackDepthAsset(image, message, { modelStatus: this.modelStatus });
    }

    const start = performance.now();
    this.lastInferenceError = null;
    this.logger.log("info", "Inference started");

    try {
      this.modelStatus = "loading";
      const session = await this.getSession(this.model, this.logger);
      this.modelStatus = "ready";
      this.executionBackend = session.backend;
      this.logger.log("info", `Execution backend: ${session.backend}`);

      const rgba = await this.loadImage(previewUrl);
      const tensor = rgbaToNchwTensor(rgba, MODEL_INPUT_SIZE);
      const output = await session.run(
        tensor,
        [1, 3, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE],
        MODEL_INPUT_SIZE,
        MODEL_INPUT_SIZE,
      );

      const validationError = validateDepthOutput(output.values);
      if (validationError) {
        throw new Error(validationError);
      }

      const resized = resizeDepthMap(
        output.values,
        output.width,
        output.height,
        image.dimensions.width,
        image.dimensions.height,
      );
      const stats = computeDepthStatistics(resized);
      const preview = depthMapToPreviewDataUrl(
        resized,
        image.dimensions.width,
        image.dimensions.height,
      );

      this.lastInferenceDurationMs = round3(performance.now() - start);
      this.logger.log("info", "Inference completed");

      return createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: image.dimensions,
        metadata: {
          sourceImageId: image.id,
          provider: this.name,
          minDepth: stats.minDepth,
          maxDepth: stats.maxDepth,
          meanDepth: stats.meanDepth,
          modelStatus: "ready",
          executionBackend: session.backend,
          inferenceDurationMs: this.lastInferenceDurationMs,
          depthPreviewUrl: preview,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown inference error";
      this.modelStatus = "error";
      this.lastInferenceError = message;
      this.lastInferenceDurationMs = round3(performance.now() - start);
      this.logger.log("error", `Inference failed: ${message}`);
      return fallbackDepthAsset(image, message, {
        modelStatus: "error",
        executionBackend: this.executionBackend,
        inferenceDurationMs: this.lastInferenceDurationMs,
      });
    }
  }
}

export function createDepthAnythingProvider(options?: DepthAnythingProviderOptions): DepthProvider {
  return new DepthAnythingProvider(options);
}
