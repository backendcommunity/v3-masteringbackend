"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Star,
  Clock,
  Zap,
  CheckCircle2,
  Lightbulb,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  getLandById,
  getStageById,
  getChallengeById,
  useHint,
  completeChallenge,
} from "@/lib/lands-data";
import { routes } from "@/lib/routes";
import { CodingChallengeComponent } from "./challenges/coding-challenge";
import { QuizChallengeComponent } from "./challenges/quiz-challenge";
import { PuzzleChallengeComponent } from "./challenges/puzzle-challenge";
import { DebugChallengeComponent } from "./challenges/debug-challenge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface ChallengeDetailPageProps {
  landId: string;
  stageId: string;
  challengeId: string;
  onNavigate: (path: string) => void;
}

export function ChallengeDetailPage({
  landId,
  stageId,
  challengeId,
  onNavigate,
}: ChallengeDetailPageProps) {
  const [showKapDialog, setShowKapDialog] = useState(false);
  const [kapQuestion, setKapQuestion] = useState("");
  const [kapResponse, setKapResponse] = useState("");
  const [isLoadingKap, setIsLoadingKap] = useState(false);
  const [usedHintId, setUsedHintId] = useState<string | null>(null);
  const [xpCost, setXpCost] = useState(0);

  const land = getLandById(landId);
  const stage = getStageById(landId, stageId);
  const challenge: any = getChallengeById(landId, stageId, challengeId);

  const handleUseHintEffect = useCallback(() => {
    if (usedHintId) {
      const cost = useHint(landId, stageId, challengeId, usedHintId);
      setXpCost(cost);
      setUsedHintId(null);
    }
  }, [usedHintId, landId, stageId, challengeId]);

  useEffect(() => {
    handleUseHintEffect();
  }, [handleUseHintEffect]);

  if (!land || !stage || !challenge) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center">
        <Info className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Challenge Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The challenge you're looking for doesn't exi
        </p>
        <Button onClick={() => onNavigate(routes.stageDetail(landId, stageId))}>
          Back to Stage
        </Button>
      </div>
    );
  }

  const handleUseHint = (hintId: string) => {
    setUsedHintId(hintId);
  };

  const handleCompleteChallenge = () => {
    const xpEarned = completeChallenge(landId, stageId, challengeId);
    // In a real app, you'd update the user's MB here
  };

  const handleAskKap = async () => {
    if (!kapQuestion.trim()) return;

    setIsLoadingKap(true);
    // Simulate AI response
    setTimeout(() => {
      setKapResponse(
        `Here's a hint for your question: "${kapQuestion}"\n\nBased on the challenge context, I suggest breaking down the problem into smaller steps. Remember to consider edge cases and test your solution thoroughly. This hint cost you 100 MB, but it should help you move forward!`
      );
      setIsLoadingKap(false);
      // Deduct MB for using Kap
    }, 2000);
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

  // Render challenge component based on type
  const renderChallengeComponent = () => {
    switch (challenge.type) {
      case "coding":
        return (
          <CodingChallengeComponent
            challenge={{
              id: challenge.id,
              title: challenge.title,
              description: challenge.description,
              difficulty: challenge.difficulty as "Easy" | "Medium" | "Hard",
              timeLimit: challenge.timeEstimate
                ? Number.parseInt(challenge.timeEstimate.split(" ")[0])
                : 30,
              points: challenge.xpReward,
              requirements: [
                "Implement the function according to the specifications",
                "Handle edge cases appropriately",
                "Ensure all test cases pass",
              ],
              testCases: challenge?.testCases || [
                {
                  input: "5",
                  expectedOutput: "25",
                  description: "Basic test case",
                },
              ],
              starterCode:
                challenge?.starterCode ||
                `function solution(input) {
  // Your code here
  return input;
}`,
              language: "javascript",
            }}
            onComplete={handleCompleteChallenge}
          />
        );
      case "quiz":
        return (
          <QuizChallengeComponent
            challenge={challenge as any}
            onComplete={handleCompleteChallenge}
          />
        );
      case "puzzle":
        return (
          <PuzzleChallengeComponent
            challenge={challenge as any}
            onComplete={handleCompleteChallenge}
          />
        );
      case "debug":
        return (
          <DebugChallengeComponent
            challenge={challenge as any}
            onComplete={handleCompleteChallenge}
          />
        );
      default:
        return <div>Challenge type not supported</div>;
    }
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onNavigate(routes.stageDetail(landId, stageId))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-muted">
              {land.title}
            </Badge>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/20"
            >
              {stage.title}
            </Badge>
            <Badge
              variant="outline"
              className={getChallengeDifficultyColor(challenge.difficulty)}
            >
              {challenge.difficulty}
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {challenge.title}
          </h1>
          <p className="text-muted-foreground">{challenge.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Zap className="h-4 w-4 text-[#F2C94C]" />
            <span className="text-sm font-medium">
              {challenge.xpReward.toLocaleString()} MB
            </span>
          </div>
          {challenge.completed && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>

      {/* Challenge Info */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-[#F2C94C]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#F2C94C]" />
              <span className="text-sm font-medium">MB Reward</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {challenge.xpReward.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Upon completion</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Time Estimate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{challenge.timeEstimate}</p>
            <p className="text-xs text-muted-foreground">
              Average completion time
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#EB5757]">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#EB5757]" />
              <span className="text-sm font-medium">Hints Available</span>
            </div>
            <p className="text-2xl font-bold mt-1">{challenge.hints.length}</p>
            <p className="text-xs text-muted-foreground">
              {challenge.usedHints} used
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Hints */}
            {challenge.hints.map((hint: any, index: any) => (
              <Button
                key={hint.id}
                variant="outline"
                size="sm"
                disabled={hint.used}
                onClick={() => handleUseHint(hint.id)}
                className="flex items-center gap-1"
              >
                <Lightbulb className="h-3 w-3" />
                {hint.used
                  ? `Hint ${index + 1} (Used)`
                  : `Hint ${index + 1} (-${hint.xpCost} MB)`}
              </Button>
            ))}

            {/* Kap AI Assistant */}
            <Dialog open={showKapDialog} onOpenChange={setShowKapDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Star className="h-3 w-3" />
                  Ask Kap (-100 MB)
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-[#F2C94C]" />
                    Ask Kap AI Assistant
                  </DialogTitle>
                  <DialogDescription>
                    Get personalized help from our AI assistant. This will cost
                    you 100 MB.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Your Question</label>
                    <textarea
                      className="w-full mt-1 p-2 border rounded-md resize-none"
                      rows={3}
                      placeholder="What specific part of this challenge are you struggling with?"
                      value={kapQuestion}
                      onChange={(e) => setKapQuestion(e.target.value)}
                    />
                  </div>

                  {kapResponse && (
                    <div>
                      <label className="text-sm font-medium">
                        Kap's Response
                      </label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <p className="text-sm whitespace-pre-wrap">
                          {kapResponse}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowKapDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAskKap}
                      disabled={!kapQuestion.trim() || isLoadingKap}
                    >
                      {isLoadingKap ? "Asking Kap..." : "Ask Kap"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Show used hints */}
          {challenge.hints.some((hint: any) => hint.used) && (
            <div className="mt-4 space-y-2">
              <Separator />
              <h4 className="font-medium text-sm">Used Hints:</h4>
              {challenge.hints
                .filter((hint: any) => hint.used)
                .map((hint: any, index: any) => (
                  <div key={hint.id} className="p-2 bg-muted rounded text-sm">
                    <strong>Hint {index + 1}:</strong> {hint.content}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Component */}
      {renderChallengeComponent()}
    </div>
  );
}
