import {
  type PerspectiveCamera,
  Vector2,
  Vector3,
  Spherical,
  Box3,
  MathUtils,
  type Object3D,
} from "three";

export interface CameraState {
  readonly position: { readonly x: number; readonly y: number; readonly z: number };
  readonly target: { readonly x: number; readonly y: number; readonly z: number };
}

export type NavigationMode = "idle" | "orbiting" | "panning" | "zooming";

export type NavigationEvent = "navigation-started" | "navigation-ended";

export type NavigationCallback = (event: NavigationEvent, mode: NavigationMode) => void;

const ORBIT_BUTTON = 0;
const PAN_BUTTON = 1;
const MIN_DISTANCE = 0.5;
const MAX_DISTANCE = 100;
const ORBIT_SPEED = 0.5;
const PAN_SPEED = 1.0;
const ZOOM_SPEED = 1.0;

export class CameraControls {
  private camera: PerspectiveCamera;
  private domElement: HTMLElement;
  private target = new Vector3(0, 0, 0);
  private spherical = new Spherical();
  private enabled = false;
  private disposed = false;

  private isDragging = false;
  private previousMouse = new Vector2();
  private currentMouse = new Vector2();
  private currentMode: NavigationMode = "idle";

  private onMouseDown: (event: MouseEvent) => void;
  private onMouseMove: (event: MouseEvent) => void;
  private onMouseUp: (event: MouseEvent) => void;
  private onWheel: (event: WheelEvent) => void;
  private onContextMenu: (event: Event) => void;

  private listeners = new Set<NavigationCallback>();

  constructor(camera: PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.spherical.setFromVector3(new Vector3().subVectors(camera.position, this.target));

    this.onMouseDown = this.handleMouseDown.bind(this);
    this.onMouseMove = this.handleMouseMove.bind(this);
    this.onMouseUp = this.handleMouseUp.bind(this);
    this.onWheel = this.handleWheel.bind(this);
    this.onContextMenu = (e: Event) => {
      e.preventDefault();
    };
  }

  get mode(): NavigationMode {
    return this.currentMode;
  }

  get cameraState(): CameraState {
    return {
      position: {
        x: roundTo(this.camera.position.x, 2),
        y: roundTo(this.camera.position.y, 2),
        z: roundTo(this.camera.position.z, 2),
      },
      target: {
        x: roundTo(this.target.x, 2),
        y: roundTo(this.target.y, 2),
        z: roundTo(this.target.z, 2),
      },
    };
  }

  enable(): void {
    if (this.disposed || this.enabled) return;
    this.enabled = true;
    const el = this.domElement;
    el.addEventListener("mousedown", this.onMouseDown);
    el.addEventListener("wheel", this.onWheel, { passive: false });
    el.addEventListener("contextmenu", this.onContextMenu);
    console.log("[Atlas Viewer] Camera Initialized");
  }

  disable(): void {
    if (!this.enabled) return;
    this.endInteraction();
    const el = this.domElement;
    el.removeEventListener("mousedown", this.onMouseDown);
    el.removeEventListener("wheel", this.onWheel);
    el.removeEventListener("contextmenu", this.onContextMenu);
    this.enabled = false;
  }

  addListener(cb: NavigationCallback): void {
    this.listeners.add(cb);
  }

  removeListener(cb: NavigationCallback): void {
    this.listeners.delete(cb);
  }

  resetForScene(object: Object3D): void {
    if (this.disposed) return;

    const box = new Box3().setFromObject(object);
    if (box.isEmpty()) {
      this.target.set(0, 0, 0);
      this.camera.position.set(0, 0, 5);
      this.camera.lookAt(this.target);
      this.spherical.setFromVector3(new Vector3().subVectors(this.camera.position, this.target));
    } else {
      const center = new Vector3();
      box.getCenter(center);
      const size = new Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.camera.fov * (Math.PI / 180);
      const distance = (maxDim / (2 * Math.tan(fov / 2))) * 1.5;

      this.target.copy(center);
      this.spherical.set(distance, Math.PI / 4, Math.PI / 4);
      this.updateCameraFromSpherical();
    }

    console.log("[Atlas Viewer] Scene Framed");
  }

  resetCamera(): void {
    if (this.disposed) return;
    this.target.set(0, 0, 0);
    this.spherical.set(5, Math.PI / 4, Math.PI / 4);
    this.updateCameraFromSpherical();
    console.log("[Atlas Viewer] Camera Reset");
  }

  dispose(): void {
    this.disable();
    this.listeners.clear();
    this.disposed = true;
  }

