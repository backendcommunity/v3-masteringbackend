"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Code2,
  Trophy,
  Users,
  Briefcase,
  Zap,
  Target,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Activity,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import { useUser } from "@/hooks/use-user";
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
      title: "Paths",
      url: routes.paths,
      icon: Target,
      active: true,
      beta: false,
    },
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
  ],
  build: [
    {
      title: "Projects",
      url: routes.projects,
      icon: Code2,
      active: true,
      beta: false,
    },
    {
      title: "Ship",
      url: routes.project30,
      icon: Sparkles,
      active: true,
      beta: false,
      disabled: true,
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
      beta: false,
      isNew: true,
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
  const router = useRouter();

  const mainNav = [
    { title: "Dashboard", url: routes.dashboard, icon: LayoutDashboard },
    { title: "My Activity", url: routes.activity, icon: Activity },
    { title: "Leaderboard", url: routes.leaderboard, icon: Trophy },
    {
      title: "My Portfolio",
      url: routes.portfolio(user?.id || ""),
      icon: Briefcase,
    },
  ];

  useEffect(() => setMounted(true), []);
  useEffect(() => setCollapsed(isCollapsed), [isCollapsed]);

  // Warm the RSC payload for every sidebar destination so first navigation
  // doesn't wait on a server round trip (the slow "fetch-server" rows).
  // No-op in dev; prefetches in production builds.
  useEffect(() => {
    Object.values(navigationData)
      .flat()
      .forEach((item) => {
        if (item?.url && item.active !== false && !(item as any).disabled)
          router.prefetch(item.url);
      });
  }, [router]);
  if (!mounted) return null;

  return (
    <div
      className={`flex fixed flex-col h-full bg-[#0E1F33] border-r border-white/10 overflow-hidden transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Header — exact h-16 to align with the top navbar */}
      <div
        className={`relative z-10 h-16 shrink-0 border-b border-white/10 flex items-center transition-all duration-300 ${
          collapsed ? "px-2 justify-center gap-1" : "px-4 gap-3"
        }`}
      >
        <button
          onClick={() => onNavigate(routes.dashboard)}
          className={`flex items-center gap-2 ${collapsed ? "justify-center" : "flex-1 min-w-0"}`}
        >
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0">
              {/* Navy rail in both themes — white "mb." mark (recolored from the
                  cyan icon), so it reads on navy regardless of theme. */}
              <img
                src="/logo-white-icon.png"
                alt="masteringbackend."
                width={146}
                height={90}
                className="w-7 h-auto object-contain select-none"
                draggable={false}
              />
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center min-w-0 flex-1">
              {/* Navy rail — white wordmark (trimmed of padding), both themes.
                  Intrinsic 431×50; explicit dims lock the aspect ratio. */}
              <img
                src="/White-trimed.png"
                alt="masteringbackend."
                width={431}
                height={50}
                className="block h-7 w-auto object-contain select-none"
                draggable={false}
              />
            </div>
          )}
        </button>

        {/* Divider — only show when expanded */}
        {!collapsed && <div className="w-px h-5 bg-white/15" />}

        {/* Collapse/Expand Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            onCollapsed(!collapsed);
            setCollapsed(!collapsed);
          }}
          className="hidden md:flex h-6 w-6 rounded-md flex-shrink-0 bg-transparent border-white/20 hover:border-primary/60 hover:bg-white/5 transition-all duration-200 group"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-white/60 group-hover:text-primary transition-colors duration-200" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-white/60 group-hover:text-primary transition-colors duration-200" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-2 ">
        {/* Main — primary destinations above the learn/build/grow catalog */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            {mainNav.map((item) => {
              const active =
                item.url === "/"
                  ? currentPath === "/"
                  : currentPath === item.url ||
                    currentPath.startsWith(item.url);
              return (
                <button
                  key={item.title}
                  onClick={() => onNavigate(item.url)}
                  title={collapsed ? item.title : ""}
                  className={`flex w-full items-center ${
                    collapsed ? "justify-center" : "justify-start"
                  } gap-2 px-4 py-2 rounded-md transition-colors ${
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`${collapsed ? "h-6 w-6" : "h-4 w-4"} transition-all`}
                  />
                  {!collapsed && <span>{item.title}</span>}
                  {!collapsed && (item as any).isNew && (
                    <Badge className="ml-auto bg-emerald-500 text-white hover:bg-emerald-600">
                      New
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider between primary destinations and the catalog */}
        <div className="mx-4 my-2 border-t border-white/10" />

        {Object.entries(navigationData).map(([section, items]) => (
          <div key={section} className="px-3 py-2">
            {!collapsed && (
              <h3 className="px-4 text-xs font-medium text-white/40 mb-1 capitalize">
                {section}
              </h3>
            )}
            <div className="space-y-1">
              {items?.map((item) => (
                <button
                  key={item.title}
                  onClick={() =>
                    (item as any).disabled ? undefined : onNavigate(item.url)
                  }
                  disabled={(item as any).disabled}
                  title={collapsed ? item.title : ""}
                  className={`flex w-full items-center ${
                    collapsed ? "justify-center" : "justify-between"
                  } px-4 py-2 rounded-md transition-colors ${
                    (item as any).disabled
                      ? "cursor-not-allowed text-white/30"
                      : currentPath === item.url ||
                          currentPath.startsWith(item.url)
                        ? "bg-primary/15 text-primary"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
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
                    {!collapsed && (item as any).disabled && (
                      <Badge variant="secondary" className="ml-auto">
                        Soon
                      </Badge>
                    )}
                    {!collapsed && !item.active && !(item as any).disabled && (
                      <Badge variant="secondary">WIP</Badge>
                    )}
                    {!collapsed && item.beta && (
                      <Badge variant="destructive">beta</Badge>
                    )}
                    {!collapsed && (item as any).isNew && (
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                        New
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        {!collapsed &&
        (user as any)?.hasFinishedOnboarding &&
        !(user as any)?.experienceLevel ? (
          <button
            onClick={() => onNavigate(routes.onboarding)}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Getting Started
          </button>
        ) : (
          <div
            className={`flex items-center ${
              collapsed ? "justify-center" : "justify-start gap-2"
            }`}
          >
            <Avatar className="h-8 w-8 border border-white/20 flex-shrink-0">
              <AvatarImage
                src={user?.avatar || "/placeholder.svg"}
                alt={user?.name}
              />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                {user?.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="grid min-w-0 text-left text-sm leading-tight">
                <span className="truncate font-medium text-white/90">
                  {user?.name}
                </span>
                <span className="truncate text-xs text-white/50">
                  {user?.email}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
