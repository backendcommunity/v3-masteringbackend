"use client";
import { GraduationCap, Sparkles } from "lucide-react";
import { PathSession } from "@/lib/path-types";

export function PathMeters({ session }: { session: PathSession }) {
  const { path } = session;
  const ptsToCert = Math.max(0, path.certThreshold - path.earnedPoints);
  return (
    <div className="p-4 border-b space-y-4">
      <h2 className="text-gradient font-bold text-base tracking-tight truncate">
        {path.title}
      </h2>

      <div>
        <div className="flex justify-between text-[11px] font-medium text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="text-primary font-semibold">{path.progressPct}%</span>
        </div>
        <div className="progress-bar h-2">
          <div
            className="progress-bar-fill"
            style={{ width: `${path.progressPct}%` }}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground mb-1.5">
          <span>Mastery</span>
          <span className="glow-subtle inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles className="w-3 h-3" />
            {path.earnedPoints}/{path.certThreshold} pts
          </span>
        </div>
        <div className="level-progress h-2">
          <div
            className="level-progress-fill"
            style={{ width: `${path.masteryPct}%` }}
          />
        </div>
      </div>

      {path.certEligible ? (
        <div
          className="pulse-animation inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold text-[#1a1305]"
          style={{
            background: "linear-gradient(135deg, #F2C94C 0%, #d9a93b 100%)",
          }}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Certificate unlocked
        </div>
      ) : (
        <div className="text-[11px] font-medium text-muted-foreground">
          <span className="text-primary font-semibold">{ptsToCert} pts</span> to
          certificate
        </div>
      )}

      <div className="h-px bg-gradient-to-r from-primary/40 via-primary/10 to-transparent" />
    </div>
  );
}
