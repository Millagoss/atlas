import { useEffect, useRef } from "react";
import type { SpatialScene } from "@atlas/shared";
import { createViewer, type Viewer } from "@atlas/viewer-engine";
import { useSandbox } from "../../stores/sandbox";

interface ViewerHostProps {
  spatialScene: SpatialScene | null;
}

export function ViewerHost({ spatialScene }: ViewerHostProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const previousSceneIdRef = useRef<string | null>(null);
  const { dispatch } = useSandbox();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const viewer = createViewer({ canvas });
    viewer.initialize();
    viewerRef.current = viewer;

    const pollInterval = setInterval(() => {
      const state = viewer.getCameraState();
      const mode = viewer.getNavigationMode();
      dispatch({ type: "SET_CAMERA_STATE", payload: state });
      dispatch({ type: "SET_NAVIGATION_MODE", payload: mode });
    }, 100);

    return () => {
      clearInterval(pollInterval);
      dispatch({ type: "SET_CAMERA_STATE", payload: null });
      dispatch({ type: "SET_NAVIGATION_MODE", payload: null });
      viewer.dispose();
      viewerRef.current = null;
      previousSceneIdRef.current = null;
    };
  }, [dispatch]);

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
      <div className="relative flex min-h-[300px] items-center justify-center rounded-md border border-dashed bg-muted/50 p-0 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full min-h-[300px]" />
        {!spatialScene ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            Upload an image to render the scene
          </p>
        ) : null}
      </div>
    </div>
  );
}
