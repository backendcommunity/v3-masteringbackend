"use client";

import { useState, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  ExternalLink,
  FileText,
  Github,
  Search,
  Trophy,
  XCircle,
  Calendar,
  Star,
  Users,
  User,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PageSkeleton } from "@/components/ui/page-skeleton";

interface ProjectSubmissionsPageProps {
  onNavigate?: (path: string) => void;
}

type ViewMode = "mine" | "all";

export function ProjectSubmissionsPage({
  onNavigate,
}: ProjectSubmissionsPageProps) {
  const store = useAppStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("mine");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewSubmission, setPreviewSubmission] = useState<any>(null);
  const pageSize = 20;

  // Fetch submissions when filters change
  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        const data = await store.getProjectSubmissions({
          status: statusFilter === "all" ? undefined : statusFilter,
          mine: viewMode === "mine",
          page: currentPage,
          pageSize,
        });
        setSubmissions(data?.solutions || data || []);
      } catch (error) {
        console.error("Failed to fetch submissions:", error);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [statusFilter, viewMode, currentPage]);

  // Fetch stats — scoped to current view mode
  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await store.getSubmissionStats({
          mine: viewMode === "mine",
        });
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        setStats(null);
      }
    }

    fetchStats();
  }, [viewMode]);

  // Reset to page 1 when switching modes
  useEffect(() => {
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("all");
  }, [viewMode]);

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchQuery) return true;
    return submission.project?.title
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      beginners:
        "bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary",
      intermediate:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      advance: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    };
    return (
      <Badge className={colors[level] || "bg-muted text-muted-foreground"}>
        {level}
      </Badge>
    );
  };

  // Computed stats: use API stats or fall back to local calculation
  const displayStats = stats || {
    total: submissions.length,
    approved: submissions.filter((s) => s.status === "approved").length,
    pending: submissions.filter((s) => s.status === "pending").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    averageScore:
      submissions.filter((s) => s.score).length > 0
        ? submissions
          .filter((s) => s.score)
          .reduce((acc, s) => acc + s.score, 0) /
        submissions.filter((s) => s.score).length
        : 0,
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => onNavigate?.("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {viewMode === "mine" ? "My Submissions" : "All Submissions"}
          </h1>
          <p className="text-muted-foreground">
            {viewMode === "mine"
              ? "Track your project submissions and feedback"
              : "Browse all project submissions from the community"}
          </p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setViewMode("mine")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "mine"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <User className="h-4 w-4" />
          My Submissions
        </button>
        <button
          onClick={() => setViewMode("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "all"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          <Users className="h-4 w-4" />
          All Submissions
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.total}</div>
            <p className="text-xs text-muted-foreground">submissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.approved}</div>
            <p className="text-xs text-muted-foreground">projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.pending}</div>
            <p className="text-xs text-muted-foreground">in review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayStats.rejected}</div>
            <p className="text-xs text-muted-foreground">to revise</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Number(displayStats.averageScore || 0).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search submissions..."
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <PageSkeleton />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">
                        {submission.project?.title}
                      </CardTitle>
                      {submission.project?.level &&
                        getLevelBadge(submission.project.level)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {/* Show submitter name in "All" mode */}
                      {viewMode === "all" && submission.user?.name && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {submission.user.name}
                        </div>
                      )}
                      {submission.submittedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Submitted{" "}
                          {new Date(
                            submission.submittedAt,
                          ).toLocaleDateString()}
                        </div>
                      )}
                      {submission.score != null && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-600" />
                          Score: {submission.score}%
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(submission.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Technologies */}
                {submission.technologies?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {submission.technologies.map((tech: string) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        <Code2 className="h-3 w-3 mr-1" />
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Feedback */}
                {submission.feedback && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">
                      Reviewer Feedback:
                    </p>
                    <p
                      className="text-sm text-muted-foreground"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(submission.feedback) }}
                    ></p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  {submission.repositoryUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={submission.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4 mr-2" />
                        View Repository
                      </a>
                    </Button>
                  )}
                  {submission.liveUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={submission.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {submission.project?.slug && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onNavigate?.(`/projects/${submission.project.slug}`)
                      }
                    >
                      View Code
                    </Button>
                  )}
                  {submission.liveUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPreviewSubmission(submission)
                      }
                    >
                      View Submission
                    </Button>
                  )}

                  {viewMode === "mine" && submission.status === "rejected" && (
                    <Button size="sm">Resubmit Project</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredSubmissions.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No submissions found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : viewMode === "mine"
                      ? "Start working on projects to see your submissions here"
                      : "No community submissions yet"}
                </p>
                {viewMode === "mine" && (
                  <Button onClick={() => onNavigate?.("/projects")}>
                    Browse Projects
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Preview Dialog */}
      {previewSubmission && (
        <Dialog
          open={!!previewSubmission}
          onOpenChange={(open) => !open && setPreviewSubmission(null)}
        >
          <DialogContent className="max-w-4xl w-[90vw] h-[80vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>
                Preview Submission: {previewSubmission.project?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden relative bg-muted/20">
              {previewSubmission.liveUrl ? (
                <iframe
                  src={previewSubmission.liveUrl}
                  className="w-full h-full border-0"
                  title="Project Preview"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No preview available for this submission
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
