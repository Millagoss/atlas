import { useSandbox, type PipelineStatus } from "../../stores/sandbox";

const STATUS_LABEL: Record<PipelineStatus, string> = {
  idle: "Idle",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_COLOR: Record<PipelineStatus, string> = {
  idle: "text-muted-foreground",
  running: "text-yellow-600",
  completed: "text-green-600",
  failed: "text-danger",
};

export function PipelineStatusPanel() {
  const { state } = useSandbox();

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Pipeline Status</h2>
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
        <p className={`text-sm font-semibold ${STATUS_COLOR[state.pipelineStatus]}`}>
          {STATUS_LABEL[state.pipelineStatus]}
        </p>
        {state.pipelineError ? (
          <p className="mt-2 text-xs text-danger">{state.pipelineError}</p>
        ) : null}
        {state.pipelineStatus === "idle" ? (
          <p className="mt-2 text-xs text-muted-foreground">No pipeline run yet</p>
        ) : null}
      </div>
    </div>
  );
}
