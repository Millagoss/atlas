// @atlas/ai-engine/depth — Depth estimation abstraction.
//
// The DepthProvider is the seam through which Atlas obtains depth information
// for an image. The real production provider will run an ONNX model (out of
// scope here); this module ships a deterministic mock that exercises the
// complete pipeline without any AI dependency.

import type { DepthAsset, ImageAsset } from "@atlas/shared";
import { createDepthAsset } from "@atlas/shared";

/**
 * Strategy that transforms an {@link ImageAsset} into a {@link DepthAsset}.
 *
 * Implementations may be synchronous or asynchronous; consumers of the
 * interface always `await` the result.
 */
export interface DepthProvider {
  /** Stable provider name (e.g. `"mock"`, `"depth-anything-v2"`). */
  readonly name: string;
  /** Produce a {@link DepthAsset} describing the depth map for `image`. */
  generate(image: ImageAsset): Promise<DepthAsset>;
}

/**
 * Deterministic mock depth provider.
 *
 * Produces a {@link DepthAsset} whose dimensions match the source image and
 * whose `metadata` carries predictable pseudorandom depth statistics (hash
 * derived from the id). This is intentionally not realistic — it only needs to
 * exercise the complete pipeline end-to-end and give downstream stages and
 * tests stable, inspectable data.
 */
export class MockDepthProvider implements DepthProvider {
  readonly name = "mock";

  generate(image: ImageAsset): Promise<DepthAsset> {
    const { width, height } = image.dimensions;

    // Deterministic pseudo-statistics derived from the image id so that tests
    // can assert exact values without depending on timing or randomness.
    const seed = hashString(image.id);
    const minDepth = round3(0.1 + ((seed % 1000) / 1000) * 0.9);
    const maxDepth = round3(10 + (seed % 900) / 100);
    const meanDepth = round3((minDepth + maxDepth) / 2);

    return Promise.resolve(
      createDepthAsset({
        mimeType: "application/octet-stream",
        dimensions: { width, height },
        metadata: {
          sourceImageId: image.id,
          provider: "mock",
          minDepth,
          maxDepth,
          meanDepth,
          deterministic: true,
        },
      }),
    );
  }
}

/** Simple, dependency-free string hash for deterministic pseudo-data. */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Factory: create the default {@link MockDepthProvider}. */
export function createMockDepthProvider(): DepthProvider {
  return new MockDepthProvider();
}
