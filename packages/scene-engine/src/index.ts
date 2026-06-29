// @atlas/scene-engine — Placeholder for 3D scene graph management, transforms, and spatial queries.

export const ENGINE_NAME = "@atlas/scene-engine" as const;

export interface SceneNode {
  id: string;
  name: string;
  children: SceneNode[];
}

export function createSceneGraph(): { root: SceneNode } {
  // Future: Initialize Three.js scene graph, spatial indexing, and visibility culling.
  return { root: { id: "root", name: "Root", children: [] } };
}
