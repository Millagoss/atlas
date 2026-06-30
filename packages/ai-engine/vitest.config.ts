import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/ai-engine",
    include: ["src/**/*.test.ts"],
  },
});
