import { dataStore, Level } from "@/lib/data";
import { useUser } from "./use-user";

export function useLevel() {
  const user = useUser();
  const levels: Level[] = dataStore?.levels;

  const points = user?.points ?? 0;
  const userLevel = user?.level ?? 1;

  // Find current level's position in the array (levels are id 1–10, array is 0-based)
  const currentIdx = Math.max(0, levels.findIndex((l) => l.id === userLevel));
  const currentLevel = levels[currentIdx];

  // Next level (null if at max level)
  const nextLevel: Level | null =
    currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null;

  // The threshold that marks the START of the current level span:
  //  - Level 1 starts at 0 pts
  //  - Level N (N>1) starts where level N's threshold begins, which equals
  //    levels[currentIdx].point (the value at the current index)
  const prevThreshold = currentIdx === 0 ? 0 : levels[currentIdx].point;
  const nextThreshold = nextLevel?.point ?? null;

  // Points remaining until next level (0 when at max)
  const mbToNextLevel =
    nextThreshold !== null ? Math.max(0, nextThreshold - points) : 0;

  // Progress % within the current level span, clamped 0–100
  const progressPct =
    nextThreshold !== null
      ? Math.min(
          100,
          Math.max(
            0,
            ((points - prevThreshold) / (nextThreshold - prevThreshold)) * 100
          )
        )
      : 100;

  return { levels, mbToNextLevel, level: currentLevel, progressPct };
}
