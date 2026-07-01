import type { DepthInferenceLogger } from "./logger.js";
import { DEFAULT_DEPTH_MODEL } from "./constants.js";

export type ExecutionBackend = "webgpu" | "wasm";

export interface DepthModelConfig {
  readonly onnxUrl: string;
  readonly externalDataUrl: string;
  readonly externalDataPath: string;
}

export interface DepthInferenceOutput {
  readonly values: Float32Array;
  readonly width: number;
  readonly height: number;
}

export interface DepthOnnxSession {
  readonly backend: ExecutionBackend;
  run(
    input: Float32Array,
    inputShape: readonly number[],
    width: number,
    height: number,
  ): Promise<DepthInferenceOutput>;
}

interface OrtTensor {
  readonly dims: readonly number[];
  readonly data: Float32Array;
}

interface OrtInferenceSession {
  readonly inputNames: readonly string[];
  readonly outputNames: readonly string[];
  run(feeds: Record<string, OrtTensor>): Promise<Record<string, OrtTensor>>;
}

interface OrtExternalData {
  readonly path: string;
  readonly data: string | Uint8Array;
}

interface OrtSessionOptions {
  executionProviders?: string[];
  externalData?: OrtExternalData[];
}

interface OrtModule {
  InferenceSession: {
    create(url: string, options?: OrtSessionOptions): Promise<OrtInferenceSession>;
  };
  Tensor: new (type: string, data: Float32Array, dims: readonly number[]) => OrtTensor;
  env: {
    wasm: { wasmPaths: string };
  };
}

let cachedSession: Promise<DepthOnnxSession> | null = null;
let cachedModelKey: string | null = null;

async function loadOrt(): Promise<OrtModule> {
  const mod = (await import("onnxruntime-web")) as OrtModule;
  mod.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.21.0/dist/";
  return mod;
}

function modelCacheKey(model: DepthModelConfig): string {
  return `${model.onnxUrl}|${model.externalDataUrl}`;
}

function buildSessionOptions(
  model: DepthModelConfig,
  executionProviders: string[],
): OrtSessionOptions {
  return {
    executionProviders,
    externalData: [
      {
        path: model.externalDataPath,
        data: model.externalDataUrl,
      },
    ],
  };
}

async function createSession(
  model: DepthModelConfig,
  logger: DepthInferenceLogger,
): Promise<DepthOnnxSession> {
  const ort = await loadOrt();
  logger.log("info", "Model download started");

  let backend: ExecutionBackend = "wasm";
  let session: OrtInferenceSession;

  try {
    session = await ort.InferenceSession.create(
      model.onnxUrl,
      buildSessionOptions(model, ["webgpu"]),
    );
    backend = "webgpu";
  } catch {
    session = await ort.InferenceSession.create(
      model.onnxUrl,
      buildSessionOptions(model, ["wasm"]),
    );
    backend = "wasm";
  }

  logger.log("info", "Model ready");
  logger.log("info", `Execution backend: ${backend}`);

  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  if (!inputName || !outputName) {
    throw new Error("ONNX model is missing input or output tensor names");
  }

  return {
    backend,
    async run(input, inputShape, width, height) {
      const tensor = new ort.Tensor("float32", input, inputShape);
      const result = await session.run({ [inputName]: tensor });
      const output = result[outputName];
      if (!output) {
        throw new Error(`ONNX model did not return output tensor "${outputName}"`);
      }
      const [outHeight, outWidth] = resolveOutputShape(output.dims, width, height);
      return { values: output.data, width: outWidth, height: outHeight };
    },
  };
}

function resolveOutputShape(
  dims: readonly number[],
  fallbackWidth: number,
  fallbackHeight: number,
): [number, number] {
  if (dims.length === 4) {
    return [dims[2] ?? fallbackHeight, dims[3] ?? fallbackWidth];
  }
  if (dims.length === 3) {
    return [dims[1] ?? fallbackHeight, dims[2] ?? fallbackWidth];
  }
  if (dims.length === 2) {
    return [dims[0] ?? fallbackHeight, dims[1] ?? fallbackWidth];
  }
  const side = Math.round(Math.sqrt(dims[dims.length - 1] ?? fallbackWidth * fallbackHeight));
  return [side, side];
}

/** Lazily load and cache the ONNX inference session. */
export function getOrCreateDepthSession(
  model: DepthModelConfig,
  logger: DepthInferenceLogger,
): Promise<DepthOnnxSession> {
  const key = modelCacheKey(model);
  if (cachedSession && cachedModelKey === key) {
    return cachedSession;
  }

  cachedModelKey = key;
  cachedSession = createSession(model, logger);
  return cachedSession;
}

/** Reset cached session (tests only). */
export function resetDepthSessionCache(): void {
  cachedSession = null;
  cachedModelKey = null;
}

export function getDefaultModelConfig(): DepthModelConfig {
  return { ...DEFAULT_DEPTH_MODEL };
}

/** @deprecated Use {@link getDefaultModelConfig}. */
export function getDefaultModelUrl(): string {
  return DEFAULT_DEPTH_MODEL.onnxUrl;
}
