"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Users,
  Star,
  Play,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { toast } from "sonner";
import { Loader } from "../ui/loader";
import { useUser } from "@/hooks/use-user";
import { PaymentDialog } from "../payment-dialog";
import { stripHtmlTags } from "@/lib/html-utils";

interface LearningPathDetailPageProps {
  pathId: string;
  onNavigate?: (route: string) => void;
}

export function LearningPathDetailPage({
  pathId,
  onNavigate,
}: LearningPathDetailPageProps) {
  const store = useAppStore();
  const user = useUser();
  const [roadmap, setRoadmap] = useState<any>(null);
  const [userRoadmap, setUserRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [roadmapData, userRoadmapsData] = await Promise.all([
          store.getRoadmapBySlug(pathId),
          store.getUserRoadmaps({ skip: 0, size: 50, filters: "" }),
        ]);

        setRoadmap(roadmapData);
        const ur = (userRoadmapsData || []).find(
          (ur: any) =>
            ur.roadmap?.slug === pathId || ur.roadmapId === roadmapData?.id,
        );
        setUserRoadmap(ur || null);
      } catch (error) {
        console.error("Failed to load learning path detail:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [pathId, store]);

  if (loading) return <Loader isLoader={false} />;

  if (!roadmap) {
    return (
      <div className="flex-1 p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Learning Path not found</h1>
          <Button onClick={() => onNavigate?.("/paths")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Learning Paths
          </Button>
        </div>
      </div>
    );
  }

  const topics = roadmap.topics || [];
  const topicIndex = userRoadmap
    ? topics.findIndex((t: any) => t.id === userRoadmap.currentTopicId)
    : -1;
  const progress =
    userRoadmap?.isCompleted || userRoadmap?.isCompleted === true
      ? 100
      : topicIndex >= 0
        ? Math.round((topicIndex / Math.max(1, topics?.length)) * 100)
        : 0;
  const enrolled = Boolean(userRoadmap);

  const handleEnroll = async () => {
    try {
      // Check if user is premium
      const isPremiumUser =
        user?.isPremium && user?.subscription?.name === "Enterprise";

      if (!isPremiumUser) {
        setShowPaymentDialog(true);
        return;
      }

      // User is premium, enroll immediately
      setEnrolling(true);
      const enrollResult = await store.enrollInRoadmap(pathId);

      if (!enrollResult) {
        toast.error("Failed to enroll in path. Please try again.");
        return;
      }

      toast.success("Successfully enrolled in path!");

      // Reload data
      const updatedRoadmapsData = await store.getUserRoadmaps({
        skip: 0,
        size: 50,
        filters: "",
      });
      const ur = (updatedRoadmapsData || []).find(
        (ur: any) =>
          ur.roadmap?.slug === pathId || ur.roadmapId === roadmap?.id,
      );
      setUserRoadmap(ur || null);

      // Navigate after short delay to show toast
      setTimeout(() => {
        onNavigate?.(`/paths/${pathId}/continue`);
      }, 500);
    } catch (error: any) {
      console.error("Failed to enroll in roadmap:", error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.message ||
        error?.toString?.() ||
        "Failed to enroll in path";
      toast.error(errorMsg);
    } finally {
      setEnrolling(false);
    }
  };

  const handlePaymentComplete = async () => {
    setShowPaymentDialog(false);
    // User is now premium, enroll them
    try {
      setEnrolling(true);
      const enrollResult = await store.enrollInRoadmap(pathId);

      if (!enrollResult) {
        toast.error("Failed to enroll in path. Please try again.");
        return;
      }

      toast.success("Successfully enrolled in path!");

      // Reload data
      const updatedRoadmapsData = await store.getUserRoadmaps({
        skip: 0,
        size: 50,
        filters: "",
      });
      const ur = (updatedRoadmapsData || []).find(
        (ur: any) =>
          ur.roadmap?.slug === pathId || ur.roadmapId === roadmap?.id,
      );
      setUserRoadmap(ur || null);

      // Navigate after short delay
      setTimeout(() => {
        onNavigate?.(`/paths/${pathId}/continue`);
      }, 500);
    } catch (error: any) {
      toast.error(error?.message || "Failed to enroll in path");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{roadmap.title}</h1>
          <p className="text-muted-foreground">{stripHtmlTags(roadmap.summary || "")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {!enrolled ? (
            <Button disabled={enrolling} onClick={handleEnroll}>
              {enrolling ? "Enrolling..." : "Enroll in Path"}
            </Button>
          ) : (
            <Button onClick={() => onNavigate?.(`/paths/${pathId}/continue`)}>
              Continue Path
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
          {/* Progress Card (if enrolled) */}
          {enrolled && (
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Overall Progress
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{progress}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Topics Started
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.max(0, topicIndex)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of {topics?.length}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="text-2xl font-bold">
                      {progress === 100 ? "Complete" : "In Progress"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Estimated Time Left
                    </div>
                    <div className="text-2xl font-bold">
                      {Math.ceil(
                        topics.reduce((s: number, t: any) => s + (t.duration || 0), 0) / 4 -
                          (topicIndex / topics.length) *
                            topics.reduce((s: number, t: any) => s + (t.duration || 0), 0) /
                            4
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">months</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="community">Community</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {[
                      "Master backend development fundamentals",
                      "Build scalable APIs and microservices",
                      "Implement database design and optimization",
                      "Deploy applications to cloud platforms",
                      "Apply DevOps and CI/CD practices",
                      "Develop production-ready applications",
                    ].map((objective, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        <span>{objective}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Path Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {roadmap?.courses?.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Courses
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {roadmap?.projects?.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Projects
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {roadmap?.estimatedTime}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Est. Time
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>About the Path Creator</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-xl font-bold text-white">MB</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Mastering Backend Team</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Expert backend engineers with 100+ years combined experience
                      </p>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">4.8/5 (1.2k reviews)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Topics ({topics?.length})</CardTitle>
                  <CardDescription>
                    Core topics and courses in this learning path
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {topics.map((topic: any, index: number) => (
                    <div key={topic.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{topic.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stripHtmlTags(topic.description || "")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{topic.level}</Badge>
                      </div>

                      {/* Courses within this topic */}
                      {topic.courses && topic.courses?.length > 0 && (
                        <div className="ml-8 space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Courses
                          </p>
                          {topic.courses.map((course: any) => (
                            <div
                              key={course.id}
                              className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                            >
                              <div>
                                <p className="font-medium">{course.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {stripHtmlTags(course.summary || "")}
                                </p>
                              </div>
                              <Button size="sm" variant="ghost">
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projects</CardTitle>
                  <CardDescription>
                    Build real-world applications
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Projects are included within the course topics.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="community" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Community</CardTitle>
                  <CardDescription>
                    Connect with fellow learners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold">1,247</div>
                      <div className="text-sm text-muted-foreground">
                        Active learners
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold">892</div>
                      <div className="text-sm text-muted-foreground">
                        Completed path
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>

      <PaymentDialog
        open={showPaymentDialog}
        onClose={() => setShowPaymentDialog(false)}
        onHandlePreview={() => {}}
        onHandlePurchase={async (_, __, success) => {
          if (success) {
            await handlePaymentComplete();
          }
        }}
        data={{
          id: roadmap?.id,
          bootcampId: roadmap?.id,
          title: roadmap?.title,
          amount: roadmap?.amount || 0,
          asyncpay_plan_id: roadmap?.asyncpay_plan_id,
          type: "roadmap",
        }}
      />
    </div>
  );
}
