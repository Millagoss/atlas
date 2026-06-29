import { useSandbox } from "../../stores/sandbox";

export function LogsPanel() {
  const { state } = useSandbox();

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Logs</h2>
      <div className="min-h-[200px] rounded-md border border-dashed bg-muted/50 p-4">
        {state.logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logs yet</p>
        ) : (
          <ul className="space-y-1">
            {state.logs.map((log, i) => (
              <li key={i} className="font-mono text-xs text-muted-foreground">
                {log}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
