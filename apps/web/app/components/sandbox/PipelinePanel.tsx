import type { ReactNode } from "react";

interface PipelinePanelProps {
  title: string;
  children?: ReactNode;
}

export function PipelinePanel({ title, children }: PipelinePanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
        {children ?? (
          <p className="text-sm text-muted-foreground">No data available</p>
        )}
      </div>
    </div>
  );
}
