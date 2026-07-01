import { useSandbox, type PipelineStageInfo } from "../../stores/sandbox";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-muted-foreground",
  running: "text-yellow-600",
  completed: "text-green-600",
  failed: "text-red-600",
};

function StageRow({ stage }: { stage: PipelineStageInfo }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`h-2 w-2 rounded-full shrink-0 ${STATUS_COLOR[stage.status] === "text-green-600" ? "bg-green-600" : STATUS_COLOR[stage.status] === "text-yellow-600" ? "bg-yellow-600" : STATUS_COLOR[stage.status] === "text-red-600" ? "bg-red-600" : "bg-muted-foreground"}`}
        />
        <span className="font-mono text-xs truncate">{stage.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-semibold ${STATUS_COLOR[stage.status] ?? ""}`}>
          {STATUS_LABEL[stage.status] ?? stage.status}
        </span>
        {stage.durationMs != null ? (
          <span className="font-mono text-xs text-muted-foreground">{stage.durationMs}ms</span>
        ) : null}
      </div>
    </div>
  );
}

export function PipelineInspector() {
  const { state } = useSandbox();
  const { pipelineStages, pipelineStatus } = state;

  if (pipelineStages.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pipeline Inspector</h2>
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">No pipeline run yet</p>
        </div>
      </div>
    );
  }

  const totalDuration = pipelineStages.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Pipeline Inspector</h2>
      <div className="rounded-md border border-dashed bg-muted/50 p-4">
        <div className="space-y-1">
          {pipelineStages.map((stage) => (
            <StageRow key={stage.name} stage={stage} />
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-foreground">Status</span>
            <span
              className={`text-xs font-semibold ${
                pipelineStatus === "completed"
                  ? "text-green-600"
                  : pipelineStatus === "failed"
                    ? "text-red-600"
                    : pipelineStatus === "running"
                      ? "text-yellow-600"
                      : "text-muted-foreground"
              }`}
            >
              {pipelineStatus.charAt(0).toUpperCase() + pipelineStatus.slice(1)}
            </span>
          </div>
          {totalDuration > 0 ? (
            <div className="flex items-center justify-between gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Total Duration</span>
              <span className="font-mono text-xs text-muted-foreground">{totalDuration}ms</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
