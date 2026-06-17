import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic", importSource: "react" },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "lib/__tests__/**/*.test.ts",
      "components/__tests__/return-recap-modal.test.tsx",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
