"use client";
import { Progress } from "@/components/ui/progress";
import { PathSession } from "@/lib/path-types";

export function PathMeters({ session }: { session: PathSession }) {
  const { path } = session;
  return (
    <div className="p-4 border-b space-y-3">
      <h2 className="font-bold text-sm truncate">{path.title}</h2>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{path.progressPct}%</span>
        </div>
        <Progress value={path.progressPct} className="h-2" />
      </div>
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Mastery</span>
          <span>
            {path.earnedPoints}/{path.certThreshold} pts
          </span>
        </div>
        <Progress value={path.masteryPct} className="h-2" />
      </div>
      {path.certEligible && (
        <div className="text-xs font-semibold text-[#347474]">
          🎓 Certificate unlocked
        </div>
      )}
    </div>
  );
}
