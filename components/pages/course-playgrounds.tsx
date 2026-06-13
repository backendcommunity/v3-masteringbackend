"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gamepad2, Code, Folder, Plus, Clock } from "lucide-react";
import { routes } from "@/lib/routes";

interface CoursePlaygroundsPageProps {
  courseId: string;
  onNavigate: (path: string) => void;
}

export function CoursePlaygroundsPage({
  courseId,
  onNavigate,
}: CoursePlaygroundsPageProps) {
  const [filter, setFilter] = useState<"all" | "my-playgrounds" | "templates">(
    "all"
  );

  // Mock playgrounds data
  const playgrounds = [
    {
      id: "playground-1",
      title: "JavaScript Basics Sandbox",
      description: "Experiment with JavaScript fundamentals",
      language: "JavaScript",
      type: "template",
      lastModified: "2024-01-15",
      files: 3,
      isOwned: false,
      tags: ["javascript", "basics"],
    },
    {
      id: "playground-2",
      title: "React Component Playground",
      description: "Build and test React components",
      language: "TypeScript",
      type: "template",
      lastModified: "2024-01-14",
      files: 5,
      isOwned: false,
      tags: ["react", "components", "typescript"],
    },
    {
      id: "playground-3",
      title: "My API Testing Lab",
      description: "Personal playground for API experiments",
      language: "JavaScript",
      type: "personal",
      lastModified: "2024-01-16",
      files: 7,
      isOwned: true,
      tags: ["api", "fetch", "testing"],
    },
    {
      id: "playground-4",
      title: "Node.js Server Playground",
      description: "Backend development sandbox",
      language: "JavaScript",
      type: "template",
      lastModified: "2024-01-13",
      files: 4,
      isOwned: false,
      tags: ["nodejs", "server", "backend"],
    },
  ];

  const filteredPlaygrounds = playgrounds.filter((playground) => {
    if (filter === "my-playgrounds") return playground.isOwned;
    if (filter === "templates") return playground.type === "template";
    return true;
  });

  const getLanguageColor = (language: string) => {
    switch (language) {
      case "JavaScript":
        return "bg-yellow-100 text-yellow-800";
      case "TypeScript":
        return "bg-primary/10 text-primary";
      case "Python":
        return "bg-green-100 text-green-800";
      case "Java":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const createNewPlayground = () => {
    // In a real app, this would create a new playground
    const newId = `playground-${Date.now()}`;
    onNavigate(routes.coursePlayground(courseId, newId));
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseDetail(courseId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Course
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-purple-600" />
              Code Playgrounds
            </h1>
            <p className="text-gray-600">
              Experiment and build in interactive coding environments
            </p>
          </div>
        </div>
        <Button
          onClick={createNewPlayground}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Playground
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Available Playgrounds</p>
                <p className="text-2xl font-bold">{playgrounds.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">My Playgrounds</p>
                <p className="text-2xl font-bold">
                  {playgrounds.filter((p) => p.isOwned).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Templates</p>
                <p className="text-2xl font-bold">
                  {playgrounds.filter((p) => p.type === "template").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Playgrounds
        </Button>
        <Button
          variant={filter === "my-playgrounds" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("my-playgrounds")}
        >
          My Playgrounds
        </Button>
        <Button
          variant={filter === "templates" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("templates")}
        >
          Templates
        </Button>
      </div>

      {/* Playgrounds Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {filteredPlaygrounds.map((playground) => (
          <Card
            key={playground.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{playground.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {playground.description}
                  </p>
                </div>
                <Badge className={getLanguageColor(playground.language)}>
                  {playground.language}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Playground Info */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Folder className="h-4 w-4" />
                  {playground.files} files
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(playground.lastModified).toLocaleDateString()}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {playground.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Type Badge */}
              <div className="flex items-center justify-between">
                <Badge variant={playground.isOwned ? "default" : "outline"}>
                  {playground.isOwned ? "My Playground" : "Template"}
                </Badge>
              </div>

              {/* Action Button */}
              <Button
                className="w-full"
                onClick={() =>
                  onNavigate(routes.coursePlayground(courseId, playground.id))
                }
              >
                {playground.isOwned ? "Continue Coding" : "Use Template"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPlaygrounds.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Gamepad2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No playgrounds found
            </h3>
            <p className="text-gray-500 mb-4">
              {filter === "my-playgrounds"
                ? "You haven't created any playgrounds yet."
                : "No playgrounds match your current filter."}
            </p>
            <Button
              onClick={createNewPlayground}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Your First Playground
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
