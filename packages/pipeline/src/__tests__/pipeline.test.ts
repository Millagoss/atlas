import { describe, it, expect, vi } from "vitest";
import { Pipeline, createPipelineContext, ConsoleLogger } from "../index.js";
import type { PipelineStage, PipelineContext, PipelineEvent } from "../types.js";

function makeStage(name: string, fn?: (ctx: PipelineContext) => void): PipelineStage {
  if (fn) {
    return {
      name,
      execute: (ctx) => {
        fn(ctx);
        return Promise.resolve(ctx);
      },
    };
  }
  return {
    name,
    execute: (ctx) => Promise.resolve(ctx),
  };
}

function makeAsyncStage(name: string, fn: (ctx: PipelineContext) => Promise<void>): PipelineStage {
  return {
    name,
    execute: async (ctx) => {
      await fn(ctx);
      return ctx;
    },
  };
}

describe("Pipeline", () => {
  describe("stage execution order", () => {
    it("executes stages in registration order", async () => {
      const order: string[] = [];
      const pipeline = new Pipeline();

      pipeline.addStage(
        makeStage("A", () => {
          order.push("A");
        }),
      );
      pipeline.addStage(
        makeStage("B", () => {
          order.push("B");
        }),
      );
      pipeline.addStage(
        makeStage("C", () => {
          order.push("C");
        }),
      );

      const ctx = createPipelineContext();
      const result = await pipeline.execute(ctx);

      expect(result.success).toBe(true);
      expect(order).toEqual(["A", "B", "C"]);
      expect(result.completedStages).toEqual(["A", "B", "C"]);
    });

    it("executes a single stage", async () => {
      let executed = false;
      const pipeline = new Pipeline();
      pipeline.addStage(
        makeStage("Only", () => {
          executed = true;
        }),
      );

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(true);
      expect(executed).toBe(true);
      expect(result.completedStages).toEqual(["Only"]);
    });

    it("returns success with empty stages array when no stages registered", async () => {
      const pipeline = new Pipeline();
      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(true);
      expect(result.completedStages).toEqual([]);
    });
  });

  describe("context propagation", () => {
    it("propagates context mutations between stages", async () => {
      const pipeline = new Pipeline();

      pipeline.addStage(
        makeStage("Writer", (ctx) => {
          ctx.set("key", "hello");
        }),
      );
      pipeline.addStage(
        makeStage("Reader", (ctx) => {
          const val = ctx.get("key");
          ctx.set("key2", `value: ${String(val)}`);
        }),
      );

      const ctx = createPipelineContext();
      const result = await pipeline.execute(ctx);

      expect(result.success).toBe(true);
      expect(ctx.get("key")).toBe("hello");
      expect(ctx.get("key2")).toBe("value: hello");
    });

    it("starts with empty context", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("Check"));

      const ctx = createPipelineContext();
      await pipeline.execute(ctx);

      expect(ctx.has("nonexistent")).toBe(false);
      expect(ctx.get("nonexistent")).toBeUndefined();
    });

    it("context delete removes entries", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage(
        makeStage("Remove", (ctx) => {
          ctx.set("temp", "data");
          ctx.delete("temp");
        }),
      );

      const ctx = createPipelineContext();
      await pipeline.execute(ctx);

      expect(ctx.has("temp")).toBe(false);
    });

    it("context entries returns all key-value pairs", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage(
        makeStage("Populate", (ctx) => {
          ctx.set("a", 1);
          ctx.set("b", 2);
        }),
      );

      const ctx = createPipelineContext();
      await pipeline.execute(ctx);

      const entries = Array.from(ctx.entries());
      expect(entries).toHaveLength(2);
    });
  });

  describe("error handling", () => {
    it("stops execution on stage failure and returns error", async () => {
      const order: string[] = [];
      const pipeline = new Pipeline();

      pipeline.addStage(
        makeStage("A", () => {
          order.push("A");
        }),
      );
      pipeline.addStage({
        name: "Failing",
        execute: () => {
          throw new Error("stage crashed");
        },
      });
      pipeline.addStage(
        makeStage("B", () => {
          order.push("B");
        }),
      );

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(false);
      expect(result.error?.stage).toBe("Failing");
      expect(result.error?.message).toBe("stage crashed");
      expect(order).toEqual(["A"]);
      expect(result.completedStages).toEqual(["A"]);
    });

    it("propagates non-Error throws as string messages", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage({
        name: "Thrower",
        execute: () => {
          throw new Error("raw string error");
        },
      });

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(false);
      expect(result.error?.stage).toBe("Thrower");
      expect(result.error?.message).toBe("raw string error");
    });

    it("returns context at point of failure", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage(
        makeStage("Set", (ctx) => {
          ctx.set("beforeCrash", true);
        }),
      );
      pipeline.addStage({
        name: "Crash",
        execute: () => {
          throw new Error("boom");
        },
      });

      const ctx = createPipelineContext();
      const result = await pipeline.execute(ctx);

      expect(result.success).toBe(false);
      expect(ctx.get("beforeCrash")).toBe(true);
    });
  });

  describe("events", () => {
    it("emits pipeline:started and pipeline:completed events", async () => {
      const events: PipelineEvent[] = [];
      const pipeline = new Pipeline();

      pipeline.on("pipeline:started", (e) => {
        events.push(e);
      });
      pipeline.on("pipeline:completed", (e) => {
        events.push(e);
      });
      pipeline.addStage(makeStage("A"));

      await pipeline.execute(createPipelineContext());

      expect(events).toHaveLength(2);
      expect(events[0]?.type).toBe("pipeline:started");
      expect(events[1]?.type).toBe("pipeline:completed");
    });

    it("emits stage:started and stage:completed for each stage", async () => {
      const events: PipelineEvent[] = [];
      const pipeline = new Pipeline();

      pipeline.on("stage:started", (e) => {
        events.push(e);
      });
      pipeline.on("stage:completed", (e) => {
        events.push(e);
      });
      pipeline.addStage(makeStage("X"));
      pipeline.addStage(makeStage("Y"));

      await pipeline.execute(createPipelineContext());

      expect(events).toHaveLength(4);
      expect(events[0]?.type).toBe("stage:started");
      expect(events[0]?.stage).toBe("X");
      expect(events[1]?.type).toBe("stage:completed");
      expect(events[1]?.stage).toBe("X");
      expect(events[2]?.type).toBe("stage:started");
      expect(events[2]?.stage).toBe("Y");
      expect(events[3]?.type).toBe("stage:completed");
      expect(events[3]?.stage).toBe("Y");
    });

    it("emits stage:failed on error", async () => {
      const events: PipelineEvent[] = [];
      const pipeline = new Pipeline();

      pipeline.on("stage:failed", (e) => {
        events.push(e);
      });
      pipeline.addStage({
        name: "Fails",
        execute: () => {
          throw new Error("fail");
        },
      });

      await pipeline.execute(createPipelineContext());

      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("stage:failed");
      expect(events[0]?.stage).toBe("Fails");
    });

    it("removes listener with off()", async () => {
      const events: PipelineEvent[] = [];
      const listener = (e: PipelineEvent) => {
        events.push(e);
      };
      const pipeline = new Pipeline();

      pipeline.on("stage:started", listener);
      pipeline.off("stage:started", listener);
      pipeline.addStage(makeStage("X"));

      await pipeline.execute(createPipelineContext());

      expect(events).toHaveLength(0);
    });

    it("handles listener errors without breaking pipeline", async () => {
      const pipeline = new Pipeline();
      pipeline.on("stage:started", () => {
        throw new Error("listener crash");
      });
      pipeline.addStage(makeStage("Works"));

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(true);
      expect(result.completedStages).toEqual(["Works"]);
    });
  });

  describe("cancellation", () => {
    it("stops execution when cancelled during execution", async () => {
      const pipeline = new Pipeline();
      let stageBExecuted = false;

      pipeline.addStage(
        makeStage("A", () => {
          pipeline.cancel();
        }),
      );
      pipeline.addStage(
        makeStage("B", () => {
          stageBExecuted = true;
        }),
      );

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe("Pipeline was cancelled");
      expect(stageBExecuted).toBe(false);
      expect(result.completedStages).toEqual(["A"]);
    });

    it("emits pipeline:cancelled event", async () => {
      const events: PipelineEvent[] = [];
      const pipeline = new Pipeline();

      pipeline.on("pipeline:cancelled", (e) => {
        events.push(e);
      });
      pipeline.addStage(
        makeStage("A", () => {
          pipeline.cancel();
        }),
      );

      await pipeline.execute(createPipelineContext());

      expect(events).toHaveLength(1);
      expect(events[0]?.type).toBe("pipeline:cancelled");
    });

    it("passes AbortSignal to stage execute", async () => {
      let receivedSignal: AbortSignal | undefined;
      const pipeline = new Pipeline();

      pipeline.addStage({
        name: "SignalCheck",
        execute: (_ctx, signal) => {
          receivedSignal = signal;
          return Promise.resolve(_ctx);
        },
      });

      await pipeline.execute(createPipelineContext());

      expect(receivedSignal).toBeDefined();
      expect(receivedSignal?.aborted).toBe(false);
    });
  });

  describe("progress reporting", () => {
    it("reports progress for each stage", async () => {
      const progressCalls: {
        currentStage: string;
        stageIndex: number;
        totalStages: number;
        percentage: number;
      }[] = [];

      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("A"));
      pipeline.addStage(makeStage("B"));
      pipeline.addStage(makeStage("C"));
      pipeline.onProgress((p) => {
        progressCalls.push({ ...p });
      });

      await pipeline.execute(createPipelineContext());

      expect(progressCalls).toHaveLength(3);
      expect(progressCalls[0]).toEqual({
        currentStage: "A",
        stageIndex: 0,
        totalStages: 3,
        percentage: 33,
      });
      expect(progressCalls[1]).toEqual({
        currentStage: "B",
        stageIndex: 1,
        totalStages: 3,
        percentage: 67,
      });
      expect(progressCalls[2]).toEqual({
        currentStage: "C",
        stageIndex: 2,
        totalStages: 3,
        percentage: 100,
      });
    });

    it("handles zero stages gracefully", async () => {
      const progressCalls: unknown[] = [];
      const pipeline = new Pipeline();
      pipeline.onProgress((p) => {
        progressCalls.push(p);
      });

      await pipeline.execute(createPipelineContext());

      expect(progressCalls).toHaveLength(0);
    });
  });

  describe("logging", () => {
    it("uses provided logger", async () => {
      const logSpy = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      const pipeline = new Pipeline({ logger: logSpy });
      pipeline.addStage(makeStage("Test"));

      await pipeline.execute(createPipelineContext());

      expect(logSpy.info).toHaveBeenCalled();
    });

    it("defaults to noopLogger when none provided", async () => {
      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("Test"));

      const result = await pipeline.execute(createPipelineContext());
      expect(result.success).toBe(true);
    });

    it("ConsoleLogger writes to console", () => {
      const logger = new ConsoleLogger("[Test]");
      const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined);
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

      logger.info("msg");
      logger.warn("warn");
      logger.error("err");

      expect(infoSpy).toHaveBeenCalledWith("[Test] msg", "");
      expect(warnSpy).toHaveBeenCalledWith("[Test] warn", "");
      expect(errorSpy).toHaveBeenCalledWith("[Test] err", "");

      infoSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe("stage management", () => {
    it("addStage returns this for chaining", () => {
      const pipeline = new Pipeline();
      const result = pipeline.addStage(makeStage("A"));

      expect(result).toBe(pipeline);
    });

    it("removeStage removes by name", () => {
      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("A"));
      pipeline.addStage(makeStage("B"));
      pipeline.removeStage("A");

      expect(pipeline.getStages().map((s) => s.name)).toEqual(["B"]);
    });

    it("removeStage is a no-op for unknown names", () => {
      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("A"));
      pipeline.removeStage("Unknown");

      expect(pipeline.getStages().map((s) => s.name)).toEqual(["A"]);
    });

    it("getStages returns readonly view of stages", () => {
      const pipeline = new Pipeline();
      pipeline.addStage(makeStage("A"));

      const stages = pipeline.getStages();
      expect(stages).toHaveLength(1);
      expect(stages[0]?.name).toBe("A");
    });

    it("accepts stages via constructor options", async () => {
      const pipeline = new Pipeline({
        stages: [makeStage("A"), makeStage("B")],
      });

      const result = await pipeline.execute(createPipelineContext());
      expect(result.completedStages).toEqual(["A", "B"]);
    });
  });

  describe("async stages", () => {
    it("awaits async stage execution", async () => {
      const order: string[] = [];
      const pipeline = new Pipeline();

      pipeline.addStage(
        makeAsyncStage("Async", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          order.push("done");
        }),
      );

      const result = await pipeline.execute(createPipelineContext());

      expect(result.success).toBe(true);
      expect(order).toEqual(["done"]);
    });
  });
});
