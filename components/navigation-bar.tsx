"use client"

import type React from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, User, Settings, Bell, Search, Menu } from "lucide-react"

interface NavigationBarProps {
  setCurrentPage: (page: string) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const NavigationBar: React.FC<NavigationBarProps> = ({ setCurrentPage, isMobile, toggleSidebar }) => {
  const { user, logout } = useAuth()

  return (
    <>
      <nav className="sticky left-0 right-0 top-0 z-50 w-ful border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={onMenuToggle}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}

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

          {/* Explore Dropdown */}
          <Popover open={isExploreOpen} onOpenChange={setIsExploreOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-10 px-4 py-2 border-2 rounded-lg font-medium nav-item"
              >
                Explore
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="lg:w-[1200px]  p-0 mt-2 border-border bg-popover"
              align="start"
              side="bottom"
            >
              <div className="p-8 space-y-8">
                {/* Level Sections */}
                <div className="lg:grid grid-cols-3 gap-6 flex flex-col">
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
                          onNavigate(`${routes.courses}?level=beginner`);
                          setIsExploreOpen(false);
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
                      <h3 className="text-xl font-bold mb-2">
                        Intermediate Level
                      </h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          onNavigate(`${routes.courses}?level=intermediate`);
                          setIsExploreOpen(false);
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
                          onNavigate(`${routes.courses}?level=advanced`);
                          setIsExploreOpen(false);
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
                    Explore foundational content and tools to help you
                    understand, learn, and improve at the skills involved in
                    trending industry roles.
                  </p>
                  <div className="lg:grid grid-cols-5 gap-4 flex flex-col">
                    {skillGuides.map((skill) => (
                      <Card
                        key={skill.name}
                        className="cursor-pointer hover:shadow-md transition-shadow border-border card-hover"
                        onClick={() => {
                          onNavigate(
                            `${
                              routes.courses
                            }?skill=${skill.name.toLowerCase()}`
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
                          <span className="font-medium">{skill.name}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Roadmaps */}
                <div>
                  <h3 className="text-xl font-bold mb-6">Roadmaps</h3>
                  <div className="lg:grid grid-cols-5 gap-4 flex flex-col">
                    {roadmaps.map((roadmap) => (
                      <Card
                        key={roadmap.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-border card-hover"
                        onClick={() => {
                          onNavigate(routes.roadmapDetail(roadmap.id));
                          setIsExploreOpen(false);
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
                          <h4 className="font-medium text-sm leading-tight">
                            {roadmap.title}
                          </h4>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Desktop Search Bar */}
          {!isMobile && (
            <div className="flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 h-9 bg-muted/50"
                />
              </form>
            </div>
          )}

          {/* Mobile Search Toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Right Section */}
          <div
            className={`${
              isMobile ? "" : "ml-auto"
            } flex items-center space-x-2`}
          >
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Subscription Status */}
            {subscription.plan !== "Free" && !isMobile && (
              <Button
                variant="outline"
                size="sm"
                className="bg-gradient-to-r from-yellow-400/10 to-orange-400/10 text-yellow-600 border-yellow-400/30 hover:bg-gradient-to- hover:from-yellow-400/20 hover:to-yellow-400/20 dark:text-yellow-400"
                onClick={() => onNavigate(routes.subscriptionManagement)}
              >
                <Crown className="h-4 w-4 mr-1" />
                {subscription.plan}
              </Button>
            )}

            {/* XP Balance - Compact on mobile */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => onNavigate(routes.xpStore)}
              >
                <Gift className="h-4 w-4 mr-1" />
                <span className={isMobile ? "sr-only" : ""}>
                  {subscription.xpBalance.toLocaleString()} XP
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
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="text-sm text-muted-foreground">
                    You have {unreadCount} unread notifications
                  </p>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
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
                              : "bg-purple-500"
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t">
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Notifications
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
                      src={user.avatar || "/placeholder.svg"}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate(routes.profile)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.courses)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>My Courses</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.projects)}>
                  <Code className="mr-2 h-4 w-4" />
                  <span>My Projects</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.roadmaps)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Roadmaps</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.project30)}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  <span>Project30</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate(routes.community)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Community</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                <DropdownMenuItem onClick={() => onNavigate(routes.logout)}>
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
        <div className="ml-4 flex-1">
          <Search className="mr-2 h-4 w-4" />
          Search
        </div>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/01.png" alt="Avatar" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setCurrentPage("profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setCurrentPage("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default NavigationBar
