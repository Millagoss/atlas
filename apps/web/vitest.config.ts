import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "@atlas/web",
    include: ["app/**/*.test.{ts,tsx}"],
  },
});
