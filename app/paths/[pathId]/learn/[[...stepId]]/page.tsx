"use client";

import { PathWorkspace } from "@/components/pages/path-workspace";
import { useParams, useRouter } from "next/navigation";

export default function PathLearnRoute() {
  const router = useRouter();
  const params = useParams() as { pathId: string; stepId?: string[] };
  // Step ids contain colons (e.g. "t1:VIDEO:v1") so selectStep percent-encodes
  // them into the URL. Decode here so the (re)mounted workspace initializes
  // currentStepId to the real id — otherwise the first selection (which flips
  // the optional catch-all from empty→populated and remounts the page) seeds an
  // encoded id that matches no step → "Select a step to begin".
  const raw = params.stepId?.[0];
  const stepId = raw ? decodeURIComponent(raw) : undefined;

  // Full-bleed, distraction-free: no global navbar/sidebar — only the
  // workspace's own PathTopBar. The watch page owns the whole viewport.
  return (
    <main className="h-screen overflow-hidden bg-background">
      <PathWorkspace
        pathId={params.pathId}
        initialStepId={stepId}
        onNavigate={(path) => router.push(path)}
      />
    </main>
  );
}
