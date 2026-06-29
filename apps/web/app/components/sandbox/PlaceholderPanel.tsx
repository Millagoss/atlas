interface PlaceholderPanelProps {
  title: string;
}

export function PlaceholderPanel({ title }: PlaceholderPanelProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex min-h-[200px] items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
        <p className="text-sm text-muted-foreground">Placeholder — coming soon</p>
      </div>
    </div>
  );
}
