import { IMAGE_MEAN, IMAGE_STD, MODEL_INPUT_SIZE } from "./constants.js";

export interface RgbaImage {
  readonly pixels: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
}

/** Bilinear resize of RGBA pixels to a square target size. */
export function resizeRgba(source: RgbaImage, targetSize: number = MODEL_INPUT_SIZE): RgbaImage {
  const { pixels, width, height } = source;
  const out = new Uint8ClampedArray(targetSize * targetSize * 4);

  const sample = (index: number): number => pixels[index] ?? 0;

  for (let y = 0; y < targetSize; y++) {
    const srcY = (y / targetSize) * height;
    const y0 = Math.floor(srcY);
    const y1 = Math.min(y0 + 1, height - 1);
    const yFrac = srcY - y0;

    for (let x = 0; x < targetSize; x++) {
      const srcX = (x / targetSize) * width;
      const x0 = Math.floor(srcX);
      const x1 = Math.min(x0 + 1, width - 1);
      const xFrac = srcX - x0;

      for (let c = 0; c < 3; c++) {
        const i00 = (y0 * width + x0) * 4 + c;
        const i10 = (y0 * width + x1) * 4 + c;
        const i01 = (y1 * width + x0) * 4 + c;
        const i11 = (y1 * width + x1) * 4 + c;
        const top = sample(i00) * (1 - xFrac) + sample(i10) * xFrac;
        const bottom = sample(i01) * (1 - xFrac) + sample(i11) * xFrac;
        const value = top * (1 - yFrac) + bottom * yFrac;
        out[(y * targetSize + x) * 4 + c] = Math.round(value);
      }
      out[(y * targetSize + x) * 4 + 3] = 255;
    }
  }

  return { pixels: out, width: targetSize, height: targetSize };
}

/** Normalize resized RGBA pixels into NCHW float tensor data. */
export function rgbaToNchwTensor(
  image: RgbaImage,
  targetSize: number = MODEL_INPUT_SIZE,
): Float32Array {
  const resized =
    image.width === targetSize && image.height === targetSize
      ? image
      : resizeRgba(image, targetSize);
  const tensor = new Float32Array(3 * targetSize * targetSize);
  const planeSize = targetSize * targetSize;

  for (let i = 0; i < planeSize; i++) {
    const base = i * 4;
    const r = (resized.pixels[base] ?? 0) / 255;
    const g = (resized.pixels[base + 1] ?? 0) / 255;
    const b = (resized.pixels[base + 2] ?? 0) / 255;
    tensor[i] = (r - IMAGE_MEAN[0]) / IMAGE_STD[0];
    tensor[planeSize + i] = (g - IMAGE_MEAN[1]) / IMAGE_STD[1];
    tensor[2 * planeSize + i] = (b - IMAGE_MEAN[2]) / IMAGE_STD[2];
  }

  return tensor;
}
