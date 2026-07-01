import { useEffect, useRef } from "react";
import type { SpatialScene } from "@atlas/shared";
import { createViewer, type Viewer } from "@atlas/viewer-engine";

interface ViewerHostProps {
  spatialScene: SpatialScene | null;
}

export function ViewerHost({ spatialScene }: ViewerHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const previousSceneIdRef = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = createViewer({ canvas });
    viewer.initialize();
    viewerRef.current = viewer;

    return () => {
      viewer.dispose();
      viewerRef.current = null;
      previousSceneIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (!spatialScene) {
      return;
    }

    if (previousSceneIdRef.current === null) {
      viewer.loadScene(spatialScene);
    } else if (previousSceneIdRef.current !== spatialScene.id) {
      viewer.replaceScene(spatialScene);
    }

    previousSceneIdRef.current = spatialScene.id;
  }, [spatialScene]);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold text-foreground">Runtime Viewer</h2>
      <div className="flex min-h-[300px] items-center justify-center rounded-md border border-dashed bg-muted/50 p-0 overflow-hidden">
        {spatialScene ? (
          <canvas ref={canvasRef} className="w-full h-full min-h-[300px]" />
        ) : (
          <p className="text-sm text-muted-foreground">Upload an image to render the scene</p>
        )}
      </div>
    </div>
  );
}
