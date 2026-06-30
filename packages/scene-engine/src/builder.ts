// @atlas/scene-engine/builder — SpatialScene construction.
//
// The builder is the seam that turns an image + depth pair into the canonical
// {@link SpatialScene} consumed by the viewer. C05 ships a deterministic
// builder that constructs a minimal scene graph; future builders can add
// real geometry subdivision, reprojecting, or mesh-from-depth logic behind the
// same interface.

import type { DepthAsset, ImageAsset, SpatialScene, SpatialSceneNode } from "@atlas/shared";
import { createSpatialScene, generateId } from "@atlas/shared";

/**
 * Strategy that builds a {@link SpatialScene} from an {@link ImageAsset} and a
 * {@link DepthAsset}.
 */
export interface SpatialSceneBuilder {
  /** Produce the canonical {@link SpatialScene} for the given inputs. */
  build(image: ImageAsset, depth: DepthAsset): Promise<SpatialScene>;
}

/**
 * Default deterministic scene builder.
 *
 * Constructs a minimal scene graph:
 *
 * ```
 * root
 * ├─ image-plane    (textured quad wrapping the source image)
 * └─ depth-field    (depth-driven displacement surface reference)
 * ```
 *
 * The graph is intentionally simple — it just needs to be valid, inspectable,
 * and stable so the viewer and tests can assert on its shape. Real geometry
 * generation is a future capability.
 */
export class DefaultSceneBuilder implements SpatialSceneBuilder {
  build(image: ImageAsset, depth: DepthAsset): Promise<SpatialScene> {
    const start = Date.now();

    const imagePlane: SpatialSceneNode = {
      id: generateId(),
      name: "image-plane",
      children: [],
    };
    const depthField: SpatialSceneNode = {
      id: generateId(),
      name: "depth-field",
      children: [],
    };
    const root: SpatialSceneNode = {
      id: generateId(),
      name: "root",
      children: [imagePlane, depthField],
    };

    const nodeCount = 3;

    const scene = createSpatialScene({
      mimeType: "application/json",
      dimensions: image.dimensions,
      root,
      metadata: {
        sourceImageId: image.id,
        sourceDepthId: depth.id,
        nodeCount,
        processingTimeMs: Date.now() - start,
        depthMinDepth: depth.metadata["minDepth"] ?? null,
        depthMaxDepth: depth.metadata["maxDepth"] ?? null,
        depthMeanDepth: depth.metadata["meanDepth"] ?? null,
        depthProvider: depth.metadata["provider"] ?? null,
      },
    });

    return Promise.resolve(scene);
  }
}

/** Factory: create the default {@link SpatialSceneBuilder}. */
export function createSceneBuilder(): SpatialSceneBuilder {
  return new DefaultSceneBuilder();
}
