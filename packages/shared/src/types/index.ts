// @atlas/shared/types — Shared TypeScript types and interfaces.

export interface AtlasMetadata {
  /** Unique identifier (UUID v7). */
  id: string;
  /** Creation timestamp (ISO 8601). */
  createdAt: string;
  /** Last-updated timestamp (ISO 8601). */
  updatedAt: string;
}

export type AtlasResult<T> = { ok: true; data: T } | { ok: false; error: AtlasError };

export interface AtlasError {
  code: string;
  message: string;
}
