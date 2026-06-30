# @atlas/scene-engine

Spatial scene construction and graph management.

## Responsibilities

- SpatialScene construction from ImageAsset + DepthAsset
- Scene graph management
- Node transform management (future)

## SpatialScene Builder

The `SpatialSceneBuilder` interface is the seam that turns an image + depth pair
into the canonical `SpatialScene` consumed by the viewer. C05 ships a
deterministic default builder; future builders can add real geometry
subdivision, reprojection, or mesh-from-depth logic behind the same interface.

### Builder API

- `SpatialSceneBuilder` — strategy interface
  (`build(image, depth): Promise<SpatialScene>`)
- `DefaultSceneBuilder` — class implementing `SpatialSceneBuilder` with a
  minimal deterministic scene graph:
  ```
  root
  ├─ image-plane
  └─ depth-field
  ```
- `createSceneBuilder()` — factory returning a `SpatialSceneBuilder`.

## Public API

- `createSceneGraph`, `SceneNode` (legacy)
- `SpatialSceneBuilder`
- `DefaultSceneBuilder`, `createSceneBuilder`

## Dependencies

- `@atlas/shared` — asset types, `createSpatialScene`, `generateId`
