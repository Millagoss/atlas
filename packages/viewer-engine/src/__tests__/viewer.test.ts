import { describe, it, expect, vi, beforeEach } from "vitest";

const sceneChildren: unknown[] = [];

function resetState() {
  sceneChildren.length = 0;
}

function noop(): void {
  /* no-op */
}

function mkDispose() {
  return vi.fn(() => {
    // no-op
  });
}

function makeMockGroup(): Record<string, unknown> {
  const children: unknown[] = [];
  return {
    add: vi.fn((obj: unknown) => {
      children.push(obj);
    }),
    remove: vi.fn(() => {
      children.length = 0;
    }),
    children,
    name: "",
    userData: {},
    traverse: vi.fn(),
  };
}

vi.mock("three", () => {
  const MockMesh = vi.fn().mockImplementation(() => ({
    geometry: { dispose: mkDispose() },
    material: { dispose: mkDispose() },
    position: { set: vi.fn(), z: 0 },
    children: [],
    traverse: vi.fn((cb: (n: unknown) => void) => {
      cb({
        geometry: { dispose: mkDispose() },
        material: { dispose: mkDispose() },
      });
    }),
  }));
  (MockMesh as unknown as Record<string, unknown>)["prototype"] = {};

  return {
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn((obj: unknown) => {
        sceneChildren.push(obj);
      }),
      children: sceneChildren,
      traverse: vi.fn(),
    })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn(), x: 0, y: 0, z: 5 },
      lookAt: vi.fn(),
    })),
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
      setPixelRatio: vi.fn(),
      setSize: vi.fn(),
      setClearColor: vi.fn(),
      render: vi.fn(),
    })),
    AmbientLight: vi.fn(),
    DirectionalLight: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
    })),
    Mesh: MockMesh,
    PlaneGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    BoxGeometry: vi.fn().mockImplementation(() => ({ dispose: vi.fn() })),
    MeshStandardMaterial: vi.fn().mockImplementation(() => ({
      dispose: vi.fn(),
    })),
    Color: vi.fn(),
    Group: vi.fn().mockImplementation(() => makeMockGroup()),
  };
});

import type { SpatialScene, SpatialSceneNode } from "@atlas/shared";

function makeSceneNode(overrides: Partial<SpatialSceneNode> = {}): SpatialSceneNode {
  return {
    id: "node-1",
    name: "test-node",
    children: [],
    ...overrides,
  };
}

function makeScene(overrides: Partial<SpatialScene> = {}): SpatialScene {
  return {
    id: "scene-1",
    type: "spatial-scene",
    createdAt: "2025-06-30T12:00:00.000Z",
    mimeType: "application/json",
    dimensions: { width: 800, height: 600 },
    root: makeSceneNode({
      id: "root-1",
      name: "root",
      children: [
        makeSceneNode({ id: "ip-1", name: "image-plane" }),
        makeSceneNode({ id: "df-1", name: "depth-field" }),
      ],
    }),
    metadata: {},
    ...overrides,
  };
}

describe("Viewer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it("initializes successfully", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    expect(() => {
      viewer.initialize();
    }).not.toThrow();
    viewer.dispose();
  });

  it("calls console.log for lifecycle events", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);

    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Viewer Initialized");

    const scene = makeScene();
    viewer.loadScene(scene);
    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Scene Loaded");

    viewer.replaceScene(makeScene({ id: "scene-2" }));
    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Scene Updated");

    viewer.dispose();
    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Scene Disposed");

    logSpy.mockRestore();
  });

  it("marks as disposed after dispose", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    expect(viewer.isDisposed()).toBe(false);

    viewer.initialize();
    viewer.dispose();

    expect(viewer.isDisposed()).toBe(true);
  });

  it("initialize after dispose is a no-op", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    viewer.dispose();
    expect(viewer.isDisposed()).toBe(true);

    viewer.initialize();
    expect(viewer.isDisposed()).toBe(true);
  });

  it("loadScene is a no-op after dispose", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    viewer.dispose();

    const scene = makeScene();
    expect(() => {
      viewer.loadScene(scene);
    }).not.toThrow();
    expect(() => {
      viewer.replaceScene(scene);
    }).not.toThrow();
  });

  it("handles scene replacement with different scene ids", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();

    const scene1 = makeScene({ id: "scene-1" });
    viewer.loadScene(scene1);

    const scene2 = makeScene({ id: "scene-2" });
    expect(() => {
      viewer.replaceScene(scene2);
    }).not.toThrow();

    viewer.dispose();
  });

  it("handles empty scene graph gracefully", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 800, clientHeight: 600 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();

    const emptyScene = makeScene({
      root: makeSceneNode({ id: "root", name: "root", children: [] }),
    });
    expect(() => {
      viewer.loadScene(emptyScene);
    }).not.toThrow();

    viewer.dispose();
  });

  it("exposes canvas getter", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = { clientWidth: 400, clientHeight: 300 } as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });
    expect(viewer.canvas).toBe(canvas);
  });
});
