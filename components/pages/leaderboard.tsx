"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Medal, Trophy, Award, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  projects: number;
  streak: number;
  mb: number;
  rank: number;
}

interface Archievement {
  name: string;
  description: string;
  count: number;
}

interface LeaderboardPage {
  slug: string;
  onNavigate: (path: string) => void;
}

export function LeaderboardPage({ slug, onNavigate }: LeaderboardPage) {
  const store = useAppStore();
  const [leaderboards, setLeaderboards] = useState<LeaderboardUser[]>([]);
  const [weeklyLeaderboards, setWeeklyLeaderboards] = useState<
    LeaderboardUser[]
  >([]);
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [achievements, setAchievements] = useState<Archievement[]>([]);

  const [weeklyTopUsers, setWeeklyTopUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser>();
  const [weeklycurrentUser, setWeeklyCurrentUser] = useState<LeaderboardUser>();
  const [activeTab, setActiveTab] = useState("overall");

  const loadWeekly = async () => {
    const data = await store.getProject30Leaderboard(slug, {
      weekly: true,
    });
    setLeaderboards(data.leaderboardUsers);
    setWeeklyCurrentUser(data.currentUser);
    setWeeklyTopUsers(data.topUsers);
  };

  const loadAchievements = async () => {
    const data = await store.getProject30Achievements(slug);
    setAchievements(data);
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const data = await store.getProject30Leaderboard(slug, {
        weekly: false,
      });
      if (!cancelled) {
        setLeaderboards(data.leaderboardUsers);
        setTopUsers(data.topUsers);
        setCurrentUser(data.currentUser);
      }
    };
    load();

    return () => {
      cancelled = true;
    };
  }, [slug, store]);

  useEffect(() => {
    if (activeTab.includes("weekly")) {
      loadWeekly();
    }

    if (activeTab.includes("achievements")) {
      loadAchievements();
    }
  }, [activeTab, slug, store]);

  const isTop10 = (id: string) => {
    return !!(
      leaderboards.find((l) => l.id === id) || topUsers.find((t) => t.id === id)
    );
  };

  const isWeeklyTop10 = (id: string) => {
    return !!(
      weeklyLeaderboards.find((l) => l.id === id) ||
      weeklyTopUsers.find((t) => t.id === id)
    );
  };

  // const achievements = [
  //   {
  //     name: "30-Day Champion",
  //     description: "Complete all 30 projects",
  //     count: 24,
  //   },
  //   {
  //     name: "Perfect Streak",
  //     description: "Maintain a 30-day streak",
  //     count: 18,
  //   },
  //   { name: "Code Master", description: "Earn 10,000+ MB", count: 12 },
  //   {
  //     name: "Community Helper",
  //     description: "Help 50+ community members",
  //     count: 35,
  //   },
  //   {
  //     name: "Speed Coder",
  //     description: "Complete 5 projects in under 2 hours each",
  //     count: 42,
  //   },
  // ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ship Leaderboard</h1>
          <p className="text-muted-foreground">
            See how you rank against other participants
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onNavigate(`/project30/${slug}`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ship
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Top 3 Users */}
        <div className="col-span-full">
          <h2 className="text-xl font-semibold mb-4">Top Performers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 2nd Place */}
            <Card className="border-2 border-silver">
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
                      src={topUsers?.[1]?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[1]?.name}
                    />
                    <AvatarFallback>
                      {topUsers?.[1]?.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{topUsers?.[1]?.name}</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>Projects: {topUsers?.[1]?.projects}</div>
                    <div>Streak: {topUsers?.[1]?.streak} days</div>
                    <div>MB: {topUsers?.[1]?.mb}</div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* 1st Place */}

            <Card className="border-2 border-amber-400 -mt-4">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2">
                  <Trophy className="h-10 w-10 text-amber-400" />
                </div>
                <CardTitle className="text-xl">1st Place</CardTitle>
              </CardHeader>
              {topUsers?.[0] && (
                <CardContent className="text-center pt-0">
                  <Avatar className="h-20 w-20 mx-auto mb-2">
                    <AvatarImage
                      src={topUsers?.[0]?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[0]?.name}
                    />
                    <AvatarFallback>
                      {topUsers?.[0]?.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium text-lg">{topUsers?.[0]?.name}</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>Projects: {topUsers?.[0]?.projects}</div>
                    <div>Streak: {topUsers?.[0]?.streak} days</div>
                    <div>MB: {topUsers?.[0]?.mb}</div>
                  </div>
                  <Badge className="mt-2 bg-amber-400 text-amber-950">
                    Champion
                  </Badge>
                </CardContent>
              )}
            </Card>

            {/* 3rd Place */}
            <Card className="border-2 border-amber-700">
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
                      src={topUsers?.[2]?.avatar || "/placeholder.svg"}
                      alt={topUsers?.[2]?.name}
                    />
                    <AvatarFallback>
                      {topUsers?.[2]?.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-medium">{topUsers?.[2]?.name}</h3>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <div>Projects: {topUsers?.[2]?.projects}</div>
                    <div>Streak: {topUsers?.[2]?.streak} days</div>
                    <div>MB: {topUsers?.[2]?.mb}</div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="overall"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="overall">Overall Ranking</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Leaders</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overall">
          <Card>
            <CardHeader>
              <CardTitle>Leaderboard Rankings</CardTitle>
              <CardDescription>
                Based on projects completed, streaks, and MB earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboards.length <= 0 && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    Weekly leaderboard resets every day at midnight
                  </p>
                  <p className="mt-2">Check back for the overall rankings!</p>
                </div>
              )}
              {leaderboards.length >= 1 && (
                <div className="space-y-4">
                  {/* Leaderboard Table */}
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b bg-muted">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-5">User</div>
                      <div className="col-span-2 text-center">Projects</div>
                      <div className="col-span-2 text-center">Streak</div>
                      <div className="col-span-2 text-center">MB</div>
                    </div>

                    {/* Leaderboard Entries */}
                    {leaderboards?.map((user) => (
                      <div
                        key={user.id}
                        className="grid grid-cols-12 gap-2 p-4 border-b"
                      >
                        <div className="col-span-1 font-medium">
                          #{user.rank}
                        </div>
                        <div className="col-span-5 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          {user.projects}
                        </div>
                        <div className="col-span-2 text-center">
                          {user.streak} days
                        </div>
                        <div className="col-span-2 text-center">{user.mb}</div>
                      </div>
                    ))}

                    {!isTop10(currentUser?.id!) && (
                      <>
                        {/* Ellipsis to indicate gap */}
                        <div className="grid grid-cols-12 gap-2 p-4 border-b text-center">
                          <div className="col-span-12">...</div>
                        </div>

                        {/* Current User */}
                        <div className="grid grid-cols-12 gap-2 p-4 bg-muted/50">
                          <div className="col-span-1 font-medium">
                            #{currentUser?.rank}
                          </div>
                          <div className="col-span-5 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={currentUser?.avatar || "/placeholder.svg"}
                                alt={currentUser?.name}
                              />
                              <AvatarFallback>
                                {currentUser?.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {currentUser?.name}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.projects}
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.streak} days
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.mb}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weekly">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Leaders</CardTitle>
              <CardDescription>Top performers for this week</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyLeaderboards.length >= 1 && (
                <div className="space-y-4">
                  {/* Leaderboard Table */}
                  <div className="rounded-md border">
                    <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b bg-muted">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-5">User</div>
                      <div className="col-span-2 text-center">Projects</div>
                      <div className="col-span-2 text-center">Streak</div>
                      <div className="col-span-2 text-center">MB</div>
                    </div>

                    {/* Leaderboard Entries */}
                    {weeklyLeaderboards?.map((user) => (
                      <div
                        key={user.id}
                        className="grid grid-cols-12 gap-2 p-4 border-b"
                      >
                        <div className="col-span-1 font-medium">
                          #{user.rank}
                        </div>
                        <div className="col-span-5 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                            />
                            <AvatarFallback>
                              {user.name.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.name}</span>
                        </div>
                        <div className="col-span-2 text-center">
                          {user.projects}
                        </div>
                        <div className="col-span-2 text-center">
                          {user.streak} days
                        </div>
                        <div className="col-span-2 text-center">{user.mb}</div>
                      </div>
                    ))}

                    {!isWeeklyTop10(weeklycurrentUser?.id!) && (
                      <>
                        {/* Ellipsis to indicate gap */}
                        <div className="grid grid-cols-12 gap-2 p-4 border-b text-center">
                          <div className="col-span-12">...</div>
                        </div>

                        {/* Current User */}
                        <div className="grid grid-cols-12 gap-2 p-4 bg-muted/50">
                          <div className="col-span-1 font-medium">
                            #{currentUser?.rank}
                          </div>
                          <div className="col-span-5 flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={currentUser?.avatar || "/placeholder.svg"}
                                alt={currentUser?.name}
                              />
                              <AvatarFallback>
                                {currentUser?.name.substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {currentUser?.name}
                            </span>
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.projects}
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.streak} days
                          </div>
                          <div className="col-span-2 text-center">
                            {currentUser?.mb}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              {weeklyLeaderboards.length <= 0 && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    Weekly leaderboard resets every Sunday at midnight
                  </p>
                  <p className="mt-2">Check back for this week's rankings!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Leaderboard</CardTitle>
              <CardDescription>
                Most prestigious achievements in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <Trophy className="h-8 w-8 text-amber-400" />
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{achievement.count}</div>
                      <div className="text-xs text-muted-foreground">users</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
