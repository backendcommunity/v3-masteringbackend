"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  ThumbsUp,
  HelpCircle,
  ImageIcon,
} from "lucide-react";

interface Project30CommunityPageProps {
  onNavigate: (path: string) => void;
}

export function Project30CommunityPage({
  onNavigate,
}: Project30CommunityPageProps) {
  const [newPost, setNewPost] = useState<string>("");
  const [newQuestion, setNewQuestion] = useState<string>("");

  // Mock community posts
  const posts = [
    {
      id: 1,
      user: {
        name: "Emma Thompson",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 28,
      },
      content:
        "Just completed my weather app for Day 14! It was challenging to work with the API but I'm happy with the result.",
      image: "/placeholder.svg?height=300&width=500",
      likes: 24,
      comments: 8,
      time: "2 hours ago",
    },
    {
      id: 2,
      user: {
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 30,
      },
      content:
        "Finished all 30 projects! What an incredible journey. I've learned so much about React, APIs, and state management. Thanks to everyone who helped along the way!",
      image: null,
      likes: 56,
      comments: 14,
      time: "5 hours ago",
    },
    {
      id: 3,
      user: {
        name: "Jessica Williams",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 29,
      },
      content:
        "My markdown editor for Day 15 is now live! Check it out and let me know what you think.",
      image: "/placeholder.svg?height=300&width=500",
      likes: 32,
      comments: 6,
      time: "8 hours ago",
    },
  ];

  // Mock help requests
  const helpRequests = [
    {
      id: 1,
      user: {
        name: "David Kim",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 12,
      },
      title: "Struggling with API authentication",
      content:
        "I'm working on Day 12's project and can't get the API authentication to work. Has anyone else faced this issue?",
      replies: 4,
      time: "1 hour ago",
    },
    {
      id: 2,
      user: {
        name: "Olivia Martinez",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 18,
      },
      title: "React state not updating correctly",
      content:
        "In my Day 18 project, the state isn't updating when I call setState. I've tried using useEffect but still having issues.",
      replies: 7,
      time: "3 hours ago",
    },
    {
      id: 3,
      user: {
        name: "William Brown",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 22,
      },
      title: "CSS Grid layout problem",
      content:
        "I'm trying to create a responsive grid layout for my Day 22 project, but the items aren't aligning correctly on mobile.",
      replies: 5,
      time: "6 hours ago",
    },
  ];

  // Mock showcase projects
  const showcaseProjects = [
    {
      id: 1,
      user: {
        name: "Sarah Johnson",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 30,
      },
      title: "E-commerce Dashboard",
      image: "/placeholder.svg?height=200&width=300",
      likes: 48,
      day: 8,
    },
    {
      id: 2,
      user: {
        name: "Daniel Lee",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 26,
      },
      title: "Recipe Finder App",
      image: "/placeholder.svg?height=200&width=300",
      likes: 36,
      day: 12,
    },
    {
      id: 3,
      user: {
        name: "Sophia Garcia",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 26,
      },
      title: "Task Management Tool",
      image: "/placeholder.svg?height=200&width=300",
      likes: 42,
      day: 16,
    },
    {
      id: 4,
      user: {
        name: "James Wilson",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 27,
      },
      title: "Music Player",
      image: "/placeholder.svg?height=200&width=300",
      likes: 39,
      day: 20,
    },
    {
      id: 5,
      user: {
        name: "Emma Thompson",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 28,
      },
      title: "Weather Dashboard",
      image: "/placeholder.svg?height=200&width=300",
      likes: 45,
      day: 14,
    },
    {
      id: 6,
      user: {
        name: "Michael Chen",
        avatar: "/placeholder.svg?height=40&width=40",
        day: 30,
      },
      title: "Portfolio Website",
      image: "/placeholder.svg?height=200&width=300",
      likes: 51,
      day: 30,
    },
  ];

  // Handle post submission
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Post submitted: ${newPost}`);
    setNewPost("");
  };

  // Handle question submission
  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Question submitted: ${newQuestion}`);
    setNewQuestion("");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ship Community</h1>
          <p className="text-muted-foreground">
            Connect, share, and learn with fellow participants
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onNavigate("/project30")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ship
        </Button>
      </div>

      <Tabs defaultValue="feed">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="feed">Community Feed</TabsTrigger>
          <TabsTrigger value="help">Help & Support</TabsTrigger>
          <TabsTrigger value="showcase">Project Showcase</TabsTrigger>
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Create Post */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Post</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePostSubmit}>
                    <Textarea
                      placeholder="Share your progress, ask questions, or post tips..."
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Add Image
                      </Button>
                      <Button type="submit" disabled={!newPost.trim()}>
                        Post
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Community Posts */}
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={post.user.avatar || "/placeholder.svg"}
                            alt={post.user.name}
                          />
                          <AvatarFallback>
                            {post.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {post.user.name}
                          </CardTitle>
                          <CardDescription>{post.time}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">Day {post.user.day}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="mb-4">{post.content}</p>
                    {post.image && (
                      <div className="rounded-md overflow-hidden mb-4">
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Post attachment"
                          className="w-full h-auto object-cover"
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{post.likes}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comments}</span>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Share</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              {/* Community Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Community Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Active Participants
                    </span>
                    <span className="font-medium">1,248</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Projects Submitted
                    </span>
                    <span className="font-medium">8,742</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Posts Today</span>
                    <span className="font-medium">156</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Questions Answered
                    </span>
                    <span className="font-medium">423</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Contributors */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      name: "Sarah Johnson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      contributions: 87,
                    },
                    {
                      name: "Michael Chen",
                      avatar: "/placeholder.svg?height=40&width=40",
                      contributions: 76,
                    },
                    {
                      name: "Jessica Williams",
                      avatar: "/placeholder.svg?height=40&width=40",
                      contributions: 64,
                    },
                    {
                      name: "David Kim",
                      avatar: "/placeholder.svg?height=40&width=40",
                      contributions: 59,
                    },
                    {
                      name: "Emma Thompson",
                      avatar: "/placeholder.svg?height=40&width=40",
                      contributions: 52,
                    },
                  ].map((contributor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={contributor.avatar || "/placeholder.svg"}
                            alt={contributor.name}
                          />
                          <AvatarFallback>
                            {contributor.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{contributor.name}</span>
                      </div>
                      <Badge variant="outline">
                        {contributor.contributions}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Join Discord */}
              <Card className="bg-indigo-50">
                <CardHeader>
                  <CardTitle>Join Our Discord</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    Connect with the Ship community in real-time, join
                    coding sessions, and get instant help.
                  </p>
                  <Button className="w-full mt-4">Join Discord</Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="help">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Ask Question */}
              <Card>
                <CardHeader>
                  <CardTitle>Ask a Question</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleQuestionSubmit} className="space-y-4">
                    <div>
                      <Input placeholder="Question title..." className="mb-2" />
                      <Textarea
                        placeholder="Describe your question or issue in detail..."
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Add Screenshot
                      </Button>
                      <Button type="submit" disabled={!newQuestion.trim()}>
                        Submit Question
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Help Requests */}
              {helpRequests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={request.user.avatar || "/placeholder.svg"}
                            alt={request.user.name}
                          />
                          <AvatarFallback>
                            {request.user.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {request.title}
                          </CardTitle>
                          <CardDescription>
                            {request.user.name} · {request.time}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">Day {request.user.day}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p>{request.content}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm text-muted-foreground">
                      {request.replies} replies
                    </div>
                    <Button variant="outline" size="sm">
                      Reply
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="space-y-6">
              {/* Help Topics */}
              <Card>
                <CardHeader>
                  <CardTitle>Common Topics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { name: "API Integration", count: 42 },
                    { name: "React State Management", count: 38 },
                    { name: "CSS Layout", count: 31 },
                    { name: "Authentication", count: 27 },
                    { name: "Performance Optimization", count: 24 },
                  ].map((topic, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <Button variant="link" className="p-0 h-auto text-left">
                        {topic.name}
                      </Button>
                      <Badge variant="secondary">{topic.count}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Help */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-medium">Project Requirements</h4>
                      <p className="text-sm text-muted-foreground">
                        Check the project requirements tab for detailed
                        instructions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-medium">Submission Issues</h4>
                      <p className="text-sm text-muted-foreground">
                        Make sure your project URL is accessible and your code
                        is complete.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 mt-0.5 text-primary" />
                    <div>
                      <h4 className="font-medium">Technical Problems</h4>
                      <p className="text-sm text-muted-foreground">
                        Try clearing your cache or using a different browser if
                        you encounter issues.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Resources */}
              <Card>
                <CardHeader>
                  <CardTitle>Helpful Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="link" className="p-0 h-auto">
                    Ship Documentation
                  </Button>
                  <Button variant="link" className="p-0 h-auto">
                    Frequently Asked Questions
                  </Button>
                  <Button variant="link" className="p-0 h-auto">
                    Troubleshooting Guide
                  </Button>
                  <Button variant="link" className="p-0 h-auto">
                    Video Tutorials
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="showcase">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Project Showcase</h2>
              <Button>Submit Your Project</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {showcaseProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {project.title}
                      </CardTitle>
                      <Badge>Day {project.day}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={project.user.avatar || "/placeholder.svg"}
                          alt={project.user.name}
                        />
                        <AvatarFallback>
                          {project.user.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{project.user.name}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{project.likes}</span>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Daily Community Challenges</CardTitle>
              <CardDescription>
                Extra challenges to boost your skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-muted-foreground">
                  Community challenges coming soon!
                </p>
                <p className="mt-2">
                  Check back for daily bonus challenges and competitions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
