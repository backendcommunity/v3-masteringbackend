"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Pencil, PauseCircle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScheduleForm, ScheduleFormValues } from "./ScheduleForm";
import { StreakBadge } from "./StreakBadge";
import {
  createSchedule,
  getSchedules,
  pauseSchedule,
  updateSchedule,
  type Schedule,
} from "@/lib/schedule";
import { toast } from "sonner";

interface ScheduleWidgetProps {
  courseId?: string;
  roadmapId?: string;
  projectId?: string;
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

const getScheduleLabel = (schedule: Schedule) => {
  const dayLabel = schedule.daysOfWeek
    .map((day) => DAY_LABELS[day] ?? day)
    .join(", ");
  const timeLabel = formatTime(schedule.startTime, schedule.timezone);
  return `${dayLabel} at ${timeLabel}`;
};

export function ScheduleWidget({
  courseId,
  roadmapId,
  projectId,
}: ScheduleWidgetProps) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const contextKey = useMemo(
    () => courseId || roadmapId || projectId,
    [courseId, roadmapId, projectId],
  );

  const loadSchedule = async () => {
    if (!contextKey) return;
    setIsLoading(true);
    try {
      const schedules = await getSchedules();
      const matched = schedules.find((item) => {
        if (courseId) return item.courseId === courseId;
        if (roadmapId) return item.roadmapId === roadmapId;
        if (projectId) return item.projectId === projectId;
        return false;
      });
      setSchedule(matched ?? null);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to load schedule.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [contextKey]);

  const handleSubmit = async (values: ScheduleFormValues) => {
    try {
      if (schedule) {
        const updated = await updateSchedule(schedule.id, values);
        setSchedule(updated);
        setIsEditing(false);
        toast.success("Schedule updated.");
        return;
      }

      const created = await createSchedule({
        ...values,
        courseId,
        roadmapId,
        projectId,
      });
      setSchedule(created);
      setIsEditing(false);
      toast.success("Schedule saved.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message ?? error?.message ?? "Error");
    }
  };

  const handleTogglePause = async () => {
    if (!schedule) return;
    try {
      const updated = await pauseSchedule(schedule.id);
      setSchedule(updated);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to update schedule.");
    }
  };

  if (!contextKey) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-4 w-4" />
          Learning Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading schedule...</p>
        ) : schedule && !isEditing ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant={schedule.isActive ? "default" : "secondary"}>
                {schedule.isActive ? "Active" : "Paused"}
              </Badge>
              <StreakBadge value={schedule.streak} />
            </div>
            <div className="space-y-1 text-sm">
              <p className="font-medium">{getScheduleLabel(schedule)}</p>
              <p className="text-muted-foreground">
                {formatDuration(schedule.duration)} - Reminder {" "}
                {schedule.reminderMinutes} min before
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTogglePause}
              >
                {schedule.isActive ? (
                  <PauseCircle className="mr-2 h-3 w-3" />
                ) : (
                  <PlayCircle className="mr-2 h-3 w-3" />
                )}
                {schedule.isActive ? "Pause" : "Resume"}
              </Button>
            </div>
          </div>
        ) : (
          <ScheduleForm
            initialValues={
              schedule
                ? {
                    daysOfWeek: schedule.daysOfWeek,
                    startTime: schedule.startTime,
                    duration: schedule.duration,
                    timezone: schedule.timezone,
                    reminderMinutes: schedule.reminderMinutes,
                  }
                : undefined
            }
            submitLabel={schedule ? "Update Schedule" : "Save Schedule"}
            onSubmit={handleSubmit}
            onCancel={schedule ? () => setIsEditing(false) : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
