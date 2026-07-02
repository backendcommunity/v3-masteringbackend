"use client";

import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { dataStore } from "@/lib/data";
import ConfettiCelebration from "@/components/confetti-celebration";
import { Trophy, Star, Zap } from "lucide-react";

const LEVEL_ICONS: Record<number, typeof Trophy> = {
  1: Star,
  2: Star,
  3: Zap,
  4: Zap,
  5: Trophy,
  6: Trophy,
  7: Trophy,
  8: Trophy,
  9: Trophy,
  10: Trophy,
};

export function LevelUpModal() {
  const { levelUpModal, setLevelUpModal } = useAppStore();

  const isOpen = !!levelUpModal;
  const newLevel = levelUpModal?.newLevel ?? 1;
  const oldLevel = levelUpModal?.oldLevel ?? 1;

  const newLevelData = dataStore.levels.find((l) => l.id === newLevel);
  const LevelIcon = LEVEL_ICONS[newLevel] ?? Trophy;

  function handleClose() {
    setLevelUpModal(null);
  }

  return (
    <>
      <ConfettiCelebration
        isVisible={isOpen}
        onComplete={() => {}}
        courseName="level-up"
        celebrationType="milestone"
        duration={3500}
      />
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-sm text-center border-2 border-yellow-500/40 bg-background">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center ring-4 ring-yellow-500/30">
                <LevelIcon className="w-10 h-10 text-yellow-500" />
              </div>
              <span className="absolute -top-1 -right-1 text-2xl">🎉</span>
            </div>

            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Level Up!
              </p>
              <h2 className="text-2xl font-bold">
                {newLevelData?.name ?? `Level ${newLevel}`}
              </h2>
              <p className="text-muted-foreground text-sm mt-2">
                You advanced from Level {oldLevel} to Level {newLevel}. Keep
                going. More rewards ahead.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded-full px-4 py-1.5 text-sm font-semibold">
              <Trophy className="w-4 h-4" />
              Level {newLevel} Achieved
            </div>

            <Button onClick={handleClose} className="w-full mt-2">
              Keep Learning
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
