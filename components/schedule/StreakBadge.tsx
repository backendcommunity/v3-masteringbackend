import { Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StreakBadgeProps {
  value: number;
}

export function StreakBadge({ value }: StreakBadgeProps) {
  return (
    <Badge variant="outline" className="gap-2 border-orange-200 bg-orange-50">
      <Flame className="h-3 w-3 text-orange-500" />
      <span className="text-xs font-medium dark:text-black">
        {value} day streak
      </span>
    </Badge>
  );
}
