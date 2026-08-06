// lib/playground-demo-executor.ts
// Demo mode utilities: create mock pgCtx for demo playground.

import type { PgCtx } from "@/lib/playground-client";

// Create a PgCtx for demo mode (dummy project)
export function createDemoPgCtx(): PgCtx {
  return {
    slug: "playground-demo",
    userId: "demo-user",
    projectId: "demo-project-id",
    projectName: "playground-demo",
  };
}
