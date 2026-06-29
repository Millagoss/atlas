export interface PipelineStage<TContext = PipelineContext> {
  readonly name: string;
  execute(context: TContext, signal?: AbortSignal): Promise<TContext>;
}

export interface PipelineContext {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- generic getter is the standard Map-like API
  get<T = unknown>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  entries(): IterableIterator<[string, unknown]>;
}

export interface PipelineResult<TContext = PipelineContext> {
  success: boolean;
  context: TContext;
  error?: PipelineError;
  completedStages: string[];
}

export interface PipelineError {
  stage: string;
  message: string;
  cause?: unknown;
}

export type PipelineEventType =
  | "pipeline:started"
  | "pipeline:completed"
  | "stage:started"
  | "stage:completed"
  | "stage:failed"
  | "pipeline:cancelled";

export interface PipelineEvent {
  type: PipelineEventType;
  stage?: string;
  timestamp: number;
  data?: unknown;
}

export type PipelineEventListener = (event: PipelineEvent) => void;

export interface PipelineLogger {
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export interface PipelineProgress {
  currentStage: string;
  stageIndex: number;
  totalStages: number;
  percentage: number;
}

export type PipelineProgressCallback = (progress: PipelineProgress) => void;

export interface PipelineOptions<TContext = PipelineContext> {
  stages?: PipelineStage<TContext>[];
  logger?: PipelineLogger;
}
