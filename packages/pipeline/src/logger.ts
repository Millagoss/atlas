import type { PipelineLogger } from "./types.js";

export class ConsoleLogger implements PipelineLogger {
  private prefix: string;

  constructor(prefix = "[Pipeline]") {
    this.prefix = prefix;
  }

  info(message: string, data?: unknown): void {
    console.info(`${this.prefix} ${message}`, data ?? "");
  }

  warn(message: string, data?: unknown): void {
    console.warn(`${this.prefix} ${message}`, data ?? "");
  }

  error(message: string, data?: unknown): void {
    console.error(`${this.prefix} ${message}`, data ?? "");
  }
}

export const noopLogger: PipelineLogger = {
  /* eslint-disable @typescript-eslint/no-empty-function */
  info: () => {},
  warn: () => {},
  error: () => {},
  /* eslint-enable @typescript-eslint/no-empty-function */
};
