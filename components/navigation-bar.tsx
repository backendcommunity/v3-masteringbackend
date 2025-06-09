"use client"

import type React from "react"

import { useState } from "react"
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
  CreditCard,
  TrendingUp,
  Sparkles,
  Star,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { getUser } from "@/lib/data"
import { routes } from "@/lib/routes"
import { MobileNav } from "@/components/mobile-nav"

interface NavigationBarProps {
  onNavigate: (path: string) => void
  currentPath: string
}

export function NavigationBar({ onNavigate, currentPath }: NavigationBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExploreOpen, setIsExploreOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const user = getUser()

  // Mock subscription data
  const subscription = {
    plan: "Pro",
    status: "active",
    xpBalance: 2450,
  }

  const notifications = [
    {
      id: "1",
      title: "Course Completed!",
      message: "You've completed Advanced Node.js Patterns",
      time: "2 hours ago",
      type: "success",
      read: false,
    },
    {
      id: "2",
      title: "Subscription Renewed",
      message: "Your Pro subscription has been renewed for another month",
      time: "3 hours ago",
      type: "billing",
      read: false,
    },
    {
      id: "3",
      title: "New Assignment",
      message: "Database Design exercise is now available",
      time: "4 hours ago",
      type: "info",
      read: false,
    },
    {
      id: "4",
      title: "XP Earned!",
      message: "You earned 150 XP for completing the API challenge",
      time: "1 day ago",
      type: "achievement",
      read: true,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const skillGuides = [
    { name: "Python", icon: "🐍", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    { name: "Ruby", icon: "💎", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    { name: "Java", icon: "☕", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    { name: "GoLang", icon: "🔷", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
    { name: "Node.js", icon: "🟢", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  ]

  const roadmaps = [
    {
      id: "1",
      title: "Career Essentials in Generative AI using Ruby",
      image: "/placeholder.svg?height=120&width=200",
      category: "Roadmap",
    },
    {
      id: "2",
      title: "Become Ruby Hero",
      image: "/placeholder.svg?height=120&width=200",
      category: "Roadmap",
    },
    {
      id: "3",
      title: "Full-Stack Development",
      image: "/placeholder.svg?height=120&width=200",
      category: "Roadmap",
    },
    {
      id: "4",
      title: "DevOps Engineering",
      image: "/placeholder.svg?height=120&width=200",
      category: "Roadmap",
    },
    {
      id: "5",
      title: "Cloud Architecture",
      image: "/placeholder.svg?height=120&width=200",
      category: "Roadmap",
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log("Searching for:", searchQuery)
      // Implement search functionality
      setIsMobileSearchOpen(false)
    }
  }

  const handleNotificationClick = (notificationId: string) => {
    console.log("Clicked notification:", notificationId)
    setIsNotificationsOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Mobile Navigation */}
        <div className="flex md:hidden">
          <MobileNav currentPath={currentPath} onNavigate={onNavigate} />
        </div>

        {/* Logo - Visible on all screens */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate(routes.dashboard)}>
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MB</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hidden sm:inline-block">
              MasteringBackend
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 ml-6">
          {/* Explore Dropdown */}
          <Popover open={isExploreOpen} onOpenChange={setIsExploreOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-10 px-4 py-2 border-2 rounded-lg font-medium nav-item">
                Explore
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[90vw] max-w-[1200px] p-0 mt-2 border-border bg-popover"
              align="start"
              side="bottom"
            >
              <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-auto max-h-[80vh]">
                {/* Level Sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <Card className="relative overflow-hidden border-border card-hover">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500">
                      <img
                        src="/placeholder.svg?height=200&width=300"
                        alt="Beginner Level"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <CardContent className="relative z-10 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Beginner Level</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onNavigate(`${routes.courses}?level=beginner`)
                          setIsExploreOpen(false)
                        }}
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-border card-hover">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent">
                      <img
                        src="/placeholder.svg?height=200&width=300"
                        alt="Intermediate Level"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <CardContent className="relative z-10 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Intermediate Level</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onNavigate(`${routes.courses}?level=intermediate`)
                          setIsExploreOpen(false)
                        }}
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="relative overflow-hidden border-border card-hover">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent to-purple-600">
                      <img
                        src="/placeholder.svg?height=200&width=300"
                        alt="Advanced Level"
                        className="w-full h-full object-cover opacity-80"
                      />
                    </div>
                    <CardContent className="relative z-10 p-6 text-white">
                      <h3 className="text-xl font-bold mb-2">Advanced Level</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onNavigate(`${routes.courses}?level=advanced`)
                          setIsExploreOpen(false)
                        }}
                      >
                        Explore
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Skill Guides */}
                <div>
                  <h3 className="text-xl font-bold mb-4">Skill Guides</h3>
                  <p className="text-muted-foreground mb-6">
                    Explore foundational content and tools to help you understand, learn, and improve at the skills
                    involved in trending industry roles.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {skillGuides.map((skill) => (
                      <Card
                        key={skill.name}
                        className="cursor-pointer hover:shadow-md transition-shadow border-border card-hover"
                        onClick={() => {
                          onNavigate(`${routes.courses}?skill=${skill.name.toLowerCase()}`)
                          setIsExploreOpen(false)
                        }}
                      >
                        <CardContent className="p-4 flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${skill.color}`}
                          >
                            {skill.icon}
                          </div>
                          <span className="font-medium">{skill.name}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Roadmaps */}
                <div>
                  <h3 className="text-xl font-bold mb-6">Roadmaps</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {roadmaps.map((roadmap) => (
                      <Card
                        key={roadmap.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-border card-hover"
                        onClick={() => {
                          onNavigate(routes.roadmapDetail(roadmap.id))
                          setIsExploreOpen(false)
                        }}
                      >
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          <img
                            src={roadmap.image || "/placeholder.svg"}
                            alt={roadmap.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <Badge variant="secondary" className="text-xs mb-2">
                            {roadmap.category}
                          </Badge>
                          <h4 className="font-medium text-sm leading-tight">{roadmap.title}</h4>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-8">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses, projects, or ask anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-10 bg-muted/50 border-border focus-visible:ring-primary focus-visible:border-primary"
            />
          </form>
        </div>

        {/* Mobile Search Button */}
        <div className="flex md:hidden ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>
        </div>

        {/* Mobile Search Overlay */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsMobileSearchOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search courses, projects, or ask anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 bg-muted/50 border-border focus-visible:ring-primary focus-visible:border-primary"
                autoFocus
              />
            </form>
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("Node.js")}>
                  Node.js
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("Database Design")}>
                  Database Design
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("API")}>
                  API Development
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("Authentication")}>
                  Authentication
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Right Section - Theme Toggle, Subscription Status, XP, Notifications and Profile */}
        <div className="ml-auto flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Subscription Status - Hidden on mobile */}
          {subscription.plan !== "Free" && (
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 hover:bg-gradient-to-r hover:from-yellow-400/20 hover:to-orange-400/20 dark:text-yellow-400 hidden md:flex"
              onClick={() => onNavigate(routes.subscriptionManagement)}
            >
              <Crown className="h-4 w-4 mr-1" />
              {subscription.plan}
            </Button>
          )}

          {/* XP Balance - Hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:bg-primary/10 hover:text-primary transition-colors hidden md:flex"
            onClick={() => onNavigate(routes.xpStore)}
          >
            <Gift className="h-4 w-4 mr-1" />
            {subscription.xpBalance.toLocaleString()} XP
          </Button>

          {/* Notifications */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative nav-item">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[90vw] max-w-[380px] p-0 border-border bg-popover" align="end">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">You have {unreadCount} unread notifications</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors dropdown-item ${
                      !notification.read ? "bg-primary/5" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === "success"
                            ? "bg-green-500"
                            : notification.type === "info"
                              ? "bg-primary"
                              : notification.type === "achievement"
                                ? "bg-yellow-500"
                                : notification.type === "billing"
                                  ? "bg-purple-500"
                                  : "bg-purple-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                      {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full">
                  View All Notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full nav-item">
                <Avatar className="h-8 w-8 border-2 border-border">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 border-border bg-popover" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  {subscription.plan !== "Free" && (
                    <Badge
                      variant="outline"
                      className="w-fit bg-yellow-400/10 text-yellow-600 border-yellow-400/20 dark:text-yellow-400"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      {subscription.plan} Member
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onNavigate(routes.profile)} className="dropdown-item">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.courses)} className="dropdown-item">
                <BookOpen className="mr-2 h-4 w-4" />
                <span>My Courses</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.projects)} className="dropdown-item">
                <Code className="mr-2 h-4 w-4" />
                <span>My Projects</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.roadmaps)} className="dropdown-item">
                <TrendingUp className="mr-2 h-4 w-4" />
                <span>Roadmaps</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.project30)} className="dropdown-item">
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Project30</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.community)} className="dropdown-item">
                <Users className="mr-2 h-4 w-4" />
                <span>Community</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
              <DropdownMenuItem onClick={() => onNavigate(routes.settings)} className="dropdown-item">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate(routes.logout)} className="dropdown-item">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
