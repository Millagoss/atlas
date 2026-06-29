import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

export interface SandboxState {
  originalImage: string | null;
  processedImage: string | null;
  depthMap: string | null;
  spatialScene: unknown;
  runtimeScene: unknown;
  logs: string[];
}

export type SandboxAction =
  | { type: "SET_ORIGINAL_IMAGE"; payload: string | null }
  | { type: "SET_PROCESSED_IMAGE"; payload: string | null }
  | { type: "SET_DEPTH_MAP"; payload: string | null }
  | { type: "SET_SPATIAL_SCENE"; payload: unknown }
  | { type: "SET_RUNTIME_SCENE"; payload: unknown }
  | { type: "APPEND_LOG"; payload: string }
  | { type: "CLEAR_LOGS" }
  | { type: "RESET" };

export const initialState: SandboxState = {
  originalImage: null,
  processedImage: null,
  depthMap: null,
  spatialScene: null,
  runtimeScene: null,
  logs: [],
};

export function sandboxReducer(state: SandboxState, action: SandboxAction): SandboxState {
  switch (action.type) {
    case "SET_ORIGINAL_IMAGE":
      return { ...state, originalImage: action.payload };
    case "SET_PROCESSED_IMAGE":
      return { ...state, processedImage: action.payload };
    case "SET_DEPTH_MAP":
      return { ...state, depthMap: action.payload };
    case "SET_SPATIAL_SCENE":
      return { ...state, spatialScene: action.payload };
    case "SET_RUNTIME_SCENE":
      return { ...state, runtimeScene: action.payload };
    case "APPEND_LOG":
      return { ...state, logs: [...state.logs, action.payload] };
    case "CLEAR_LOGS":
      return { ...state, logs: [] };
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
