import { Button } from "@atlas/ui";
import { useSandbox } from "../../stores/sandbox";
import { useAtlasServices } from "../../stores/atlas";

export function DevToolbar() {
  const { dispatch } = useSandbox();
  const { registry } = useAtlasServices();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
      <Button
        variant="outline"
        className="text-xs"
        onClick={() => {
          dispatch({ type: "CLEAR_LOGS" });
        }}
      >
        Clear Logs
      </Button>
      <Button
        variant="outline"
        className="text-xs"
        onClick={() => {
          registry.clear();
          dispatch({ type: "SET_REGISTRY_COUNT", payload: registry.size() });
          dispatch({ type: "RESET" });
        }}
      >
        Reset Sandbox
      </Button>
    </div>
  );
}
