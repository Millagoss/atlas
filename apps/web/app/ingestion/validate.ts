// app/ingestion/validate — Pure image-file validation.
//
// Validation is deliberately decoupled from the DOM `File` type. It accepts a
// minimal structural shape ({ name, size, type }) so it is trivially unit-
// testable with plain objects and reusable for non-browser sources.

import type { AtlasResult } from "@atlas/shared";
import { MAX_IMAGE_FILE_SIZE, SUPPORTED_IMAGE_TYPE_SET } from "./constants.js";

/**
 * Minimal structural shape validated by {@link validateImageFile}.
 *
 * The browser `File` type satisfies this structurally, but tests can pass plain
 * objects without constructing real blobs.
 */
export interface ImageFileInput {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

/** Error codes emitted by image-file validation. */
export type ImageFileError =
  "FILE_EMPTY" | "FILE_TOO_LARGE" | "FILE_UNSUPPORTED_TYPE" | "FILE_MISSING_TYPE";

/**
 * Validate a candidate image file against the ingestion rules.
 *
 * Rules, in order:
 * 1. `type` must be non-empty.
 * 2. `type` must be one of {@link SUPPORTED_IMAGE_TYPES}.
 * 3. `size` must be greater than zero (reject empty files).
 * 4. `size` must not exceed {@link MAX_IMAGE_FILE_SIZE}.
 *
 * @example
 * ```ts
 * const result = validateImageFile({ name: "a.png", size: 1024, type: "image/png" });
 * if (result.ok) {
 *   // proceed with result.data
 * }
 * ```
 */
export function validateImageFile(file: ImageFileInput): AtlasResult<ImageFileInput> {
  if (!file.type) {
    return {
      ok: false,
      error: { code: "FILE_MISSING_TYPE", message: "File is missing a MIME type." },
    };
  }

  if (!SUPPORTED_IMAGE_TYPE_SET.has(file.type)) {
    return {
      ok: false,
      error: {
        code: "FILE_UNSUPPORTED_TYPE",
        message: `Unsupported file type "${file.type}". Supported: JPEG, PNG, WEBP.`,
      },
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      error: { code: "FILE_EMPTY", message: "File is empty." },
    };
  }

  if (file.size > MAX_IMAGE_FILE_SIZE) {
    const mib = Math.round(MAX_IMAGE_FILE_SIZE / (1024 * 1024));
    return {
      ok: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File is ${String(file.size)} bytes; maximum is ${String(mib)} MiB.`,
      },
    };
  }

  return { ok: true, data: file };
}
