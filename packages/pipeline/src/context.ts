import type { PipelineContext } from "./types.js";

export function createPipelineContext(): PipelineContext {
  const data = new Map<string, unknown>();

  return {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- generic getter is the standard Map-like API
    get<T = unknown>(key: string): T | undefined {
      return data.get(key) as T | undefined;
    },
    set(key: string, value: unknown): void {
      data.set(key, value);
    },
    has(key: string): boolean {
      return data.has(key);
    },
    delete(key: string): boolean {
      return data.delete(key);
    },
    entries(): IterableIterator<[string, unknown]> {
      return data.entries();
    },
  };
}
