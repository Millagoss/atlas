import { describe, it, expect, vi, beforeEach } from "vitest";

const sceneChildren: unknown[] = [];

function resetState() {
  sceneChildren.length = 0;
}

function mkEventTarget(): Record<string, unknown> {
  const listeners: Record<string, ((...args: unknown[]) => void)[]> = {};
  return {
    addEventListener: vi.fn((type: string, fn: (...args: unknown[]) => void) => {
      listeners[type] ??= [];
      listeners[type].push(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: (...args: unknown[]) => void) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((l) => l !== fn);
      }
    }),
    getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, left: 0, top: 0 })),
    _listeners: listeners,
  };
}

function makeCanvas(): Record<string, unknown> {
  return {
    clientWidth: 800,
    clientHeight: 600,
    ...mkEventTarget(),
  };
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
  const makeVec3Like = (ax = 0, ay = 0, az = 0): Record<string, unknown> => ({
    x: ax,
    y: ay,
    z: az,
    set: vi.fn(),
    copy: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    add: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    distanceTo: vi.fn(() => 5),
    subVectors: vi.fn(() => makeVec3Like()),
    normalize: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    crossVectors: vi.fn(() => makeVec3Like()),
    addScaledVector: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    multiplyScalar: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    setFromSpherical: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
  });

  const makeVec3 = vi
    .fn()
    .mockImplementation((x?: number, y?: number, z?: number) => makeVec3Like(x, y, z));
  const makeVec2 = vi.fn().mockImplementation(() => ({
    x: 0,
    y: 0,
    set: vi.fn(),
    copy: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    subVectors: vi.fn(() => ({ x: 0, y: 0, lengthSq: vi.fn(() => 0) })),
    multiplyScalar: vi.fn(() => ({ x: 0, y: 0 })),
    lengthSq: vi.fn(() => 0),
  }));

  const MockMesh = vi.fn().mockImplementation(() => ({
    geometry: { dispose: mkDispose() },
    material: { dispose: mkDispose() },
    position: Object.assign(makeVec3Like(), { z: 0 }),
    children: [],
    traverse: vi.fn((cb: (n: unknown) => void) => {
      cb({
        geometry: { dispose: mkDispose() },
        material: { dispose: mkDispose() },
      });
    }),
  }));
  (MockMesh as unknown as Record<string, unknown>)["prototype"] = {};

  const cameraObj = (): Record<string, unknown> => ({
    position: Object.assign(makeVec3Like(), { x: 0, y: 0, z: 5 }),
    lookAt: vi.fn(),
    fov: 50,
    up: { x: 0, y: 1, z: 0 },
  });

  const sphereObj = (): Record<string, unknown> => {
    const s: Record<string, unknown> = {
      radius: 5,
      phi: Math.PI / 4,
      theta: Math.PI / 4,
      set: vi.fn(function (this: Record<string, unknown>, r: number, p: number, t: number) {
        this["radius"] = r;
        this["phi"] = p;
        this["theta"] = t;
      }),
      setFromVector3: vi.fn(),
    };
    return s;
  };

  const boxObj = (): Record<string, unknown> => ({
    isEmpty: vi.fn(() => false),
    setFromObject: vi.fn(function (this: Record<string, unknown>) {
      return this;
    }),
    getCenter: vi.fn((v: Record<string, unknown>) => {
      (v["set"] as (...args: number[]) => void)(0, 0, 0);
    }),
    getSize: vi.fn((v: Record<string, unknown>) => {
      (v["set"] as (...args: number[]) => void)(1, 1, 1);
    }),
  });

  return {
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn((obj: unknown) => {
        sceneChildren.push(obj);
      }),
      children: sceneChildren,
      traverse: vi.fn(),
    })),
    PerspectiveCamera: vi.fn().mockImplementation(cameraObj),
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
    Vector2: makeVec2,
    Vector3: makeVec3,
    Spherical: vi.fn().mockImplementation(sphereObj),
    Box3: vi.fn().mockImplementation(boxObj),
    MathUtils: {
      clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      DEG2RAD: Math.PI / 180,
    },
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
    const winListeners: Record<string, ((...args: unknown[]) => void)[]> = {};
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, fn: (...args: unknown[]) => void) => {
        winListeners[type] ??= [];
        winListeners[type].push(fn);
      }),
      removeEventListener: vi.fn((type: string, fn: (...args: unknown[]) => void) => {
        if (winListeners[type]) {
          winListeners[type] = winListeners[type].filter((l) => l !== fn);
        }
      }),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
    });
  });

  it("initializes successfully", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    expect(() => {
      viewer.initialize();
    }).not.toThrow();
    viewer.dispose();
  });

  it("calls console.log for lifecycle events", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);

    const { Viewer } = await import("../viewer.js");
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
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
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    expect(viewer.isDisposed()).toBe(false);

    viewer.initialize();
    viewer.dispose();

    expect(viewer.isDisposed()).toBe(true);
  });

  it("initialize after dispose is a no-op", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    viewer.dispose();
    expect(viewer.isDisposed()).toBe(true);

    viewer.initialize();
    expect(viewer.isDisposed()).toBe(true);
  });

  it("loadScene is a no-op after dispose", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
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
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
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
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
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
    const canvas = {
      clientWidth: 400,
      clientHeight: 300,
      ...mkEventTarget(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });
    expect(viewer.canvas).toBe(canvas);
  });

  it("initializes camera controls and logs Camera Initialized", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);

    const { Viewer } = await import("../viewer.js");
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();

    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Camera Initialized");

    viewer.dispose();
    logSpy.mockRestore();
  });

  it("returns camera state after initialization", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();

    const state = viewer.getCameraState();
    expect(state).not.toBeNull();
    expect(state?.position.z).toBeGreaterThan(0);
    expect(state?.target.x).toBe(0);
    expect(state?.target.y).toBe(0);
    expect(state?.target.z).toBe(0);

    viewer.dispose();
  });

  it("returns navigation mode after initialization", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();

    const mode = viewer.getNavigationMode();
    expect(mode).toBe("idle");

    viewer.dispose();
  });

  it("resetCamera logs Camera Reset", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(noop);

    const { Viewer } = await import("../viewer.js");
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    logSpy.mockClear();

    viewer.resetCamera();
    expect(logSpy).toHaveBeenCalledWith("[Atlas Viewer] Camera Reset");

    viewer.dispose();
    logSpy.mockRestore();
  });

  it("returns null camera state before initialization", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = makeCanvas() as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    expect(viewer.getCameraState()).toBeNull();
    expect(viewer.getNavigationMode()).toBeNull();
  });

  it("returns null camera state after dispose", async () => {
    const { Viewer } = await import("../viewer.js");
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    viewer.dispose();

    expect(viewer.getCameraState()).toBeNull();
    expect(viewer.getNavigationMode()).toBeNull();
  });

  it("cleanup removes event listeners on dispose", async () => {
    const { Viewer } = await import("../viewer.js");
    const removeSpy = vi.fn();
    const canvas = {
      clientWidth: 800,
      clientHeight: 600,
      addEventListener: vi.fn(),
      removeEventListener: removeSpy,
    } as unknown as HTMLCanvasElement;
    const viewer = new Viewer({ canvas });

    viewer.initialize();
    viewer.dispose();

    expect(removeSpy).toHaveBeenCalled();
  });
});
