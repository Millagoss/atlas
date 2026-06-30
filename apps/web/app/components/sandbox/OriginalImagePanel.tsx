import type { ReactNode } from "react";
import { useSandbox } from "../../stores/sandbox";

/** Coerce an unknown metadata value to a display string safely. */
function displayValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "—";
}

function MetadataRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-3 text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}

export function OriginalImagePanel() {
  const { state } = useSandbox();
  const { originalImage, currentAsset, assetId } = state;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Original Image</h2>
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-md border border-dashed bg-muted/50 p-4">
        {originalImage ? (
          <>
            <img
              src={originalImage}
              alt="Selected preview"
              className="max-h-64 max-w-full rounded-md object-contain"
            />
            <div className="w-full space-y-1">
              <MetadataRow label="Asset ID" value={assetId ?? "—"} />
              {currentAsset ? (
                <>
                  <MetadataRow label="Type" value={currentAsset.type} />
                  <MetadataRow label="MIME" value={currentAsset.mimeType} />
                  <MetadataRow
                    label="Dimensions"
                    value={
                      <>
                        {currentAsset.dimensions.width}×{currentAsset.dimensions.height}
                      </>
                    }
                  />
                  <MetadataRow
                    label="Filename"
                    value={displayValue(currentAsset.metadata["filename"])}
                  />
                  <MetadataRow
                    label="File size (bytes)"
                    value={displayValue(currentAsset.metadata["fileSize"])}
                  />
                </>
              ) : null}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No image selected</p>
        )}
      </div>
    </div>
  );
}
