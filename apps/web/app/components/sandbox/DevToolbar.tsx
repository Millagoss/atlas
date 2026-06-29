import { Button } from "@atlas/ui";
import { useSandbox } from "../../stores/sandbox";

export function DevToolbar() {
  const { dispatch } = useSandbox();

  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card p-2">
      <Button
        variant="outline"
        className="text-xs"
        onClick={() => {
          dispatch({ type: "CLEAR_LOGS" });
        }}
      >
        Clear State
      </Button>
      <Button
        variant="outline"
        className="text-xs"
        onClick={() => {
          dispatch({ type: "RESET" });
        }}
      >
        Reset Sandbox
      </Button>
    </div>
  );
}
