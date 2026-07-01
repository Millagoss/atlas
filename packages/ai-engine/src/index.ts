// @atlas/ai-engine — AI inference, model management, and depth estimation.

export const ENGINE_NAME = "@atlas/ai-engine" as const;

export interface AiEngineConfig {
  /** Model identifier for inference. */
  model: string;
}

export function createAiEngine(_config: AiEngineConfig): void {
  // Future: Initialize AI models and inference pipelines.
}

export type { DepthProvider } from "./depth.js";
export { MockDepthProvider, createMockDepthProvider } from "./depth.js";

export type {
  DepthAnythingProviderOptions,
  DepthAnythingProviderState,
  ModelStatus,
} from "./depth-anything/provider.js";
export { DepthAnythingProvider, createDepthAnythingProvider } from "./depth-anything/provider.js";
export { DEFAULT_DEPTH_MODEL, IMAGE_PREVIEW_URL_METADATA_KEY } from "./depth-anything/constants.js";
export type { DepthModelConfig } from "./depth-anything/session.js";
export { getDefaultModelConfig } from "./depth-anything/session.js";
