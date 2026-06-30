import { createContext, useContext, useMemo, type ReactNode } from "react";
import { AssetRegistry } from "@atlas/shared";
import type { Pipeline } from "@atlas/pipeline";
import type { DepthProvider } from "@atlas/ai-engine";
import { createMockDepthProvider } from "@atlas/ai-engine";
import type { SpatialSceneBuilder } from "@atlas/scene-engine";
import { createSceneBuilder } from "@atlas/scene-engine";
import {
  createIngestionPipeline,
  createBrowserImageExtractor,
  type ImageMetadataExtractor,
} from "../ingestion/index";

export interface AtlasServices {
  readonly registry: AssetRegistry;
  readonly pipeline: Pipeline;
  readonly extractor: ImageMetadataExtractor;
  readonly depthProvider: DepthProvider;
  readonly sceneBuilder: SpatialSceneBuilder;
}

const AtlasServicesContext = createContext<AtlasServices | null>(null);

export function AtlasServicesProvider({ children }: { children: ReactNode }) {
  const services = useMemo<AtlasServices>(() => {
    const depthProvider = createMockDepthProvider();
    const sceneBuilder = createSceneBuilder();
    const pipeline = createIngestionPipeline({ depthProvider, sceneBuilder });

    return {
      registry: new AssetRegistry(),
      pipeline,
      extractor: createBrowserImageExtractor(),
      depthProvider,
      sceneBuilder,
    };
  }, []);

  return <AtlasServicesContext.Provider value={services}>{children}</AtlasServicesContext.Provider>;
}

export function useAtlasServices(): AtlasServices {
  const context = useContext(AtlasServicesContext);
  if (!context) {
    throw new Error("useAtlasServices must be used within an AtlasServicesProvider");
  }
  return context;
}
