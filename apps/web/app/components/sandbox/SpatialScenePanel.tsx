import { useSandbox } from "../../stores/sandbox";

function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "—";
}

export function SpatialScenePanel() {
  const { state } = useSandbox();
  const { spatialScene } = state;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">SpatialScene</h2>
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
        {spatialScene ? (
          <div className="w-full space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Type</span>
              <span className="font-mono text-foreground">{spatialScene.type}</span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Dimensions</span>
              <span className="font-mono text-foreground">
                {spatialScene.dimensions.width}x{spatialScene.dimensions.height}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Nodes</span>
              <span className="font-mono text-foreground">
                {displayValue(spatialScene.metadata["nodeCount"])}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Source Image</span>
              <span className="font-mono truncate max-w-32 text-foreground">
                {displayValue(spatialScene.metadata["sourceImageId"])}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Source Depth</span>
              <span className="font-mono truncate max-w-32 text-foreground">
                {displayValue(spatialScene.metadata["sourceDepthId"])}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Depth Provider</span>
              <span className="font-mono text-foreground">
                {displayValue(spatialScene.metadata["depthProvider"])}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Depth Range</span>
              <span className="font-mono text-foreground">
                {displayValue(spatialScene.metadata["depthMinDepth"])}–
                {displayValue(spatialScene.metadata["depthMaxDepth"])}
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Processing Time</span>
              <span className="font-mono text-foreground">
                {displayValue(spatialScene.metadata["processingTimeMs"])}ms
              </span>
            </div>
            <div className="flex justify-between gap-3 text-xs">
              <span className="text-muted-foreground">Scene Root</span>
              <span className="font-mono text-foreground">{spatialScene.root.name}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No scene generated yet</p>
        )}
      </div>
    </div>
  );
}
