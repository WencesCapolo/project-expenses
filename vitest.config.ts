import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // convex-test must be inlined so its server bundle runs under vitest.
    server: { deps: { inline: ["convex-test"] } },
  },
});
