"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Code2,
  Trophy,
  Users,
  Star,
  Clock,
  Award,
  ArrowRight,
  Play,
  CheckCircle,
  Flame,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { Topic } from "@/lib/data";
import { OnboardingSkipBanner } from "@/components/onboarding/onboarding-skip-banner";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { format } from "timeago.js";
import { useUser } from "@/hooks/use-user";
import { Loader } from "./ui/loader";
import { analytics } from "@/lib/analytics";

interface DashboardContentProps {}

export function DashboardContent({}: DashboardContentProps) {
  const router = useRouter();
  const user = useUser();
  const store = useAppStore();
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [userRoadmaps, setUserRoadmaps] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsActivitiesLoading(true);
        setIsRoadmapLoading(true);
        const [activities, userRoadmaps] = await Promise.all([
          store.getActivities({}),
          store.getUserRoadmaps({
            size: 1,
            skip: 0,
          }),
        ]);

        if (!cancelled) {
          setActivities(activities);
          setUserRoadmaps(userRoadmaps);
        }
      } catch (error) {
      } finally {
        if (!cancelled) {
          setIsRoadmapLoading(false);
          setIsActivitiesLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // Epic 5: Track streak badge view on dashboard load
  useEffect(() => {
    if (user?.currentStreak !== undefined || user?.streak !== undefined) {
      analytics.track("streak_viewed", {
        currentStreak: user?.currentStreak ?? user?.streak ?? 0,
        longestStreak: user?.longestStreak,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user?.currentStreak, user?.longestStreak, user?.streak]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const quickActions = [
    {
      title: "Browse Courses",
      description: "Discover new skills",
      icon: Play,
      action: () => handleNavigate(routes.courses),
      color: "bg-blue-500",
    },
    {
      title: "Start Project",
      description: "Build something new",
      icon: Code2,
      action: () => handleNavigate(routes.projects),
      color: "bg-green-500",
    },
    {
      title: "Take Challenge",
      description: "Test your skills",
      icon: Trophy,
      action: () => handleNavigate(routes.lands),
      color: "bg-purple-500",
    },
    {
      title: "Join Community",
      description: "Connect with peers",
      icon: Users,
      action: () => handleNavigate(routes.community),
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding Skip Banner — show for users who skipped onboarding */}
      {user?.hasFinishedOnboarding && !user?.experienceLevel && (
        <OnboardingSkipBanner userName={user.name} />
      )}
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Ready to continue your backend engineering journey?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10"
          >
            <Flame className="h-3 w-3 mr-1 text-orange-500" />
            {user?.currentStreak ?? user?.streak ?? 0} day streak
          </Badge>
        </div>
      </div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Courses Progress
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.numberOfCoursesCompleted ?? 0}/
              {user?.numberOfCoursesInProgress ?? 0}
            </div>
            <Progress
              value={
                ((user?.numberOfCoursesCompleted ?? 0) /
                  user?.numberOfCoursesInProgress!) *
                100
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Projects Built
            </CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.numberOfProjectsBuilt ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +{user?.numberOfProjectsBuiltThisMonth ?? 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MB Earned</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.points?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Level {user?.level ?? 0} Engineer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.numberOfCertificateEarned ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Industry recognized</p>
          </CardContent>
        </Card>
      </div>
      {/* Epic 5, Story 5.1: Continue Learning */}
      <ContinueLearningCard />

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump into your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions?.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-primary/5"
                onClick={action.action}
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {action.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card> */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest achievements and progress
            </CardDescription>
          </CardHeader>

          {activities?.length < 1 && (
            <CardContent className="space-y-4">
              <EmptyStateCard
                icon={Trophy}
                title="No Activities Yet"
                description="Complete a course to see your progress and achievements here."
                primaryCTA={{
                  label: "Browse Courses",
                  onClick: () => handleNavigate("/courses"),
                }}
              />
            </CardContent>
          )}

          <CardContent className="space-y-4">
            {isActivitiesLoading ? (
              <Loader isLoader={false} />
            ) : (
              <>
                {activities?.map((activity: any, i) => (
                  <div
                    key={activity?.id + ":" + i}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{activity?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {activity?.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {format(activity?.createdAt)}
                        </span>
                      </div>
                    </div>
                    {activity?.mb > 0 && (
                      <Badge variant="secondary">+{activity?.mb} MB</Badge>
                    )}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        {/* Learning Path Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Current Learning Roadmap</CardTitle>
            <CardDescription>
              Continue learning from where you left off.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isRoadmapLoading ? (
              <Loader isLoader={false} />
            ) : (
              <>
                {userRoadmaps.length < 1 ? (
                  <EmptyStateCard
                    icon={BookOpen}
                    title="No Learning Roadmap Yet"
                    description="Choose a structured learning path to guide your backend engineering journey."
                    primaryCTA={{
                      label: "Explore Roadmaps",
                      onClick: () => handleNavigate("/roadmaps"),
                    }}
                  />
                ) : (
                  <>
                    {userRoadmaps?.map((userRoadmap: any, i: number) => {
                      return (
                        <div className="space-y-4" key={i}>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Overall Progress</span>
                              <span>65%</span>
                            </div>
                            <Progress value={65} />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">
                                {userRoadmap?.roadmap?.title}
                              </span>
                            </div>

                            {userRoadmap?.roadmap?.topics?.map((t: Topic) => {
                              <>
                                <div className="flex items-center gap-3">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm">{t?.title}</span>
                                </div>
                                {/* <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20" />
                          <span className="text-sm font-medium">
                            System Architecture
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-4 w-4 rounded-full border-2 border-muted" />
                          <span className="text-sm text-muted-foreground">
                            Microservices
                          </span>
                        </div> */}
                              </>;
                            })}
                          </div>

                          <Button
                            className="w-full"
                            onClick={() => handleNavigate(routes.paths)}
                          >
                            Continue Learning Path
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
