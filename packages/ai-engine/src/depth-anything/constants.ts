const HF_ONNX_BASE =
  "https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX/resolve/main/onnx";

/** Default Depth Anything V2 Small ONNX artifacts (fp16, ~50MB weights). */
export const DEFAULT_DEPTH_MODEL = {
  onnxUrl: `${HF_ONNX_BASE}/model_fp16.onnx`,
  externalDataUrl: `${HF_ONNX_BASE}/model_fp16.onnx_data`,
  /** Must match the `location` field embedded in the ONNX protobuf. */
  externalDataPath: "model_fp16.onnx_data",
} as const;

/** @deprecated Use {@link DEFAULT_DEPTH_MODEL}. */
export const DEFAULT_MODEL_URL = DEFAULT_DEPTH_MODEL.onnxUrl;

/** Model input spatial size (square). */
export const MODEL_INPUT_SIZE = 518;

/** ImageNet normalization used by Depth Anything V2. */
export const IMAGE_MEAN = [0.485, 0.456, 0.406] as const;
export const IMAGE_STD = [0.229, 0.224, 0.225] as const;

/** Metadata key on {@link ImageAsset} carrying a browser object URL for inference. */
export const IMAGE_PREVIEW_URL_METADATA_KEY = "previewUrl";
