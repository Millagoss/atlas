import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/shared",
    include: ["src/**/*.test.ts"],
  },
});
