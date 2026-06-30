// @atlas/scene-engine — Spatial scene construction and graph management.
//
// C05 ships the SpatialSceneBuilder which transforms an ImageAsset + DepthAsset
// pair into the canonical SpatialScene consumed by the viewer.

export const ENGINE_NAME = "@atlas/scene-engine" as const;

/** Legacy scene-graph placeholder (replaced by SpatialSceneNode in @atlas/shared). */
export interface SceneNode {
  id: string;
  name: string;
  children: SceneNode[];
}

export function createSceneGraph(): { root: SceneNode } {
  return { root: { id: "root", name: "Root", children: [] } };
}

export type { SpatialSceneBuilder } from "./builder.js";
export { DefaultSceneBuilder, createSceneBuilder } from "./builder.js";
