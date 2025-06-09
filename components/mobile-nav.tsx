"use client"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAppStore } from "@/lib/store"
import { routes } from "@/lib/routes"
import {
  BookOpen,
  Code2,
  Trophy,
  Users,
  Briefcase,
  Star,
  Zap,
  Target,
  TrendingUp,
  Settings,
  Sparkles,
  Crown,
  Gift,
} from "lucide-react"

interface MobileNavProps {
  currentPath: string
  onNavigate: (path: string) => void
}

export function MobileNav({ currentPath, onNavigate }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const store = useAppStore()
  const user = store.getUser()

  // Mock subscription data - in real app this would come from store
  const subscription = {
    plan: "Pro",
    status: "active",
    xpBalance: 2450,
  }

  const navigationData = {
    learn: [
      {
        title: "Courses",
        url: routes.courses,
        icon: BookOpen,
      },
      {
        title: "Bootcamps",
        url: routes.bootcamps,
        icon: Zap,
      },
      {
        title: "Learning Paths",
        url: routes.paths,
        icon: Target,
      },
      {
        title: "Roadmaps",
        url: routes.roadmaps,
        icon: TrendingUp,
      },
    ],
    build: [
      {
        title: "MB Projects",
        url: routes.projects,
        icon: Code2,
      },
      {
        title: "Project30",
        url: routes.project30,
        icon: Sparkles,
      },
      {
        title: "MB Lands",
        url: routes.lands,
        icon: Trophy,
      },
    ],
    grow: [
      {
        title: "MB Interviews",
        url: routes.interviews,
        icon: Briefcase,
      },
      {
        title: "Mock Interviews",
        url: routes.mockInterviews,
        icon: Users,
      },
      {
        title: "Community",
        url: routes.community,
        icon: Users,
      },
    ],
  }

  const handleNavigate = (path: string) => {
    onNavigate(path)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85%] max-w-[300px] p-0">
        <div className="flex flex-col h-full bg-sidebar">
          {/* Header */}
          <div className="border-b border-border p-4">
            <button
              onClick={() => handleNavigate(routes.dashboard)}
              className="flex items-center gap-2 mb-4 hover:bg-primary/10 rounded-lg p-2 transition-colors w-full"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground">
                <span className="text-sm font-bold">MB</span>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Masteringbackend
                </span>
                <span className="truncate text-xs text-muted-foreground">Career Platform</span>
              </div>
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* User Progress */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Level {user.level} Engineer</span>
                {subscription.plan !== "Free" && (
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 dark:text-yellow-400"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    {subscription.plan}
                  </Badge>
                )}
              </div>
              <Progress value={(user.xp / user.xpToNextLevel) * 100} className="h-2 mb-1" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{user.xp.toLocaleString()} XP</span>
                <span>
                  {user.xpToNextLevel.toLocaleString()} XP to Level {user.level + 1}
                </span>
              </div>
            </div>

            {/* XP Balance */}
            <Button
              variant="outline"
              className="w-full justify-between mt-3 border-border hover:bg-primary/10 hover:border-primary/50 transition-colors"
              onClick={() => handleNavigate(routes.xpStore)}
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-primary">{subscription.xpBalance.toLocaleString()} XP</span>
              </div>
              <span className="text-xs text-primary">Redeem</span>
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-auto py-2">
            {/* Learn Section */}
            <div className="px-3 py-2">
              <h3 className="px-4 text-xs font-medium text-muted-foreground mb-1">Learn</h3>
              <div className="space-y-1">
                {navigationData.learn.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                      currentPath === item.url || currentPath.startsWith(item.url)
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Build Section */}
            <div className="px-3 py-2">
              <h3 className="px-4 text-xs font-medium text-muted-foreground mb-1">Build</h3>
              <div className="space-y-1">
                {navigationData.build.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                      currentPath === item.url || currentPath.startsWith(item.url)
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Grow Section */}
            <div className="px-3 py-2">
              <h3 className="px-4 text-xs font-medium text-muted-foreground mb-1">Grow</h3>
              <div className="space-y-1">
                {navigationData.grow.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => handleNavigate(item.url)}
                    className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                      currentPath === item.url || currentPath.startsWith(item.url)
                        ? "bg-primary/15 text-primary"
                        : "hover:bg-primary/10"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="px-3 py-2">
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigate(routes.settings)}
                  className={`flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                    currentPath === routes.settings ? "bg-primary/15 text-primary" : "hover:bg-primary/10"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                handleNavigate(routes.logout)
              }}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
