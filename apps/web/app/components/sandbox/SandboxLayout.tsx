import { useSandbox } from "../../stores/sandbox";
import { DevToolbar } from "./DevToolbar";
import { LogsPanel } from "./LogsPanel";
import { ImageUploader } from "./ImageUploader";
import { OriginalImagePanel } from "./OriginalImagePanel";
import { RegistryPanel } from "./RegistryPanel";
import { PipelineStatusPanel } from "./PipelineStatusPanel";
import { SpatialScenePanel } from "./SpatialScenePanel";
import { PipelinePanel } from "./PipelinePanel";
import { ViewerHost } from "./ViewerHost";
import { ViewerStatusPanel } from "./ViewerStatusPanel";
import { PipelineInspector } from "./PipelineInspector";

const REMAINING_PANELS = ["Processed Image", "Depth Map"] as const;

export function SandboxLayout() {
  const { state } = useSandbox();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Developer Sandbox</h1>
            <p className="text-sm text-muted-foreground">Atlas Spatial Pipeline Inspector</p>
          </div>
          <div className="flex items-center gap-4">
            <ImageUploader />
            <DevToolbar />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <OriginalImagePanel />
          <RegistryPanel />
          <PipelineStatusPanel />
          <SpatialScenePanel />
          <PipelineInspector />
          {REMAINING_PANELS.map((title) => (
            <PipelinePanel key={title} title={title} />
          ))}
          <ViewerHost spatialScene={state.spatialScene} />
          <ViewerStatusPanel />
        </div>

        <LogsPanel />
      </div>
    </div>
  );
}
