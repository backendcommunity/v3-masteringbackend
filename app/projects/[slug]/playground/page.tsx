"use client";

import { useParams, useRouter } from "next/navigation";
import { ProjectPlaygroundPage } from "@/components/pages/project-playground";

type ProjectPlaygroundPageRouteProps = {
  slug: string;
};

// Full-bleed, distraction-free — same layout structure as the path workspace:
// no global navbar/sidebar. The playground renders in its NATIVE (non-embedded)
// mode so it keeps its own top bar (breadcrumb + Run/Preview/Restart/theme/GitHub
// icons) and self-sizes to the viewport.
export default function ProjectPlaygroundPageRoute() {
  const router = useRouter();
  const { slug } = useParams() as ProjectPlaygroundPageRouteProps;

  return (
    <main className="h-screen overflow-hidden bg-background">
      <ProjectPlaygroundPage
        slug={slug}
        onNavigate={(path: string) => router.push(path)}
      />
    </main>
  );
}
