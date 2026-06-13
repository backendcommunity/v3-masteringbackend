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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Users,
  Target,
  Code2,
  Trophy,
  Play,
  Sparkles,
  Layers,
  CheckCircle2,
  BadgeIcon,
  BookOpen,
  PlayCircle,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { Bootcamp, Week } from "@/lib/data";
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

  const currentWeekIndex = (weekId: string) => {
    return bootcamp?.cohort?.weeks.findIndex((w: Week) => w.id === weekId) + 1;
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

          {/* Hero Card */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-[#0E1F33] flex items-center justify-center">
              {/* TODO: Add a video here */}
              {bootcamp?.banner ? (
                <img src={bootcamp.banner} alt={bootcamp?.cohort?.name} />
              ) : (
                <div className="text-center text-white">
                  <Trophy className="h-16 w-16 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold">
                    Intensive Backend Bootcamp
                  </h2>
                  <p className="text-blue-100 mt-2">
                    Transform your career in {bootcamp?.cohort?.duration} weeks
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={active} onValueChange={setActive} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="bonus">Bonuses</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>What You'll Learn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {bootcamp?.topics?.map(
                      (
                        topic: { title: string; summary: string },
                        i: number,
                      ) => (
                        <div key={i} className="flex items-start gap-3">
                          <Code2 className="h-5 w-5 text-primary mt-0.5" />
                          <div>
                            <h4 className="font-medium">{topic.title}</h4>
                            <p className="text-sm text-muted-foreground">
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
              <Card>
                <CardHeader>
                  <CardTitle>
                    {bootcamp?.cohort?.duration}-Week Curriculum
                  </CardTitle>
                  <CardDescription>
                    Comprehensive cohort-based program to help you learn{" "}
                    {bootcamp.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bootcamp?.cohort?.weeks?.map(
                    (module: any, index: number) => (
                      <div
                        key={index}
                        className={`border rounded-lg p-4 ${
                          module?.status === "current"
                            ? "border-gray-500 dark:border-gray-100/90"
                            : module?.status === "completed"
                              ? "border-green-500/50 bg-green-500/10"
                              : "border-gray-500/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">
                              Week {index + 1}: {module?.title}
                            </h4>
                            <p className="text-xs">{module.summary}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                bootcamp?.enrolled ? "default" : "outline"
                              }
                            >
                              {bootcamp?.enrolled ? "In Progress" : "Locked"}
                            </Badge>
                            {bootcamp?.enrolled &&
                              module?.status !== "locked" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
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
                        <div className="flex flex-wrap gap-2">
                          {module?.tags?.map((tag: string, i: number) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ),
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="flex gap-2">
                  <Badge
                    variant={
                      bootcamp?.level === "Advanced" ? "destructive" : "default"
                    }
                  >
                    {bootcamp?.level}
                  </Badge>
                  <Badge variant={"destructive"}>
                    {bootcamp?.cohort?.name}
                  </Badge>
                </span>
                <div className="flex items-center gap-1">
                  <Badge
                    className="text-sm"
                    variant={
                      bootcamp?.cohort?.status === "OPEN"
                        ? "outline"
                        : started
                          ? "default"
                          : "destructive"
                    }
                  >
                    {started
                      ? "In Progress"
                      : (bootcamp?.cohort?.status ?? "Not enrolled")}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  ${bootcamp?.cohort?.amount?.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">
                  Full program cost
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </span>
                  <span>
                    {new Date(bootcamp?.cohort?.startsAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Duration
                  </span>
                  <span>{bootcamp?.cohort?.duration} weeks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Spots Left
                  </span>
                  <span className="text-orange-600 font-medium">
                    {bootcamp?.cohort?.spotsLeft}
                  </span>
                </div>
              </div>

              {bootcamp?.enrolled && (
                <div className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/30 dark:border-primary/30 rounded-lg">
                  <p className="text-xs text-blue-900 dark:text-blue-100">
                    <strong>Recording Availability:</strong> Session recordings
                    will be available 24-48 hours after each live class.
                  </p>
                </div>
              )}

              {bootcamp?.enrolled ? (
                <div className="space-y-2">
                  <Badge
                    variant="outline"
                    className="w-full justify-center bg-green-50 text-green-700 border-green-200"
                  >
                    Enrolled
                  </Badge>

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
                      Access Bootcamp
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
                  Apply Now
                </Button>
              )}
            </CardContent>
          </Card>

          <Card
            className={`${
              bootcamp?.userCohort?.progress >= 100
                ? "border-green-200 bg-green-50/50"
                : "border-orange-200 bg-orange-50/50"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    bootcamp?.userCohort?.progress >= 100
                      ? "bg-green-100"
                      : "bg-orange-100"
                  }`}
                >
                  {bootcamp?.userCohort?.progress >= 100 ? (
                    <Trophy className="h-6 w-6 text-green-600" />
                  ) : (
                    <BadgeIcon className="h-6 w-6 text-orange-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Bootcamp Certificate
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {bootcamp?.enrolled
                      ? "Ready to claim!"
                      : "Complete bootcamp to earn"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {bootcamp?.userCohort?.progress >= 100
                    ? "Congratulations! You've completed the bootcamp and earned your certificate."
                    : "Complete all weeks and pass the final assessment to earn your verified certificate."}
                </p>

                {bootcamp?.enrolled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress to Certificate</span>
                      <span>{Math.floor(bootcamp?.userCohort?.progress)}%</span>
                    </div>
                    <Progress
                      value={bootcamp?.userCohort?.progress}
                      className="h-2"
                    />
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

              {bootcamp?.enrolled && bootcamp?.userCohort?.progress >= 100 ? (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    onNavigate?.(routes.bootcampCertificate(bootcampId))
                  }
                >
                  <BadgeIcon className="mr-2 h-4 w-4" />
                  View Certificate
                </Button>
              ) : bootcamp?.enrolled ? (
                <Button variant="outline" className="w-full" disabled>
                  <BadgeIcon className="mr-2 h-4 w-4" />
                  Complete Bootcamp to Earn
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    enrollInBootcamp(bootcampId, bootcamp.cohort.id)
                  }
                >
                  <BadgeIcon className="mr-2 h-4 w-4" />
                  Enroll to Earn Certificate
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
