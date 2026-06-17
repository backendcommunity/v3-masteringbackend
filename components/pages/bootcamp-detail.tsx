"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sanitizeHtml } from "@/lib/sanitize";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Target,
  Code2,
  Play,
  Sparkles,
  Layers,
  Lock,
  Award,
  CheckCircle2,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { Bootcamp } from "@/lib/data";
import { Loader } from "../ui/loader";
import { toast } from "sonner";
import Countdown from "../ui/count-down";
import DisqusCommentBlock from "../ui/comment";
import { routes } from "@/lib/routes";
import { PaymentDialog } from "../payment-dialog";
import { useUser } from "@/hooks/use-user";
import { Accordion } from "../ui/accordion";

interface BootcampDetailPageProps {
  bootcampId: string;
  onNavigate?: (route: string) => void;
}

export function BootcampDetailPage({
  bootcampId,
  onNavigate,
}: BootcampDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState("overview");
  const [bootcamp, setBootcamp] = useState<Bootcamp | any>();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [bonusCourses, setBonusCourses] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const bootcamp = await store.getBootcamp(bootcampId);
        setBootcamp({
          ...bootcamp,
        });
        setLoading(false);
        if (bootcamp) {
          analytics.track("bootcamp_viewed", {
            bootcampId,
            bootcampTitle: bootcamp.title,
            isEnrolled: bootcamp.enrolled ?? false,
          });
        }
      } catch (error) {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootcampId]);

  useEffect(() => {
    let cancelled = false;

    if (active !== "bonus") return;

    const load = async () => {
      try {
        const id = bootcamp?.cohort?.id;
        const bonuses = await store.getBootcampBonuses(bootcampId, id);
        if (!cancelled) {
          setBonusCourses(bonuses);
        }
      } catch (error) {}
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [active, bootcamp?.cohort?.id, bootcampId, store]);

  if (loading) return <Loader isLoader={false} />;

  if (!bootcamp) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Bootcamp not found</h1>
          <Button onClick={() => onNavigate?.("/bootcamps")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bootcamps
          </Button>
        </div>
      </div>
    );
  }

  const enrollInBootcamp = async (id: string, cohort: string) => {
    if (!cohort) return;

    analytics.track("bootcamp_enroll_clicked", {
      bootcampId: id,
      bootcampTitle: bootcamp?.title,
      cohort,
    });

    try {
      // Try to enroll directly - backend validates subscription/payment
      const userCohort = await store.enrollInBootcamp(id, cohort);
      if (!userCohort) {
        toast.warning("An error occurred. Please try again");
        return;
      }

      setBootcamp((prev: Bootcamp) => ({
        ...prev,
        enrolled: true,
        userCohort,
      }));
      toast.success("You have successfully enrolled");
    } catch (error: any) {
      // Check if payment is required (402 status)
      if (error?.response?.status === 402) {
        setShowPaymentDialog(true);
        return;
      }
      toast.error(
        error?.response?.data?.message || "An error occurred. Please try again",
      );
    }
  };

  const handlePurchase = async (id: string, type: string, success: any) => {
    if (!success) return;

    if (type === "individual") {
      // Paddle payment — webhook will handle enrollment
      // Show processing message and poll for enrollment status
      toast.info("Payment received! Your enrollment is being processed...");
      setShowPaymentDialog(false);

      // Poll after 5s to refresh bootcamp data
      setTimeout(async () => {
        try {
          const updated = await store.getBootcamp(bootcampId);
          if (updated?.enrolled) {
            setBootcamp(updated);
            toast.success("You have successfully enrolled");
          } else {
            toast.info(
              "Enrollment processing... Please check back in a moment",
            );
          }
        } catch (error) {
          // Silently fail — user can refresh manually
        }
      }, 5000);
      return;
    }

    if (type === "mb") {
      // MB payment — backend handles enrollment atomically
      try {
        const updated = await store.getBootcamp(bootcampId);
        if (updated?.enrolled) {
          setBootcamp(updated);
          toast.success("You have successfully enrolled with MB points");
        } else {
          toast.error("Enrollment failed. Please try again.");
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
      }
      return;
    }
  };

  const started =
    new Date(bootcamp?.userCohort?.cohort!?.startsAt) < new Date();

  return (
    <div className="flex-1 space-y-6">
      {/* Back link */}
      <button
        onClick={() => onNavigate?.("/bootcamps")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition"
      >
        <ArrowLeft className="h-4 w-4" /> Bootcamps
      </button>

      {/* Blueprint detail hero — navy anchor; the grid lives here only */}
      <div className="overflow-hidden rounded-2xl dark:ring-1 dark:ring-white/10">
        <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative">
          <div className="hero-grid absolute inset-0" aria-hidden="true" />
          <div className="relative px-5 py-6 sm:px-8 sm:py-7">
            <div className="eyebrow-mono text-white/[.55]">bootcamp</div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <h1 className="text-3xl font-bold">{bootcamp?.title}</h1>
              {bootcamp?.cohort?.name && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/20 text-[#4AC5E8] border border-primary/30">
                  {bootcamp.cohort.name}
                </span>
              )}
            </div>

            <div className="mt-4">
              {bootcamp?.enrolled ? (
                <button
                  onClick={() =>
                    onNavigate?.(`/bootcamps/${bootcampId}/dashboard`)
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                >
                  <Play className="w-4 h-4" /> Continue Bootcamp
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      enrollInBootcamp(bootcampId, bootcamp?.cohort?.id)
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                  >
                    <Sparkles className="w-4 h-4" /> Apply Now
                  </button>
                  <span className="text-sm text-white/[.65]">
                    {bootcamp?.cohort?.amount ? (
                      <span className="font-semibold text-white">
                        ${bootcamp.cohort.amount?.toLocaleString()}
                      </span>
                    ) : (
                      <>
                        Free with{" "}
                        <span className="font-semibold text-white">Pro</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 mt-5 text-sm text-white/[.78]">
              {bootcamp?.cohort?.duration > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-4 h-4 opacity-70" />
                  {bootcamp.cohort.duration} weeks
                </span>
              )}
              {bootcamp?.cohort?.weeks?.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-4 h-4 opacity-70" />
                  {bootcamp.cohort.weeks.length} modules
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion strip — enrolled only */}
        {bootcamp?.enrolled && (
          <div className="text-white px-5 sm:px-8 py-4 bg-[#0A1726] dark:bg-[#05080F]">
            <div className="eyebrow-mono text-white/[.5] mb-2">
              bootcamp completion
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full overflow-hidden bg-white/[.12]">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${bootcamp?.userCohort?.progress ?? 0}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {bootcamp?.userCohort?.progress ?? 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      {bootcamp?.description && (
        <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
          {bootcamp?.description}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress stats (if enrolled) — progress bar lives in the hero strip */}
          {bootcamp?.enrolled && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-primary" />
                  Your Bootcamp Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {bootcamp?.userCohort?.totalLessonsCompleted ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Modules Completed
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {bootcamp?.userCohort?.projectBuilt}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Projects Built
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {bootcamp?.userCohort?.totalAssigments}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Assigments Completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Banner (when provided) */}
          {bootcamp?.banner && (
            <Card className="overflow-hidden rounded-2xl border-border p-0">
              <img
                src={bootcamp.banner}
                alt={bootcamp?.cohort?.name}
                className="w-full aspect-video object-cover"
              />
            </Card>
          )}

          {/* Tabs */}
          <Tabs value={active} onValueChange={setActive} className="w-full">
            <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent p-0 h-auto">
              {[
                { value: "overview", label: "Overview" },
                { value: "curriculum", label: "Curriculum" },
                { value: "bonus", label: "Bonuses" },
                { value: "reviews", label: "Reviews" },
              ].map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="rounded-xl border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-none"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <div className="eyebrow-mono text-muted-foreground mb-1">
                    what you&apos;ll learn
                  </div>
                  <CardTitle className="text-lg">Skills you&apos;ll build</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {bootcamp?.topics?.map(
                      (
                        topic: { title: string; summary: string },
                        i: number,
                      ) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Code2 className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-bold leading-snug">
                              {topic.title}
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {topic.summary}
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <div className="eyebrow-mono text-muted-foreground mb-1">
                    curriculum
                  </div>
                  <CardTitle className="text-lg">
                    {bootcamp?.cohort?.duration}-week program
                  </CardTitle>
                  <CardDescription>
                    Cohort-based path to master {bootcamp.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bootcamp?.cohort?.weeks?.map(
                    (module: any, index: number) => {
                      const done = module?.status === "completed";
                      const current = module?.status === "current";
                      return (
                        <div
                          key={index}
                          className={`rounded-xl border p-4 ${
                            done
                              ? "border-emerald-500/30 bg-emerald-500/[.06]"
                              : current
                                ? "border-primary/40 bg-primary/[.04]"
                                : "border-border"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                  done
                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                    : current
                                      ? "bg-primary/15 text-primary"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {done ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  index + 1
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-[15px] font-bold leading-snug">
                                  {module?.title}
                                </h4>
                                {module?.summary && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {module.summary}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  done
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    : bootcamp?.enrolled
                                      ? "bg-primary/10 text-primary"
                                      : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {!bootcamp?.enrolled && (
                                  <Lock className="h-3 w-3" />
                                )}
                                {done
                                  ? "Completed"
                                  : bootcamp?.enrolled
                                    ? "In progress"
                                    : "Locked"}
                              </span>
                              {bootcamp?.enrolled &&
                                module?.status !== "locked" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() =>
                                      onNavigate?.(
                                        `/bootcamps/${bootcampId}/${bootcamp?.userCohort?.cohortId}/weeks/${module.id}`,
                                      )
                                    }
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                            </div>
                          </div>
                          {module?.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pl-11">
                              {module?.tags?.map((tag: string, i: number) => (
                                <span
                                  key={i}
                                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bonus" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">
                    Bonus Resources
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Find all the bonus courses, resources and more information
                    here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {bonusCourses.map(({ id, course, video, resource }) => {
                      if (course)
                        return (
                          <div key={id} className="space-y-4  pb-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Course
                                {/* TODO: show videos and resources */}
                              </h4>
                              <Card key={course.id} className="overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                  <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                    <img
                                      src={course?.banner || "/placeholder.svg"}
                                      alt={course?.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div>
                                        <h5 className="font-medium">
                                          {course?.title}
                                        </h5>
                                        <article
                                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(course?.summary) }}
                                          className="text-sm text-muted-foreground [&>*>span]:!text-black [&>p]:text-black dark:[&>*>span]:!text-muted-foreground dark:[&>p]:text-muted-foreground"
                                        ></article>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {course.type}
                                        </Badge>
                                        <Badge variant="outline">
                                          {course?.totalDuration ?? 0} mins
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <PlayCircle className="h-4 w-4 text-primary" />
                                        <span className="text-sm">
                                          {course.chapters?.length} chapters
                                        </span>
                                      </div>

                                      {bootcamp?.enrolled ? (
                                        <a
                                          target="_blank"
                                          href={routes.courseDetail(
                                            course?.slug,
                                          )}
                                        >
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            View Course
                                          </Button>
                                        </a>
                                      ) : (
                                        <Button
                                          className="w-full"
                                          onClick={() =>
                                            enrollInBootcamp(
                                              bootcampId,
                                              bootcamp?.cohort?.id,
                                            )
                                          }
                                        >
                                          Apply Now
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        );
                      if (video)
                        return (
                          <div key={id} className="space-y-4  pb-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Video
                              </h4>
                              <Card key={video.id} className="overflow-hidden">
                                <div className="flex flex-col md:flex-row">
                                  <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                    <img
                                      src={video?.banner || "/placeholder.svg"}
                                      alt={video?.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div>
                                        <h5 className="font-medium">
                                          {video?.title}
                                        </h5>

                                        <article
                                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(video?.summary) }}
                                          className="text-xs text-muted-foreground"
                                        ></article>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline">
                                          {video.type}
                                        </Badge>
                                        <Badge variant="outline">
                                          {video?.duration ?? 0}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      {bootcamp?.enrolled ? (
                                        <a target="_blank" href={"#"}>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            Watch Video
                                          </Button>
                                        </a>
                                      ) : (
                                        <Button
                                          className="w-full"
                                          onClick={() =>
                                            enrollInBootcamp(
                                              bootcampId,
                                              bootcamp?.cohort?.id,
                                            )
                                          }
                                        >
                                          Apply Now
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        );
                      if (resource)
                        return (
                          <div key={id} className="space-y-4  pb-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-primary" />
                                Resource
                              </h4>
                              <Card
                                key={resource.id}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-col md:flex-row">
                                  <div className="w-full md:w-1/4 h-40 md:h-auto bg-muted">
                                    <img
                                      src={
                                        resource.banner || "/placeholder.svg"
                                      }
                                      alt={resource.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 p-4">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                      <div>
                                        <h5 className="font-medium">
                                          {resource.title}
                                        </h5>

                                        <article
                                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(resource?.summary) }}
                                          className="text-xs text-muted-foreground"
                                        ></article>
                                      </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                      {bootcamp?.enrolled ? (
                                        <a target="_blank" href={resource.link}>
                                          <Button
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                            }}
                                          >
                                            View Resource
                                          </Button>
                                        </a>
                                      ) : (
                                        <Button
                                          className="w-full"
                                          onClick={() =>
                                            enrollInBootcamp(
                                              bootcampId,
                                              bootcamp?.cohort?.id,
                                            )
                                          }
                                        >
                                          Apply Now
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </div>
                          </div>
                        );
                    })}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <DisqusCommentBlock
                      config={{
                        identifier: bootcampId,
                        title: bootcamp?.title,
                        url: `/bootcamps/${bootcampId}`,
                      }}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card className="rounded-2xl border-border">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center gap-2">
                {bootcamp?.level && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      bootcamp?.level === "Advanced"
                        ? "bg-red-500/10 text-red-600 dark:text-red-400"
                        : bootcamp?.level === "Intermediate"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {bootcamp?.level}
                  </span>
                )}
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    started
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {started
                    ? "In progress"
                    : (bootcamp?.cohort?.status ?? "Not enrolled")}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-3xl font-bold">
                  ${bootcamp?.cohort?.amount?.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Full program cost
                </p>
              </div>

              <div className="space-y-3 text-sm border-t border-border/60 pt-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 opacity-70" />
                    Start date
                  </span>
                  <span className="font-medium">
                    {new Date(bootcamp?.cohort?.startsAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 opacity-70" />
                    Duration
                  </span>
                  <span className="font-medium">
                    {bootcamp?.cohort?.duration} weeks
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 opacity-70" />
                    Spots left
                  </span>
                  <span className="font-semibold">
                    {bootcamp?.cohort?.spotsLeft}
                  </span>
                </div>
              </div>

              {bootcamp?.enrolled && (
                <div className="rounded-lg border border-primary/20 bg-primary/[.04] p-3">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">
                      Recording availability:
                    </strong>{" "}
                    Session recordings are available 24–48 hours after each live
                    class.
                  </p>
                </div>
              )}

              {bootcamp?.enrolled ? (
                <div className="space-y-2">
                  <span className="flex items-center justify-center gap-1.5 w-full rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 py-2 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Enrolled
                  </span>

                  {!started ? (
                    <Button variant={"secondary"} className="w-full">
                      <Countdown
                        startDate={bootcamp?.userCohort?.cohort!?.startsAt}
                      ></Countdown>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() =>
                        onNavigate?.(`/bootcamps/${bootcampId}/dashboard`)
                      }
                    >
                      <Play className="mr-2 h-4 w-4" /> Access Bootcamp
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() =>
                    enrollInBootcamp(bootcampId, bootcamp?.cohort?.id)
                  }
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Apply Now
                </Button>
              )}
            </CardContent>
          </Card>

          <Card
            className={`rounded-2xl ${
              bootcamp?.userCohort?.progress >= 100
                ? "border-emerald-500/30 bg-emerald-500/[.05]"
                : "border-border"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    bootcamp?.userCohort?.progress >= 100
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <div className="eyebrow-mono text-muted-foreground mb-0.5">
                    certificate
                  </div>
                  <CardTitle className="text-base">
                    Bootcamp certificate
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bootcamp?.userCohort?.progress >= 100
                  ? "Congratulations! You've completed the bootcamp and earned your certificate."
                  : "Complete all weeks and pass the final assessment to earn your verified certificate."}
              </p>

              {bootcamp?.enrolled && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progress to certificate
                    </span>
                    <span className="font-semibold">
                      {Math.floor(bootcamp?.userCohort?.progress)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        bootcamp?.userCohort?.progress >= 100
                          ? "bg-emerald-500"
                          : "bg-primary"
                      }`}
                      style={{
                        width: `${Math.floor(bootcamp?.userCohort?.progress)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {[
                  "Shareable on LinkedIn",
                  "Verifiable credential",
                  "Industry recognized",
                ].map((t) => (
                  <div
                    key={t}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/80" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              {bootcamp?.enrolled && bootcamp?.userCohort?.progress >= 100 ? (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() =>
                    onNavigate?.(routes.bootcampCertificate(bootcampId))
                  }
                >
                  <Award className="mr-2 h-4 w-4" />
                  View certificate
                </Button>
              ) : bootcamp?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <Award className="mr-2 h-4 w-4" />
                  Complete bootcamp to earn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    enrollInBootcamp(bootcampId, bootcamp.cohort.id)
                  }
                >
                  <Award className="mr-2 h-4 w-4" />
                  Enroll to earn certificate
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentDialog
        onClose={() => setShowPaymentDialog(false)}
        open={showPaymentDialog}
        data={{
          ...bootcamp,
          type: "bootcamp",
          plan: "Enterprise",
          amount: bootcamp?.cohort?.amount,
          id: bootcamp?.cohort?.id,
          bootcampId: bootcampId,
          paddle_price_id: bootcamp?.cohort?.paddle_price_id,
          asyncpay_plan_id: bootcamp?.cohort?.asyncpay_plan_id,
        }}
        disableSubscription={bootcamp?.cohort?.allowsSubscription === false}
        onHandlePreview={() => {}}
        onHandlePurchase={(id: string, type: any, success: boolean) =>
          handlePurchase(id, type, success)
        }
      />
    </div>
  );
}
