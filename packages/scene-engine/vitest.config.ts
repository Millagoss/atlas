import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/scene-engine",
    include: ["src/**/*.test.ts"],
  },
});
