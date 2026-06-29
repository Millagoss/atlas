import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/pipeline",
    include: ["src/**/*.test.ts"],
  },
});
