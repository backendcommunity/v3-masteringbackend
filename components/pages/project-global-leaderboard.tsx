"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  User,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Loader } from "../ui/loader";
import { toast } from "sonner";

interface GlobalLeaderboardDialogProps {
  open: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function GlobalLeaderboardDialog({
  open,
  onClose,
  onNavigate,
}: GlobalLeaderboardDialogProps) {
  const store = useAppStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadLeaderboard();
    }
  }, [open]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await store.getGlobalProjectLeaderboard({ size: 50, skip: 0 });
      setLeaderboard(data?.leaderboard || []);
    } catch (error) {
      console.error("Failed to load global leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 dark:bg-yellow-900/20 border-yellow-500";
    if (rank === 2) return "bg-gray-100 dark:bg-gray-800 border-gray-400";
    if (rank === 3) return "bg-amber-100 dark:bg-amber-900/20 border-amber-600";
    return "bg-muted";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Global Project Leaderboard
          </DialogTitle>
          <DialogDescription>
            Top developers ranked by total project points across all MB Projects
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8">
            <Loader isLoader={true} isFull={false} />
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              return (
                <Card
                  key={entry.userId}
                  className={`overflow-hidden transition-all hover:shadow-md ${
                    rank <= 3 ? getRankBadgeColor(rank) : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(rank)}
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-[#2BB8D8] flex items-center justify-center text-white font-bold">
                          {entry.user?.name
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("") || <User className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{entry.user?.name || "Anonymous"}</h3>
                            {rank <= 3 && (
                              <Badge variant="outline" className="text-xs">
                                Top {rank}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{entry.completedProjects || 0} projects completed</span>
                            {entry.user?.location && (
                              <span>• {entry.user.location}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                          {entry.totalPoints?.toLocaleString() || 0}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {entry.averageScore || 0}% avg score
                        </div>
                      </div>

                      {/* View Portfolio */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onNavigate?.(`/portfolio/${entry.userId}`);
                          onClose();
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Technologies */}
                    {entry.topTechnologies && entry.topTechnologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 ml-16">
                        {entry.topTechnologies.slice(0, 5).map((tech: string) => (
                          <Badge key={tech} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {leaderboard.length === 0 && !loading && (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No leaderboard data available yet
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Rankings updated daily based on project completions and scores
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
