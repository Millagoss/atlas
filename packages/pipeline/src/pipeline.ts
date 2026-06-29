import type {
  PipelineStage,
  PipelineContext,
  PipelineResult,
  PipelineEventType,
  PipelineEventListener,
  PipelineLogger,
  PipelineProgressCallback,
  PipelineOptions,
} from "./types.js";
import { noopLogger } from "./logger.js";

export class Pipeline<TContext extends PipelineContext = PipelineContext> {
  private stages: PipelineStage<TContext>[] = [];
  private listeners = new Map<PipelineEventType, Set<PipelineEventListener>>();
  private logger: PipelineLogger;
  private progressCallback?: PipelineProgressCallback;
  private abortController?: AbortController;

  constructor(options?: PipelineOptions<TContext>) {
    this.logger = options?.logger ?? noopLogger;
    if (options?.stages) {
      this.stages = [...options.stages];
    }
  }

  addStage(stage: PipelineStage<TContext>): this {
    this.stages.push(stage);
    return this;
  }

  removeStage(name: string): this {
    this.stages = this.stages.filter((s) => s.name !== name);
    return this;
  }

  getStages(): readonly PipelineStage<TContext>[] {
    return this.stages;
  }

  on(event: PipelineEventType, listener: PipelineEventListener): this {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);
    return this;
  }

  off(event: PipelineEventType, listener: PipelineEventListener): this {
    this.listeners.get(event)?.delete(listener);
    return this;
  }

  setLogger(logger: PipelineLogger): this {
    this.logger = logger;
    return this;
  }

  onProgress(callback: PipelineProgressCallback): this {
    this.progressCallback = callback;
    return this;
  }

  cancel(): void {
    this.abortController?.abort();
    this.emit("pipeline:cancelled");
  }

  async execute(initialContext: TContext): Promise<PipelineResult<TContext>> {
    let context = initialContext;
    const completedStages: string[] = [];
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.logger.info("Pipeline execution started", {
      stageCount: this.stages.length,
    });
    this.emit("pipeline:started", { stageCount: this.stages.length });

    for (let i = 0; i < this.stages.length; i++) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- loop index is bounded by length
      const stage = this.stages[i]!;

      if (signal.aborted) {
        this.logger.warn("Pipeline cancelled before stage", {
          stage: stage.name,
        });
        return {
          success: false,
          context,
          error: {
            stage: stage.name,
            message: "Pipeline was cancelled",
          },
          completedStages,
        };
      }

      this.emitProgress(stage.name, i, this.stages.length);
      this.logger.info(`Stage started: ${stage.name}`);
      this.emit("stage:started", { stage: stage.name });

      try {
        context = await stage.execute(context, signal);
        completedStages.push(stage.name);
        this.logger.info(`Stage completed: ${stage.name}`);
        this.emit("stage:completed", { stage: stage.name });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error in stage";
        this.logger.error(`Stage failed: ${stage.name}`, { error: message });
        this.emit("stage:failed", { stage: stage.name, error: message });

        return {
          success: false,
          context,
          error: {
            stage: stage.name,
            message,
            cause: err,
          },
          completedStages,
        };
      }
    }

    this.logger.info("Pipeline execution completed", {
      completedStages,
    });
    this.emit("pipeline:completed", { completedStages });

    return {
      success: true,
      context,
      completedStages,
    };
  }

  private emit(type: PipelineEventType, data?: unknown): void {
    const event = {
      type,
      stage: undefined as string | undefined,
      timestamp: Date.now(),
      data,
    };

    if (data != null && typeof data === "object" && "stage" in data) {
      event.stage = (data as { stage: string }).stage;
    }

    this.listeners.get(type)?.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // Prevent listener errors from breaking the pipeline
      }
    });
  }

  private emitProgress(stageName: string, stageIndex: number, totalStages: number): void {
    if (!this.progressCallback) return;
    this.progressCallback({
      currentStage: stageName,
      stageIndex,
      totalStages,
      percentage: totalStages > 0 ? Math.round(((stageIndex + 1) / totalStages) * 100) : 100,
    });
  }
}
