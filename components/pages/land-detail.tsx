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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Trophy,
  Star,
  Clock,
  Zap,
  Target,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  Lightbulb,
} from "lucide-react";
import { getLandById } from "@/lib/lands-data";
import { routes } from "@/lib/routes";

interface LandDetailPageProps {
  landId: string;
  onNavigate: (path: string) => void;
}

export function LandDetailPage({ landId, onNavigate }: LandDetailPageProps) {
  const [activeTab, setActiveTab] = useState("stages");

  const land = getLandById(landId);

  if (!land) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Land Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The land you're looking for doesn't exist
        </p>
        <Button onClick={() => onNavigate(routes.lands)}>
          Back to MB Lands
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(routes.lands)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge
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
            <Badge variant="outline" className="bg-muted">
              {land.category}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{land.title}</h1>
          <p className="text-muted-foreground">{land.description}</p>
        </div>
      </div>

      {/* Land Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-[#F2C94C]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">Total MB</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {land.totalXP.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {land.completedXP.toLocaleString()} earned
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Stages</span>
            </div>
            <p className="text-2xl font-bold mt-1">{land.stages.length}</p>
            <p className="text-xs text-muted-foreground">
              {land.stages.filter((stage) => stage.completed).length} completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#EB5757]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#EB5757]" />
              <span className="text-sm font-medium">Challenges</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {land.stages.reduce(
                (total, stage) => total + stage.challenges.length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {land.stages.reduce(
                (total, stage) =>
                  total +
                  stage.challenges.filter((challenge) => challenge.completed)
                    .length,
                0
              )}{" "}
              completed
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#347474]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#347474]" />
              <span className="text-sm font-medium">Estimated Time</span>
            </div>
            <p className="text-2xl font-bold mt-1">{land.estimatedTime}</p>
            <p className="text-xs text-muted-foreground">
              To complete all stages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-primary text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Land Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Overall Completion</span>
              <span>{land.progress}%</span>
            </div>
            <Progress value={land.progress} className="h-3" />
            <div className="flex justify-between text-sm text-blue-100">
              <span>{land.completedXP.toLocaleString()} MB earned</span>
              <span>
                {(land.totalXP - land.completedXP).toLocaleString()} MB
                remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="stages">Stages</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Stages Tab */}
        <TabsContent value="stages" className="space-y-6">
          <div className="space-y-6">
            {land.stages.map((stage, index) => (
              <Card
                key={stage.id}
                className={!stage.unlocked ? "opacity-70" : ""}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-muted">
                      Stage {index + 1}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-[#F2C94C]" />
                      <span className="text-sm font-medium">
                        {stage.totalXP.toLocaleString()} MB
                      </span>
                    </div>
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stage.title}</span>
                    {stage.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : !stage.unlocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : null}
                  </CardTitle>
                  <CardDescription>{stage.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Lightbulb className="h-4 w-4" />
                      {stage.challenges.length} challenges
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {stage.estimatedTime}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{stage.progress}%</span>
                    </div>
                    <Progress value={stage.progress} className="h-2" />
                  </div>

                  <Button
                    className="w-full flex items-center justify-between"
                    disabled={!stage.unlocked}
                    onClick={() =>
                      onNavigate(routes.stageDetail(land.id, stage.id))
                    }
                  >
                    <span>
                      {stage.progress > 0 && stage.progress < 100
                        ? "Continue"
                        : stage.completed
                        ? "Review"
                        : "Start"}
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>About This Land</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-2">Description</h3>
                <p>{land.description}</p>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">What You'll Learn</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {land.stages.map((stage) => (
                    <li key={stage.id}>{stage.title}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">Prerequisites</h3>
                <p>
                  {land.id === "javascript-fundamentals"
                    ? "No prerequisites required. This is a beginner-friendly land."
                    : "Complete previous lands to build the necessary foundation."}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-lg mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {land.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#F2C94C]" />
                Land Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    rank: 1,
                    name: "Alex Chen",
                    xp: land.totalXP,
                    badge: "🥇",
                    completion: "100%",
                  },
                  {
                    rank: 2,
                    name: "Sarah Johnson",
                    xp: Math.round(land.totalXP * 0.95),
                    badge: "🥈",
                    completion: "95%",
                  },
                  {
                    rank: 3,
                    name: "Mike Rodriguez",
                    xp: Math.round(land.totalXP * 0.88),
                    badge: "🥉",
                    completion: "88%",
                  },
                  {
                    rank: 4,
                    name: "Emily Davis",
                    xp: Math.round(land.totalXP * 0.76),
                    badge: "",
                    completion: "76%",
                  },
                  {
                    rank: 5,
                    name: "John Doe",
                    xp: land.completedXP,
                    badge: "",
                    isUser: true,
                    completion: `${land.progress}%`,
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
                      <Badge variant="outline">{player.completion}</Badge>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
