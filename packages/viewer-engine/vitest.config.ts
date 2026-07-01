import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/viewer-engine",
    include: ["src/**/*.test.ts"],
  },
});
