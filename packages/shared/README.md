# @atlas/shared

Shared utilities, types, and constants used across all Atlas packages, including
the canonical Atlas Asset System.

## Responsibilities

- Common TypeScript types (`AtlasMetadata`, `AtlasResult`, `AtlasError`)
- Utility functions (`generateId`, `noop`)
- Core Asset System — the data model every pipeline stage consumes/produces
- Zero dependencies on engine packages

## Asset System

Assets are the lingua franca of the Atlas pipeline. Every stage transforms one
asset into another instead of passing around raw browser objects (`File`, `Blob`,
`ImageBitmap`). The system defines pure, immutable, JSON-serializable data.

### Asset types

- `Asset` — base contract (`id`, `type`, `createdAt`, `mimeType`, `metadata`)
- `Dimensions` — `{ width, height }` for image-like assets
- `ImageAsset` — raw image input (`type: "image"`)
- `ProcessedImageAsset` — normalized image output (`type: "processed-image"`)
- `DepthAsset` — per-pixel depth map (`type: "depth"`)
- `AnyAsset` — union of all implemented asset kinds
- `AssetInitOptions`, `DimensionedAssetInitOptions` — factory input options

### Factories (immutable by construction)

- `createImageAsset(options)`
- `createProcessedImageAsset(options)`
- `createDepthAsset(options)`

Factories fill in default `id`/`createdAt`, normalize `metadata`, and deep-freeze
the result. Pipeline stages produce _new_ assets through factories rather than
mutating existing ones.

### Validation

- `validateAsset(input): AtlasResult<AnyAsset>` — dependency-free integrity check
  that dispatches on `type` and validates dimensions for image-like assets.

### Serialization

- `serializeAsset(asset): string` — JSON string for persistence/transport.
- `deserializeAsset(json): AtlasResult<AnyAsset>` — parse + validate + freeze.

## Asset Registry

A lightweight in-memory registry that acts as the runtime single source of
truth for assets. No persistence; no reactivity. UIs mirror its state by
dispatching store updates after mutating it.

### Registry API

- `AssetRegistry` — `register`, `get`, `has`, `remove`, `clear`, `size`, `all`,
  `query(predicate)`, `getByType(type)`.

## Public API

- `generateId`
- `noop`
- `AtlasMetadata`
- `AtlasResult`
- `AtlasError`
- `Asset`, `AssetType`, `AssetMetadata`, `Dimensions`
- `ImageAsset`, `ProcessedImageAsset`, `DepthAsset`, `AnyAsset`
- `AssetInitOptions`, `DimensionedAssetInitOptions`
- `createImageAsset`, `createProcessedImageAsset`, `createDepthAsset`
- `validateAsset`
- `serializeAsset`, `deserializeAsset`
- `AssetRegistry`

## Dependencies

- None
