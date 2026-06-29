// @atlas/shared/utils — Shared utility functions.

export function generateId(): string {
  return crypto.randomUUID();
}

export function noop(..._args: unknown[]): void {
  // intentional no-op
}
