"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  FolderOpen,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Filter,
  Calendar,
} from "lucide-react";
import { routes } from "@/lib/routes";

interface CourseProjectsPageProps {
  courseId: string;
  onNavigate: (path: string) => void;
}

export function CourseProjectsPage({
  courseId,
  onNavigate,
}: CourseProjectsPageProps) {
  const [filter, setFilter] = useState<
    "all" | "in-progress" | "completed" | "not-started"
  >("all");

  // Mock projects data
  const projects = [
    {
      id: "project-1",
      title: "Personal Portfolio Website",
      description:
        "Build a responsive portfolio website using HTML, CSS, and JavaScript",
      difficulty: "Beginner",
      estimatedHours: 8,
      points: 200,
      dueDate: "2024-02-15",
      status: "completed",
      progress: 100,
      submitted: true,
      submissionUrl: "https://github.com/user/portfolio",
      feedback: "Excellent work! Great attention to detail.",
      grade: 95,
      requirements: [
        "Responsive design",
        "Navigation menu",
        "About section",
        "Projects showcase",
        "Contact form",
      ],
    },
    {
      id: "project-2",
      title: "Todo List Application",
      description: "Create a full-featured todo list app with local storage",
      difficulty: "Intermediate",
      estimatedHours: 12,
      points: 300,
      dueDate: "2024-02-20",
      status: "in-progress",
      progress: 65,
      submitted: false,
      submissionUrl: "",
      feedback: "",
      grade: null,
      requirements: [
        "Add/delete todos",
        "Mark as complete",
        "Filter todos",
        "Local storage",
        "Responsive design",
      ],
    },
    {
      id: "project-3",
      title: "Weather Dashboard",
      description:
        "Build a weather app using external APIs and modern JavaScript",
      difficulty: "Advanced",
      estimatedHours: 16,
      points: 400,
      dueDate: "2024-02-25",
      status: "not-started",
      progress: 0,
      submitted: false,
      submissionUrl: "",
      feedback: "",
      grade: null,
      requirements: [
        "API integration",
        "Search functionality",
        "Weather forecast",
        "Location detection",
        "Data visualization",
      ],
    },
  ];

  const filteredProjects = projects.filter((project) => {
    if (filter === "all") return true;
    return project.status === filter;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in-progress":
        return "text-primary";
      case "not-started":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-primary" />;
      case "not-started":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatStatus = (status: string) => {
    return status
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "completed";
  };

  const totalPoints = projects
    .filter((p) => p.status === "completed")
    .reduce((acc, p) => acc + p.points, 0);
  const completedCount = projects.filter(
    (p) => p.status === "completed"
  ).length;
  const inProgressCount = projects.filter(
    (p) => p.status === "in-progress"
  ).length;

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
              <FolderOpen className="h-6 w-6 text-orange-600" />
              Course Projects
            </h1>
            <p className="text-gray-600">
              Build real-world projects to showcase your skills
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold">{projects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">MB Earned</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-600" />
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All Projects
        </Button>
        <Button
          variant={filter === "not-started" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("not-started")}
        >
          Not Started
        </Button>
        <Button
          variant={filter === "in-progress" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("in-progress")}
        >
          In Progress
        </Button>
        <Button
          variant={filter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("completed")}
        >
          Completed
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.description}
                  </p>
                </div>
                <Badge className={getDifficultyColor(project.difficulty)}>
                  {project.difficulty}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="h-4 w-4" />~{project.estimatedHours} hours
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Star className="h-4 w-4" />
                  {project.points} MB
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Due: {new Date(project.dueDate).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(project.status)}
                  <span
                    className={`text-sm font-medium ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>
              </div>

              {/* Due Date Warning */}
              {isOverdue(project.dueDate, project.status) && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">⚠️ Overdue</p>
                </div>
              )}

              {/* Progress Bar */}
              {project.status !== "not-started" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
              )}

              {/* Requirements Checklist */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">
                  Requirements:
                </h4>
                <div className="space-y-1">
                  {project.requirements.slice(0, 3).map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center">
                        {project.progress > (index + 1) * 20 && (
                          <CheckCircle className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                      <span className="text-gray-600">{req}</span>
                    </div>
                  ))}
                  {project.requirements.length > 3 && (
                    <p className="text-xs text-gray-500 ml-6">
                      +{project.requirements.length - 3} more requirements
                    </p>
                  )}
                </div>
              </div>

              {/* Submission Info */}
              {project.submitted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        Submitted
                      </p>
                      {project.grade && (
                        <p className="text-sm text-green-600">
                          Grade: {project.grade}%
                        </p>
                      )}
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  {project.feedback && (
                    <p className="text-sm text-green-700 mt-2">
                      {project.feedback}
                    </p>
                  )}
                </div>
              )}

              {/* Action Button */}
              <Button
                className="w-full"
                onClick={() =>
                  onNavigate(routes.courseProject(courseId, project.id))
                }
                variant={project.status === "completed" ? "outline" : "default"}
              >
                {project.status === "completed"
                  ? "View Project"
                  : project.status === "in-progress"
                  ? "Continue Project"
                  : "Start Project"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No projects found
            </h3>
            <p className="text-gray-500">
              No projects match your current filter.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
