import { DevToolbar } from "./DevToolbar";
import { PipelinePanel } from "./PipelinePanel";
import { LogsPanel } from "./LogsPanel";

const PIPELINE_PANELS = [
  "Original Image",
  "Processed Image",
  "Depth Map",
  "SpatialScene",
  "Runtime Viewer",
] as const;

export function SandboxLayout() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Developer Sandbox</h1>
            <p className="text-sm text-muted-foreground">Atlas Spatial Pipeline Inspector</p>
          </div>
          <DevToolbar />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PIPELINE_PANELS.map((title) => (
            <PipelinePanel key={title} title={title} />
          ))}
        </div>

        <LogsPanel />
      </div>
    </div>
  );
}
