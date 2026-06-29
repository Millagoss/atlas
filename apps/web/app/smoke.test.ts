import { describe, it, expect } from "vitest";
import { generateId } from "@atlas/shared";
import { loadConfig } from "@atlas/config";

describe("smoke test", () => {
  it("cross-package import from @atlas/shared resolves correctly", () => {
    const id = generateId();
    expect(id).toBeTypeOf("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("cross-package import from @atlas/config resolves correctly", () => {
    const config = loadConfig();
    expect(config.env).toBeTypeOf("string");
    expect(config.webUrl).toBe("http://localhost:3000");
  });

  it("verifies application can bootstrap dependencies", () => {
    expect(loadConfig).toBeInstanceOf(Function);
    expect(generateId).toBeInstanceOf(Function);
  });
});
