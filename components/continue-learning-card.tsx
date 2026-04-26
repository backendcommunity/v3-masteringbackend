"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { type ContinueLearningItem, type ContentItemType } from "@/lib/data";
import {
  BookOpen,
  Compass,
  GraduationCap,
  Terminal,
  Mic,
  ChevronRight,
} from "lucide-react";
import { analytics } from "@/lib/analytics";
import { EmptyStateCard } from "@/components/empty-state-card";

const TYPE_CONFIG: Record<
  ContentItemType,
  {
    label: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    badgeClass: string;
    borderHover: string;
  }
> = {
  course: {
    label: "Course",
    icon: BookOpen,
    iconColor: "text-[#13AECE]",
    iconBg: "bg-gradient-to-br from-[#13AECE]/25 to-[#13AECE]/5",
    badgeClass: "bg-[#13AECE]/10 text-[#13AECE] border-[#13AECE]/20",
    borderHover: "hover:border-[#13AECE]/40",
  },
  roadmap: {
    label: "Learning Path",
    icon: Compass,
    iconColor: "text-violet-400",
    iconBg: "bg-gradient-to-br from-violet-500/25 to-violet-500/5",
    badgeClass: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    borderHover: "hover:border-violet-500/40",
  },
  bootcamp: {
    label: "Bootcamp",
    icon: GraduationCap,
    iconColor: "text-orange-400",
    iconBg: "bg-gradient-to-br from-orange-500/25 to-orange-500/5",
    badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    borderHover: "hover:border-orange-500/40",
  },
  project: {
    label: "Project",
    icon: Terminal,
    iconColor: "text-emerald-400",
    iconBg: "bg-gradient-to-br from-emerald-500/25 to-emerald-500/5",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderHover: "hover:border-emerald-500/40",
  },
  mock_interview: {
    label: "Mock Interview",
    icon: Mic,
    iconColor: "text-rose-400",
    iconBg: "bg-gradient-to-br from-rose-500/25 to-rose-500/5",
    badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    borderHover: "hover:border-rose-500/40",
  },
};

export function ContinueLearningCard() {
  const store = useAppStore();
  const router = useRouter();
  const [items, setItems] = useState<ContinueLearningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store
      .getContinueLearning()
      .then((data) => setItems(data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [store]);

  const handleResume = (item: ContinueLearningItem) => {
    analytics.track("click_resume_content", {
      type: item.type,
      id: item.id,
      title: item.title,
      resumeLabel: item.resumeLabel,
      fromDashboard: true,
    });
    router.push(item.resumeUrl);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Continue Learning</CardTitle>
        <CardDescription>Pick up where you left off</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3 p-3 border border-border rounded-lg animate-pulse"
              >
                <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyStateCard
            icon={BookOpen}
            title="Nothing In Progress"
            description="Enroll in a course, path, or project to see your progress here."
            primaryCTA={{
              label: "Browse Courses",
              onClick: () => router.push("/courses"),
            }}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              const config = TYPE_CONFIG[item.type];
              const Icon = config.icon;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`flex gap-3 p-3 border border-border rounded-lg transition-all group cursor-pointer hover:bg-muted/40 ${config.borderHover}`}
                  onClick={() => handleResume(item)}
                >
                  {/* Icon tile */}
                  <div
                    className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${config.iconBg}`}
                  >
                    <Icon className={`h-[18px] w-[18px] ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 font-medium ${config.badgeClass}`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <p className="font-medium text-sm truncate leading-tight">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.resumeLabel}
                    </p>
                  </div>

                  {/* Arrow */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity self-center"
                    tabIndex={-1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
