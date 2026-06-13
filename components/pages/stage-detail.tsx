"use client";
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
import {
  ArrowLeft,
  Trophy,
  Star,
  Clock,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  Info,
  Lightbulb,
  Code,
  FileQuestion,
  Puzzle,
  Bug,
} from "lucide-react";
import { getLandById, getStageById } from "@/lib/lands-data";
import { routes } from "@/lib/routes";

interface StageDetailPageProps {
  landId: string;
  stageId: string;
  onNavigate: (path: string) => void;
}

export function StageDetailPage({
  landId,
  stageId,
  onNavigate,
}: StageDetailPageProps) {
  const land = getLandById(landId);
  const stage = getStageById(landId, stageId);


  if (!land || !stage) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Stage Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The stage you're looking for doesn't exist
        </p>
        <Button onClick={() => onNavigate(routes.landDetail(landId))}>
          Back to Land
        </Button>
      </div>
    );
  }

  // Get challenge type icon
  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case "coding":
        return <Code className="h-4 w-4" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4" />;
      case "puzzle":
        return <Puzzle className="h-4 w-4" />;
      case "debug":
        return <Bug className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // Get challenge difficulty color
  const getChallengeDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Medium":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "Hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Expert":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(routes.landDetail(landId))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-muted">
              {land.title}
            </Badge>
            <Badge
              variant="outline"
              className="bg-[#13AECE]/10 text-[#13AECE] border-[#13AECE]/20"
            >
              Stage {stage.order}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{stage.title}</h1>
          <p className="text-muted-foreground">{stage.description}</p>
        </div>
      </div>

      {/* Stage Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-[#F2C94C]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">Total MB</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {stage.totalXP.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {stage.completedXP.toLocaleString()} earned
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#13AECE]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#13AECE]" />
              <span className="text-sm font-medium">Challenges</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stage.challenges.length}</p>
            <p className="text-xs text-muted-foreground">
              {
                stage.challenges.filter((challenge) => challenge.completed)
                  .length
              }{" "}
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
            <p className="text-2xl font-bold mt-1">{stage.estimatedTime}</p>
            <p className="text-xs text-muted-foreground">
              To complete all challenges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-[#13AECE] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Stage Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Overall Completion</span>
              <span>{stage.progress}%</span>
            </div>
            <Progress value={stage.progress} className="h-3" />
            <div className="flex justify-between text-sm text-blue-100">
              <span>{stage.completedXP.toLocaleString()} MB earned</span>
              <span>
                {(stage.totalXP - stage.completedXP).toLocaleString()} MB
                remaining
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenges */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Challenges</h2>
        <p className="text-muted-foreground">
          Complete these challenges to master {stage.title}
        </p>
      </div>

      <div className="space-y-4">
        {stage.challenges.map((challenge, index) => (
          <Card
            key={challenge.id}
            className={!challenge.unlocked ? "opacity-70" : ""}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-muted">
                    Challenge {index + 1}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getChallengeDifficultyColor(
                      challenge.difficulty
                    )}
                  >
                    {challenge.difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-[#F2C94C]" />
                  <span className="text-sm font-medium">
                    {challenge.xpReward.toLocaleString()} MB
                  </span>
                </div>
              </div>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getChallengeTypeIcon(challenge.type)}
                  <span>{challenge.title}</span>
                </div>
                {challenge.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : !challenge.unlocked ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : null}
              </CardTitle>
              <CardDescription>{challenge.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  {getChallengeTypeIcon(challenge.type)}
                  <span className="capitalize">{challenge.type} Challenge</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {challenge.timeEstimate}
                </div>
              </div>

              {challenge.usedHints > 0 && (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <Lightbulb className="h-4 w-4" />
                  <span>
                    {challenge.usedHints} hint
                    {challenge.usedHints > 1 ? "s" : ""} used
                  </span>
                </div>
              )}

              <Button
                className="w-full flex items-center justify-between"
                disabled={!challenge.unlocked}
                onClick={() =>
                  onNavigate(
                    routes.challengeDetail(landId, stageId, challenge.id)
                  )
                }
              >
                <span>
                  {challenge.completed ? "Review" : "Start Challenge"}
                </span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stage Completion */}
      {stage.completed && (
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Stage Completed!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-600 mb-4">
              Congratulations! You've completed all challenges in this stage and
              earned {stage.totalXP.toLocaleString()} MB.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => onNavigate(routes.landDetail(landId))}>
                Back to Land
              </Button>
              {/* Check if there's a next stage */}
              {land.stages.find((s) => s.order === stage.order + 1) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextStage = land.stages.find(
                      (s) => s.order === stage.order + 1
                    );
                    if (nextStage) {
                      onNavigate(routes.stageDetail(landId, nextStage.id));
                    }
                  }}
                >
                  Next Stage
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
