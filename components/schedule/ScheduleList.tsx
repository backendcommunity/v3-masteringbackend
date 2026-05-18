"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";
import { ScheduleCard } from "./ScheduleCard";
import { getSchedules, type Schedule } from "@/lib/schedule";
import { routes } from "@/lib/routes";
import { EmptyStateCard } from "@/components/empty-state-card";
import { toast } from "sonner";

export function ScheduleList() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      const data = await getSchedules();
      setSchedules(data ?? []);
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to load schedules.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg">My Learning Schedules</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(routes.courses)}
        >
          Add Schedule
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading schedules...</p>
        ) : schedules.length === 0 ? (
          <EmptyStateCard
            icon={CalendarClock}
            title="No schedules yet"
            description="Set a learning schedule from any course, roadmap, or project to stay consistent."
            primaryCTA={{
              label: "Browse content",
              onClick: () => router.push(routes.courses),
            }}
          />
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                onChanged={loadSchedules}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
