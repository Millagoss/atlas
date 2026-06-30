import { useRef, type ChangeEvent } from "react";
import { Button } from "@atlas/ui";

import { useIngestion } from "../../stores/useIngestion";
import { useSandbox } from "../../stores/sandbox";

export function ImageUploader() {
  const { ingest, isProcessing } = useIngestion();
  const { state } = useSandbox();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file twice still fires change.
    event.target.value = "";
    if (!file) return;

    // Kick off ingestion without crashing on unexpected failures.
    void ingest(file).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : "Unexpected error during ingestion.";
      console.error("[Atlas] Ingestion crashed:", message);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleSelect}
      />
      <Button
        variant="default"
        className="text-xs"
        disabled={isProcessing}
        onClick={() => inputRef.current?.click()}
      >
        {isProcessing ? "Processing…" : "Select Image"}
      </Button>
      {state.ingestionError ? <p className="text-xs text-danger">{state.ingestionError}</p> : null}
    </div>
  );
}
