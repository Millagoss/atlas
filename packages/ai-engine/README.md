# @atlas/ai-engine

AI inference, model management, and depth estimation.

## Responsibilities

- AI model lifecycle management
- Inference pipeline execution
- Model configuration
- Depth estimation via the `DepthProvider` abstraction

## Depth estimation

The `DepthProvider` interface is the seam through which Atlas obtains depth
information for an image. C08 adds `DepthAnythingProvider`, which runs Depth
Anything V2 Small in the browser via ONNX Runtime Web (WebGPU with WASM
fallback). `MockDepthProvider` remains available for deterministic tests.

### DepthProvider API

- `DepthProvider` — strategy interface (`name`, `generate(image): Promise<DepthAsset>`)
- `DepthAnythingProvider` — browser ONNX inference (`depth-anything-v2`)
- `createDepthAnythingProvider()` — factory for the real AI provider
- `MockDepthProvider` — deterministic pseudo-statistics derived from the image id
- `createMockDepthProvider()` — factory returning a mock `DepthProvider`

`DepthAnythingProvider` expects `ImageAsset.metadata.previewUrl` (a browser object
URL) to load pixels for inference.

## Public API

- `createAiEngine`, `AiEngineConfig`
- `DepthProvider`
- `DepthAnythingProvider`, `createDepthAnythingProvider`
- `MockDepthProvider`, `createMockDepthProvider`
- `IMAGE_PREVIEW_URL_METADATA_KEY`

## Dependencies

- `@atlas/shared` — asset types, `ImageAsset`, `DepthAsset`, `createDepthAsset`
- `onnxruntime-web` — browser ONNX inference
