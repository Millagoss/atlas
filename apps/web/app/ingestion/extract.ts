// app/ingestion/extract — Image metadata extraction.
//
// Extraction requires browser APIs (object URLs, `Image` decoding) to read
// pixel dimensions and build a preview URL, so it is modelled as an injectable
// strategy: the orchestrator depends on the {@link ImageMetadataExtractor}
// interface and the default browser implementation is supplied only at the
// composition root. Tests inject fakes that need no DOM.

import type { AtlasResult, Dimensions } from "@atlas/shared";

/** Metadata extracted from a candidate image file. */
export interface ExtractedImageMeta {
  /** Pixel dimensions of the source image. */
  readonly dimensions: Dimensions;
  /** Object URL (or equivalent) usable as an `<img src>` for preview. */
  readonly previewUrl: string;
}

/**
 * Strategy interface for reading image metadata from a `File`.
 *
 * Implementations are also responsible for surface-level corruption detection
 * where practical: a file that cannot be decoded should be reported as a
 * failure rather than producing a partially-populated asset.
 */
export interface ImageMetadataExtractor {
  extract(file: File): Promise<AtlasResult<ExtractedImageMeta>>;
}

/**
 * Default browser extractor.
 *
 * Uses `URL.createObjectURL` + an `Image` element to read `naturalWidth` /
 * `naturalHeight`. `Image.onerror` maps to a corruption/decode failure, which
 * gives practical corrupted-file detection without a full decoder dependency.
 */
export function createBrowserImageExtractor(): ImageMetadataExtractor {
  return {
    async extract(file: File): Promise<AtlasResult<ExtractedImageMeta>> {
      const previewUrl = URL.createObjectURL(file);

      try {
        const { naturalWidth, naturalHeight } = await loadNaturalDimensions(previewUrl);

        if (naturalWidth <= 0 || naturalHeight <= 0) {
          return {
            ok: false,
            error: {
              code: "IMAGE_DECODE_FAILED",
              message: "Image has non-positive dimensions.",
            },
          };
        }

        return {
          ok: true,
          data: {
            dimensions: { width: naturalWidth, height: naturalHeight },
            previewUrl,
          },
        };
      } catch (err) {
        URL.revokeObjectURL(previewUrl);
        const message = err instanceof Error ? err.message : "Image could not be decoded.";
        return {
          ok: false,
          error: { code: "IMAGE_DECODE_FAILED", message },
        };
      }
    },
  };
}

/** Resolve an image URL to its natural pixel dimensions. */
function loadNaturalDimensions(
  url: string,
): Promise<{ naturalWidth: number; naturalHeight: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error("Image could not be decoded."));
    };
    img.src = url;
  });
}
