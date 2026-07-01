import { useCallback, useEffect, useRef } from "react";
import type { PipelineEvent } from "@atlas/pipeline";

import { ingestImage, type IngestionLogLevel } from "../ingestion/ingest";
import { useAtlasServices } from "./atlas";
import { useSandbox, type PipelineStageInfo } from "./sandbox";

const INGESTION_STAGES = ["ingest-image", "generate-depth", "build-spatial-scene"] as const;

function initialStages(): PipelineStageInfo[] {
  return INGESTION_STAGES.map((name) => ({ name, status: "pending", durationMs: null }));
}

/** Safely pull an error message out of a pipeline event's `unknown` payload. */
function extractEventErrorMessage(data: unknown): string | undefined {
  if (typeof data === "object" && data !== null && "error" in data) {
    const value = data.error;
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.message;
  }
  return undefined;
}

/**
 * Sandbox-facing ingestion controller.
 *
 * Wires the ingestion orchestrator to the sandbox store and to the pipeline's
 * lifecycle events, exposing a single `ingest(file)` action plus derived
 * `isProcessing` state to UI components.
 */
export function useIngestion() {
  const services = useAtlasServices();
  const { state, dispatch } = useSandbox();
  const { registry, pipeline, extractor } = services;
  const stageStartTimes = useRef<Map<string, number>>(new Map());

  // Mirror pipeline lifecycle events (per-stage logs + status) into the sandbox.
  // `dispatch` from useReducer is stable, so this effect wires listeners once.
  useEffect(() => {
    const appendLog = (level: IngestionLogLevel, message: string) => {
      dispatch({
        type: "APPEND_LOG",
        payload: { timestamp: new Date().toISOString(), level, message },
      });
    };

    const onStarted = () => {
      dispatch({ type: "SET_PIPELINE_STATUS", payload: "running" });
      dispatch({ type: "SET_PIPELINE_STAGES", payload: initialStages() });
      stageStartTimes.current = new Map();
      appendLog("info", "Pipeline Started");
    };
    const onCompleted = () => {
      dispatch({ type: "SET_PIPELINE_STATUS", payload: "completed" });
      dispatch({ type: "SET_PIPELINE_ERROR", payload: null });
    };
    const onStageStarted = (event: PipelineEvent) => {
      const stageName = event.stage ?? "unknown";
      stageStartTimes.current.set(stageName, event.timestamp);
      dispatch({ type: "UPDATE_PIPELINE_STAGE", payload: { name: stageName, status: "running" } });
      appendLog("info", `Stage started: ${stageName}`);
    };
    const onStageCompleted = (event: PipelineEvent) => {
      const stageName = event.stage ?? "unknown";
      const startTime = stageStartTimes.current.get(stageName);
      const durationMs = startTime != null ? event.timestamp - startTime : undefined;
      dispatch({
        type: "UPDATE_PIPELINE_STAGE",
        payload: { name: stageName, status: "completed", durationMs },
      });
      appendLog("info", `Stage completed: ${stageName}`);
    };
    const onStageFailed = (event: PipelineEvent) => {
      const stageName = event.stage ?? "unknown";
      const startTime = stageStartTimes.current.get(stageName);
      const durationMs = startTime != null ? event.timestamp - startTime : undefined;
      dispatch({
        type: "UPDATE_PIPELINE_STAGE",
        payload: { name: stageName, status: "failed", durationMs },
      });
      const detail = extractEventErrorMessage(event.data);
      const detailSuffix = detail ? ` — ${detail}` : "";
      appendLog("error", `Stage failed: ${stageName}${detailSuffix}`);
    };

    pipeline.on("pipeline:started", onStarted);
    pipeline.on("pipeline:completed", onCompleted);
    pipeline.on("stage:started", onStageStarted);
    pipeline.on("stage:completed", onStageCompleted);
    pipeline.on("stage:failed", onStageFailed);

    return () => {
      pipeline.off("pipeline:started", onStarted);
      pipeline.off("pipeline:completed", onCompleted);
      pipeline.off("stage:started", onStageStarted);
      pipeline.off("stage:completed", onStageCompleted);
      pipeline.off("stage:failed", onStageFailed);
    };
  }, [pipeline, dispatch]);

  const ingest = useCallback(
    async (file: File) => {
      dispatch({ type: "SET_PROCESSING", payload: true });
      dispatch({ type: "SET_INGESTION_ERROR", payload: null });

      const logger = {
        log: (level: IngestionLogLevel, message: string) => {
          dispatch({
            type: "APPEND_LOG",
            payload: { timestamp: new Date().toISOString(), level, message },
          });
        },
      };

      const result = await ingestImage(file, { registry, pipeline, extractor, logger });

      if (result.ok) {
        const { asset, previewUrl, depth, scene } = result.data;
        dispatch({ type: "SET_ORIGINAL_IMAGE", payload: previewUrl });
        dispatch({ type: "SET_CURRENT_ASSET", payload: asset });
        dispatch({ type: "SET_ASSET_ID", payload: asset.id });
        dispatch({ type: "SET_DEPTH_ASSET", payload: depth });
        dispatch({ type: "SET_SPATIAL_SCENE", payload: scene });
        dispatch({ type: "SET_REGISTRY_COUNT", payload: registry.size() });
      } else {
        dispatch({ type: "SET_INGESTION_ERROR", payload: result.error.message });
        dispatch({ type: "SET_REGISTRY_COUNT", payload: registry.size() });
      }

      dispatch({ type: "SET_PROCESSING", payload: false });
      return result;
    },
    [registry, pipeline, extractor, dispatch],
  );

  return { ingest, isProcessing: state.isProcessing };
}
