"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PathProjectTasks } from "@/components/pages/path/steps/path-project-tasks";
import { PathFeedbackDialog } from "@/components/pages/path/path-feedback-dialog";
import { PathCodeSheet } from "@/components/pages/path/path-code-sheet";

type ProjectTasksRouteProps = {
  slug: string;
};

// Standalone project tasks — same full-bleed, playground-style layout as the
// in-path project step (resizable Tasks/Kap rail + article-block content). No
// dashboard sidebar/navbar; a slim top bar (logo → dashboard, breadcrumb,
// feedback) sits above the shared PathProjectTasks workspace.
export default function ProjectTasksRoute() {
  const router = useRouter();
  const { slug } = useParams() as ProjectTasksRouteProps;
  const [title, setTitle] = useState("");

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="z-10 flex items-center justify-between gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            title="Go to dashboard"
            aria-label="Go to dashboard"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0E1F33] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src="/main-logo.png"
              alt="Mastering Backend"
              width={32}
              height={32}
              className="h-full w-full object-cover"
            />
          </button>
          <nav className="flex min-w-0 items-center gap-1.5 text-sm">
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Build
            </button>
            <span className="text-muted-foreground/50">›</span>
            <span className="truncate font-semibold">{title || "Project"}</span>
          </nav>
        </div>
        <div className="flex items-center gap-0.5">
          <PathCodeSheet />
          <PathFeedbackDialog />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <PathProjectTasks
          projectId={slug}
          onNavigate={(path) => router.push(path)}
          backHref={`/projects/${slug}`}
          onProjectLoaded={(p) => setTitle(p.title ?? "")}
        />
      </div>
    </main>
  );
}
