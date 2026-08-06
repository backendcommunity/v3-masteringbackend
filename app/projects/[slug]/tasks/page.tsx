"use client";

import Image from "next/image";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Award, X, Zap } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PathProjectTasks } from "@/components/pages/path/steps/path-project-tasks";
import { PathFeedbackDialog } from "@/components/pages/path/path-feedback-dialog";
import { PathCodeSheet } from "@/components/pages/path/path-code-sheet";
import { PathCertificate } from "@/components/pages/path/path-certificate";
import { Button } from "@/components/ui/button";

type ProjectTasksRouteProps = {
  slug: string;
};

// Standalone project tasks — same full-bleed, playground-style layout as the
// in-path project step (resizable Tasks/Kap rail + article-block content). No
// dashboard sidebar/navbar; a slim top bar (logo → dashboard, breadcrumb,
// feedback) sits above the shared PathProjectTasks workspace.
//
// Unlike the in-path step, this surface also offers a project CERTIFICATE: once
// the project is complete (cert unlocked) a "Certificate ready" CTA appears in
// the header and opens the shared PathCertificate celebration UI as an overlay.
export default function ProjectTasksRoute() {
  const router = useRouter();
  const store = useAppStore();
  const { slug } = useParams() as ProjectTasksRouteProps;
  const [title, setTitle] = useState("");
  const [certUnlocked, setCertUnlocked] = useState(false);
  const [showCert, setShowCert] = useState(false);
  const [points, setPoints] = useState({ earnedPoints: 0, totalPoints: 0 });
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Once the project has loaded, check whether the certificate is unlocked so we
  // can surface the "Certificate ready" CTA. Failures are silent — the CTA just
  // stays hidden; the tasks workspace is unaffected.
  const handleProjectLoaded = async (project: { title?: string }) => {
    setTitle(project.title ?? "");
    try {
      const cert = await store.getProjectCertificate(slug);
      if (cert?.unlocked) setCertUnlocked(true);
    } catch {
      // Non-blocking: leave the CTA hidden.
    }
  };

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
        <div className="flex items-center gap-1.5">
          {points.totalPoints > 0 && (
            <span
              title="MB earned building this project"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
            >
              <Zap className="h-3.5 w-3.5" />
              {points.earnedPoints} / {points.totalPoints} MB
            </span>
          )}
          {certUnlocked && (
            <Button
              size="sm"
              onClick={() => setShowCert(true)}
              className="mr-1 gap-1.5"
            >
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Certificate ready 🎉</span>
              <span className="sm:hidden">Certificate</span>
            </Button>
          )}
          <PathCodeSheet />
          <PathFeedbackDialog
            open={feedbackOpen}
            onOpenChange={setFeedbackOpen}
            source="tasks-page"
            context={{ projectSlug: slug }}
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">
        <PathProjectTasks
          projectId={slug}
          onNavigate={(path) => router.push(path)}
          backHref={`/projects/${slug}`}
          onProjectLoaded={handleProjectLoaded}
          onViewCertificate={() => setShowCert(true)}
          onProgress={setPoints}
        />
      </div>

      {/* Certificate overlay — reuses the shared PathCertificate celebration UI
          (same PathCertificate data shape) rendered over the workspace. */}
      {showCert && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span className="truncate font-semibold">
                {title || "Project"} Certificate
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCert(false)}
              aria-label="Close certificate"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <PathCertificate
              slug={slug}
              pathTitle={title || "Project"}
              fetcher={store.getProjectCertificate}
              showAlumniLounge={false}
              kind="project"
            />
          </div>
        </div>
      )}
    </main>
  );
}
