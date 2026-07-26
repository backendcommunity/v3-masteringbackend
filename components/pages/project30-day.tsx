"use client";

import { useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Star,
  Code2,
  FileText,
  Upload,
  CheckCircle2,
  Play,
  Save,
  Share,
  ArrowLeft,
  Target,
  Lightbulb,
  ExternalLink,
  PlayCircle,
  Volume2,
  Maximize2,
  SkipBack,
  SkipForward,
  Pause,
} from "lucide-react";
import { codeSample } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { Project30, Resource, Video } from "@/lib/data";
import { toast } from "sonner";
import ConfettiCelebration from "../confetti-celebration";
import { routes } from "@/lib/routes";
import { VimeoPlayer } from "../ui/vimeo-player";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface Project30DayPageProps {
  dayNumber: string;
  slug: string;
  onNavigate: (path: string) => void;
}

export function Project30DayPage({
  dayNumber,
  slug,
  onNavigate,
}: Project30DayPageProps) {
  const store = useAppStore();
  const [activeTab, setActiveTab] = useState("video");
  const [video, setVideo] = useState<Video>();
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [code, setCode] = useState(codeSample);
  const [projectUrl, setProjectUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");
  const [project30, setProject30] = useState<Project30>();
  const [completedItems, setCompletedItems] = useState([]);
  const [celebration, setCelebration] = useState(false);

  const userProject30 = project30?.userProject30;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const data = await store.getProject30(slug);
      if (!cancelled) {
        setProject30(data);
        setCompletedItems(data.userOfferItems);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug, store]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const video = await store.getVideo(dayNumber);
      if (!cancelled) {
        setVideo(video);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [dayNumber, store]);

  if (loading) return <PageSkeleton />;

  const completedVideo: any = completedItems?.find(
    (c: any) => c.videoId === dayNumber && c.completed
  );

  // Format time for display (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Format time for display (HH:MM:SS)
  const formatLongTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    // In a real implementation, this would control the video playback
  };

  const submitProject = async () => {
    try {
      const allVideosWithChapters =
        project30?.courses
          .filter(
            (course: any) =>
              !["Optional", "Bonus"].includes(course.topic.trim())
          )
          .flatMap(({ course }: any) =>
            course.chapters.flatMap((chapter: any, chapterIndex: number) =>
              chapter.videos.map((video: any) => ({
                ...video,
                chapter, // keep reference to chapter
                chapterIndex, // keep index for currentWeek
              }))
            )
          ) ?? [];

      const currentDay = userProject30?.currentDay ?? 0;
      const totaldays = allVideosWithChapters.length;

      let currentIndex =
        totaldays === currentDay + 1 ? currentDay : currentDay + 1;
      const nextVideo = allVideosWithChapters[currentIndex];

      if (!nextVideo) return;

      const dayCompleted = await store.markDayComplete(slug, dayNumber, {
        courseId: nextVideo?.chapter?.courseId,
        day: currentDay + 1,
        notes: submissionNotes ? submissionNotes : undefined,
        url: projectUrl,
        currentDay: currentDay + 1,
        currentWeek: nextVideo.chapterIndex,
        nextLesson: nextVideo?.id,
        nextWeek: nextVideo?.chapterId,
        isProject30Completed:
          allVideosWithChapters[totaldays - 1].id === dayNumber,
      });

      setCelebration(true);
      onNavigate(routes.project30Detail(`/${slug}`));
    } catch (error) {
      toast.error("An error occurred. Please try again");
    }
  };

  // TODO:: Create a special Form to add this for admin

  const projectRequirements = video?.resources?.filter((r: any) =>
    r.title.includes("Project Requirements")
  );

  const testRequirements = video?.resources?.filter((r: any) =>
    r.title.includes("Test Cases")
  );

  const resourcesRequirements = video?.resources?.filter((r: any) =>
    r.title.includes("Resources")
  );

  const hintsRequirements = video?.resources?.filter((r: any) =>
    r.title.includes("Hints")
  );

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between ">
        <div className="flex items-center flex-1 gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("/project30/" + slug)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant="outline"
                className="bg-[#F2C94C]/10 text-[#F2C94C] border-[#F2C94C]/20"
              >
                Day{" "}
                {completedVideo
                  ? completedVideo?.day
                  : userProject30?.currentDay! + 1}
              </Badge>
              <Badge
                variant={
                  video?.difficulty === "Hard"
                    ? "destructive"
                    : video?.difficulty === "Medium"
                    ? "default"
                    : "secondary"
                }
              >
                {video?.difficulty}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {video?.title}
            </h1>

            <article
              className="text-muted-foreground w-1/2"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(video?.summary!) }}
            ></article>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm">{video?.duration} minutes</span>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">Instructor</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {video?.instructor?.name ?? "Masteringbackend"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">MB Reward</span>
            </div>
            <p className="text-2xl font-bold mt-1">{video?.mb}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Project Time</span>
            </div>
            <p className="text-2xl font-bold mt-1">{video?.duration}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Technologies</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {video?.technologies?.map((tech) => (
                <Badge key={tech} variant="outline" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Video Player Panel */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="video">Video Lesson</TabsTrigger>
              <TabsTrigger value="code">Code Editor</TabsTrigger>
              <TabsTrigger value="submit">Submit Project</TabsTrigger>
            </TabsList>

            <TabsContent value="video">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Video Lesson
                  </CardTitle>
                  <CardDescription>
                    Watch the step-by-step tutorial to build this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Video Player */}
                  <div className="relative rounded-md overflow-hidden bg-black aspect-video">
                    <img
                      src={video?.banner || "/placeholder.svg"}
                      alt="Video thumbnail"
                      className={`w-full h-full object-cover ${
                        isPlaying ? "hidden" : "block"
                      }`}
                    />
                    {!isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Button
                          size="lg"
                          variant="ghost"
                          className="rounded-full w-16 h-16 bg-black/30 hover:bg-black/50 text-white"
                          onClick={togglePlayPause}
                        >
                          <PlayCircle className="h-10 w-10" />
                        </Button>
                      </div>
                    )}
                    {isPlaying && (
                      <Card className="overflow-hidden">
                        <div className="aspect-video bg-black relative">
                          <VimeoPlayer video={video!} />
                        </div>
                      </Card>
                    )}

                    {/* Video Controls */}
                    {/* <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 flex flex-col gap-2">

                      <div className="w-full bg-gray-600 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-[#F2C94C] h-full"
                          style={{
                            width: `${(currentTime / duration) * 100}%`,
                          }}
                        ></div>
                      </div>


                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                            onClick={togglePlayPause}
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                          <span className="text-xs">
                            {formatTime(currentTime)} / {formatTime(duration)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <div className="w-16 bg-gray-600 h-1 rounded-full overflow-hidden">
                              <div
                                className="bg-white h-full"
                                style={{ width: `${volume}%` }}
                              ></div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white"
                          >
                            <Maximize2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div> */}
                  </div>

                  {/* Video Chapters */}
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-3">Video Chapter</h3>
                    <div className="space-y-3">
                      {video?.chapter?.videos.map((v: Video, i: number) => {
                        return (
                          <div
                            className={`flex items-center gap-3 p-2 rounded-md ${
                              v.id === dayNumber
                                ? "bg-[#F2C94C]/10 border border-[#F2C94C]/20"
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs ${
                                v.id === dayNumber ? "bg-[#F2C94C]" : "bg-muted"
                              }`}
                            >
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{v.title}</p>
                              <p className="text-xs text-muted-foreground">
                                00:00 - {v.duration}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code2 className="h-5 w-5" />
                    Code Editor
                  </CardTitle>
                  <CardDescription>
                    Follow along with the video and write your code here
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border rounded-md bg-black text-white p-4 font-mono text-sm h-[600px]">
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full h-full resize-none border-none outline-none bg-transparent font-mono text-sm"
                      placeholder="Start coding your project here..."
                    />
                  </div>
                </CardContent>
                <div className="flex justify-between p-4">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save
                  </Button>
                  <Button className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Run
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="submit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Submit Your Project
                  </CardTitle>
                  <CardDescription>
                    Share your completed project to earn MB and maintain your
                    streak
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="submission-url">
                        Project URL (GitHub, CodePen, etc.)
                      </Label>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <Input
                          id="submission-url"
                          placeholder="https://github.com/username/project-name"
                          value={projectUrl}
                          onChange={(e) => setProjectUrl(e.target.value)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Link to your project on CodeSandbox, GitHub, or any
                        other platform
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="submission-notes">Notes (Optional)</Label>
                      <Textarea
                        id="submission-notes"
                        placeholder="Any challenges faced, learnings, or additional features..."
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={submitProject} disabled={!projectUrl}>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Project
                    </Button>
                    <Button variant="outline">
                      <Share className="mr-2 h-4 w-4" />
                      Share Progress
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Instructions Panel */}
        <div className="lg:col-span-1">
          <Tabs defaultValue="requirements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requirements">Tasks</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="hints">Hints</TabsTrigger>
            </TabsList>

            <TabsContent value="requirements">
              {projectRequirements?.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Project Requirements
                    </CardTitle>
                    <CardDescription>
                      Complete these tasks after watching the video
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {projectRequirements?.map(
                        (requirement: any, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border text-xs">
                              {index + 1}
                            </div>
                            <span className="text-sm">
                              {requirement?.title}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="resources">
              {resourcesRequirements?.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5" />
                      Resources
                    </CardTitle>
                    <CardDescription>
                      Additional materials to help you complete the project
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {resourcesRequirements?.map(
                        (resource: Resource, index: number) => (
                          <a
                            key={index}
                            href={resource.link}
                            className="flex items-center gap-2 p-2 rounded-lg border hover:bg-muted transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-sm">{resource.title}</span>
                            <ExternalLink className="h-3 w-3 ml-auto" />
                          </a>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="hints">
              {hintsRequirements?.length && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Hints
                    </CardTitle>
                    <CardDescription>
                      Tips to help you if you get stuck
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {hintsRequirements?.map((hint: Resource, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-3 rounded-lg bg-muted/50"
                        >
                          <Lightbulb className="h-4 w-4 text-[#F2C94C] mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{hint.title}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Test Cases */}
          {testRequirements?.length && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Test Cases
                </CardTitle>
                <CardDescription>
                  Make sure your project meets these requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {testRequirements?.map((test: Resource, index: number) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 p-2 border rounded-md"
                    >
                      <CheckCircle2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{test.title}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfettiCelebration
        onComplete={() => setCelebration(false)}
        isVisible={celebration}
        celebrationType="completion"
        courseName={video?.title!}
      />
    </div>
  );
}
