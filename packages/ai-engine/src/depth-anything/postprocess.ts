export interface DepthStatistics {
  readonly minDepth: number;
  readonly maxDepth: number;
  readonly meanDepth: number;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Compute min/max/mean over a depth buffer. */
export function computeDepthStatistics(depth: Float32Array): DepthStatistics {
  if (depth.length === 0) {
    return { minDepth: 0, maxDepth: 0, meanDepth: 0 };
  }

  let min = depth[0] ?? 0;
  let max = depth[0] ?? 0;
  let sum = 0;

  for (const v of depth) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }

  return {
    minDepth: round3(min),
    maxDepth: round3(max),
    meanDepth: round3(sum / depth.length),
  };
}

/** Nearest-neighbor resize of a single-channel depth map. */
export function resizeDepthMap(
  depth: Float32Array,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): Float32Array {
  const out = new Float32Array(targetWidth * targetHeight);

  for (let y = 0; y < targetHeight; y++) {
    const srcY = Math.min(Math.floor((y / targetHeight) * sourceHeight), sourceHeight - 1);
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.min(Math.floor((x / targetWidth) * sourceWidth), sourceWidth - 1);
      out[y * targetWidth + x] = depth[srcY * sourceWidth + srcX] ?? 0;
    }
  }

  return out;
}

/** Validate ONNX depth output before downstream consumption. */
export function validateDepthOutput(depth: Float32Array): string | null {
  if (depth.length === 0) return "Depth output is empty";
  const first = depth[0];
  if (first === undefined || !Number.isFinite(first)) {
    return "Depth output contains non-finite values";
  }
  for (const value of depth.subarray(0, Math.min(depth.length, 64))) {
    if (!Number.isFinite(value)) return "Depth output contains non-finite values";
  }
  return null;
}

/** Encode a normalized depth map as a grayscale PNG data URL (browser only). */
export function depthMapToPreviewDataUrl(
  depth: Float32Array,
  width: number,
  height: number,
): string | null {
  if (typeof document === "undefined") return null;

  const stats = computeDepthStatistics(depth);
  const range = stats.maxDepth - stats.minDepth || 1;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageData = ctx.createImageData(width, height);
  for (let i = 0; i < depth.length; i++) {
    const value = depth[i] ?? 0;
    const normalized = Math.round(((value - stats.minDepth) / range) * 255);
    const offset = i * 4;
    imageData.data[offset] = normalized;
    imageData.data[offset + 1] = normalized;
    imageData.data[offset + 2] = normalized;
    imageData.data[offset + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}
