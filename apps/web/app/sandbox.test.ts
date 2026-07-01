import { describe, it, expect } from "vitest";
import { sandboxReducer, initialState, type SandboxState, type LogEntry } from "./stores/sandbox";

function log(message: string, level: LogEntry["level"] = "info"): LogEntry {
  return { timestamp: "2025-06-29T12:00:00.000Z", level, message };
}

describe("sandbox state store", () => {
  it("initial state has null/empty defaults", () => {
    expect(initialState.originalImage).toBeNull();
    expect(initialState.processedImage).toBeNull();
    expect(initialState.depthMap).toBeNull();
    expect(initialState.spatialScene).toBeNull();
    expect(initialState.runtimeScene).toBeNull();
    expect(initialState.logs).toEqual([]);
    expect(initialState.currentAsset).toBeNull();
    expect(initialState.assetId).toBeNull();
    expect(initialState.registryCount).toBe(0);
    expect(initialState.pipelineStatus).toBe("idle");
    expect(initialState.pipelineError).toBeNull();
    expect(initialState.ingestionError).toBeNull();
    expect(initialState.isProcessing).toBe(false);
    expect(initialState.cameraState).toBeNull();
    expect(initialState.navigationMode).toBeNull();
  });

  it("SET_ORIGINAL_IMAGE updates originalImage", () => {
    const next = sandboxReducer(initialState, {
      type: "SET_ORIGINAL_IMAGE",
      payload: "blob:test.png",
    });
    expect(next.originalImage).toBe("blob:test.png");
  });

  it("APPEND_LOG adds structured entries in order", () => {
    let state = sandboxReducer(initialState, {
      type: "APPEND_LOG",
      payload: log("pipeline started"),
    });
    state = sandboxReducer(state, {
      type: "APPEND_LOG",
      payload: log("depth computed"),
    });
    expect(state.logs).toEqual([log("pipeline started"), log("depth computed")]);
  });

  it("CLEAR_LOGS removes all log entries", () => {
    const withLogs: SandboxState = {
      ...initialState,
      logs: [log("msg 1"), log("msg 2")],
    };
    const next = sandboxReducer(withLogs, { type: "CLEAR_LOGS" });
    expect(next.logs).toEqual([]);
  });

  it("SET_REGISTRY_COUNT updates the registry count", () => {
    const next = sandboxReducer(initialState, { type: "SET_REGISTRY_COUNT", payload: 3 });
    expect(next.registryCount).toBe(3);
  });

  it("SET_PIPELINE_STATUS updates the pipeline status", () => {
    const next = sandboxReducer(initialState, { type: "SET_PIPELINE_STATUS", payload: "running" });
    expect(next.pipelineStatus).toBe("running");
  });

  it("SET_INGESTION_ERROR updates the ingestion error", () => {
    const next = sandboxReducer(initialState, {
      type: "SET_INGESTION_ERROR",
      payload: "Unsupported file type",
    });
    expect(next.ingestionError).toBe("Unsupported file type");
  });

  it("RESET returns state to initial values", () => {
    const dirty: SandboxState = {
      ...initialState,
      originalImage: "img.png",
      logs: [log("entry")],
      currentAsset: null,
      assetId: "abc",
      registryCount: 1,
      pipelineStatus: "completed",
    };
    const next = sandboxReducer(dirty, { type: "RESET" });
    expect(next).toEqual(initialState);
  });

  it("SET_CAMERA_STATE updates camera state", () => {
    const state = {
      position: { x: 1.5, y: 2.5, z: 3.5 },
      target: { x: 0, y: 0, z: 0 },
    };
    const next = sandboxReducer(initialState, { type: "SET_CAMERA_STATE", payload: state });
    expect(next.cameraState).toEqual(state);
  });

  it("SET_CAMERA_STATE accepts null", () => {
    const withState = sandboxReducer(initialState, {
      type: "SET_CAMERA_STATE",
      payload: { position: { x: 1, y: 1, z: 1 }, target: { x: 0, y: 0, z: 0 } },
    });
    const next = sandboxReducer(withState, { type: "SET_CAMERA_STATE", payload: null });
    expect(next.cameraState).toBeNull();
  });

  it("SET_NAVIGATION_MODE updates navigation mode", () => {
    const next = sandboxReducer(initialState, { type: "SET_NAVIGATION_MODE", payload: "orbiting" });
    expect(next.navigationMode).toBe("orbiting");
  });

  it("SET_NAVIGATION_MODE accepts null", () => {
    const withMode = sandboxReducer(initialState, {
      type: "SET_NAVIGATION_MODE",
      payload: "orbiting",
    });
    const next = sandboxReducer(withMode, { type: "SET_NAVIGATION_MODE", payload: null });
    expect(next.navigationMode).toBeNull();
  });

  it("unknown action returns state unchanged", () => {
    const next = sandboxReducer(initialState, { type: "UNKNOWN" } as never);
    expect(next).toBe(initialState);
  });
});
