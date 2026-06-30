import { useSandbox, type LogEntry } from "../../stores/sandbox";

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  info: "text-muted-foreground",
  warn: "text-yellow-600",
  error: "text-danger",
};

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
            {state.logs.map((entry, i) => (
              <li key={i} className={`font-mono text-xs ${LEVEL_COLOR[entry.level]}`}>
                <span className="text-muted-foreground">[{entry.timestamp}]</span>{" "}
                <span className="font-semibold uppercase">[{entry.level}]</span> {entry.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
