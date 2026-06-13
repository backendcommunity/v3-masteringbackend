"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize,
  Clock,
  Star,
  BookOpen,
  Award,
  Lock,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { Chapter, Course, Topic, updateCourse, Video } from "@/lib/data";
import DisqusCommentBlock from "../ui/comment";
import { PaymentDialog } from "../payment-dialog";
import ConfettiCelebration from "@/components/confetti-celebration";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { Loader } from "../ui/loader";
import { VimeoPlayer } from "../ui/vimeo-player";
interface CoursePreviewPageProps {
  slug: string;
  onNavigate?: (route: string) => void;
}

export function CoursePreviewPage({
  slug,
  onNavigate,
}: CoursePreviewPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [celebration, setCelebration] = useState(false);
  const [course, setCourse] = useState<Course>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(300); // 5 minutes preview
  const [selectedPreview, setSelectedPreview] = useState<Partial<Video>>();
  const [previewChapters, setPreviewChapters] = useState<Chapter[]>([]);
  const [freeVideos, setFreeVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    async function findCourse(slug: string) {
      const course = await store.getCourse(slug);
      setCourse(course);
      setSelectedPreview({
        video: course?.preview,
      });
      setLoading(false);
    }

    findCourse(slug);
  }, [slug]);

  useEffect(() => {
    if (!course) return;

    const previewChapters = course.chapters
      ?.map((chapter) => ({
        ...chapter,
        videos: chapter.videos?.filter((video) => !video.isPremium) ?? [],
      }))
      .filter((chapter) => chapter.videos.length > 0);

    setPreviewChapters(previewChapters);

    const freeVideos =
      previewChapters?.flatMap((chapter) => chapter.videos) ?? [];

    setFreeVideos(freeVideos);

    // Set the first free video as selected preview
    if (freeVideos.length) {
      setSelectedPreview(freeVideos[0]);
    }
  }, [course]);

  if (loading) return <Loader isLoader={false} />;

  if (!course) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Course not found</h1>
          <Button onClick={() => onNavigate?.("/courses")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateHours = (chapter: Chapter) => {
    let totalSeconds = 0;

    if (!chapter?.videos) return;

    for (const video of chapter?.videos) {
      if (typeof video.duration === "number") {
        // Assume number = minutes
        totalSeconds += video.duration * 60;
      } else if (typeof video.duration === "string") {
        const parts = video.duration.split(":").map(Number);

        if (parts.length === 1) {
          // e.g. "5" => 5 minutes
          totalSeconds += parts[0] * 60;
        } else if (parts.length === 2) {
          // mm:ss
          const [m, s] = parts;
          totalSeconds += m * 60 + s;
        } else if (parts.length === 3) {
          // hh:mm:ss
          const [h, m, s] = parts;
          totalSeconds += h * 3600 + m * 60 + s;
        }
      }
    }

    return +(totalSeconds / 3600).toFixed(2);
  };

  const handleEnrollNow = async () => {
    if (!user?.isPremium) {
      setShowPaymentDialog(!showPaymentDialog);
      return;
    }

    if (course.isEnrolled) {
      onNavigate?.(
        routes.courseWatch(
          slug,
          course?.chapters[0]?.slug,
          course?.chapters[0]?.videos[0]?.slug,
        ),
      );
      return;
    }

    const { data } = await handleEnrollment(course?.id!);
    if (!data) {
      toast.error("An error occurred. Please try again");
      return;
    }
    updateCourse(slug, { ...course, enrolled: true, userCourse: data });
    Object.assign(course!, { enrolled: true });

    // Trigger celebration for first-time enrollment
    setCelebration(true);
    toast.success("You have successfully enrolled");

    onNavigate?.(routes.courseDetail(slug));
  };

  const handleEnrollment = async (courseId: string) => {
    return await store.handleCourseEnrollment(courseId);
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => onNavigate?.(routes.courseDetail(slug))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              <Eye className="mr-1 h-3 w-3" />
              Preview
            </Badge>
            <Badge variant="outline">{course?.level}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">
            Free preview • {freeVideos?.length} videos available
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${course.amount}</div>
          <div className="text-sm text-muted-foreground">Full course</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-4">
          {/* Video Player */}
          <Card className="overflow-hidden">
            <div className="aspect-video bg-black relative">
              {/* Video placeholder with preview content */}

              {freeVideos?.length ? (
                <div className="text-center text-white aspect-video bg-black relative">
                  <VimeoPlayer video={selectedPreview!} />

                  {/* Preview watermark */}
                  <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                    FREE PREVIEW
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0E1F33]">
                  <div className="flex-1 p-6">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold">
                        No free preview for this course. Enrol now to have full
                        access.
                      </h1>
                      <Button
                        onClick={() => onNavigate?.("/courses")}
                        className="mt-4"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Enrol now
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Video Controls */}
              {!previewChapters?.length && !freeVideos?.length && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 text-white text-sm">
                      <span>{formatTime(currentTime)}</span>
                      <div className="flex-1">
                        <Progress
                          value={(currentTime / duration) * 100}
                          className="h-1"
                        />
                      </div>
                      <span>{formatTime(duration)}</span>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                          onClick={() => setIsPlaying(!isPlaying)}
                        >
                          {isPlaying ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-white/70">
                          Preview Mode
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Preview Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                <Eye className="mr-1 h-3 w-3" />
                Free Preview
              </Badge>
              <span className="text-sm text-muted-foreground">
                {previewChapters.length} of {course.chapters.length} chapters
                available
              </span>
            </div>
            <Button
              onClick={() => {
                handleEnrollNow();
              }}
            >
              {user?.isPremium
                ? "Start Learning Now"
                : course.isEnrolled
                  ? "Continue Learning"
                  : "Enroll Now"}
            </Button>
          </div>

          {/* Preview Content Tabs */}
          <Tabs defaultValue="preview" className="w-full">
            <TabsList>
              <TabsTrigger value="preview">Preview Chapters</TabsTrigger>
              <TabsTrigger value="curriculum">Full Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Free Preview Videos</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Get a taste of what you'll learn in this course
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {freeVideos.map((video) => (
                      <div
                        key={video.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                          selectedPreview?.id === video.id ? "bg-muted/90" : ""
                        }`}
                        onClick={() => {
                          setSelectedPreview(video);
                        }}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <Play className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{video.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Badge
                              variant="outline"
                              className="text-xs border-green-600 text-green-600"
                            >
                              FREE
                            </Badge>
                            <Clock className="h-3 w-3" />
                            <span>
                              {video.duration} hour
                              {Number(video.duration) > 1 ? "s" : ""}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {video.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Course Curriculum</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {course.chapters.length} chapters • {course.totalDuration}{" "}
                    total length
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {course.chapters.map((chapter, index) => {
                      return (
                        <div
                          key={chapter.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            !chapter.isPremium
                              ? "cursor-pointer hover:bg-muted/50"
                              : "opacity-60"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                              !chapter.isPremium
                                ? "bg-green-100 text-green-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {!chapter.isPremium ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{chapter.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  !chapter.isPremium
                                    ? "border-green-600 text-green-600"
                                    : "border-orange-600 text-orange-600"
                                }`}
                              >
                                {!chapter.isPremium ? "FREE" : "PREMIUM"}
                              </Badge>
                              <Clock className="h-3 w-3" />
                              <span>
                                {calculateHours(chapter)} hour
                                {calculateHours(chapter)! > 1 ? "s" : ""}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {chapter.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="instructor">
              <Card>
                <CardHeader>
                  <CardTitle>About the Instructor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-lg font-bold">
                        {course?.instructor
                          ?.split(" ")
                          .map((n: string) => n.charAt(0))
                          .join("") ?? "MB"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">
                        {course?.instructor ?? "Mastering Backend"}
                      </h3>
                      <p className="text-muted-foreground">
                        Senior Backend Engineer with 8+ years of experience
                        building scalable systems. Previously worked at Google
                        and Netflix.
                      </p>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>15 courses</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>4.9 rating</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle>Student Reviews</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <DisqusCommentBlock
                      config={{
                        url: "/courses/" + slug,
                        identifier: slug,
                        title: course?.title,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="font-bold text-lg">${course.amount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Duration
                  </span>
                  <span className="font-medium">
                    {course.totalDuration} hour
                    {course.totalDuration > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Level</span>
                  <Badge variant="outline">{course?.level}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Certificate
                  </span>
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Included</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrollment CTA */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="text-center">
                <h3 className="font-bold text-lg mb-2">
                  Ready to start learning?
                </h3>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  handleEnrollNow();
                }}
              >
                {user?.isPremium
                  ? "Start Learning Now"
                  : course.isEnrolled
                    ? "Continue Learning"
                    : "Enroll Now"}
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  30-day money-back guarantee
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What You'll Learn */}
          {course?.topics?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You'll Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {course?.topics?.map((item: Topic, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                      <span>{item?.title ?? item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            ""
          )}
          {/* Course Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Topics Covered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {course?.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="enrollment"
        courseName={course?.title!}
      />

      {showPaymentDialog && (
        <PaymentDialog
          onClose={() => setShowPaymentDialog(false)}
          open={showPaymentDialog}
          data={course}
          onHandlePreview={() => {}}
          onHandlePurchase={() => {}}
        />
      )}
    </div>
  );
}
