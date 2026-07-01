import { useSandbox } from "../../stores/sandbox";

function formatVec(value: number): string {
  return value.toFixed(2);
}

export function ViewerStatusPanel() {
  const { state } = useSandbox();
  const { cameraState, navigationMode } = state;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Viewer Status</h2>
      <div className="flex min-h-[200px] flex-col justify-center rounded-md border border-dashed bg-muted/50 p-4 space-y-2">
        {cameraState ? (
          <>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Position</span>
              <p className="font-mono text-xs">
                x: {formatVec(cameraState.position.x)} y: {formatVec(cameraState.position.y)} z:{" "}
                {formatVec(cameraState.position.z)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Target</span>
              <p className="font-mono text-xs">
                x: {formatVec(cameraState.target.x)} y: {formatVec(cameraState.target.y)} z:{" "}
                {formatVec(cameraState.target.z)}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">Mode</span>
              <p className="text-xs capitalize">{navigationMode ?? "idle"}</p>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground text-center">Camera not initialized</p>
        )}
      </div>
    </div>
  );
}
