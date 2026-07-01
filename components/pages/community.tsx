"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  MessageSquare,
  Heart,
  Share,
  Plus,
  Search,
  TrendingUp,
  Award,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { WIP } from "../WIP";

export function CommunityPage() {
  const posts = [
    {
      id: 1,
      author: "Sarah Chen",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Just completed my first microservices project!",
      content:
        "Took me three weeks, but I finally shipped my e-commerce microservices. Hard, but worth it. Thanks to everyone who helped me debug the Docker issues!",
      timestamp: "2 hours ago",
      likes: 24,
      comments: 8,
      tags: ["microservices", "docker", "achievement"],
    },
    {
      id: 2,
      author: "Mike Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Database optimization tips that saved me 70% query time",
      content:
        "Here are 5 database optimization techniques I learned this week:\n\n1. Proper indexing strategy\n2. Query plan analysis\n3. Connection pooling\n4. Caching layer implementation\n5. Database partitioning\n\nWould love to hear your experiences!",
      timestamp: "5 hours ago",
      likes: 45,
      comments: 12,
      tags: ["database", "optimization", "tips"],
    },
    {
      id: 3,
      author: "Emily Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      title: "Looking for study buddy for System Design interviews",
      content:
        "Hey everyone! I'm preparing for system design interviews and would love to find a study partner. We could practice mock interviews together and share resources. DM me if interested!",
      timestamp: "1 day ago",
      likes: 18,
      comments: 15,
      tags: ["study-group", "interviews", "system-design"],
    },
  ];

  const events = [
    {
      id: 1,
      title: "Backend Architecture Workshop",
      date: "Dec 15, 2024",
      time: "2:00 PM EST",
      attendees: 45,
      type: "Workshop",
    },
    {
      id: 2,
      title: "Mock Interview Session",
      date: "Dec 18, 2024",
      time: "6:00 PM EST",
      attendees: 12,
      type: "Practice",
    },
    {
      id: 3,
      title: "Node.js Best Practices Webinar",
      date: "Dec 20, 2024",
      time: "1:00 PM EST",
      attendees: 78,
      type: "Webinar",
    },
  ];

  const leaderboard = [
    { rank: 1, name: "Alex Chen", points: 2450, badge: "🏆" },
    { rank: 2, name: "Sarah Johnson", points: 2380, badge: "🥈" },
    { rank: 3, name: "Mike Rodriguez", points: 2250, badge: "🥉" },
    { rank: 4, name: "Emily Davis", points: 2100, badge: "" },
    { rank: 5, name: "John Smith", points: 1950, badge: "" },
  ];

  return (
    <div className="relative space-y-6 w-full">
      <WIP />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community</h1>
          <p className="text-muted-foreground">
            Meet other backend engineers, swap what you've learned, and build
            together
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            24 Online
          </Badge>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">+127 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Discussions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">+23 today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Knowledge Shared
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Posts & answers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Success Stories
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Job placements</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="feed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="feed">Latest</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="feed" className="space-y-4">
              {/* Create Post */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <Textarea placeholder="Share your backend engineering journey, ask questions, or help others..." />
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                          >
                            #question
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                          >
                            #achievement
                          </Badge>
                          <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                          >
                            #help
                          </Badge>
                        </div>
                        <Button>Post</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Posts */}
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarImage
                            src={post.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {post.author
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{post.author}</h3>
                            <span className="text-sm text-muted-foreground">
                              {post.timestamp}
                            </span>
                          </div>
                          <h4 className="font-medium mt-1">{post.title}</h4>
                        </div>
                      </div>

                      <div className="pl-12">
                        <p className="text-sm whitespace-pre-line">
                          {post.content}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                          <Button variant="ghost" size="sm">
                            <Heart className="mr-2 h-4 w-4" />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Share className="mr-2 h-4 w-4" />
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="trending">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Trending posts will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Community questions will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Member achievements will appear here
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search community..." className="pl-8" />
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{event.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.attendees} attending
                    </span>
                  </div>
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {event.date} at {event.time}
                  </div>
                  <Button size="sm" className="w-full">
                    Join Event
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Community Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((member) => (
                <div
                  key={member.rank}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium w-6">
                      {member.badge || `#${member.rank}`}
                    </span>
                    <span className="text-sm">{member.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {member.points} pts
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Community Guidelines
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Discord Server
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                GitHub Repository
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                size="sm"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Resource Library
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
