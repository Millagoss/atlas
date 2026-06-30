import { useSandbox } from "../../stores/sandbox";
import { useAtlasServices } from "../../stores/atlas";

export function RegistryPanel() {
  const { state } = useSandbox();
  const { registry } = useAtlasServices();

  // The registry is the source of truth; the store mirrors its count.
  const count = state.registryCount;
  const imageCount = registry.getByType("image").length;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Asset Registry</h2>
      <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed bg-muted/50 p-4">
        <dl className="w-full space-y-1">
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Total assets</dt>
            <dd className="font-mono text-foreground">{count}</dd>
          </div>
          <div className="flex justify-between text-xs">
            <dt className="text-muted-foreground">Image assets</dt>
            <dd className="font-mono text-foreground">{imageCount}</dd>
          </div>
        </dl>
        {count === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">Registry is empty</p>
        ) : null}
      </div>
    </div>
  );
}
