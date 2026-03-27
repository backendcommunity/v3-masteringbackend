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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { Loader } from "../ui/loader";
import { ExternalLink } from "lucide-react";

interface Assignment {
  id: string;
  createdAt: string;
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
  const [selectedBootcamp, setSelectedBootcamp] = useState<string>("");
  const [bootcamps, setBootcamps] = useState<
    Array<{ id: string; title: string }>
  >([]);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        const data = await store.getAdminAssignments(
          selectedBootcamp ? { bootcampId: selectedBootcamp } : undefined,
        );
        setAssignments(data || []);

        // Extract unique bootcamps from data
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

    loadAssignments();
  }, [selectedBootcamp, store]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <Loader isLoader={false} />;

  return (
    <div className="flex-1 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Student Assignments
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and manage all bootcamp assignment submissions
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({assignments.length})</CardTitle>
          <CardDescription>
            {selectedBootcamp
              ? `Assignments for selected bootcamp`
              : "All student assignment submissions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No assignments found</p>
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
                    <th className="text-left py-3 px-4 font-medium">
                      Submission
                    </th>
                    <th className="text-left py-3 px-4 font-medium">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
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
