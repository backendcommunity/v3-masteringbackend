"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Code2, Trophy, Clock, Award, Flame } from "lucide-react";
import { ContinueLearningCard } from "@/components/continue-learning-card";
import { EmptyStateCard } from "@/components/empty-state-card";
import { ScheduleList } from "@/components/schedule/ScheduleList";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { format } from "timeago.js";
import { useUser } from "@/hooks/use-user";
import { Loader } from "./ui/loader";
import { analytics } from "@/lib/analytics";
import { dataStore } from "@/lib/data";
import { Button } from "./ui/button";

// Custom Four-Point Star Icon mapping directly to our gamification design token
const FourPointStar = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
  </svg>
);

interface DashboardContentProps {}

export function DashboardContent({}: DashboardContentProps) {
  const router = useRouter();
  const user = useUser();
  const store = useAppStore();
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsActivitiesLoading(true);
        const fetchedActivities = await store.getActivities({ size: 4 });

        if (!cancelled) {
          setActivities(fetchedActivities || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard activities:", error);
      } finally {
        if (!cancelled) {
          setIsActivitiesLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [store]);

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

  const getLevel = (level: number) => {
    return dataStore.levels.find((l) => l.id === level);
  };

  // Helper dynamic function to render titles corresponding to backend engineering levels
  const getRankTitle = (level: number) => {
    return getLevel(level)?.name;
  };

  const userLevel = user?.level ?? 1;
  const currentXP = user?.points ?? 0;
  // Calculate a mock ceiling milestone threshold based on standard platform rules
  const nextLevelXP = getLevel(userLevel + 1)?.point ?? 0;
  const xpPercentage = Math.min((currentXP / nextLevelXP) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your backend engineering journey?
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 border-orange-500/20"
          >
            <Flame className="h-3 w-3 mr-1 text-orange-500 fill-orange-500" />
            {user?.currentStreak ?? user?.streak ?? 0} day streak
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
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
                user?.numberOfCoursesInProgress
                  ? ((user?.numberOfCoursesCompleted ?? 0) /
                      user.numberOfCoursesInProgress) *
                    100
                  : 0
              }
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
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

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MB Earned</CardTitle>
            <FourPointStar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentXP.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Level {userLevel} Engineer
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
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

      <ScheduleList />

      {/* Split Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity Column */}
        <Card className="lg:col-span-7 h-fit shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest achievements and progress
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {activities?.length < 1 && !isActivitiesLoading && (
              <EmptyStateCard
                icon={Trophy}
                title="No Activities Yet"
                description="Complete a course to see your progress and achievements here."
                primaryCTA={{
                  label: "Browse Courses",
                  onClick: () => handleNavigate("/courses"),
                }}
              />
            )}

            {isActivitiesLoading ? (
              <Loader isLoader={false} />
            ) : (
              <div className="space-y-3">
                {activities?.map((activity: any, i) => (
                  <div
                    key={(activity?.id ?? i) + ":" + i}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activity?.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {activity?.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[11px] text-muted-foreground">
                          {format(activity?.createdAt)}
                        </span>
                      </div>
                    </div>
                    {activity?.mb > 0 && (
                      <Badge variant="secondary" className="font-mono text-xs">
                        +{activity?.mb} MB
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Telemetry Stack Column (DataCamp Architecture Blueprint) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Telemetry Card 1: Your Rank Plate */}
          <Card className="shadow-sm bg-card border">
            <CardHeader className="pb-3">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Your Rank Plate
              </span>
            </CardHeader>
            <CardContent className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-primary flex items-center justify-center font-mono font-bold text-sm bg-primary/5 text-primary">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : "ME"}
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-lg tracking-tight">
                    Level {userLevel}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {getRankTitle(userLevel)}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => handleNavigate("/levels")}
                variant={"link"}
              >
                View Levels
              </Button>
            </CardContent>
          </Card>

          {/* Telemetry Card 2: XP Status Progress Matrix */}
          <Card className="shadow-sm bg-card border">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                XP Status
              </span>
              <FourPointStar className="h-4 w-4 text-primary animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-xl font-bold tracking-tight">
                  {currentXP.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {currentXP.toLocaleString()} / {nextLevelXP.toLocaleString()}{" "}
                  XP to Lvl {userLevel + 1}
                </span>
              </div>
              <Progress
                value={xpPercentage}
                className="h-2 rounded-full [&>div]:bg-primary"
              />
            </CardContent>
          </Card>

          {/* Telemetry Card 3: Daily Learning Streak Panel */}
          <Card className="shadow-sm bg-card border">
            <CardHeader className="pb-2">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                Daily Learning Streak
              </span>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                  {user?.currentStreak ?? user?.streak ?? 0} Days Active
                </span>
              </div>
              <span className="text-xs text-muted-foreground max-w-[150px] text-right">
                Keep your weekly rhythm running.
              </span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
