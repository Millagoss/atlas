import { createContext, useContext, useMemo, type ReactNode } from "react";
import { AssetRegistry } from "@atlas/shared";
import type { Pipeline } from "@atlas/pipeline";
import { createIngestionPipeline } from "../ingestion/stages";
import { createBrowserImageExtractor, type ImageMetadataExtractor } from "../ingestion/extract";

/**
 * Runtime services used by the Sandbox: the in-memory Asset Registry, the
 * ingestion pipeline, and the image-metadata extractor.
 *
 * Instances are created once per Sandbox session (per `AtlasProvider` mount)
 * via `useMemo`, so the registry genuinely acts as the single source of truth
 * for that session and is naturally reset when the route unmounts.
 */
export interface AtlasServices {
  readonly registry: AssetRegistry;
  readonly pipeline: Pipeline;
  readonly extractor: ImageMetadataExtractor;
}

const AtlasServicesContext = createContext<AtlasServices | null>(null);

export function AtlasServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<AtlasServices>(
    () => ({
      registry: new AssetRegistry(),
      pipeline: createIngestionPipeline(),
      extractor: createBrowserImageExtractor(),
    }),
    [],
  );

  return <AtlasServicesContext.Provider value={services}>{children}</AtlasServicesContext.Provider>;
}

export function useAtlasServices(): AtlasServices {
  const context = useContext(AtlasServicesContext);
  if (!context) {
    throw new Error("useAtlasServices must be used within an AtlasServicesProvider");
  }
  return context;
}
