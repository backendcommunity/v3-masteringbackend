"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Calendar,
  ExternalLink,
  Upload,
  FileText,
  Video,
  Link,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { toast } from "sonner";

interface CourseProjectPageProps {
  courseId: string;
  projectId: string;
  onNavigate: (path: string) => void;
}

export function CourseProjectPage({
  courseId,
  projectId,
  onNavigate,
}: CourseProjectPageProps) {
  const [checkedRequirements, setCheckedRequirements] = useState<
    Record<number, boolean>
  >({
    0: true,
    1: true,
    2: false,
    3: false,
    4: false,
  });
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionNotes, setSubmissionNotes] = useState("");

  // Mock project data
  const project = {
    id: projectId,
    title: "Personal Portfolio Website",
    description:
      "Build a responsive portfolio website using HTML, CSS, and JavaScript",
    difficulty: "Beginner",
    estimatedHours: 8,
    points: 200,
    dueDate: "2024-02-15",
    status: "in-progress",
    submitted: false,
    submissionUrl: "",
    feedback: "",
    grade: null,
    instructions: `
Create a personal portfolio website that showcases your skills and projects. Your portfolio should be professional, responsive, and include all the required sections.

## Getting Started
1. Create a new HTML file as your main page
2. Set up your CSS file for styling
3. Add JavaScript for interactive features
4. Test your website on different screen sizes

## Design Guidelines
- Use a clean, professional design
- Choose a consistent color scheme
- Ensure good typography and readability
- Make it mobile-friendly

## Technical Requirements
- Valid HTML5 structure
- CSS Grid or Flexbox for layout
- Responsive design (mobile-first approach)
- Cross-browser compatibility
- Fast loading times
    `,
    requirements: [
      {
        id: 0,
        title: "Responsive Design",
        description:
          "Website works well on desktop, tablet, and mobile devices",
        completed: true,
      },
      {
        id: 1,
        title: "Navigation Menu",
        description: "Clear navigation that works on all screen sizes",
        completed: true,
      },
      {
        id: 2,
        title: "About Section",
        description:
          "Professional about section with your background and skills",
        completed: false,
      },
      {
        id: 3,
        title: "Projects Showcase",
        description: "Display your projects with descriptions and links",
        completed: false,
      },
      {
        id: 4,
        title: "Contact Form",
        description: "Working contact form with validation",
        completed: false,
      },
    ],
    resources: [
      {
        type: "documentation",
        title: "HTML5 Semantic Elements Guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
        description: "Complete guide to HTML5 semantic elements",
      },
      {
        type: "tutorial",
        title: "CSS Grid Layout Tutorial",
        url: "https://css-tricks.com/snippets/css/complete-guide-grid/",
        description: "Comprehensive guide to CSS Grid",
      },
      {
        type: "video",
        title: "Responsive Design Principles",
        url: "https://youtube.com/watch?v=example",
        description: "Video tutorial on responsive web design",
      },
      {
        type: "tool",
        title: "Color Palette Generator",
        url: "https://coolors.co/",
        description: "Generate beautiful color palettes for your design",
      },
    ],
  };

  const toggleRequirement = (id: number) => {
    setCheckedRequirements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedRequirements =
    Object.values(checkedRequirements).filter(Boolean).length;
  const progress = (completedRequirements / project.requirements.length) * 100;

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

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "documentation":
        return <FileText className="h-4 w-4" />;
      case "tutorial":
        return <ExternalLink className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "tool":
        return <Link className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleSubmit = () => {
    if (submissionUrl.trim()) {
      toast.success("Project submitted successfully!");
    }
  };

  const isOverdue =
    new Date(project.dueDate) < new Date() && !project.submitted;

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(routes.courseProjects(courseId))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getDifficultyColor(project.difficulty)}>
            {project.difficulty}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            {project.points} pts
          </Badge>
        </div>
      </div>

      {/* Project Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-gray-600">Estimated Time</p>
                <p className="text-lg font-bold">{project.estimatedHours}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="text-lg font-bold">
                  {new Date(project.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-lg font-bold">{Math.round(progress)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Reward</p>
                <p className="text-lg font-bold">{project.points} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Warning */}
      {isOverdue && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">This project is overdue!</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">
                {completedRequirements}/{project.requirements.length}{" "}
                requirements completed
              </span>
            </div>
            <Progress value={progress} />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="requirements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="submit">Submit</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Requirements</CardTitle>
              <p className="text-sm text-gray-600">
                Check off each requirement as you complete it to track your
                progress.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.requirements.map((requirement) => (
                <div
                  key={requirement.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <button
                    onClick={() => toggleRequirement(requirement.id)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      checkedRequirements[requirement.id]
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {checkedRequirements[requirement.id] && (
                      <CheckCircle className="h-3 w-3 text-white" />
                    )}
                  </button>
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        checkedRequirements[requirement.id]
                          ? "line-through text-gray-500"
                          : ""
                      }`}
                    >
                      {requirement.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {requirement.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">
                  {project.instructions}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Helpful Resources</CardTitle>
              <p className="text-sm text-gray-600">
                Use these resources to help you complete the project.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.resources.map((resource, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{resource.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {resource.description}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(resource.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open Resource
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Submit Your Project</CardTitle>
              <p className="text-sm text-gray-600">
                Submit your completed project for review and feedback.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project URL *</label>
                <Input
                  placeholder="https://github.com/username/project or https://your-project.netlify.app"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Provide a link to your GitHub repository or live demo
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Additional Notes (Optional)
                </label>
                <Textarea
                  placeholder="Any additional information about your project, challenges faced, or features you're proud of..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-primary/5 border border-primary/30 rounded-lg p-4">
                <h4 className="font-medium text-primary mb-2">
                  Before Submitting:
                </h4>
                <ul className="text-sm text-primary space-y-1">
                  <li>✓ All requirements are completed</li>
                  <li>✓ Code is well-commented and organized</li>
                  <li>✓ Project works on different screen sizes</li>
                  <li>✓ All links and features are functional</li>
                </ul>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!submissionUrl.trim()}
                className="w-full"
                size="lg"
              >
                <Upload className="h-4 w-4 mr-2" />
                Submit Project
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
