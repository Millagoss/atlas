import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Atlas Platform</h1>
        <p className="text-xl text-muted-foreground">Development Environment Ready</p>
        <div className="mt-8 rounded-lg border bg-card p-6 text-card-foreground">
          <code className="font-mono text-sm">
            @atlas/web · TanStack Start · React 19 · TypeScript
          </code>
        </div>
      </div>
    </main>
  );
}
