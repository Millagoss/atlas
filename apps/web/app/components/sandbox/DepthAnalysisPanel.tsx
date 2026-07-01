import { useSandbox } from "../../stores/sandbox";

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "—";
}

export function DepthAnalysisPanel() {
  const { state } = useSandbox();
  const { depthAsset, depthMap } = state;

  const modelStatus = displayValue(depthAsset?.metadata["modelStatus"]);
  const backend = displayValue(depthAsset?.metadata["executionBackend"]);
  const duration = displayValue(depthAsset?.metadata["inferenceDurationMs"]);
  const error = depthAsset?.metadata["inferenceError"];

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Depth Analysis</h2>
      <div className="flex min-h-[200px] flex-col gap-3 rounded-md border border-dashed bg-muted/50 p-4">
        {depthAsset ? (
          <>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-muted-foreground">Model Status</div>
              <div className="font-mono text-foreground">{modelStatus}</div>
              <div className="text-muted-foreground">Runtime Backend</div>
              <div className="font-mono text-foreground">{backend}</div>
              <div className="text-muted-foreground">Inference Duration</div>
              <div className="font-mono text-foreground">
                {duration === "—" ? "—" : `${duration}ms`}
              </div>
              <div className="text-muted-foreground">Provider</div>
              <div className="font-mono text-foreground">
                {displayValue(depthAsset.metadata["provider"])}
              </div>
              <div className="text-muted-foreground">Depth Range</div>
              <div className="font-mono text-foreground">
                {displayValue(depthAsset.metadata["minDepth"])}–
                {displayValue(depthAsset.metadata["maxDepth"])}
              </div>
            </div>

            {typeof error === "string" && error.length > 0 ? (
              <p className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}

            {depthMap ? (
              <img
                src={depthMap}
                alt="Depth map preview"
                className="max-h-40 w-full rounded border object-contain"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No depth map preview available</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Upload an image to run depth inference</p>
        )}
      </div>
    </div>
  );
}
