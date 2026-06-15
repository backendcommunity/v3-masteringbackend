"use client";

import type React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  BookOpen,
  Code,
  Users,
  Crown,
  Gift,
  Sparkles,
  Menu,
  CheckSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { routes } from "@/lib/routes";
import { useAuth } from "@/store/auth";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { format } from "timeago.js";
import { updateUser, type Activity, type SearchResults } from "@/lib/data";
import { Loader } from "./ui/loader";
import { analytics } from "@/lib/analytics";
import { toast } from "sonner";
interface NavigationBarProps {
  onNavigate: (path: string) => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

export function NavigationBar({
  onNavigate,
  onMenuToggle,
  isMobile = false,
}: NavigationBarProps) {
  const auth = useAuth();
  const store = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [exploreSearchQuery, setExploreSearchQuery] = useState("");
  const [exploreSearchResults, setExploreSearchResults] =
    useState<SearchResults | null>(null);
  const [isExploreSearchLoading, setIsExploreSearchLoading] = useState(false);
  const exploreSearchRef = useRef<HTMLDivElement>(null);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [notifications, setNotifications] = useState<Activity[]>([]);
  const [seenNotificationIds] = useState(() => new Set<string>());
  const user = useUser();

  const subscriptionName = user?.isPremium
    ? user?.subscription?.plan?.name ?? "Pro"
    : "Free";
  async function load() {
    try {
      setIsActivitiesLoading(true);
      const activities = await store.getActivities({
        size: 20,
        skip: 0,
      });
      setNotifications(activities);

      // Detect new gamification events in background notifications
      for (const activity of activities as Activity[]) {
        if (seenNotificationIds.has(activity.id)) continue;
        if (!activity.isRead) {
          if (activity.type === "LEVEL_UP" && activity.isNotification) {
            const match = activity.description?.match(
              /Level (\d+) to Level (\d+)/,
            );
            if (match) {
              store.setLevelUpModal({
                oldLevel: parseInt(match[1]),
                newLevel: parseInt(match[2]),
              });
              // Mark as read immediately so modal never re-fires on refresh
              store.markActivityRead(activity.id).catch(() => {});
            }
          }
          if (
            activity.type === "ACHIEVEMENT_UNLOCKED" &&
            activity.isNotification
          ) {
            const titleMatch = activity.title?.match(
              /Achievement Unlocked: (.+)/,
            );
            if (titleMatch) {
              toast.success(`Achievement Unlocked: ${titleMatch[1]}`, {
                description: "Keep going — you're building momentum!",
                duration: 5000,
              });
              // Mark as read immediately so toast never re-fires on refresh
              store.markActivityRead(activity.id).catch(() => {});
            }
          }
        }
        seenNotificationIds.add(activity.id);
      }

      // const unreadCount = activities.filter((a: Activity) => !a.isRead).length;
      // analytics.track("notification_bell_clicked", {
      //   totalNotifications: activities.length,
      //   unreadCount,
      // });
    } catch (error) {
    } finally {
      setIsActivitiesLoading(false);
    }
  }

  // Change polling to real-time subscription when backend supports it (e.g., WebSocket, SSE)
  // Real-time notification polling (every 10 seconds)
  useEffect(() => {
    // Load notifications immediately
    load();

    // Set up polling interval for real-time updates
    const pollInterval = setInterval(() => {
      load();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  useMemo(() => {
    if (isNotificationsOpen) load();
  }, [isNotificationsOpen]);

  // Debounced search effect for Explore popover (Epic 6: Global Search)
  useEffect(() => {
    if (!exploreSearchQuery.trim() || exploreSearchQuery.length < 2) {
      setExploreSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsExploreSearchLoading(true);
        const results = await store.search(exploreSearchQuery);
        setExploreSearchResults(results);
        analytics.track("search_performed", {
          query: exploreSearchQuery,
          resultsCount: results?.total ?? 0,
        });
      } catch {
        setExploreSearchResults(null);
      } finally {
        setIsExploreSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [exploreSearchQuery]);

  // Load popular items when popover opens (if not searching)
  useEffect(() => {
    if (isExploreOpen) {
      if (!exploreSearchQuery.trim()) {
        const loadPopular = async () => {
          try {
            setIsExploreSearchLoading(true);
            const results = await store.search("");
            setExploreSearchResults(results);
          } catch {
            setExploreSearchResults(null);
          } finally {
            setIsExploreSearchLoading(false);
          }
        };
        loadPopular();
      }

      // Ensure input is focused when popover opens
      setTimeout(() => {
        const searchInput = exploreSearchRef.current?.querySelector("input");
        if (searchInput && document.activeElement !== searchInput) {
          searchInput.focus();
        }
      }, 0);
    }
  }, [isExploreOpen]);

  // Keyboard shortcut to open Explore (Cmd/Ctrl + K) and focus input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsExploreOpen(true);
        // Focus the input after popover opens
        setTimeout(() => {
          const searchInput = exploreSearchRef.current?.querySelector("input");
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }, 50);
      }
      // Escape to close
      else if (e.key === "Escape") {
        if (isExploreOpen) {
          setIsExploreOpen(false);
          setExploreSearchQuery("");
          // Return focus to the search input
          setTimeout(() => {
            const searchInput =
              exploreSearchRef.current?.querySelector("input");
            searchInput?.blur();
          }, 0);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExploreOpen]);

  const skillGuides = [
    {
      name: "Python",
      icon: "🐍",
      color: "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary",
    },
    {
      name: "Ruby",
      icon: "💎",
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    },
    {
      name: "Java",
      icon: "☕",
      color:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    },
    {
      name: "GoLang",
      icon: "🔷",
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    },
    {
      name: "Node.js",
      icon: "🟢",
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality
      if (isMobile) {
        setShowMobileSearch(false);
      }
    }
  };

  const handleNotificationClick = async (id: string) => {
    try {
      // Mark activity as read via store
      await store.markActivityRead(id);

      // Find the notification being marked as read for analytics
      const notification = notifications.find((n) => n.id === id);

      // Update local state to reflect read status
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );

      // Decrement the badge count (unread notification count)
      updateUser({
        ...user,
        totalNotifications: Math.max(0, (user?.totalNotifications ?? 0) - 1),
      });

      // Epic 5: Track notification interaction
      analytics.track("mark_notification_read", {
        notificationId: id,
        notificationType: notification?.type,
        title: notification?.title,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
    // setIsNotificationsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always redirect to login after logout attempt
      onNavigate("/auth/login");
    }
  };

  const handleDeleteNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    const data = await store.deleteActivities(ids);
    if (!data?.isDeleted) return;

    updateUser({
      ...user,
      totalNotifications: user?.totalNotifications! - ids.length,
    });
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      const markedCount = notifications.filter(
        (n: Activity) => !n.isRead,
      ).length;

      // Mark all activities as read via store
      await store.markAllActivitiesRead();

      // Update local state to reflect read status
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      // Set badge count to 0
      updateUser({
        ...user,
        totalNotifications: 0,
      });

      // Epic 5: Track mark all read action
      analytics.track("mark_all_notifications_read", {
        notificationsMarked: markedCount,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
    setIsNotificationsOpen(false);
  };

  return (
    <>
      <nav className="sticky md:pl-72 top-0 z-50 w-full bg-card shadow-[0_1px_2px_rgba(14,31,51,0.06),0_4px_16px_rgba(14,31,51,0.06)] dark:shadow-none dark:border-b dark:border-border">
        <div className="flex gap-2 h-16 items-center px-4">
          {/* Mobile Menu Button — CSS-gated so it's correct before hydration */}
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 md:hidden"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>

          {/* Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer md:hidden px-2"
            onClick={() => onNavigate(routes.dashboard)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MB</span>
            </div>
            {!isMobile && (
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                MasteringBackend
              </span>
            )}
          </div>

          {/* Global Search Bar */}
          <Popover open={isExploreOpen} onOpenChange={setIsExploreOpen}>
            <div className="flex-1 max-w-2xl mx-4" ref={exploreSearchRef}>
              <PopoverTrigger asChild>
                <div className="relative group cursor-text">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Search courses, projects, bootcamps..."
                    value={exploreSearchQuery}
                    onChange={(e) => setExploreSearchQuery(e.target.value)}
                    onClick={() => !isExploreOpen && setIsExploreOpen(true)}
                    onFocus={() => !isExploreOpen && setIsExploreOpen(true)}
                    className="w-full pl-10 pr-16 h-10 bg-muted/50 border border-muted hover:border-primary/50 focus:border-primary focus:bg-background transition-colors rounded-lg font-medium focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium pointer-events-none hidden sm:block">
                    <kbd className="px-2.5 py-1 rounded bg-muted border border-border text-foreground">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </PopoverTrigger>
            </div>
            <PopoverContent
              className="lg:w-[1200px] w-screen sm:w-[90vw] md:w-[600px] p-0 mt-2 border-border bg-popover"
              align="start"
              side="bottom"
            >
              <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
                {/* Show search results if query exists */}
                {exploreSearchQuery.trim().length >= 2 ? (
                  <>
                    {isExploreSearchLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="space-y-3 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Searching...
                          </p>
                        </div>
                      </div>
                    ) : exploreSearchResults?.total === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">🔍</div>
                        <p className="text-sm font-medium text-foreground">
                          No results found
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try searching with different keywords
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Courses Results */}
                        {(exploreSearchResults?.courses?.length ?? 0) > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                              📚 Courses{" "}
                              <span className="font-normal">
                                ({exploreSearchResults!.courses.length})
                              </span>
                            </h3>
                            <div className="space-y-2">
                              {exploreSearchResults!.courses
                                .slice(0, 3)
                                .map((course) => (
                                  <button
                                    key={course.id}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                    onClick={() => {
                                      setIsExploreOpen(false);
                                      setExploreSearchQuery("");
                                      onNavigate(
                                        routes.courseDetail(course.slug),
                                      );
                                    }}
                                  >
                                    <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-foreground">
                                        {course.title}
                                      </p>
                                      {course.summary && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                          {course.summary}
                                        </p>
                                      )}
                                    </div>
                                    {course.isEnrolled && (
                                      <Badge className="text-xs flex-shrink-0 ml-2">
                                        ✓ Enrolled
                                      </Badge>
                                    )}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Projects Results */}
                        {(exploreSearchResults?.projects?.length ?? 0) > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                              💻 Projects{" "}
                              <span className="font-normal">
                                ({exploreSearchResults!.projects.length})
                              </span>
                            </h3>
                            <div className="space-y-2">
                              {exploreSearchResults!.projects
                                .slice(0, 3)
                                .map((project) => (
                                  <button
                                    key={project.id}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                    onClick={() => {
                                      setIsExploreOpen(false);
                                      setExploreSearchQuery("");
                                      onNavigate(
                                        routes.projectDetail(project.slug),
                                      );
                                    }}
                                  >
                                    <Code className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-foreground">
                                        {project.title}
                                      </p>
                                      {project.level && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                          {project.level}
                                        </p>
                                      )}
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Bootcamps Results */}
                        {(exploreSearchResults?.bootcamps?.length ?? 0) > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
                              👥 Bootcamps{" "}
                              <span className="font-normal">
                                ({exploreSearchResults!.bootcamps.length})
                              </span>
                            </h3>
                            <div className="space-y-2">
                              {exploreSearchResults!.bootcamps
                                .slice(0, 3)
                                .map((bootcamp) => (
                                  <button
                                    key={bootcamp.id}
                                    className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                    onClick={() => {
                                      setIsExploreOpen(false);
                                      setExploreSearchQuery("");
                                      onNavigate(
                                        routes.bootcampDetail(bootcamp.id),
                                      );
                                    }}
                                  >
                                    <Users className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate text-foreground">
                                        {bootcamp.title}
                                      </p>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : isExploreSearchLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="space-y-3 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Loading popular content...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Popular Courses */}
                    {(exploreSearchResults?.courses?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          📚 Popular Courses
                        </h3>
                        <div className="space-y-2">
                          {exploreSearchResults!.courses
                            .slice(0, 4)
                            .map((course) => (
                              <button
                                key={course.id}
                                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                onClick={() => {
                                  analytics.track("search_result_clicked", {
                                    resultType: "course",
                                    resultId: course.id,
                                    resultTitle: course.title,
                                    query: exploreSearchQuery,
                                  });
                                  setIsExploreOpen(false);
                                  setExploreSearchQuery("");
                                  onNavigate(routes.courseDetail(course.slug));
                                }}
                              >
                                <BookOpen className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {course.title}
                                  </p>
                                  {course.summary && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                      {course.summary}
                                    </p>
                                  )}
                                </div>
                                {course.isEnrolled && (
                                  <Badge className="text-xs flex-shrink-0 ml-2">
                                    ✓ Enrolled
                                  </Badge>
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Projects */}
                    {(exploreSearchResults?.projects?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          💻 Popular Projects
                        </h3>
                        <div className="space-y-2">
                          {exploreSearchResults!.projects
                            .slice(0, 4)
                            .map((project) => (
                              <button
                                key={project.id}
                                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                onClick={() => {
                                  analytics.track("search_result_clicked", {
                                    resultType: "project",
                                    resultId: project.id,
                                    resultTitle: project.title,
                                    query: exploreSearchQuery,
                                  });
                                  setIsExploreOpen(false);
                                  setExploreSearchQuery("");
                                  onNavigate(
                                    routes.projectDetail(project.slug),
                                  );
                                }}
                              >
                                <Code className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {project.title}
                                  </p>
                                  {project.level && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {project.level}
                                    </p>
                                  )}
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Popular Bootcamps */}
                    {(exploreSearchResults?.bootcamps?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
                          👥 Popular Bootcamps
                        </h3>
                        <div className="space-y-2">
                          {exploreSearchResults!.bootcamps
                            .slice(0, 4)
                            .map((bootcamp) => (
                              <button
                                key={bootcamp.id}
                                className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 text-left transition-all duration-150 hover:translate-x-1 hover:shadow-sm"
                                onClick={() => {
                                  analytics.track("search_result_clicked", {
                                    resultType: "bootcamp",
                                    resultId: bootcamp.id,
                                    resultTitle: bootcamp.title,
                                    query: exploreSearchQuery,
                                  });
                                  setIsExploreOpen(false);
                                  setExploreSearchQuery("");
                                  onNavigate(
                                    routes.bootcampDetail(bootcamp.id),
                                  );
                                }}
                              >
                                <Users className="h-4 w-4 text-primary flex-shrink-0 mt-1" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-foreground">
                                    {bootcamp.title}
                                  </p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Guides */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-3">
                        🎯 Skill Guides
                      </h3>
                      <div className="lg:grid grid-cols-5 gap-4 flex flex-col">
                        {skillGuides.map((skill) => (
                          <Card
                            key={skill.name}
                            className="cursor-pointer hover:shadow-md transition-shadow border-border card-hover"
                            onClick={() => {
                              onNavigate(
                                `${routes.courses}?skill=${skill.name.toLowerCase()}`,
                              );
                              setIsExploreOpen(false);
                            }}
                          >
                            <CardContent className="p-4 flex items-center space-x-3">
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${skill.color}`}
                              >
                                {skill.icon}
                              </div>
                              <span className="font-medium text-sm">
                                {skill.name}
                              </span>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Levels */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1 mb-4">
                        📈 Browse by Level
                      </h3>
                      <div className="lg:grid grid-cols-3 gap-6 flex flex-col">
                        <Card
                          className="relative overflow-hidden border-border card-hover cursor-pointer"
                          onClick={() => {
                            onNavigate(`${routes.courses}?level=beginner`);
                            setIsExploreOpen(false);
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500">
                            <img
                              src="/placeholder.svg?height=200&width=300"
                              alt="Beginner Level"
                              className="w-full h-full object-cover opacity-80"
                            />
                          </div>
                          <CardContent className="relative z-10 p-6 text-white">
                            <h4 className="text-lg font-bold">Beginner</h4>
                          </CardContent>
                        </Card>

                        <Card
                          className="relative overflow-hidden border-border card-hover cursor-pointer"
                          onClick={() => {
                            onNavigate(`${routes.courses}?level=intermediate`);
                            setIsExploreOpen(false);
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent">
                            <img
                              src="/placeholder.svg?height=200&width=300"
                              alt="Intermediate Level"
                              className="w-full h-full object-cover opacity-80"
                            />
                          </div>
                          <CardContent className="relative z-10 p-6 text-white">
                            <h4 className="text-lg font-bold">Intermediate</h4>
                          </CardContent>
                        </Card>

                        <Card
                          className="relative overflow-hidden border-border card-hover cursor-pointer"
                          onClick={() => {
                            onNavigate(`${routes.courses}?level=advanced`);
                            setIsExploreOpen(false);
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-accent to-purple-600">
                            <img
                              src="/placeholder.svg?height=200&width=300"
                              alt="Advanced Level"
                              className="w-full h-full object-cover opacity-80"
                            />
                          </div>
                          <CardContent className="relative z-10 p-6 text-white">
                            <h4 className="text-lg font-bold">Advanced</h4>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Desktop Search Bar */}
          {!isMobile && (
            <div className="flex-1 max-w-md mx-4">
              {/* <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-9 bg-muted/50"
                />
              </form> */}
            </div>
          )}

          {/* Right Section */}
          <div
            className={`${
              isMobile ? "justify-end w-full" : "ml-auto gap-4"
            } flex items-center space-x-1`}
          >

            {user?.isPremium ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 hover:from-yellow-400/20 hover:to-yellow-400/20 dark:text-yellow-400"
                onClick={() => onNavigate(routes.subscriptionManagement)}
              >
                <Crown className={`h-4 w-4 ${!isMobile ? "mr-1" : ""}`} />
                {!isMobile && subscriptionName}
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-semibold hover:from-yellow-500 hover:to-orange-500"
                onClick={() => onNavigate(routes.subscriptionManagement)}
              >
                <Crown className={`h-4 w-4 ${!isMobile ? "mr-1" : ""}`} />
                {!isMobile && "Upgrade"}
              </Button>
            )}

            {/* MB Balance - Compact on mobile */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => onNavigate(routes.xpStore)}
              >
                <Gift className="h-4 w-4 mr-1" />
                <span className={isMobile ? "sr-only" : ""}>
                  {user?.points?.toLocaleString()} MB
                </span>
              </Button>
            )}

            {/* Notifications */}
            <Popover
              open={isNotificationsOpen}
              onOpenChange={setIsNotificationsOpen}
            >
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {user?.totalNotifications! > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]"
                    >
                      {user?.totalNotifications! > 9
                        ? `${9}+`
                        : user?.totalNotifications}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You have {user?.totalNotifications} unread notifications
                  </p>
                </div>

                {isActivitiesLoading ? (
                  <Loader isLoader={false} />
                ) : (
                  <div className="max-h-[60vh] overflow-y-auto">
                    {/* Section: NEW NOTIFICATIONS */}
                    {notifications.filter((n: Activity) => !n.isRead).length >
                      0 && (
                      <div>
                        <div className="sticky top-0 px-4 py-2 bg-primary/5 dark:bg-primary/10 border-b border-primary/30 dark:border-primary/30">
                          <p className="text-xs font-semibold text-primary dark:text-primary uppercase">
                            🆕 New (
                            {
                              notifications.filter((n: Activity) => !n.isRead)
                                .length
                            }
                            )
                          </p>
                        </div>
                        {notifications
                          .filter((n: Activity) => !n.isRead)
                          .map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 border-b bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-950/30 dark:to-transparent cursor-pointer hover:bg-gradient-to-r hover:from-blue-100 hover:to-transparent dark:hover:from-blue-900/40 transition-colors border-l-4 border-l-blue-500"
                              onClick={() =>
                                handleNotificationClick(notification.id)
                              }
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                                    notification.type === "LEVEL_UP"
                                      ? "bg-yellow-500 animate-pulse"
                                      : notification.type ===
                                          "ACHIEVEMENT_UNLOCKED"
                                        ? "bg-purple-500 animate-pulse"
                                        : notification.type?.includes(
                                              "COMPLETED",
                                            )
                                          ? "bg-green-500"
                                          : notification.type?.includes(
                                                "MILESTONE",
                                              )
                                            ? "bg-orange-500 animate-pulse"
                                            : "bg-primary"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(notification.createdAt)}
                                  </p>
                                </div>
                                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0 mt-1" />
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Section: READ NOTIFICATIONS */}
                    {notifications.filter((n: Activity) => n.isRead).length >
                      0 && (
                      <div>
                        <div className="sticky top-0 px-4 py-2 bg-muted border-b">
                          <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Earlier
                          </p>
                        </div>
                        {notifications
                          .filter((n: Activity) => n.isRead)
                          .map((notification) => (
                            <div
                              key={notification.id}
                              className="p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() =>
                                handleNotificationClick(notification.id)
                              }
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 ${
                                    notification.type?.includes("COMPLETED")
                                      ? "bg-green-500"
                                      : notification.type?.includes("MILESTONE")
                                        ? "bg-orange-500"
                                        : "bg-gray-400"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-muted-foreground">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground/70">
                                    {notification.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground/60 mt-1">
                                    {format(notification.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 border-t">
                  <Button
                    onClick={handleMarkAllRead}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Mark All as Read
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.avatar || "/placeholder.svg"}
                      alt={user?.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate(routes.profile)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onNavigate("/courses?tab=my-courses")}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>My Courses</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.projects)}>
                  <Code className="mr-2 h-4 w-4" />
                  <span>My Projects</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.project30)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Ship</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onNavigate(routes.portfolio(user?.id || ""))}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>My Portfolio</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {(user?.role === "ADMIN" || user?.role === "INSTRUCTOR") && (
                  <>
                    <DropdownMenuItem
                      onClick={() => onNavigate("/admin/assignments")}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>Assignments</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => onNavigate(routes.subscriptionManagement)}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Subscription</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.settings)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        {isMobile && showMobileSearch && (
          <div className="px-4 pb-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-9"
                autoFocus
              />
            </form>
          </div>
        )}
      </nav>
    </>
  );
}
