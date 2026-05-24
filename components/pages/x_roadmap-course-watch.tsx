"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Settings,
  Maximize,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  Code,
  Zap,
  Clock,
  Target,
  Trophy,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  getCourseById,
  getRoadmapById,
  getRoadmapMilestoneById,
  markVideoComplete,
  markChapterComplete,
} from "@/lib/data";

interface RoadmapCourseWatchProps {
  roadmapId: string;
  milestoneId: string;
  courseId: string;
  chapterId?: string;
  videoId?: string;
  onBack: () => void;
  onNavigateToQuiz: (quizId: string) => void;
  onNavigateToExercise: (exerciseId: string) => void;
  onNavigateToPlayground: (playgroundId: string) => void;
}

export function RoadmapCourseWatch({
  roadmapId,
  milestoneId,
  courseId,
  chapterId,
  videoId,
  onBack,
  onNavigateToQuiz,
  onNavigateToExercise,
  onNavigateToPlayground,
}: RoadmapCourseWatchProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(
    new Set()
  );
  const roadmap = getRoadmapById(roadmapId);
  const milestone = getRoadmapMilestoneById(roadmapId, milestoneId);
  const course = getCourseById(courseId);

  const [currentChapter, setCurrentChapter] = useState(
    chapterId
      ? course?.chapters.find((c) => c.id === chapterId)
      : course?.chapters[0]
  );
  const [currentVideo, setCurrentVideo] = useState<any>(null);

  useEffect(() => {
    if (chapterId) {
      setCurrentChapter(
        course?.chapters.find((c) => c.id === chapterId) || course?.chapters[0]
      );
    } else {
      setCurrentChapter(course?.chapters[0]);
    }
  }, [chapterId, course?.chapters]);

  useEffect(() => {
    if (currentChapter) {
      if (videoId) {
        setCurrentVideo(
          currentChapter.videos.find((v) => v.id === videoId) ||
            currentChapter.videos[0]
        );
      } else {
        setCurrentVideo(currentChapter.videos[0]);
      }
    }
  }, [videoId, currentChapter]);

  useEffect(() => {
    if (currentChapter) {
      setExpandedChapters((prev) => new Set([...prev, currentChapter.id]));
    }
  }, [currentChapter]);

  if (!roadmap || !milestone || !course) {
    return <div>Course not found</div>;
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVideoComplete = () => {
    if (currentVideo && currentChapter) {
      markVideoComplete(courseId, currentChapter.id, currentVideo.id);

      // Check if all videos in chapter are complete
      const allVideosComplete = currentChapter.videos.every(
        (v) => v.isCompleted || v.id === currentVideo.id
      );
      if (allVideosComplete) {
        markChapterComplete(courseId, currentChapter.id);
      }
    }
  };

  const toggleChapterExpansion = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId);
      } else {
        newSet.add(chapterId);
      }
      return newSet;
    });
  };

  const getNextVideo = () => {
    if (!currentChapter || !currentVideo) return null;

    const currentVideoIndex = currentChapter.videos.findIndex(
      (v) => v.id === currentVideo.id
    );
    if (currentVideoIndex < currentChapter.videos.length - 1) {
      return currentChapter.videos[currentVideoIndex + 1];
    }

    // Look for next chapter
    const currentChapterIndex = course?.chapters?.findIndex(
      (c) => c.id === currentChapter.id
    );
    if (currentChapterIndex! < course?.chapters!?.length - 1) {
      const nextChapter = course?.chapters[currentChapterIndex! + 1];
      return nextChapter?.videos[0];
    }

    return null;
  };

  const getPreviousVideo = () => {
    if (!currentChapter || !currentVideo) return null;

    const currentVideoIndex = currentChapter.videos.findIndex(
      (v) => v.id === currentVideo.id
    );
    if (currentVideoIndex > 0) {
      return currentChapter.videos[currentVideoIndex - 1];
    }

    // Look for previous chapter
    const currentChapterIndex = course?.chapters.findIndex(
      (c) => c.id === currentChapter.id
    );
    if (currentChapterIndex! > 0) {
      const prevChapter = course?.chapters[currentChapterIndex! - 1];
      return prevChapter?.videos[prevChapter?.videos.length - 1];
    }

    return null;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className=" border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Roadmap
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{roadmap?.title}</span>
                <span>•</span>
                <span>{milestone?.title}</span>
                <span>•</span>
                <span>{course?.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Roadmap Course
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative bg-black rounded-t-lg aspect-video">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="text-6xl mb-4">🎥</div>
                      <h3 className="text-xl font-semibold mb-2">
                        {currentVideo?.title ||
                          "Select a video to start learning"}
                      </h3>
                      {currentVideo && (
                        <p className="text-gray-300 mb-4">
                          {currentVideo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4 text-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={handlePlayPause}
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
                        disabled={!getPreviousVideo()}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        disabled={!getNextVideo()}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-sm">
                          {formatTime(currentTime)}
                        </span>
                        <div className="flex-1 bg-white/30 rounded-full h-1">
                          <div
                            className="bg-white rounded-full h-1 transition-all duration-300"
                            style={{
                              width: `${(currentTime / duration) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm">{formatTime(duration)}</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>

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

                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {currentVideo?.title || "Select a video"}
                      </h1>
                      <p className="text-gray-600 mb-4">
                        {currentVideo?.description ||
                          "Choose a video from the course curriculum to start learning."}
                      </p>

                      {currentVideo && (
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{currentVideo.duration}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            <span>
                              Chapter{" "}
                              {course?.chapters!?.findIndex(
                                (c) => c.id === currentChapter?.id
                              ) + 1}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {currentVideo && !currentVideo.completed && (
                      <Button onClick={handleVideoComplete} className="ml-4">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      disabled={!getPreviousVideo()}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Previous Video
                    </Button>

                    <Button
                      disabled={!getNextVideo()}
                      className="flex items-center gap-2"
                    >
                      Next Video
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Course Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Overall Progress
                      </span>
                      <span className="text-sm text-gray-600">
                        {course?.progress}%
                      </span>
                    </div>
                    <Progress value={course?.progress} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Completed Videos</div>
                      <div className="font-medium">
                        {course?.chapters.reduce(
                          (acc, chapter) =>
                            acc +
                            chapter.videos.filter((v) => v.isCompleted).length,
                          0
                        )}{" "}
                        /{" "}
                        {course?.chapters.reduce(
                          (acc, chapter) => acc + chapter.videos.length,
                          0
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Completed Chapters</div>
                      <div className="font-medium">
                        {course?.chapters.filter((c) => c.isCompleted).length} /{" "}
                        {course?.chapters.length}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Course Curriculum Sidebar */}
          <div className="space-y-6">
            {/* Roadmap Context */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4 text-blue-500" />
                  Roadmap Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">
                    {milestone?.title}
                  </div>
                  <Progress value={milestone?.progress} className="h-2" />
                  <div className="text-xs text-gray-500 mt-1">
                    {milestone?.progress}% complete
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Curriculum */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Curriculum</CardTitle>
                <CardDescription>
                  {course?.chapters.length} chapters •{" "}
                  {course?.chapters.reduce(
                    (acc, c) => acc + c.videos.length,
                    0
                  )}{" "}
                  videos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {course?.chapters.map((chapter, chapterIndex) => (
                    <div
                      key={chapter.id}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <button
                        onClick={() => toggleChapterExpansion(chapter.id)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                              {chapterIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {chapter.title}
                              </div>
                              <div className="text-xs text-gray-500">
                                {chapter.duration}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {chapter.isCompleted && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            {expandedChapters.has(chapter.id) ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </button>

                      {expandedChapters.has(chapter.id) && (
                        <div className="pb-2">
                          {/* Videos */}
                          {chapter.videos.map((video) => (
                            <button
                              key={video.id}
                              onClick={() => setCurrentVideo(video)}
                              className={`w-full p-3 pl-12 text-left hover:bg-gray-50 transition-colors ${
                                currentVideo?.id === video.id
                                  ? "bg-blue-50 border-r-2 border-blue-500"
                                  : ""
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-5 h-5">
                                  {video.isCompleted ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Play className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {video.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {video.duration}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}

                          {/* Additional Content */}
                          {chapter?.quizzes!?.length > 0 && (
                            <button
                              onClick={() =>
                                onNavigateToQuiz(chapter?.quiz!.id)
                              }
                              className="w-full p-3 pl-12 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {chapter.quiz?.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Quiz • {chapter.quiz?.timeLimit} min
                                  </div>
                                </div>
                                {chapter.quiz?.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </button>
                          )}

                          {chapter.exercise && (
                            <button
                              onClick={() =>
                                onNavigateToExercise(chapter.exercise!.id)
                              }
                              className="w-full p-3 pl-12 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Code className="h-4 w-4 text-purple-500" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {chapter.exercise.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Exercise • {chapter.exercise.difficulty}
                                  </div>
                                </div>
                                {chapter.exercise.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </button>
                          )}

                          {chapter.playground && (
                            <button
                              onClick={() =>
                                onNavigateToPlayground(chapter.playground!.id)
                              }
                              className="w-full p-3 pl-12 text-left hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4 text-orange-500" />
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-gray-900">
                                    {chapter.playground.title}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Playground • {chapter.playground.language}
                                  </div>
                                </div>
                                {chapter.playground.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export { RoadmapCourseWatch as RoadmapCourseWatchPage };
