"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Pencil,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScheduleForm, ScheduleFormValues } from "./ScheduleForm";
import { StreakBadge } from "./StreakBadge";
import {
  deleteSchedule,
  pauseSchedule,
  updateSchedule,
  type Schedule,
} from "@/lib/schedule";
import { routes } from "@/lib/routes";
import { toast } from "sonner";

interface ScheduleCardProps {
  schedule: Schedule;
  onChanged: () => void;
}

const DAY_LABELS: Record<string, string> = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
  SAT: "Sat",
  SUN: "Sun",
};

const formatTime = (iso: string, timeZone: string) => {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
};

const formatDuration = (duration: number) => {
  if (duration % 60 === 0) {
    const hours = duration / 60;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  return `${duration} min`;
};

export function ScheduleCard({ schedule, onChanged }: ScheduleCardProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const content = useMemo(() => {
    if (schedule.course?.course) {
      return {
        title: schedule.course.course.title,
        url: routes.courseDetail(schedule.course.course.slug),
        label: "Course",
      };
    }
    if (schedule.roadmap?.roadmap) {
      return {
        title: schedule.roadmap.roadmap.title,
        url: routes.roadmapDetail(schedule.roadmap.roadmap.slug),
        label: "Roadmap",
      };
    }
    if (schedule.project?.project) {
      return {
        title: schedule.project.project.title,
        url: routes.projectDetail(schedule.project.project.slug),
        label: "Project",
      };
    }

    return {
      title: schedule.title || "Learning Schedule",
      url: routes.dashboard,
      label: "Schedule",
    };
  }, [schedule]);

  const scheduleLabel = `${schedule.daysOfWeek
    .map((day) => DAY_LABELS[day] ?? day)
    .join(", ")} at ${formatTime(schedule.startTime, schedule.timezone)}`;

  const handleEditSubmit = async (values: ScheduleFormValues) => {
    setIsWorking(true);
    try {
      await updateSchedule(schedule.id, values);
      toast.success("Schedule updated.");
      setIsEditing(false);
      onChanged();
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Error");
    } finally {
      setIsWorking(false);
    }
  };

  const handleTogglePause = async () => {
    setIsWorking(true);
    try {
      await pauseSchedule(schedule.id);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update schedule.");
    } finally {
      setIsWorking(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this schedule?");
    if (!confirmed) return;

    setIsWorking(true);
    try {
      await deleteSchedule(schedule.id);
      toast.success("Schedule deleted.");
      onChanged();
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to delete schedule.");
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => router.push(content.url)}
              >
                {content.title}
              </button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">{content.label}</p>
          </div>
          <Badge variant={schedule.isActive ? "default" : "secondary"}>
            {schedule.isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{scheduleLabel}</p>
          <p className="text-muted-foreground">
            {formatDuration(schedule.duration)} - Reminder{" "}
            {schedule.reminderMinutes} min before
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <StreakBadge value={schedule.streak} />
          <span className="text-xs text-muted-foreground">
            Best: {schedule.longestStreak} days
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            disabled={isWorking}
          >
            <Pencil className="mr-2 h-3 w-3" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTogglePause}
            disabled={isWorking}
          >
            {schedule.isActive ? (
              <PauseCircle className="mr-2 h-3 w-3" />
            ) : (
              <PlayCircle className="mr-2 h-3 w-3" />
            )}
            {schedule.isActive ? "Pause" : "Resume"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isWorking}
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </Button>
        </div>
      </CardContent>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit schedule</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            initialValues={{
              daysOfWeek: schedule.daysOfWeek,
              startTime: schedule.startTime,
              duration: schedule.duration,
              timezone: schedule.timezone,
              reminderMinutes: schedule.reminderMinutes,
            }}
            submitLabel={isWorking ? "Saving..." : "Save changes"}
            onSubmit={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
