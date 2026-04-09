"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Code2,
  Trophy,
  Users,
  Briefcase,
  Zap,
  Target,
  TrendingUp,
  Sparkles,
  Crown,
  Gift,
  Award,
  ChevronLeft,
  ChevronRight,
  Star,
  Flame,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { useUser } from "@/hooks/use-user";
import { useLevel } from "@/hooks/use-level";
import { useAuth } from "@/store/auth";
import { BrandLogo } from "./brand-logo";
import { useTheme } from "next-themes";

interface DashboardSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isMobile: boolean;
  onCollapsed: Function;
  isCollapsed: boolean;
}

const navigationData = {
  learn: [
    {
      title: "Courses",
      url: routes.courses,
      icon: BookOpen,
      active: true,
      beta: false,
    },
    {
      title: "Bootcamps",
      url: routes.bootcamps,
      icon: Zap,
      active: true,
      beta: false,
    },
    {
      title: "Learning Paths",
      url: routes.paths,
      icon: Target,
      active: true,
      beta: false,
    },
    {
      title: "Roadmaps",
      url: routes.roadmaps,
      icon: TrendingUp,
      active: true,
      beta: false,
    },
  ],
  build: [
    {
      title: "MB Projects",
      url: routes.projects,
      icon: Code2,
      active: false,
      beta: false,
    },
    {
      title: "Project30",
      url: routes.project30,
      icon: Sparkles,
      active: true,
      beta: false,
    },
    // {
    //   title: "MB Lands",
    //   url: routes.lands,
    //   icon: Trophy,
    //   active: false,
    //   beta: false,
    // },
  ],
  grow: [
    // {
    //   title: "MB Interviews",
    //   url: routes.interviews,
    //   icon: Briefcase,
    //   active: false,
    //   beta: false,
    // },
    {
      title: "Mock Interviews",
      url: routes.mockInterviews,
      icon: Users,
      active: true,
      beta: true,
    },
    // {
    //   title: "Certifications",
    //   url: "/certifications",
    //   icon: Award,
    //   active: false,
    //   beta: false,
    // },
    // {
    //   title: "Community",
    //   url: routes.community,
    //   icon: Users,
    //   active: false,
    //   beta: false,
    // },
  ],
};

export function DashboardSidebar({
  currentPath,
  onNavigate,
  isMobile,
  isCollapsed,
  onCollapsed,
}: DashboardSidebarProps) {
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const user = useUser();
  const { theme } = useTheme();
  const { level, mbToNextLevel, progressPct } = useLevel();

  useEffect(() => setMounted(true), []);
  useEffect(() => setCollapsed(isCollapsed), [isCollapsed]);
  if (!mounted) return null;

  return (
    <div
      className={`flex fixed flex-col h-full bg-sidebar border-r border-border overflow-hidden transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header */}
      <div
        className={`border-b border-border flex items-center min-h-16 transition-all duration-300 ${
          collapsed ? "px-2 py-2 justify-center gap-1" : "px-4 py-3 gap-3"
        }`}
      >
        <button
          onClick={() => onNavigate(routes.dashboard)}
          className={`flex items-center gap-2 ${collapsed ? "justify-center" : "flex-1 min-w-0"}`}
        >
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
              <BrandLogo size="md" showText={true} variant="default" />
            </div>
          )}
          {!collapsed && (
            <div className="grid text-left text-sm leading-tight flex-1 min-w-0">
              {theme === "light" ? (
                <img src="/blue-logo-trimed.png" alt="logo" />
              ) : (
                <img src="/logo-trimed.png" alt="logo" />
              )}
            </div>
          )}
        </button>

        {/* Divider — only show when expanded */}
        {!collapsed && <div className="w-px h-5 bg-border/50" />}

        {/* Collapse/Expand Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onCollapsed(!collapsed);
            setCollapsed(!collapsed);
          }}
          className="h-6 w-6 rounded-md flex-shrink-0 border-border/80 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
          )}
        </Button>
      </div>

      {/* User Progress (hidden when collapsed) */}
      {!collapsed && (
        <div className="p-4 border-b border-border">
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                Level {user?.level} Engineer
              </span>
              {user?.isPremium ? (
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 dark:text-yellow-400"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {user?.subscription?.name}
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 dark:text-yellow-400"
                >
                  Free
                </Badge>
              )}
            </div>
            <Progress value={progressPct} className="h-2 mb-1" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{user?.points?.toLocaleString()} MB</span>
              <span>
                {mbToNextLevel?.toLocaleString()} MB to Level{" "}
                {user?.level + 1}
              </span>
            </div>

            {/* Streak display */}
            {(user?.currentStreak ?? user?.streak ?? 0) > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-medium text-orange-500">
                  {user?.currentStreak ?? user?.streak ?? 0}-day streak
                </span>
                {(user?.currentStreak ?? user?.streak ?? 0) >= 7 && (
                  <span className="ml-auto text-xs font-bold text-orange-500 bg-orange-500/10 rounded px-1.5 py-0.5">
                    {(user?.currentStreak ?? user?.streak ?? 0) >= 30
                      ? "1.5×"
                      : "1.25×"}{" "}
                    MB
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-3">
            <Button
              variant="outline"
              className="w-full justify-between border-border hover:bg-primary/10 hover:border-primary/50 transition-colors"
              onClick={() => onNavigate(routes.xpStore)}
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-primary">
                  {user?.points?.toLocaleString()} MB
                </span>
              </div>
              <span className="text-xs text-primary">Redeem</span>
            </Button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 ">
        {Object.entries(navigationData).map(([section, items]) => (
          <div key={section} className="px-3 py-2">
            {!collapsed && (
              <h3 className="px-4 text-xs font-medium text-muted-foreground mb-1 capitalize">
                {section}
              </h3>
            )}
            <div className="space-y-1">
              {items.map((item) => (
                <button
                  key={item.title}
                  onClick={() => onNavigate(item.url)}
                  title={collapsed ? item.title : ""}
                  className={`flex w-full items-center ${
                    collapsed ? "justify-center" : "justify-between"
                  } px-4 py-2 rounded-md hover:bg-primary/10 transition-colors ${
                    currentPath === item.url || currentPath.startsWith(item.url)
                      ? "bg-primary/15 text-primary"
                      : ""
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      collapsed ? "" : "w-full"
                    }`}
                  >
                    <item.icon
                      className={`${
                        collapsed ? "h-6 w-6" : "h-4 w-4"
                      } transition-all`}
                    />
                    {!collapsed && <span>{item.title}</span>}
                    {!collapsed && !item.active && (
                      <Badge variant="secondary">WIP</Badge>
                    )}
                    {!collapsed && item.beta && (
                      <Badge variant="destructive">beta</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage
                src={user?.avatar || "/placeholder.svg"}
                alt={user?.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="grid text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
