"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { triggerItemRecap } from "@/lib/use-journey-recap-trigger";
import { TryPlaygroundButton } from "@/components/projects/try-playground-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Play,
  CheckCircle2,
  Clock,
  Lock,
  BadgeIcon as Certificate,
  Trophy,
  Star,
  Sparkles,
  BarChart3,
  Loader2,
  RotateCcw,
  Share2,
  Link as LinkIcon,
  Download,
  ExternalLink,
  ListChecks,
  Database,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { PROJECT_EVENTS } from "@/lib/analytics-events";
import { routes } from "@/lib/routes";
import { ContentComingSoon } from "@/components/content-coming-soon";
import { stripHtmlTags } from "@/lib/html-utils";
import { sanitizeHtml } from "@/lib/sanitize";
import { isCredibleLearnerCount } from "@/lib/social-proof";
import { PaymentGateOverlay } from "../payment-gate-overlay";
import { Project } from "@/lib/data";
import { toast } from "sonner";
import ConfettiCelebration from "@/components/confetti-celebration";
import { useUser } from "@/hooks/use-user";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ScheduleWidget } from "@/components/schedule/ScheduleWidget";

interface ProjectDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function ProjectDetailPage({
  slug,
  onNavigate,
}: ProjectDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const { updateProject } = store;
  const [project, setProject] = useState<Project>();
  const [userProject, setUserProject] = useState<any>();
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [celebration, setCelebration] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function findProject(slug: string) {
      const project = await store.getProject(slug);
      setProject(project);
      setUserProject(project?.userProject);
      setLoading(false);
      if (project?.id) {
        setTimeout(() => {
          void triggerItemRecap("PROJECT", project.id);
        }, 0);
      }
      if (project) {
        analytics.track(PROJECT_EVENTS.viewed, {
          projectId: project.id,
          slug,
          isPremium: project.isPremium,
        });
      }
    }
    findProject(slug);
  }, [slug]);

  const handlePurchase = (
    projectId: string,
    method: "subscription" | "individual" | "mb",
    success: boolean,
  ) => {
    if (!project || !success) return;
    switch (method) {
      case "subscription":
        onNavigate(routes.pricing(routes.projectDetail(slug)));
        break;
      case "individual":
        break;
      case "mb":
        Object.assign(project!, { enrolled: true });
        break;
    }
    setCelebration(true);
    toast.success("You have successfully enrolled");
  };

  const handleEnrollment = async (slug: string) =>
    store.handleProjectEnrollment(slug);

  const handleContinueLearning = (s: string) => {
    onNavigate(`/projects/${s}/tasks`);
  };

  const handleEnrollNow = async () => {
    try {
      analytics.track(PROJECT_EVENTS.startClicked, {
        projectId: project?.id,
        projectTitle: project?.title,
        isPremium: !user?.isPremium,
      });
      // Free user on a premium project → payment dialog (the gate).
      if (!user?.isPremium && project?.isPremium) {
        setShowPaymentGate(!showPaymentGate);
        return;
      }
      // add from here inside dialog
      const userProject = await handleEnrollment(slug);
      if (!userProject) {
        toast.error("An error occurred. Please try again");
        return;
      }
      updateProject(project?.id!, { enrolled: true });
      Object.assign(project!, { enrolled: true });
      // Pro/enterprise enroll → straight into the first task (mirrors the cards).
      toast.success("Enrolled — taking you to your first task…");
      handleContinueLearning(project!.slug);
    } catch (error: any) {
      const e = error?.response?.message ?? error?.message;
      toast.error(e ?? "An error occurred");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if ((project as any)?.isWaiting) {
    return (
      <ContentComingSoon
        title={project?.title}
        summary={(project?.summary || "").replace(/<[^>]+>/g, "")}
        waitingLink={(project as any)?.waitingLink}
        kindLabel="project"
        backLabel="Browse Projects"
        onBack={() => onNavigate(routes.projects)}
        onWaitlistTrack={() =>
          analytics.track("project_waitlist_clicked", { title: project?.title })
        }
      />
    );
  }

  const groups: any[] = project?.projectTasks ?? [];
  const totalTasks = groups.reduce(
    (sum, g) => sum + (g?.tasks?.length ?? 0),
    0,
  );
  const totalMb = groups.reduce(
    (sum, g) =>
      sum + (g?.tasks?.reduce((s: number, t: any) => s + (t?.mb ?? 0), 0) ?? 0),
    0,
  );
  const projectLevel = project?.level || "Beginner";
  const projectProgress = Math.floor(project?.progress ?? 0);
  const isComplete = projectProgress >= 100;
  const canEarnCertificate = !!project?.enrolled && isComplete;
  const accessible = !!project?.enrolled || !project?.isPremium;

  const groupBadgeCls =
    "inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted-foreground/20";

  // ── Share helpers ──
  const shareUrl = `https://projects.masteringbackend.com/projects/${slug}?ref=app`;
  const shareText = `Check out the ${project?.title} project on MasteringBackend`;
  const openShare = (network: string, url: string) => {
    analytics.track("project_share_clicked", {
      projectId: project?.id,
      network,
    });
    window.open(url, "_blank", "noopener,noreferrer");
  };
  const shareLinkedIn = () =>
    openShare(
      "linkedin",
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`${project?.title} project`)}&summary=${encodeURIComponent(`${shareText} @masteringbackend`)}`,
    );
  const shareX = () =>
    openShare(
      "x",
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`${shareText} @master_backend`)}`,
    );
  const shareFacebook = () =>
    openShare(
      "facebook",
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    );
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Blueprint hero — navy anchor; the grid lives here only */}
      <div className="overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <div className="eyebrow-mono text-white/[.55]">project</div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">
              {project?.title}
            </h1>

            <div className="mt-4">
              {project?.enrolled ? (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    onClick={() => handleContinueLearning(project!.slug)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                  >
                    <Play className="w-4 h-4" /> Continue Building
                  </button>
                  <TryPlaygroundButton
                    source="detail"
                    slug={slug}
                    premiumLocked={Boolean(!user?.isPremium && project?.isPremium)}
                    onPremiumRequired={() => setShowPaymentGate(true)}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    disabled={enrolling}
                    onClick={handleEnrollNow}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition disabled:opacity-60"
                  >
                    {enrolling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {enrolling ? "Starting…" : "Start Building"}
                  </button>
                  <TryPlaygroundButton
                    source="detail"
                    slug={slug}
                    premiumLocked={Boolean(!user?.isPremium && project?.isPremium)}
                    onPremiumRequired={() => setShowPaymentGate(true)}
                  />
                  {(!project?.isPremium || user?.isPremium) && (
                    <span className="text-sm text-white/[.65]">
                      Free with{" "}
                      <span className="font-semibold text-white">Pro</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mt-5 text-sm text-white/[.78]">
              <span className="inline-flex items-center gap-1.5 capitalize">
                <BarChart3 className="w-4 h-4 opacity-70" />
                {projectLevel}
              </span>
              {project?.duration ? (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 opacity-70" />
                  {project.duration} hours
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 opacity-70" />
                {totalTasks || totalTasks === 0 ? totalTasks : 0} tasks
              </span>
              {totalMb > 0 && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/90 text-amber-950">
                  {totalMb} MB to earn
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion strip — enrolled only */}
        {project?.enrolled && (
          <div className="text-white px-5 sm:px-8 py-4 bg-[#0A1726] dark:bg-[#05080F]">
            <div className="eyebrow-mono text-white/[.5] mb-2">
              project completion
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
              <span className="text-sm font-semibold">{projectProgress}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Project description (rich HTML — collapsible) */}
          {(() => {
            const html = project?.description || project?.summary || "";
            if (!html) return null;
            const isLong = stripHtmlTags(html).length > 280;
            return (
              <div>
                <h3 className="font-semibold text-[15px] mb-2">
                  Project overview
                </h3>
                <div className="relative">
                  <article
                    className={`prose-sm max-w-3xl text-sm leading-relaxed text-muted-foreground [&_a]:text-amber-600 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_pre]:mt-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-3 [&_pre]:text-zinc-100 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 ${
                      isLong && !descExpanded
                        ? "max-h-[15rem] overflow-hidden"
                        : ""
                    }`}
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
                  />
                  {isLong && !descExpanded && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent" />
                  )}
                </div>
                {isLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Technologies */}
          {project?.technologies?.length ? (
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <Badge key={tech} variant="outline">
                  {tech}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Prerequisites & Skills */}
          {project?.prerequisites?.length || project?.skills?.length ? (
            <Card>
              <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
                {project?.prerequisites?.length ? (
                  <div className="space-y-2">
                    <CardTitle className="text-base">Prerequisites</CardTitle>
                    {project.prerequisites.map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {project?.skills?.length ? (
                  <div className="space-y-2">
                    <CardTitle className="text-base">
                      Skills you'll build
                    </CardTitle>
                    {project.skills.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Tasks timeline (groups → accordion items) */}
          <Card>
            <CardHeader>
              <CardTitle>Project Tasks</CardTitle>
              <CardDescription>
                {totalTasks} tasks
                {totalMb > 0 ? ` · ${totalMb} MB to earn` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pt-0">
              <div className="relative px-4 py-3">
                <div className="absolute left-[1.625rem] top-5 bottom-5 w-px bg-border" />
                <Accordion type="single" collapsible className="space-y-3">
                  {groups.map((group: any, index: number) => {
                    const completed = !!group?.isCompleted;
                    const num = index + 1;
                    const numBgCls = completed
                      ? "bg-emerald-600"
                      : "bg-foreground";
                    const groupMb =
                      group?.tasks?.reduce(
                        (s: number, t: any) => s + (t?.mb ?? 0),
                        0,
                      ) ?? 0;
                    return (
                      <AccordionItem
                        key={group.id ?? index}
                        value={group.id ?? `group-${index}`}
                        className="border-0 scroll-mt-6"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`relative z-10 mt-4 w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-background ${
                              completed ? "bg-emerald-600" : "bg-foreground/20"
                            }`}
                          />
                          <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
                            <AccordionTrigger className="w-full px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/10">
                              <div className="space-y-1.5 text-left flex-1 pr-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {completed && (
                                    <Badge className="bg-emerald-600 text-[10px] py-0 px-1.5 h-auto text-white hover:bg-emerald-700">
                                      ✓ Done
                                    </Badge>
                                  )}
                                  {group?.tasks?.length ? (
                                    <span className={groupBadgeCls}>
                                      {group.tasks.length} task
                                      {group.tasks.length > 1 ? "s" : ""}
                                    </span>
                                  ) : null}
                                  {groupMb > 0 && (
                                    <span className="text-[10px] font-semibold text-amber-600">
                                      +{groupMb} MB
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white ${numBgCls}`}
                                  >
                                    {String(num).padStart(2, "0")}
                                  </span>
                                  <span className="font-bold text-sm leading-snug">
                                    {group?.title}
                                  </span>
                                  {!accessible && (
                                    <Lock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                  )}
                                </div>
                                {group?.summary && (
                                  <p className="text-xs text-muted-foreground">
                                    {stripHtmlTags(group.summary)}
                                  </p>
                                )}
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-0">
                              <div className="border-t pt-3 space-y-3">
                                {group?.tasks?.length ? (
                                  <ul className="space-y-2.5">
                                    {group.tasks.map(
                                      (task: any, ti: number) => (
                                        <li
                                          key={task.id ?? ti}
                                          className="flex items-start gap-2 text-sm"
                                        >
                                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                          <span className="flex-1 min-w-0">
                                            <span className="block text-foreground/90 font-medium">
                                              {task?.title}
                                            </span>
                                            {task?.technologies?.length ? (
                                              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                                <Database className="h-3 w-3" />
                                                {task.technologies.join(", ")}
                                              </span>
                                            ) : null}
                                          </span>
                                          {task?.mb ? (
                                            <span className="flex-shrink-0 text-[11px] font-semibold text-amber-600">
                                              +{task.mb} MB
                                            </span>
                                          ) : null}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                ) : null}

                                {completed ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs w-full"
                                    onClick={() =>
                                      handleContinueLearning(project!.slug)
                                    }
                                  >
                                    <RotateCcw className="h-3 w-3 mr-1" />
                                    Review Tasks
                                  </Button>
                                ) : accessible ? (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs w-full"
                                    onClick={() =>
                                      project?.enrolled
                                        ? handleContinueLearning(project.slug)
                                        : handleEnrollNow()
                                    }
                                    disabled={enrolling}
                                  >
                                    {enrolling ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Play className="h-3 w-3 mr-1" />
                                    )}
                                    {project?.enrolled
                                      ? "Continue"
                                      : "Start Building"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs w-full"
                                    disabled={enrolling}
                                    onClick={handleEnrollNow}
                                  >
                                    {enrolling ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Lock className="h-3 w-3 mr-1" />
                                    )}
                                    {enrolling
                                      ? "Starting…"
                                      : "Enroll to Unlock"}
                                  </Button>
                                )}
                              </div>
                            </AccordionContent>
                          </div>
                        </div>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-6 self-start">
          {showPaymentGate && (
            <PaymentGateOverlay
              open={showPaymentGate}
              onClose={() => setShowPaymentGate(false)}
              itemTitle={project?.title ?? "this project"}
              stage="build"
              variant="centered"
              purchasable={{ ...project, type: "project" }}
              allowOneTime={false}
              onPurchased={(id: string, method: string, success: boolean) =>
                handlePurchase(id, method as any, success)
              }
            />
          )}

          {/* Primary action — start (cold) or continue (warm) */}
          {project?.enrolled ? (
            <>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-[15px]">
                    Your progress
                  </span>
                  <span className="font-bold text-primary">
                    {projectProgress}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-muted mb-4">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
                <button
                  onClick={() => handleContinueLearning(project.slug)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                >
                  <Play className="w-4 h-4" />
                  Continue Building
                </button>
                <TryPlaygroundButton
                  source="detail-sidebar"
                  slug={slug}
                  className="mt-2 w-full"
                  premiumLocked={Boolean(!user?.isPremium && project?.isPremium)}
                  onPremiumRequired={() => setShowPaymentGate(true)}
                />

                {(project?.PRDLink || project?.frontendURL) && (
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                    {project?.PRDLink && (
                      <a
                        href={project.PRDLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        <Download className="h-4 w-4" /> Download PRD
                      </a>
                    )}
                    {project?.frontendURL && (
                      <a
                        href={project.frontendURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" /> Preview frontend
                      </a>
                    )}
                  </div>
                )}
              </div>

              {userProject?.id && <ScheduleWidget projectId={userProject.id} />}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="text-2xl font-bold mb-1">
                {!project?.isPremium || user?.isPremium ? (
                  <span className="flex items-baseline gap-2">
                    Free
                    <span className="text-sm font-medium text-muted-foreground">
                      with Pro
                    </span>
                  </span>
                ) : (
                  <span className="text-lg">Premium membership</span>
                )}
              </div>

              {(() => {
                const builders = project?.students || 0;
                if (isCredibleLearnerCount(builders)) {
                  return (
                    <div className="text-sm text-muted-foreground mb-4">
                      {builders.toLocaleString()} builders enrolled
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <Sparkles className="w-3 h-3" />
                      Newly launched
                    </span>
                    <span className="text-muted-foreground">
                      Be among the first to ship it
                    </span>
                  </div>
                );
              })()}

              <button
                disabled={enrolling}
                onClick={handleEnrollNow}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-3 text-sm hover:bg-primary/90 transition disabled:opacity-60"
              >
                {enrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                {enrolling ? "Starting…" : "Start Building"}
              </button>

              <TryPlaygroundButton
                source="detail-sidebar"
                slug={slug}
                className="mt-2 w-full"
                premiumLocked={Boolean(!user?.isPremium && project?.isPremium)}
                onPremiumRequired={() => setShowPaymentGate(true)}
              />

              <p className="mt-3 text-xs text-center text-muted-foreground">
                {!project?.isPremium || user?.isPremium
                  ? "Build at your own pace · Earn a verified certificate"
                  : "Earn a verified certificate"}
              </p>

              {(project?.PRDLink || project?.frontendURL) && (
                <div className="mt-3 flex flex-col gap-1.5 border-t border-border pt-3">
                  {project?.PRDLink && (
                    <a
                      href={project.PRDLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                      <Download className="h-4 w-4" /> Download PRD
                    </a>
                  )}
                  {project?.frontendURL && (
                    <a
                      href={project.frontendURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-4 w-4" /> Preview frontend
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Certification Card */}
          <Card
            className={`rounded-2xl ${
              canEarnCertificate
                ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    canEarnCertificate
                      ? "bg-emerald-100 dark:bg-emerald-950/40"
                      : "bg-primary/10"
                  }`}
                >
                  {canEarnCertificate ? (
                    <Trophy className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <Certificate className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Project Certificate</CardTitle>
                  <CardDescription className="text-sm">
                    {canEarnCertificate
                      ? "Ready to claim!"
                      : "Complete project to earn"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {canEarnCertificate
                    ? "Congratulations! You've shipped the project and earned your certificate."
                    : "Complete every task to earn your verified, shareable certificate."}
                </p>

                {totalMb > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
                    <span className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
                      <Trophy className="h-4 w-4" />
                      {canEarnCertificate ? "MB earned" : "MB to earn"}
                    </span>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {totalMb} MB
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Shareable on LinkedIn</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verifiable credential</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Industry recognized</span>
                </div>
              </div>

              {canEarnCertificate ? (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleContinueLearning(project!.slug)}
                >
                  <Certificate className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
              ) : project?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <Certificate className="mr-2 h-4 w-4" />
                  Complete Project to Earn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleEnrollNow}
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Certificate className="mr-2 h-4 w-4" />
                  )}
                  {enrolling ? "Starting…" : "Start to Earn Certificate"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Share */}
          {(() => {
            const tileCls =
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-xs font-semibold text-muted-foreground transition-colors";
            return (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="flex items-center gap-2 font-semibold text-[15px] mb-1">
                  <Share2 className="w-4 h-4" />
                  Share this project
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Help a friend build their backend portfolio.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={shareLinkedIn}
                    aria-label="Share on LinkedIn"
                    className={`${tileCls} hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z" />
                    </svg>
                    LinkedIn
                  </button>
                  <button
                    onClick={shareX}
                    aria-label="Share on X"
                    className={`${tileCls} hover:border-foreground hover:bg-foreground hover:text-background`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    X
                  </button>
                  <button
                    onClick={shareFacebook}
                    aria-label="Share on Facebook"
                    className={`${tileCls} hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.86.24-1.45 1.48-1.45H17V4.1c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9V10H8.2v3h2.72v8z" />
                    </svg>
                    Facebook
                  </button>
                </div>
                <button
                  onClick={copyShareLink}
                  aria-label="Copy link"
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <LinkIcon className="w-4 h-4" />
                  Copy link
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      <ConfettiCelebration
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={project?.title ?? "Project"}
        onComplete={() => setCelebration(false)}
      />
    </div>
  );
}
