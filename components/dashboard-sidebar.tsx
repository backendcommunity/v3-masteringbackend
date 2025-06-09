"use client"

import type * as React from "react"
import { useEffect, useState } from "react"
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
  User,
  ChevronDown,
  Sparkles,
  Crown,
  Gift,
  CreditCard,
  Award,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { routes } from "@/lib/routes"

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
  currentPath: string
  onNavigate: (path: string) => void
}

const navigationData = {
  learn: [
    {
      title: "Courses",
      url: routes.courses,
      icon: BookOpen,
      badge: "12 Active",
    },
    {
      title: "Bootcamps",
      url: routes.bootcamps,
      icon: Zap,
      badge: "2 New",
    },
    {
      title: "Learning Paths",
      url: routes.paths,
      icon: Target,
      badge: "5 Available",
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
      badge: "3 In Progress",
    },
    {
      title: "Project30",
      url: routes.project30,
      icon: Sparkles,
      badge: "Day 15",
    },
    {
      title: "MB Lands",
      url: routes.lands,
      icon: Trophy,
      badge: "Level 8",
    },
  ],
  grow: [
    {
      title: "MB Interviews",
      url: routes.interviews,
      icon: Briefcase,
      badge: "2 Pending",
    },
    {
      title: "Mock Interviews",
      url: routes.mockInterviews,
      icon: Users,
    },
    {
      title: "Certifications",
      url: "/dashboard/certifications",
      icon: Award,
      badge: "1 Ready",
    },
    {
      title: "Community",
      url: routes.community,
      icon: Users,
      badge: "24 Online",
    },
  ],
}

export function DashboardSidebar({ currentPath, onNavigate, ...props }: DashboardSidebarProps) {
  const [mounted, setMounted] = useState(false)
  const store = useAppStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Add safety check for currentPath
  const safePath = currentPath || "/dashboard"

  const user = store.getUser()

  // Mock subscription data - in real app this would come from store
  const subscription = {
    plan: "Pro",
    status: "active",
    xpBalance: 2450,
  }

  return (
    <Sidebar variant="inset" className="bg-sidebar border-r border-border" {...props}>
      <SidebarHeader className="border-b border-border">
        <button
          onClick={() => onNavigate(routes.dashboard)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-primary/10 rounded-lg transition-colors sidebar-item"
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

        {/* User Progress Card - Clean minimal design */}
        <div className="mx-4 rounded-lg border border-border bg-card p-3">
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

        {/* XP Balance - Clean button design */}
        <div className="mx-4 mt-3">
          <Button
            variant="outline"
            className="w-full justify-between border-border hover:bg-primary/10 hover:border-primary/50 transition-colors"
            onClick={() => onNavigate(routes.xpStore)}
          >
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-primary">{subscription.xpBalance.toLocaleString()} XP</span>
            </div>
            <span className="text-xs text-primary">Redeem</span>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Learn Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Learn</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.learn.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    className="sidebar-item"
                  >
                    <button
                      onClick={() => onNavigate(item.url)}
                      className="flex w-full items-center justify-between hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary transition-colors"
                      data-active={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Build Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Build</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.build.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    className="sidebar-item"
                  >
                    <button
                      onClick={() => onNavigate(item.url)}
                      className="flex w-full items-center justify-between hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary transition-colors"
                      data-active={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Grow Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground">Grow</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationData.grow.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    className="sidebar-item"
                  >
                    <button
                      onClick={() => onNavigate(item.url)}
                      className="flex w-full items-center justify-between hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary transition-colors"
                      data-active={safePath === item.url || (safePath && safePath.startsWith(item.url))}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={safePath === routes.settings} className="sidebar-item">
                  <button
                    onClick={() => onNavigate(routes.settings)}
                    className="flex w-full items-center gap-2 hover:bg-primary/10 data-[active=true]:bg-primary/15 data-[active=true]:text-primary transition-colors"
                    data-active={safePath === routes.settings}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-2 rounded-lg p-2 hover:bg-primary/10 transition-colors sidebar-item">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px] border-border bg-popover">
            <DropdownMenuItem onClick={() => onNavigate(routes.profile)} className="dropdown-item">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(routes.subscriptionManagement)} className="dropdown-item">
              <Crown className="mr-2 h-4 w-4" />
              <span>Subscription</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(routes.subscriptionPlans)} className="dropdown-item">
              <Star className="mr-2 h-4 w-4" />
              <span>Plans</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(routes.billing)} className="dropdown-item">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Billing</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(routes.xpStore)} className="dropdown-item">
              <Gift className="mr-2 h-4 w-4" />
              <span>XP Store</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate(routes.logout)} className="dropdown-item">
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
