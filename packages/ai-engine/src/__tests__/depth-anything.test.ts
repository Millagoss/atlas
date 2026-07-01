import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createDepthAnythingProvider,
  DepthAnythingProvider,
  IMAGE_PREVIEW_URL_METADATA_KEY,
} from "../index.js";
import { createImageAsset, validateAsset } from "@atlas/shared";
import { DEFAULT_DEPTH_MODEL } from "../depth-anything/constants.js";
import { getDefaultModelConfig, resetDepthSessionCache } from "../depth-anything/session.js";
import {
  computeDepthStatistics,
  resizeDepthMap,
  validateDepthOutput,
} from "../depth-anything/postprocess.js";
import { rgbaToNchwTensor } from "../depth-anything/preprocess.js";

const DIMS = { width: 4, height: 4 };

function makeImage(previewUrl?: string) {
  return createImageAsset({
    mimeType: "image/png",
    dimensions: DIMS,
    id: "img-1",
    metadata: previewUrl ? { [IMAGE_PREVIEW_URL_METADATA_KEY]: previewUrl } : {},
  });
}

function makeGradientRgba(width: number, height: number) {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      pixels[i] = x * 40;
      pixels[i + 1] = y * 40;
      pixels[i + 2] = 128;
      pixels[i + 3] = 255;
    }
  }
  return { pixels, width, height };
}

describe("depth-anything preprocess/postprocess", () => {
  it("builds an NCHW tensor with expected length", () => {
    const rgba = makeGradientRgba(8, 6);
    const tensor = rgbaToNchwTensor(rgba, 4);
    expect(tensor).toBeInstanceOf(Float32Array);
    expect(tensor.length).toBe(3 * 4 * 4);
  });

  it("computes depth statistics", () => {
    const depth = new Float32Array([1, 2, 3, 4]);
    expect(computeDepthStatistics(depth)).toEqual({
      minDepth: 1,
      maxDepth: 4,
      meanDepth: 2.5,
    });
  });

  it("resizes depth maps to target dimensions", () => {
    const depth = new Float32Array([1, 2, 3, 4]);
    const resized = resizeDepthMap(depth, 2, 2, 4, 4);
    expect(resized.length).toBe(16);
  });

  it("rejects invalid depth output", () => {
    expect(validateDepthOutput(new Float32Array())).toBe("Depth output is empty");
    expect(validateDepthOutput(new Float32Array([Number.NaN]))).toBe(
      "Depth output contains non-finite values",
    );
    expect(validateDepthOutput(new Float32Array([1, 2, 3]))).toBeNull();
  });
});

describe("depth model config", () => {
  it("points at fp16 ONNX artifacts with matching external data path", () => {
    const model = getDefaultModelConfig();
    expect(model.onnxUrl).toContain("model_fp16.onnx");
    expect(model.externalDataUrl).toContain("model_fp16.onnx_data");
    expect(model.externalDataPath).toBe("model_fp16.onnx_data");
    expect(DEFAULT_DEPTH_MODEL.externalDataPath).toBe("model_fp16.onnx_data");
  });
});

describe("DepthAnythingProvider", () => {
  beforeEach(() => {
    resetDepthSessionCache();
  });

  it("implements DepthProvider", () => {
    const provider = createDepthAnythingProvider();
    expect(provider.name).toBe("depth-anything-v2");
  });

  it("returns a fallback DepthAsset when previewUrl is missing", async () => {
    const provider = createDepthAnythingProvider({ logger: { log: vi.fn() } });
    const depth = await provider.generate(makeImage());

    expect(depth.type).toBe("depth");
    expect(depth.metadata["inferenceError"]).toBeTruthy();
    expect(validateAsset(depth).ok).toBe(true);
  });

  it("runs inference through a mocked ONNX session", async () => {
    const logger = { log: vi.fn() };
    const loadImage = vi.fn().mockResolvedValue(makeGradientRgba(4, 4));
    const output = new Float32Array(16);
    for (let i = 0; i < output.length; i++) output[i] = i;

    const getSession = vi.fn().mockResolvedValue({
      backend: "wasm" as const,
      run: vi.fn().mockResolvedValue({ values: output, width: 4, height: 4 }),
    });

    const provider = new DepthAnythingProvider({
      logger,
      loadImage,
      getSession,
    });

    const depth = await provider.generate(makeImage("blob:preview"));

    expect(getSession).toHaveBeenCalledOnce();
    expect(loadImage).toHaveBeenCalledWith("blob:preview");
    expect(depth.metadata["provider"]).toBe("depth-anything-v2");
    expect(depth.metadata["executionBackend"]).toBe("wasm");
    expect(depth.metadata["modelStatus"]).toBe("ready");
    expect(depth.metadata["minDepth"]).toBeTypeOf("number");
    expect(depth.metadata["maxDepth"]).toBeTypeOf("number");
    expect(depth.metadata["meanDepth"]).toBeTypeOf("number");
    expect(logger.log).toHaveBeenCalledWith("info", "Inference started");
    expect(logger.log).toHaveBeenCalledWith("info", "Inference completed");
    expect(validateAsset(depth).ok).toBe(true);
  });

  it("returns a graceful fallback asset when inference fails", async () => {
    const provider = new DepthAnythingProvider({
      logger: { log: vi.fn() },
      loadImage: vi.fn().mockRejectedValue(new Error("load failed")),
      getSession: vi.fn().mockResolvedValue({
        backend: "wasm" as const,
        run: vi.fn(),
      }),
    });

    const depth = await provider.generate(makeImage("blob:preview"));
    expect(depth.metadata["modelStatus"]).toBe("error");
    expect(depth.metadata["inferenceError"]).toBe("load failed");
    expect(validateAsset(depth).ok).toBe(true);
  });

  it("reuses a cached session factory across calls", async () => {
    const run = vi.fn().mockResolvedValue({
      values: new Float32Array([1, 2, 3, 4]),
      width: 2,
      height: 2,
    });
    const getSession = vi.fn().mockResolvedValue({ backend: "wasm" as const, run });
    const provider = new DepthAnythingProvider({
      logger: { log: vi.fn() },
      loadImage: vi.fn().mockResolvedValue(makeGradientRgba(2, 2)),
      getSession,
    });

    await provider.generate(makeImage("blob:a"));
    await provider.generate(makeImage("blob:b"));

    expect(getSession).toHaveBeenCalledTimes(2);
  });
});
