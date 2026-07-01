import type { RgbaImage } from "./preprocess.js";

/** Load RGBA pixels from a browser image URL. */
export function loadRgbaFromUrl(url: string): Promise<RgbaImage> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined" || typeof document === "undefined") {
      reject(new Error("Image loading is only available in a browser environment"));
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to acquire 2D canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve({
        pixels: imageData.data,
        width: canvas.width,
        height: canvas.height,
      });
    };
    img.onerror = () => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}
