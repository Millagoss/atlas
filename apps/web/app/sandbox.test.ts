import { describe, it, expect } from "vitest";
import { sandboxReducer, initialState, type SandboxState } from "./stores/sandbox";

describe("sandbox state store", () => {
  it("initial state has null/empty defaults", () => {
    expect(initialState.originalImage).toBeNull();
    expect(initialState.processedImage).toBeNull();
    expect(initialState.depthMap).toBeNull();
    expect(initialState.spatialScene).toBeNull();
    expect(initialState.runtimeScene).toBeNull();
    expect(initialState.logs).toEqual([]);
  });

  it("SET_ORIGINAL_IMAGE updates originalImage", () => {
    const next = sandboxReducer(initialState, {
      type: "SET_ORIGINAL_IMAGE",
      payload: "test.png",
    });
    expect(next.originalImage).toBe("test.png");
  });

  it("APPEND_LOG adds entries in order", () => {
    let state = sandboxReducer(initialState, {
      type: "APPEND_LOG",
      payload: "pipeline started",
    });
    state = sandboxReducer(state, {
      type: "APPEND_LOG",
      payload: "depth computed",
    });
    expect(state.logs).toEqual(["pipeline started", "depth computed"]);
  });

  it("CLEAR_LOGS removes all log entries", () => {
    const withLogs: SandboxState = {
      ...initialState,
      logs: ["msg 1", "msg 2"],
    };
    const next = sandboxReducer(withLogs, { type: "CLEAR_LOGS" });
    expect(next.logs).toEqual([]);
  });

  it("RESET returns state to initial values", () => {
    const dirty: SandboxState = {
      ...initialState,
      originalImage: "img.png",
      logs: ["entry"],
    };
    const next = sandboxReducer(dirty, { type: "RESET" });
    expect(next).toEqual(initialState);
  });

  it("unknown action returns state unchanged", () => {
    const next = sandboxReducer(initialState, { type: "UNKNOWN" } as never);
    expect(next).toBe(initialState);
  });
});
