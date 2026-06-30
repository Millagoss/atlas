// @atlas/shared/assets/validation — Lightweight, framework-independent asset
// integrity checks.
//
// Validators are intentionally runtime-only and dependency-free. They never
// touch the DOM, Node APIs, storage, or any decoding logic. Each returns an
// {@link AtlasResult} so callers can decide how to surface failures.

import type { AtlasResult } from "../types/index.js";
import type {
  AnyAsset,
  AssetType,
  Dimensions,
  ImageAsset,
  ProcessedImageAsset,
  DepthAsset,
  SpatialScene,
  SpatialSceneNode,
} from "./types.js";

const KNOWN_ASSET_TYPES: ReadonlySet<AssetType> = new Set([
  "image",
  "processed-image",
  "depth",
  "spatial-scene",
]);

const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** A loose record view used while inspecting untrusted input. */
type RecordLike = Record<string, unknown>;

function fail(message: string): AtlasResult<never> {
  return { ok: false, error: { code: "ASSET_INVALID", message } };
}

function isRecord(value: unknown): value is RecordLike {
  return typeof value === "object" && value !== null;
}

function isDimensions(value: unknown): value is Dimensions {
  if (!isRecord(value)) return false;
  const width = value["width"];
  const height = value["height"];
  return (
    typeof width === "number" &&
    Number.isFinite(width) &&
    Number.isInteger(width) &&
    width > 0 &&
    typeof height === "number" &&
    Number.isFinite(height) &&
    Number.isInteger(height) &&
    height > 0
  );
}

function validateBase(asset: RecordLike): string | null {
  const id = asset["id"];
  if (typeof id !== "string" || id.length === 0) {
    return "asset.id must be a non-empty string";
  }
  const type = asset["type"];
  if (typeof type !== "string" || !KNOWN_ASSET_TYPES.has(type as AssetType)) {
    return `asset.type must be one of: ${[...KNOWN_ASSET_TYPES].join(", ")}`;
  }
  const createdAt = asset["createdAt"];
  if (typeof createdAt !== "string" || !ISO_8601_REGEX.test(createdAt)) {
    return "asset.createdAt must be an ISO 8601 string";
  }
  const mimeType = asset["mimeType"];
  if (typeof mimeType !== "string" || mimeType.length === 0) {
    return "asset.mimeType must be a non-empty string";
  }
  if (!isRecord(asset["metadata"])) {
    return "asset.metadata must be an object";
  }
  return null;
}

function validateDimensioned(asset: RecordLike): string | null {
  const baseError = validateBase(asset);
  if (baseError !== null) return baseError;
  if (!isDimensions(asset["dimensions"])) {
    return "asset.dimensions must be { width: integer>0, height: integer>0 }";
  }
  return null;
}

/** Recursively verify a scene-graph node has the required string fields. */
function isSceneNode(value: unknown): value is SpatialSceneNode {
  if (!isRecord(value)) return false;
  const id = value["id"];
  const name = value["name"];
  const children = value["children"];
  if (typeof id !== "string" || id.length === 0) return false;
  if (typeof name !== "string") return false;
  if (!Array.isArray(children)) return false;
  return children.every((child) => isSceneNode(child));
}

function validateSpatialScene(asset: RecordLike): string | null {
  const baseError = validateBase(asset);
  if (baseError !== null) return baseError;
  if (!isDimensions(asset["dimensions"])) {
    return "asset.dimensions must be { width: integer>0, height: integer>0 }";
  }
  if (!isSceneNode(asset["root"])) {
    return "asset.root must be a SpatialSceneNode { id: non-empty string, name: string, children: SpatialSceneNode[] }";
  }
  return null;
}

/**
 * Validate an arbitrary value as an Atlas {@link Asset}.
 *
 * The validator dispatches on `type` and runs the appropriate type-specific
 * checks (e.g. dimension validation for image-like assets). It returns the
 * validated asset on success, or an {@link AtlasError} describing the first
 * integrity problem encountered.
 *
 * @example
 * ```ts
 * const result = validateAsset(maybeAsset);
 * if (result.ok) {
 *   const asset: Asset = result.data;
 * } else {
 *   console.error(result.error.message);
 * }
 * ```
 */
export function validateAsset(input: unknown): AtlasResult<AnyAsset> {
  if (!isRecord(input)) {
    return fail("asset must be a non-null object");
  }

  const type = input["type"];

  if (type === "image") {
    const error = validateDimensioned(input);
    return error === null
      ? { ok: true, data: freezeAssumed(input) as unknown as ImageAsset }
      : fail(error);
  }
  if (type === "processed-image") {
    const error = validateDimensioned(input);
    return error === null
      ? { ok: true, data: freezeAssumed(input) as unknown as ProcessedImageAsset }
      : fail(error);
  }
  if (type === "depth") {
    const error = validateDimensioned(input);
    return error === null
      ? { ok: true, data: freezeAssumed(input) as unknown as DepthAsset }
      : fail(error);
  }
  if (type === "spatial-scene") {
    const error = validateSpatialScene(input);
    return error === null
      ? { ok: true, data: freezeAssumed(input) as unknown as SpatialScene }
      : fail(error);
  }

  return fail(`asset.type must be one of: ${[...KNOWN_ASSET_TYPES].join(", ")}`);
}

/**
 * Re-freeze a previously validated plain object so callers cannot mutate the
 * returned asset even if the input came from `JSON.parse`.
 */
function freezeSceneNode(value: RecordLike): void {
  const children = value["children"];
  if (Array.isArray(children)) {
    for (const child of children) {
      if (isRecord(child)) freezeSceneNode(child);
    }
  }
  Object.freeze(value);
}

function freezeAssumed(value: RecordLike): Readonly<RecordLike> {
  if (isRecord(value["metadata"])) {
    Object.freeze(value["metadata"]);
  }
  if (isDimensions(value["dimensions"])) {
    Object.freeze(value["dimensions"]);
  }
  if (isRecord(value["root"])) {
    freezeSceneNode(value["root"]);
  }
  return Object.freeze(value);
}