  private emit(event: NavigationEvent): void {
    for (const cb of this.listeners) {
      cb(event, this.currentMode);
    }
  }

  private startInteraction(mode: NavigationMode): void {
    if (this.currentMode === "idle") {
      this.currentMode = mode;
      this.emit("navigation-started");
      console.log("[Atlas Viewer] Navigation Started");
    } else {
      this.currentMode = mode;
    }
  }

  private endInteraction(): void {
    if (this.currentMode !== "idle") {
      this.currentMode = "idle";
      this.isDragging = false;
      this.emit("navigation-ended");
      console.log("[Atlas Viewer] Navigation Ended");
    }
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  private handleMouseDown(event: MouseEvent): void {
    if (this.disposed || !this.enabled) return;

    event.preventDefault();
    this.isDragging = true;
    this.previousMouse.set(event.clientX, event.clientY);

    if (event.button === ORBIT_BUTTON) {
      this.startInteraction("orbiting");
    } else if (event.button === PAN_BUTTON) {
      this.startInteraction("panning");
    }

    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);
  }

  private handleMouseMove(event: MouseEvent): void {
    if (this.disposed || !this.enabled || !this.isDragging) return;

    this.currentMouse.set(event.clientX, event.clientY);
    const delta = new Vector2().subVectors(this.currentMouse, this.previousMouse);

    if (delta.lengthSq() === 0) return;

    const rect = this.domElement.getBoundingClientRect();
    const ndc = new Vector2((delta.x / rect.width) * 2, -(delta.y / rect.height) * 2);

    switch (this.currentMode) {
      case "orbiting":
        this.orbit(ndc);
        break;
      case "panning":
        this.pan(ndc);
        break;
    }

    this.previousMouse.copy(this.currentMouse);
  }

  private handleMouseUp(_event: MouseEvent): void {
    if (this.disposed || !this.enabled) return;
    this.endInteraction();
  }

  private handleWheel(event: WheelEvent): void {
    if (this.disposed || !this.enabled) return;

    event.preventDefault();
    const wasIdle = this.currentMode === "idle";
    this.currentMode = "zooming";

    if (wasIdle) {
      this.emit("navigation-started");
    }

    const delta = Math.sign(event.deltaY) * ZOOM_SPEED * 0.2;
    this.spherical.radius += delta;
    this.spherical.radius = MathUtils.clamp(this.spherical.radius, MIN_DISTANCE, MAX_DISTANCE);
    this.updateCameraFromSpherical();

    if (!this.zoomTimeout) {
      this.zoomTimeout = window.setTimeout(() => {
        this.zoomTimeout = null;
        if (this.currentMode === "zooming") {
          this.currentMode = "idle";
          this.emit("navigation-ended");
          console.log("[Atlas Viewer] Navigation Ended");
        }
      }, 300);
    } else {
      clearTimeout(this.zoomTimeout);
      this.zoomTimeout = window.setTimeout(() => {
        this.zoomTimeout = null;
        if (this.currentMode === "zooming") {
          this.currentMode = "idle";
          this.emit("navigation-ended");
          console.log("[Atlas Viewer] Navigation Ended");
        }
      }, 300);
    }
  }

  private zoomTimeout: number | null = null;

  private orbit(delta: Vector2): void {
    this.spherical.theta -= delta.x * ORBIT_SPEED;
    this.spherical.phi -= delta.y * ORBIT_SPEED;
    this.spherical.phi = MathUtils.clamp(this.spherical.phi, 0.01, Math.PI - 0.01);
    this.updateCameraFromSpherical();
  }

  private pan(delta: Vector2): void {
    const distance = this.camera.position.distanceTo(this.target);
    const panDelta = new Vector3(delta.x, delta.y, 0).multiplyScalar(distance * PAN_SPEED);

    const right = new Vector3();
    const up = new Vector3();
    const forward = new Vector3().subVectors(this.target, this.camera.position).normalize();
    right.crossVectors(forward, this.camera.up).normalize();
    up.crossVectors(right, forward).normalize();

    const offset = new Vector3()
      .addScaledVector(right, -panDelta.x)
      .addScaledVector(up, -panDelta.y);

    this.target.add(offset);
    this.camera.position.add(offset);
    this.spherical.setFromVector3(new Vector3().subVectors(this.camera.position, this.target));
  }

  private updateCameraFromSpherical(): void {
    const position = new Vector3().setFromSpherical(this.spherical).add(this.target);
    this.camera.position.copy(position);
    this.camera.lookAt(this.target);
  }
}

function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
