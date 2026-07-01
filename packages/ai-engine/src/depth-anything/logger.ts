export type DepthInferenceLogLevel = "info" | "warn" | "error";

export interface DepthInferenceLogger {
  log(level: DepthInferenceLogLevel, message: string): void;
}

export function createConsoleDepthLogger(prefix = "[Atlas Depth]"): DepthInferenceLogger {
  return {
    log(level, message) {
      const line = `${prefix} ${message}`;
      if (level === "error") {
        console.error(line);
      } else if (level === "warn") {
        console.warn(line);
      } else {
        console.log(line);
      }
    },
  };
}
