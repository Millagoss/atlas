# @atlas/ai-engine

AI inference, model management, and depth estimation.

## Responsibilities

- AI model lifecycle management
- Inference pipeline execution
- Model configuration
- Depth estimation via the `DepthProvider` abstraction

## Depth estimation

The `DepthProvider` interface is the seam through which Atlas obtains depth
information for an image. The real production provider will run an ONNX model
(out of scope for C05); this package ships a deterministic `MockDepthProvider`
that exercises the complete pipeline without any AI dependency.

### DepthProvider API

- `DepthProvider` — strategy interface (`name`, `generate(image): Promise<DepthAsset>`)
- `MockDepthProvider` — class implementing `DepthProvider` with deterministic
  pseudo-statistics derived from the image id.
- `createMockDepthProvider()` — factory returning a `DepthProvider`.

## Public API

- `createAiEngine`, `AiEngineConfig`
- `DepthProvider`
- `MockDepthProvider`, `createMockDepthProvider`

## Dependencies

- `@atlas/shared` — asset types, `ImageAsset`, `DepthAsset`, `createDepthAsset`
