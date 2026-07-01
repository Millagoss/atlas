# Engineering Brief

**ID:** C08

**Title:** AI Spatial Analysis

**Status:** Implemented

---

# Objective

Replace the MockDepthProvider with a real AI-powered DepthProvider.

The existing Atlas pipeline, asset system, viewer, and camera navigation must remain unchanged.

The only responsibility of this capability is generating a real `DepthAsset` from an uploaded image.

---

# Requirements

Implement a new provider:

- `DepthAnythingProvider`

The provider must implement the existing `DepthProvider` interface.

The pipeline should switch from the mock provider to the real provider without requiring architectural changes.

---

## AI Runtime

Use:

- ONNX Runtime Web

Prefer execution providers in this order:

1. WebGPU
2. WASM

Automatically fall back if WebGPU is unavailable.

---

## Model

Use an ONNX version of **Depth Anything V2 Small** for the MVP.

Load the model lazily.

Cache it after the first download.

Subsequent inferences should reuse the loaded session.

---

## Image Processing

Before inference:

- Resize to the model's expected input size.
- Normalize pixel values according to the model requirements.
- Convert to tensor format.

After inference:

- Convert model output into a canonical `DepthAsset`.
- Preserve width and height information.

---

## Sandbox

Display:

- AI model status
- Runtime backend (WebGPU/WASM)
- Inference duration
- Depth map preview (grayscale)
- Any inference errors

Keep the UI simple and developer-focused.

---

## Pipeline

Replace:

MockDepthProvider

with

DepthAnythingProvider

No other pipeline stages should change.

---

## Error Handling

Gracefully handle:

- model download failures
- unsupported browser features
- inference failures
- invalid model outputs

The application must remain usable.

---

## Logging

Log:

- Model download started
- Model ready
- Inference started
- Inference completed
- Inference failed
- Execution backend

---

## Testing

Add tests where practical for:

- provider initialization
- model loading
- inference pipeline
- output validation
- provider replacement

---

# Constraints

Do not implement:

- segmentation
- object detection
- mesh generation
- Gaussian splatting
- server inference
- cloud APIs
- paid AI services

Focus exclusively on monocular depth estimation.

---

# Acceptance Criteria

The capability is complete when:

- Uploading an image runs the AI model.
- A valid `DepthAsset` is generated.
- The existing SpatialSceneBuilder consumes the new DepthAsset.
- The Viewer updates automatically.
- Different images produce noticeably different scene geometry.
- The Sandbox displays inference information.
- Build, lint, typecheck, and tests pass.

---

# Manual Verification

1. Start Atlas.
2. Upload a property image.
3. Wait for model download (first run only).
4. Confirm inference completes.
5. Confirm a depth map preview appears.
6. Confirm the Viewer updates.
7. Upload a different image.
8. Confirm the resulting scene differs.
9. Confirm no runtime errors occur.

---

# Deliverables

- DepthAnythingProvider
- ONNX Runtime Web integration
- Browser inference
- DepthAsset generation
- Depth map preview
- Updated capability documentation

Stop after completing this capability.
