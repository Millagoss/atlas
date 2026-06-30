// @atlas/shared/registry — In-memory Asset Registry.
//
// The registry is the runtime single source of truth for assets. It is a
// lightweight, framework-independent `Map`-backed store: no persistence, no
// reactivity. React UIs mirror its size/content by dispatching store updates
// after mutating it (see the web app's `useIngestion` hook).

import type { AnyAsset, AssetType } from "../assets/types.js";

/**
 * Lightweight in-memory registry of {@link AnyAsset} instances.
 *
 * Assets are keyed by their immutable `id`. The registry owns no copies — it
 * stores references to the frozen asset objects produced by the asset
 * factories. Registering the same id twice replaces the previous entry, which
 * is acceptable because assets are immutable and id collisions imply the same
 * logical asset.
 */
export class AssetRegistry {
  private readonly assets = new Map<string, AnyAsset>();

  /** Register (or replace) an asset, keyed by `asset.id`. */
  register<T extends AnyAsset>(asset: T): T {
    this.assets.set(asset.id, asset);
    return asset;
  }

  /** Retrieve an asset by id, or `undefined` if not present. */
  get(id: string): AnyAsset | undefined {
    return this.assets.get(id);
  }

  /** Whether an asset with the given id is registered. */
  has(id: string): boolean {
    return this.assets.has(id);
  }

  /** Remove an asset by id. Returns `true` if an entry was removed. */
  remove(id: string): boolean {
    return this.assets.delete(id);
  }

  /** Remove every registered asset. */
  clear(): void {
    this.assets.clear();
  }

  /** Current number of registered assets. */
  size(): number {
    return this.assets.size;
  }

  /** A snapshot of all registered assets, in insertion order. */
  all(): readonly AnyAsset[] {
    return Array.from(this.assets.values());
  }

  /** Query assets matching a predicate, in insertion order. */
  query(predicate: (asset: AnyAsset) => boolean): AnyAsset[] {
    const results: AnyAsset[] = [];
    for (const asset of this.assets.values()) {
      if (predicate(asset)) {
        results.push(asset);
      }
    }
    return results;
  }

  /** Convenience: all assets of a given {@link AssetType}. */
  getByType(type: AssetType): AnyAsset[] {
    return this.query((asset) => asset.type === type);
  }
}
