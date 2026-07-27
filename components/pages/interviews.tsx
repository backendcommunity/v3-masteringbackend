"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Briefcase,
  Clock,
  Target,
  CheckCircle2,
  Search,
  Brain,
  Code,
  MessageSquare,
  Building,
  Trophy,
  Star,
  Play,
  RotateCcw,
  Eye,
} from "lucide-react";
import { routes } from "@/lib/routes";
import {
  getInterviewProjects,
  getInterviewProjectsByType,
} from "@/lib/interview-data";
import { WIP } from "../WIP";

interface InterviewsPageProps {
  onNavigate?: (route: string) => void;
}

export function InterviewsPage({ onNavigate }: InterviewsPageProps) {
  const allProjects = getInterviewProjects();
  const fullProjects = getInterviewProjectsByType("full-project");
  const algorithmProjects = getInterviewProjectsByType("algorithm");

  const stats = {
    completed: allProjects.filter((p) => p.status === "Completed").length,
    inProgress: allProjects.filter((p) => p.status === "In Progress").length,
    averageScore: Math.round(
      allProjects
        .filter((p) => p.score)
        .reduce((acc, p) => acc + (p.score || 0), 0) /
        allProjects.filter((p) => p.score).length || 0
    ),
    totalProjects: allProjects.length,
  };

  const handleNavigate = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-500";
      case "In Progress":
        return "bg-primary";
      case "Graded":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 bg-green-50 border-green-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Hard":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {project.type === "full-project" ? (
                <Briefcase className="h-4 w-4 text-primary" />
              ) : (
                <Code className="h-4 w-4 text-green-600" />
              )}
              <CardTitle className="text-sm md:text-lg truncate">
                {project.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-3 w-3" />
              {project.company} • {project.position}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Badge
              className={`${getDifficultyColor(project.difficulty)} text-xs`}
            >
              {project.difficulty}
            </Badge>
            {project.score && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                <span className="text-sm font-medium">
                  {project.score}/{project.maxScore}
                </span>
              </div>
            )}
          </div>
        </div>
        <CardDescription className="line-clamp-2 text-xs md:text-sm">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {project.duration}
              </div>
              <Badge variant="outline">{project.category}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(
                  project.status
                )}`}
              />
              <span className="text-xs">{project.status}</span>
            </div>
          </div>

          {project.technologies && (
            <div className="flex flex-wrap gap-1">
              {project.technologies.slice(0, 3).map((tech: string) => (
                <Badge key={tech} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {project.technologies.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{project.technologies.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {project.status === "Available" && (
              <Button
                size="sm"
                onClick={() =>
                  handleNavigate(routes.interviewDetail(project.id))
                }
                className="flex-1 text-xs"
              >
                <Play className="h-3 w-3 mr-1" />
                Start Interview
              </Button>
            )}
            {project.status === "In Progress" && (
              <Button
                size="sm"
                onClick={() =>
                  handleNavigate(routes.interviewDetail(project.id))
                }
                className="flex-1 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Continue
              </Button>
            )}
            {(project.status === "Completed" ||
              project.status === "Graded") && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleNavigate(routes.interviewResults(project.id))
                  }
                  className="flex-1 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Results
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleNavigate(routes.interviewDetail(project.id))
                  }
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 md:space-y-6 relative">
      <WIP />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            MB Interviews
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Practice real-world interview projects and algorithmic challenges
          </p>
        </div>
        <Button>
          <Trophy className="mr-2 h-4 w-4" />
          View Leaderboard
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Interviews Completed
            </CardTitle>
            <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {stats.completed}
            </div>
            <p className="text-xs text-muted-foreground">
              out of {stats.totalProjects} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              In Progress
            </CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {stats.inProgress}
            </div>
            <p className="text-xs text-muted-foreground">active interviews</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Average Score
            </CardTitle>
            <Target className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg md:text-2xl font-bold">
              {stats.averageScore}%
            </div>
            <p className="text-xs text-muted-foreground">
              across all interviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">
              Interview Ready
            </CardTitle>
            <Brain className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.5/10</div>
            <p className="text-xs text-muted-foreground">readiness score</p>
          </CardContent>
        </Card>
      </div>

      {/* Interview Readiness Progress */}
      <Card className="bg-gradient-to-r from-[#0E1F33] to-primary text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Interview Readiness Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm">System Design</span>
              </div>
              <Progress value={85} className="h-2" />
              <span className="text-xs text-blue-100">85% Ready</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span className="text-sm">Algorithms</span>
              </div>
              <Progress value={92} className="h-2" />
              <span className="text-xs text-blue-100">92% Ready</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm">Full Projects</span>
              </div>
              <Progress value={78} className="h-2" />
              <span className="text-xs text-blue-100">78% Ready</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">Technical</span>
              </div>
              <Progress value={88} className="h-2" />
              <span className="text-xs text-blue-100">88% Ready</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search interviews..." className="pl-8" />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="netflix">Netflix</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Interview Projects */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Interviews ({allProjects.length})
          </TabsTrigger>
          <TabsTrigger value="full-projects">
            Full Projects ({fullProjects.length})
          </TabsTrigger>
          <TabsTrigger value="algorithms">
            Algorithms ({algorithmProjects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="full-projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fullProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="algorithms" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {algorithmProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
