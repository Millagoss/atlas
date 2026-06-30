import { describe, it, expect } from "vitest";
import { validateImageFile, MAX_IMAGE_FILE_SIZE } from "../index";
import type { ImageFileInput } from "../index";

function file(overrides: Partial<ImageFileInput>): ImageFileInput {
  return { name: "photo.png", size: 1024, type: "image/png", ...overrides };
}

describe("validateImageFile", () => {
  it("accepts a supported PNG of normal size", () => {
    const result = validateImageFile(file({ type: "image/png", size: 1024 }));
    expect(result.ok).toBe(true);
  });

  it("accepts JPEG and WEBP", () => {
    expect(validateImageFile(file({ type: "image/jpeg" })).ok).toBe(true);
    expect(validateImageFile(file({ type: "image/webp" })).ok).toBe(true);
  });

  it("rejects an unsupported type", () => {
    const result = validateImageFile(file({ type: "image/gif" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FILE_UNSUPPORTED_TYPE");
      expect(result.error.message).toMatch(/gif/);
    }
  });

  it("rejects a missing MIME type", () => {
    const result = validateImageFile(file({ type: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FILE_MISSING_TYPE");
  });

  it("rejects an empty file", () => {
    const result = validateImageFile(file({ size: 0 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("FILE_EMPTY");
  });

  it("rejects an oversized file", () => {
    const result = validateImageFile(file({ size: MAX_IMAGE_FILE_SIZE + 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("FILE_TOO_LARGE");
      expect(result.error.message).toMatch(/bytes/);
    }
  });

  it("accepts a file exactly at the size limit", () => {
    const result = validateImageFile(file({ size: MAX_IMAGE_FILE_SIZE }));
    expect(result.ok).toBe(true);
  });
});
