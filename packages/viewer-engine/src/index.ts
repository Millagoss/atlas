// @atlas/viewer-engine — Placeholder for 3D model rendering, camera controls, and viewport management.

export const ENGINE_NAME = "@atlas/viewer-engine" as const;

export interface ViewerConfig {
  canvas: HTMLCanvasElement;
  antialias: boolean;
}

export function createViewer(_config: ViewerConfig): void {
  // Future: Initialize R3F canvas, camera rig, post-processing, and interaction handlers.
}
