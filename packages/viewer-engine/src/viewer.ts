import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  Mesh,
  PlaneGeometry,
  MeshStandardMaterial,
  BoxGeometry,
  Color,
  Group,
  type Object3D,
} from "three";
import type { SpatialScene, SpatialSceneNode } from "@atlas/shared";

export type ViewerLifecycleEvent =
  "viewer:initialized" | "viewer:scene-loaded" | "viewer:scene-updated" | "viewer:disposed";

export interface ViewerConfig {
  canvas: HTMLCanvasElement;
}

export class Viewer {
  private renderer: WebGLRenderer | null = null;
  private scene: Scene | null = null;
  private camera: PerspectiveCamera | null = null;
  private sceneGroup: Group | null = null;
  private animationId: number | null = null;
  private disposed = false;

  constructor(private readonly config: ViewerConfig) {}

  get canvas(): HTMLCanvasElement {
    return this.config.canvas;
  }

  initialize(): void {
    if (this.disposed) return;

    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio : 1;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.renderer.setClearColor(new Color(0x1a1a2e));

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      50,
      this.canvas.clientWidth / Math.max(this.canvas.clientHeight, 1),
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    const ambient = new AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const directional = new DirectionalLight(0xffffff, 0.8);
    directional.position.set(2, 3, 4);
    this.scene.add(directional);

    this.sceneGroup = new Group();
    this.scene.add(this.sceneGroup);

    this.startRenderLoop();
    console.log("[Atlas Viewer] Viewer Initialized");
  }

  loadScene(spatialScene: SpatialScene): void {
    if (this.disposed || !this.scene || !this.sceneGroup) return;

    this.clearSceneGroup();
    this.buildSceneGraph(spatialScene, this.sceneGroup);

    const isUpdate = this.sceneGroup.children.length > 0;
    if (isUpdate) {
      console.log("[Atlas Viewer] Scene Loaded");
    }
  }

  replaceScene(spatialScene: SpatialScene): void {
    if (this.disposed || !this.scene || !this.sceneGroup) return;

    this.clearSceneGroup();
    this.buildSceneGraph(spatialScene, this.sceneGroup);
    console.log("[Atlas Viewer] Scene Updated");
  }

  dispose(): void {
    if (this.disposed) return;

    this.stopRenderLoop();
    this.clearSceneGroup();

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.sceneGroup = null;
    this.disposed = true;

    console.log("[Atlas Viewer] Scene Disposed");
  }

  isDisposed(): boolean {
    return this.disposed;
  }

  private clearSceneGroup(): void {
    if (!this.sceneGroup) return;
    while (this.sceneGroup.children.length > 0) {
      const child = this.sceneGroup.children[0];
      if (child) {
        this.disposeObject(child);
        this.sceneGroup.remove(child);
      }
    }
  }

  private disposeObject(object: Object3D): void {
    const collectAndDispose = (obj: Object3D): void => {
      if (obj instanceof Mesh) {
        const meshObj = obj as Mesh;
        meshObj.geometry.dispose();
        const mat = meshObj.material;
        if (Array.isArray(mat)) {
          for (const m of mat) {
            m.dispose();
          }
        } else {
          mat.dispose();
        }
      }
      for (const child of obj.children) {
        collectAndDispose(child);
      }
    };
    collectAndDispose(object);
  }

  private buildSceneGraph(spatialScene: SpatialScene, parent: Group): void {
    const { width, height } = spatialScene.dimensions;
    const maxDim = Math.max(width, height);
    const aspect = maxDim > 0 ? width / height : 1;

    const sceneRoot = new Group();
    sceneRoot.name = spatialScene.root.name;
    sceneRoot.userData = { nodeId: spatialScene.root.id };

    for (const childNode of spatialScene.root.children) {
      const childGroup = this.createNodeMesh(childNode, maxDim, aspect);
      sceneRoot.add(childGroup);
    }

    parent.add(sceneRoot);
  }

  private createNodeMesh(node: SpatialSceneNode, maxDim: number, aspect: number): Group {
    const group = new Group();
    group.name = node.name;
    group.userData = { nodeId: node.id };

    let mesh: Mesh;

    switch (node.name) {
      case "image-plane": {
        const geometry = new PlaneGeometry(aspect, 1);
        const material = new MeshStandardMaterial({
          color: new Color(0x4a6fa5),
          roughness: 0.5,
          metalness: 0.1,
          side: 2,
        });
        mesh = new Mesh(geometry, material);
        mesh.position.z = 0;
        break;
      }
      case "depth-field": {
        const geometry = new PlaneGeometry(aspect, 1);
        const material = new MeshStandardMaterial({
          color: new Color(0x8b5cf6),
          roughness: 0.7,
          metalness: 0.05,
          wireframe: true,
        });
        mesh = new Mesh(geometry, material);
        mesh.position.z = -0.5;
        break;
      }
      default: {
        const geometry = new BoxGeometry(0.3, 0.3, 0.3);
        const material = new MeshStandardMaterial({
          color: new Color(0xffffff),
          roughness: 0.5,
          metalness: 0.1,
        });
        mesh = new Mesh(geometry, material);
        break;
      }
    }

    group.add(mesh);

    for (const child of node.children) {
      const childGroup = this.createNodeMesh(child, maxDim, aspect);
      group.add(childGroup);
    }

    return group;
  }

  private startRenderLoop(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    if (typeof requestAnimationFrame === "undefined") return;

    const animate = () => {
      if (this.disposed) return;
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  private stopRenderLoop(): void {
    if (this.animationId !== null && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

export function createViewer(config: ViewerConfig): Viewer {
  return new Viewer(config);
}
