// @atlas/shared/assets/serialization — JSON serialization for assets.
//
// Assets are plain read-only data, so `JSON.stringify` works out of the box.
// These helpers wrap that with validation on the way back in, so a round-trip
// through persistence/transport restores an *integrity-checked* asset rather
// than a blindly trusted blob.

import type { AtlasResult } from "../types/index.js";
import type { AnyAsset } from "./types.js";
import { validateAsset } from "./validation.js";

/**
 * Serialize an asset to a JSON string.
 *
 * Future persistence layers can store this representation verbatim — it is the
 * asset's full metadata payload and nothing more.
 */
export function serializeAsset(asset: AnyAsset): string {
  return JSON.stringify(asset);
}

/**
 * Deserialize an asset from a JSON string.
 *
 * The parsed value is run through {@link validateAsset} and the resulting asset
 * is deep-frozen, mirroring the guarantees of the factory functions.
 */
export function deserializeAsset(json: string): AtlasResult<AnyAsset> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid JSON";
    return { ok: false, error: { code: "ASSET_INVALID_JSON", message } };
  }
  return validateAsset(parsed);
}
