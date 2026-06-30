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
