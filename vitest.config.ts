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
      "hooks/__tests__/**/*.test.ts",
      "hooks/__tests__/**/*.test.tsx",
      "lib/__tests__/**/*.test.ts",
      "lib/__tests__/**/*.test.tsx",
      "components/__tests__/error-boundary.test.tsx",
      "components/__tests__/path-exercise-ide-continue.test.tsx",
      "components/__tests__/path-exercise-ide-max-attempts.test.tsx",
      "components/__tests__/take-hint-ide.test.tsx",
      "components/__tests__/streaming-output.test.tsx",
      "components/__tests__/return-recap-modal.test.tsx",
      "components/__tests__/mock-interview-anchors.test.tsx",
      "components/__tests__/demo-chat-interview-room.test.tsx",
      "components/__tests__/announcement-banner.test.tsx",
      "components/__tests__/try-mock-interview-button.test.tsx",
      "components/__tests__/interview-completion-dialog-cta.test.tsx",
      "components/__tests__/simple-editor-run.test.tsx",
      "components/__tests__/github-connect-disconnect.test.tsx",
      "components/__tests__/page-skeleton.test.tsx",
      "components/__tests__/onboarding-upsell.test.tsx",
      "components/__tests__/payment-gate-overlay.test.tsx",
      "components/pages/path/__tests__/step-skeleton.test.tsx",
      "components/pages/path/__tests__/step-paywall.test.tsx",
      "components/pages/path/__tests__/path-workspace-gating.test.tsx",
      "components/pages/path/__tests__/step-stage-gated.test.tsx",
      "components/pages/path/__tests__/path-feedback-dialog.test.tsx",
      "components/pages/__tests__/courses-skeleton.test.tsx",
      "components/atoms/__tests__/terminal-run-api.test.tsx",
      "components/pages/__tests__/project-playground-terminal-mode.test.tsx",
      "components/pages/__tests__/pricing-enterprise-card.test.tsx",
      "components/pages/__tests__/pricing-plan-features.test.tsx",
      "components/pages/__tests__/checkout-seat-selector.test.tsx",
      "components/team/__tests__/invite-dialog.test.tsx",
      "components/pages/__tests__/team-invite-gating.test.tsx",
      "components/pages/__tests__/team-overview-filter-failure.test.tsx",
      "components/team/__tests__/member-progress-sheet.test.tsx",
      "components/team/__tests__/group-members-dialog.test.tsx",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
