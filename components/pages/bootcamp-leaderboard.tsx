"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Medal,
  Trophy,
  Award,
  ArrowLeft,
  RefreshCw,
  Star,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { getStoredUser } from "@/lib/user-store";
import { Loader } from "../ui/loader";
import { routes } from "@/lib/routes";

interface BootcampLeaderboardEntry {
  userId: string;
  totalAssignments: number;
  totalLessons: number;
  score: number;
  rank: number;
  user: {
    id: string;
    name: string | null;
    avatar: string | null;
    email: string;
  };
}

interface BootcampLeaderboardProps {
  bootcampId: string;
  cohortId: string;
  onNavigate: (path: string) => void;
}

export function BootcampLeaderboard({
  bootcampId,
  cohortId,
  onNavigate,
}: BootcampLeaderboardProps) {
  const store = useAppStore();
  const [leaderboard, setLeaderboard] = useState<BootcampLeaderboardEntry[]>([]);
  const [topUsers, setTopUsers] = useState<BootcampLeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<BootcampLeaderboardEntry>();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadLeaderboard = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await store.getBootcampLeaderboard(bootcampId, cohortId);
      if (!data || !Array.isArray(data)) {
        setLeaderboard([]);
        setTopUsers([]);
        setCurrentUser(undefined);
      } else {
        setLeaderboard(data);
        setTopUsers(data.slice(0, 3));

        const user = getStoredUser();
        const current = data.find((entry) => entry.userId === user?.id);
        if (current) {
          setCurrentUser(current);
        }
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error loading leaderboard:", err);
      setError(
        err?.response?.data?.message ||
          "Failed to load leaderboard. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [bootcampId, cohortId]);

  if (loading) return <Loader isLoader={false} />;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.substring(0, 2).toUpperCase();
  };

  const getAverageScore = () => {
    if (leaderboard.length === 0) return 0;
    const total = leaderboard.reduce((sum, entry) => sum + entry.score, 0);
    return Math.round(total / leaderboard.length);
  };

  const averageScore = getAverageScore();

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-amber-500">🏆 Champion</Badge>;
    if (rank <= 3) return <Badge className="bg-gray-400">⭐ Top 3</Badge>;
    return null;
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bootcamp Leaderboard</h1>
          <p className="text-muted-foreground">
            {leaderboard.length} students • Your rank: {" "}
            <span className="font-semibold text-foreground">
              #{currentUser?.rank || "—"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Updated {formatTimeAgo(lastUpdated)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigate(routes.bootcampDashboard(bootcampId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Users Podium */}
      {topUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">🏆 Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            <Card className="border-2 border-gray-400 order-2 md:order-1">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2">
                  <Medal className="h-8 w-8 text-gray-400" />
                </div>
                <CardTitle className="text-lg">2nd Place</CardTitle>
              </CardHeader>
              {topUsers?.[1] && (
                <CardContent className="text-center pt-0">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage
                      src={topUsers?.[1]?.user?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[1]?.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(topUsers?.[1]?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium truncate max-w-xs">
                    {topUsers?.[1]?.user?.name}
                  </h3>
                  <div className="flex gap-2 justify-center mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[1]?.totalAssignments} Assign
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[1]?.totalLessons} Lessons
                    </Badge>
                  </div>
                  <div className="font-semibold text-foreground text-lg mt-2">
                    {topUsers?.[1]?.score} pts
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 1st Place - Center and elevated */}
            <Card className="border-2 border-amber-400 order-1 md:order-2 md:-mt-4">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2">
                  <Trophy className="h-10 w-10 text-amber-400" />
                </div>
                <CardTitle className="text-xl">🥇 Champion</CardTitle>
              </CardHeader>
              {topUsers?.[0] && (
                <CardContent className="text-center pt-0">
                  <Avatar className="h-20 w-20 mx-auto mb-2 ring-2 ring-amber-400">
                    <AvatarImage
                      src={topUsers?.[0]?.user?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[0]?.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(topUsers?.[0]?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg truncate max-w-xs">
                    {topUsers?.[0]?.user?.name}
                  </h3>
                  <div className="flex gap-2 justify-center mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[0]?.totalAssignments} Assign
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[0]?.totalLessons} Lessons
                    </Badge>
                  </div>
                  <div className="font-semibold text-foreground text-xl mt-2">
                    {topUsers?.[0]?.score} pts
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 3rd Place */}
            <Card className="border-2 border-amber-700 order-3 md:order-3">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2">
                  <Award className="h-8 w-8 text-amber-700" />
                </div>
                <CardTitle className="text-lg">3rd Place</CardTitle>
              </CardHeader>
              {topUsers?.[2] && (
                <CardContent className="text-center pt-0">
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarImage
                      src={topUsers?.[2]?.user?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[2]?.user?.name || "User"}
                    />
                    <AvatarFallback>
                      {getInitials(topUsers?.[2]?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium truncate max-w-xs">
                    {topUsers?.[2]?.user?.name}
                  </h3>
                  <div className="flex gap-2 justify-center mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[2]?.totalAssignments} Assign
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {topUsers?.[2]?.totalLessons} Lessons
                    </Badge>
                  </div>
                  <div className="font-semibold text-foreground text-lg mt-2">
                    {topUsers?.[2]?.score} pts
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* Your Rank Card - Show if not in top 3 */}
      {currentUser &&
        !topUsers.find((u) => u.userId === currentUser.userId) && (
          <Card className="border-2 border-primary bg-primary/5">
            <CardContent className="p-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Your Current Rank</p>
              <div className="flex items-center justify-center gap-4">
                <div>
                  <div className="text-4xl font-bold text-primary">
                    #{currentUser.rank}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {leaderboard.length - currentUser.rank} to reach top 3
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold">{currentUser.score}</div>
                  <p className="text-xs text-muted-foreground">points total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
          <CardDescription>
            Ranked by total assignments and lessons completed • Average score:{" "}
            {averageScore}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard?.length === 0 && (
            <div className="text-center p-12 space-y-4">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/30" />
              <div>
                <p className="font-semibold text-lg">No one has started yet!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete your first assignment to appear on the leaderboard
                </p>
              </div>
              <Button
                onClick={() => onNavigate(routes.bootcampDashboard(bootcampId))}
              >
                Start First Lesson →
              </Button>
            </div>
          )}
          {leaderboard?.length > 0 && (
            <div className="space-y-4">
              {/* Leaderboard Table - Responsive */}
              <div className="rounded-md border overflow-x-auto">
                <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b bg-muted text-sm">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-4 md:col-span-5">User</div>
                  <div className="col-span-2 text-center text-xs">Assign</div>
                  <div className="col-span-2 text-center text-xs">Lessons</div>
                  <div className="col-span-3 md:col-span-2 text-center">
                    Score
                  </div>
                </div>

                {/* Leaderboard Entries */}
                {leaderboard?.map((entry) => {
                  const isCurrentUser = entry.userId === currentUser?.userId;
                  const isAboveAverage = entry.score > averageScore;
                  const badge = getRankBadge(entry.rank);

                  return (
                    <div
                      key={entry.userId}
                      className={`grid grid-cols-12 gap-2 p-4 border-b text-sm transition-colors ${
                        isCurrentUser
                          ? "bg-primary/10 border-primary font-semibold"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="col-span-1 font-bold">#{entry.rank}</div>
                      <div className="col-span-4 md:col-span-5 flex items-center gap-2 min-w-0">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage
                            src={entry.user?.avatar || "/placeholder.svg"}
                            alt={entry.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {getInitials(entry.user?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate">
                          {entry.user?.name}
                          {isAboveAverage && !badge && (
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 inline ml-1" />
                          )}
                        </span>
                      </div>
                      <div className="col-span-2 text-center">
                        {entry.totalAssignments}
                      </div>
                      <div className="col-span-2 text-center">
                        {entry.totalLessons}
                      </div>
                      <div className="col-span-3 md:col-span-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-bold">{entry.score}</span>
                          {badge && badge}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                  <span>Above average</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-500 text-xs h-5">🏆</Badge>
                  <span>Top performer</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
