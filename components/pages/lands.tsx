"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trophy,
  Star,
  Users,
  Clock,
  Search,
  Zap,
  Target,
  Award,
  Filter,
  Lock,
} from "lucide-react";
import { getLands } from "@/lib/lands-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/lib/routes";
import { WIP } from "../WIP";

interface LandsPageProps {
  onNavigate: (path: string) => void;
}

export function LandsPage({ onNavigate }: LandsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const lands = getLands();

  // Filter lands based on search query and filters
  const filteredLands = lands.filter((land) => {
    // Search filter
    const matchesSearch =
      land.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      land.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      land.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Difficulty filter
    const matchesDifficulty =
      difficultyFilter === "all" ||
      land.difficulty.toLowerCase() === difficultyFilter.toLowerCase();

    // Category filter
    const matchesCategory =
      categoryFilter === "all" ||
      land.category.toLowerCase() === categoryFilter.toLowerCase();

    // Tab filter
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "in-progress" &&
        land.progress > 0 &&
        land.progress < 100) ||
      (activeTab === "completed" && land.completed) ||
      (activeTab === "locked" && !land.unlocked);

    return matchesSearch && matchesDifficulty && matchesCategory && matchesTab;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(lands.map((land) => land.category)));

  return (
    <div className="flex-1 space-y-6 relative">
      <WIP />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MB Lands</h1>
          <p className="text-muted-foreground">
            Master programming concepts through gamified challenges and earn MB,
            badges, and glory!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-[#F2C94C]/10 text-[#F2C94C] border-[#F2C94C]/20"
          >
            <Trophy className="mr-1 h-3 w-3" />6 Lands Available
          </Badge>
        </div>
      </div>

      {/* Player Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#F2C94C]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">Lands Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">0 / 6</p>
            <p className="text-xs text-muted-foreground">0% completion rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Total MB Earned</span>
            </div>
            <p className="text-2xl font-bold mt-1">4,000</p>
            <p className="text-xs text-muted-foreground">From challenges</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#EB5757]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#EB5757]" />
              <span className="text-sm font-medium">Challenges Completed</span>
            </div>
            <p className="text-2xl font-bold mt-1">8</p>
            <p className="text-xs text-muted-foreground">85% success rate</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#347474]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#347474]" />
              <span className="text-sm font-medium">Badges Earned</span>
            </div>
            <p className="text-2xl font-bold mt-1">3</p>
            <p className="text-xs text-muted-foreground">2 this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lands..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase()}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All Lands</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="locked">Locked</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lands Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredLands.length > 0 ? (
          filteredLands.map((land) => (
            <Card
              key={land.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-40">
                <img
                  src={land.thumbnail || "/placeholder.svg"}
                  alt={land.title}
                  className="w-full h-full object-cover"
                />
                {!land.unlocked && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Lock className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">
                        Complete previous lands to unlock
                      </p>
                    </div>
                  </div>
                )}
                <Badge
                  className="absolute top-2 right-2"
                  variant={
                    land.difficulty === "Beginner"
                      ? "secondary"
                      : land.difficulty === "Intermediate"
                      ? "default"
                      : land.difficulty === "Advanced"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {land.difficulty}
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-muted">
                    {land.category}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-[#F2C94C]" />
                    <span className="text-sm font-medium">
                      {land.totalXP.toLocaleString()} MB
                    </span>
                  </div>
                </div>
                <CardTitle className="line-clamp-1">{land.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {land.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {land.users.toLocaleString()} users
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {land.estimatedTime}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{land.progress}%</span>
                  </div>
                  <Progress value={land.progress} className="h-2" />
                </div>

                <Button
                  className="w-full"
                  disabled={!land.unlocked}
                  onClick={() => onNavigate(routes.landDetail(land.id))}
                >
                  {land.progress > 0 && land.progress < 100
                    ? "Continue"
                    : land.completed
                    ? "Review"
                    : "Start"}
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">
              No lands match your filters
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setDifficultyFilter("all");
                setCategoryFilter("all");
                setActiveTab("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#F2C94C]" />
            MB Lands Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { rank: 1, name: "Alex Chen", xp: 12500, badge: "🥇", lands: 5 },
              {
                rank: 2,
                name: "Sarah Johnson",
                xp: 10800,
                badge: "🥈",
                lands: 4,
              },
              {
                rank: 3,
                name: "Mike Rodriguez",
                xp: 9650,
                badge: "🥉",
                lands: 4,
              },
              { rank: 4, name: "Emily Davis", xp: 8200, badge: "", lands: 3 },
              {
                rank: 5,
                name: "John Doe",
                xp: 4000,
                badge: "",
                isUser: true,
                lands: 2,
              },
            ].map((player) => (
              <div
                key={player.rank}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.isUser
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <span className="text-sm font-bold">
                      {player.badge || `#${player.rank}`}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {player.xp.toLocaleString()} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{player.lands} Lands</Badge>
                  {player.isUser && (
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary"
                    >
                      You
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
