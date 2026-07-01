import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";
import type { AnyAsset, DepthAsset, SpatialScene } from "@atlas/shared";
import type { CameraState, NavigationMode } from "@atlas/viewer-engine";

/** A single structured log entry displayed in the Sandbox Logs panel. */
export interface LogEntry {
  /** ISO 8601 timestamp. */
  readonly timestamp: string;
  /** Severity level. */
  readonly level: "info" | "warn" | "error";
  /** Human-readable message. */
  readonly message: string;
}

/** Lifecycle status of the most recent pipeline execution. */
export type PipelineStatus = "idle" | "running" | "completed" | "failed";

/** Status of an individual pipeline stage. */
export type StageStatus = "pending" | "running" | "completed" | "failed";

/** Information about a single pipeline stage tracked by the inspector. */
export interface PipelineStageInfo {
  readonly name: string;
  readonly status: StageStatus;
  readonly durationMs: number | null;
}

export interface SandboxState {
  /** Object URL for the original-image preview (rendered by the Sandbox). */
  originalImage: string | null;
  processedImage: string | null;
  depthMap: string | null;
  /** The DepthAsset produced by the generate-depth pipeline stage. */
  depthAsset: DepthAsset | null;
  /** The SpatialScene produced by the build-spatial-scene pipeline stage. */
  spatialScene: SpatialScene | null;
  runtimeScene: unknown;
  /** Structured ingestion/pipeline lifecycle log entries, in order. */
  logs: LogEntry[];
  /** The canonical asset produced by the most recent successful ingestion. */
  currentAsset: AnyAsset | null;
  /** Asset id of {@link currentAsset}, surfaced separately for quick display. */
  assetId: string | null;
  /** Number of assets currently in the Asset Registry. */
  registryCount: number;
  /** Status of the most recent pipeline execution. */
  pipelineStatus: PipelineStatus;
  /** Error message from the most recent pipeline failure, if any. */
  pipelineError: string | null;
  /** Error message from the most recent ingestion failure, if any. */
  ingestionError: string | null;
  /** Whether an ingestion/pipeline run is currently in progress. */
  isProcessing: boolean;
  /** Pipeline stage statuses for the inspector. */
  pipelineStages: PipelineStageInfo[];
  /** Current camera state from the viewer engine. */
  cameraState: CameraState | null;
  /** Current navigation interaction mode. */
  navigationMode: NavigationMode | null;
}

export type SandboxAction =
  | { type: "SET_ORIGINAL_IMAGE"; payload: string | null }
  | { type: "SET_PROCESSED_IMAGE"; payload: string | null }
  | { type: "SET_DEPTH_MAP"; payload: string | null }
  | { type: "SET_DEPTH_ASSET"; payload: DepthAsset | null }
  | { type: "SET_SPATIAL_SCENE"; payload: SpatialScene | null }
  | { type: "SET_RUNTIME_SCENE"; payload: unknown }
  | { type: "APPEND_LOG"; payload: LogEntry }
  | { type: "CLEAR_LOGS" }
  | { type: "SET_CURRENT_ASSET"; payload: AnyAsset | null }
  | { type: "SET_ASSET_ID"; payload: string | null }
  | { type: "SET_REGISTRY_COUNT"; payload: number }
  | { type: "SET_PIPELINE_STATUS"; payload: PipelineStatus }
  | { type: "SET_PIPELINE_ERROR"; payload: string | null }
  | { type: "SET_INGESTION_ERROR"; payload: string | null }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_PIPELINE_STAGES"; payload: PipelineStageInfo[] }
  | {
      type: "UPDATE_PIPELINE_STAGE";
      payload: { name: string; status: StageStatus; durationMs?: number };
    }
  | { type: "SET_CAMERA_STATE"; payload: CameraState | null }
  | { type: "SET_NAVIGATION_MODE"; payload: NavigationMode | null }
  | { type: "RESET" };

export const initialState: SandboxState = {
  originalImage: null,
  processedImage: null,
  depthMap: null,
  depthAsset: null,
  spatialScene: null,
  runtimeScene: null,
  logs: [],
  currentAsset: null,
  assetId: null,
  registryCount: 0,
  pipelineStatus: "idle",
  pipelineError: null,
  ingestionError: null,
  isProcessing: false,
  pipelineStages: [],
  cameraState: null,
  navigationMode: null,
};

export function sandboxReducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case "SET_ORIGINAL_IMAGE":
      return { ...state, originalImage: action.payload };
    case "SET_PROCESSED_IMAGE":
      return { ...state, processedImage: action.payload };
    case "SET_DEPTH_MAP":
      return { ...state, depthMap: action.payload };
    case "SET_DEPTH_ASSET":
      return { ...state, depthAsset: action.payload };
    case "SET_SPATIAL_SCENE":
      return { ...state, spatialScene: action.payload };
    case "SET_RUNTIME_SCENE":
      return { ...state, runtimeScene: action.payload };
    case "APPEND_LOG":
      return { ...state, logs: [...state.logs, action.payload] };
    case "CLEAR_LOGS":
      return { ...state, logs: [] };
    case "SET_CURRENT_ASSET":
      return { ...state, currentAsset: action.payload };
    case "SET_ASSET_ID":
      return { ...state, assetId: action.payload };
    case "SET_REGISTRY_COUNT":
      return { ...state, registryCount: action.payload };
    case "SET_PIPELINE_STATUS":
      return { ...state, pipelineStatus: action.payload };
    case "SET_PIPELINE_ERROR":
      return { ...state, pipelineError: action.payload };
    case "SET_INGESTION_ERROR":
      return { ...state, ingestionError: action.payload };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload };
    case "SET_PIPELINE_STAGES":
      return { ...state, pipelineStages: action.payload };
    case "UPDATE_PIPELINE_STAGE":
      return {
        ...state,
        pipelineStages: state.pipelineStages.map((s) =>
          s.name === action.payload.name
            ? {
                ...s,
                status: action.payload.status,
                durationMs: action.payload.durationMs ?? s.durationMs,
              }
            : s,
        ),
      };
    case "SET_CAMERA_STATE":
      return { ...state, cameraState: action.payload };
    case "SET_NAVIGATION_MODE":
      return { ...state, navigationMode: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const SandboxContext = createContext<{
  state: SandboxState;
  dispatch: Dispatch<SandboxAction>;
} | null>(null);

export function SandboxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sandboxReducer, initialState);
  return <SandboxContext.Provider value={{ state, dispatch }}>{children}</SandboxContext.Provider>;
}

export function useSandbox() {
  const context = useContext(SandboxContext);
  if (!context) {
    throw new Error("useSandbox must be used within a SandboxProvider");
  }
  return context;
}
