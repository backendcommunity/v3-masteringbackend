"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { Loader } from "../ui/loader";
import { ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

interface Assignment {
  id: string;
  createdAt: string;
  completed: boolean;
  submissionUrl?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lesson?: {
    id: string;
    title: string;
    type?: string;
    week?: {
      id: string;
      title: string;
      cohort?: {
        id: string;
        name: string;
        bootcamp?: {
          id: string;
          title: string;
        };
      };
    };
  };
}

interface AdminAssignmentsPageProps {
  onNavigate?: (route: string) => void;
}

export function AdminAssignmentsPage({
  onNavigate,
}: AdminAssignmentsPageProps) {
  const store = useAppStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [selectedBootcamp, setSelectedBootcamp] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all");
  const [bootcamps, setBootcamps] = useState<
    Array<{ id: string; title: string }>
  >([]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await store.getAdminAssignments(
        selectedBootcamp && selectedBootcamp !== "all"
          ? { bootcampId: selectedBootcamp }
          : undefined,
      );
      setAssignments(data || []);

      const uniqueBootcamps = Array.from(
        new Map(
          data
            ?.flatMap((a: Assignment) =>
              a.lesson?.week?.cohort?.bootcamp
                ? [
                    [
                      a.lesson.week.cohort.bootcamp.id,
                      a.lesson.week.cohort.bootcamp,
                    ],
                  ]
                : [],
            )
            .entries() || [],
        ).values(),
      ) as Array<{ id: string; title: string }>;
      setBootcamps(uniqueBootcamps);
    } catch (error) {
      console.error("Failed to load assignments", error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [selectedBootcamp]);

  const handleApprove = async (userLessonId: string) => {
    setApprovingId(userLessonId);
    try {
      await store.approveAssignment(userLessonId);
      toast.success("Submission approved and student notified.");
      // Update local state immediately
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === userLessonId ? { ...a, completed: true } : a,
        ),
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to approve submission.",
      );
    } finally {
      setApprovingId(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filtered = assignments.filter((a) => {
    if (statusFilter === "pending") return !a.completed;
    if (statusFilter === "approved") return a.completed;
    return true;
  });

  const pendingCount = assignments.filter((a) => !a.completed).length;

  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Student Submissions
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and approve assignment, exercise, and project submissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="w-full max-w-xs">
              <Select
                value={selectedBootcamp}
                onValueChange={setSelectedBootcamp}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Bootcamps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Bootcamps</SelectItem>
                  {bootcamps.map((bootcamp) => (
                    <SelectItem key={bootcamp.id} value={bootcamp.id}>
                      {bootcamp.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full max-w-xs">
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">
                    Pending ({pendingCount})
                  </SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Submissions ({filtered.length})
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-500 text-white">
                {pendingCount} pending
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedBootcamp && selectedBootcamp !== "all"
              ? "Assignments for selected bootcamp"
              : "All student submissions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Student</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Bootcamp
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Cohort</th>
                    <th className="text-left py-3 px-4 font-medium">Lesson</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">
                      Submission
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Submitted At
                    </th>
                    <th className="text-left py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((assignment) => (
                    <tr
                      key={assignment.id}
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{assignment.user?.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">
                          {assignment.lesson?.week?.cohort?.bootcamp?.title}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {assignment.lesson?.week?.cohort?.name}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">
                            {assignment.lesson?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.lesson?.week?.title}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {assignment.lesson?.type?.toLowerCase() ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {assignment.submissionUrl ? (
                          <a
                            href={assignment.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Submission
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <Badge variant="secondary">Not Submitted</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {formatDate(assignment.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        {assignment.completed ? (
                          <div className="flex items-center gap-1.5 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Approved</span>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                            disabled={approvingId === assignment.id}
                            onClick={() => handleApprove(assignment.id)}
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            {approvingId === assignment.id
                              ? "Approving…"
                              : "Mark Complete"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
