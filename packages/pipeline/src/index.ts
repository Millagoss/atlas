// @atlas/pipeline — Core pipeline framework for sequential data processing.

export { Pipeline } from "./pipeline.js";
export { createPipelineContext } from "./context.js";
export { ConsoleLogger, noopLogger } from "./logger.js";

export type {
  PipelineStage,
  PipelineContext,
  PipelineResult,
  PipelineError,
  PipelineEventType,
  PipelineEvent,
  PipelineEventListener,
  PipelineLogger,
  PipelineProgress,
  PipelineProgressCallback,
  PipelineOptions,
} from "./types.js";
