// @atlas/shared/assets/factories — Immutable asset factories.
//
// Factories are the *only* supported way to construct assets. They fill in
// defaults (id, timestamp), normalize the metadata record, and deep-freeze the
// resulting object so callers cannot mutate it afterwards. Pipeline stages then
// produce *new* assets through these factories instead of mutating existing
// ones.

import { generateId } from "../utils/index.js";
import type {
  AssetInitOptions,
  AssetMetadata,
  DepthAsset,
  Dimensions,
  DimensionedAssetInitOptions,
  ImageAsset,
  ProcessedImageAsset,
  SpatialScene,
  SpatialSceneInitOptions,
  SpatialSceneNode,
} from "./types.js";

/** Timestamp helper kept central so tests can override behavior predictably. */
function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Deep-freeze an asset and its metadata record.
 *
 * `Object.freeze` is shallow on its own; because `metadata` is the only nested
 * object on an asset we freeze it explicitly to genuinely enforce immutability
 * without pulling in a deep-freeze library.
 */
function freezeAsset<T extends object>(asset: T): Readonly<T> {
  const obj = asset as unknown as {
    metadata?: AssetMetadata;
    dimensions?: Dimensions;
    root?: SpatialSceneNode;
  };
  const meta = obj.metadata;
  if (meta && typeof meta === "object") {
    Object.freeze(meta);
  }
  const dims = obj.dimensions;
  if (dims && typeof dims === "object") {
    Object.freeze(dims);
  }
  const root = obj.root;
  if (root && typeof root === "object") {
    freezeSceneNode(root);
  }
  return Object.freeze(asset);
}

/** Normalize caller-supplied metadata into a non-null frozen record. */
function normalizeMetadata(metadata?: AssetMetadata): AssetMetadata {
  const copy: Record<string, unknown> = { ...(metadata ?? {}) };
  return Object.freeze(copy);
}

/** Build the shared base fields, applying defaults for `id` / `createdAt`. */
function buildBaseFields(options: AssetInitOptions): {
  readonly id: string;
  readonly createdAt: string;
  readonly mimeType: string;
  readonly metadata: AssetMetadata;
} {
  return {
    id: options.id ?? generateId(),
    createdAt: options.createdAt ?? nowIso(),
    mimeType: options.mimeType,
    metadata: normalizeMetadata(options.metadata),
  };
}

/**
 * Create an immutable {@link ImageAsset}.
 *
 * @example
 * ```ts
 * const image = createImageAsset({
 *   mimeType: "image/png",
 *   dimensions: { width: 1920, height: 1080 },
 * });
 * ```
 */
export function createImageAsset(options: DimensionedAssetInitOptions): ImageAsset {
  const base = buildBaseFields(options);
  return freezeAsset<ImageAsset>({
    ...base,
    type: "image",
    dimensions: options.dimensions,
  });
}

/**
 * Create an immutable {@link ProcessedImageAsset}.
 *
 * Semantically distinct from {@link createImageAsset}: a processed image is the
 * normalized output of an image-processing stage, not a raw input.
 */
export function createProcessedImageAsset(
  options: DimensionedAssetInitOptions,
): ProcessedImageAsset {
  const base = buildBaseFields(options);
  return freezeAsset<ProcessedImageAsset>({
    ...base,
    type: "processed-image",
    dimensions: options.dimensions,
  });
}

/**
 * Create an immutable {@link DepthAsset}.
 *
 * A depth asset describes a per-pixel depth map. The depth buffer itself is
 * owned by a future storage/loader layer; this factory describes the map's
 * shape and metadata only.
 */
export function createDepthAsset(options: DimensionedAssetInitOptions): DepthAsset {
  const base = buildBaseFields(options);
  return freezeAsset<DepthAsset>({
    ...base,
    type: "depth",
    dimensions: options.dimensions,
  });
}

/**
 * Deep-freeze a scene-graph node and all its descendants, enforcing the
 * immutability contract of {@link SpatialScene} without a deep-freeze library.
 */
function freezeSceneNode(node: SpatialSceneNode): void {
  for (const child of node.children) {
    freezeSceneNode(child);
  }
  Object.freeze(node);
}

/**
 * Create an immutable {@link SpatialScene}, the canonical scene representation
 * produced by a scene builder.
 *
 * Lineage (source asset ids), processing time, and node counts should be
 * injected via `metadata`; the factory itself only owns the structural fields.
 */
export function createSpatialScene(options: SpatialSceneInitOptions): SpatialScene {
  const base = buildBaseFields(options);
  return freezeAsset<SpatialScene>({
    ...base,
    type: "spatial-scene",
    dimensions: options.dimensions,
    root: options.root,
  });
}
