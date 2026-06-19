import { defineConfig } from "vitest/config";
import path from "path";
import { transform as sucraseTransform } from "sucrase";

// Sucrase-based transformer for .tsx/.jsx — needed because no @vitejs/plugin-react
// is installed in this project. Only applied to component test files.
const sucrasePlugin = {
  name: "sucrase-tsx",
  transform(code: string, id: string) {
    if (!id.endsWith(".tsx") && !id.endsWith(".jsx")) return null;
    const result = sucraseTransform(code, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "automatic",
      production: false,
      filePath: id,
    });
    return { code: result.code, map: result.sourceMap };
  },
};

export default defineConfig({
  plugins: [sucrasePlugin],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    include: [
      "lib/__tests__/**/*.test.ts",
      "components/__tests__/path-exercise-ide-continue.test.tsx",
      "components/__tests__/take-hint-ide.test.tsx",
      "components/__tests__/streaming-output.test.tsx",
      "components/__tests__/return-recap-modal.test.tsx",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
