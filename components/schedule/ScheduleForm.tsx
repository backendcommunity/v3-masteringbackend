"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export type ScheduleFormValues = {
  daysOfWeek: string[];
  startTime: string;
  duration: number;
  timezone: string;
  reminderMinutes: number;
};

interface ScheduleFormProps {
  initialValues?: Partial<ScheduleFormValues>;
  submitLabel?: string;
  onSubmit: (values: ScheduleFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

const DAY_OPTIONS = [
  { value: "MON", label: "M" },
  { value: "TUE", label: "T" },
  { value: "WED", label: "W" },
  { value: "THU", label: "T" },
  { value: "FRI", label: "F" },
  { value: "SAT", label: "S" },
  { value: "SUN", label: "S" },
];

const PRESET_DURATIONS = [30, 60, 120];
const REMINDER_OPTIONS = [5, 10, 15, 30, 60];

const getDefaultTimezones = () => {
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const base = [
    "UTC",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Chicago",
    "America/Los_Angeles",
    "Asia/Kolkata",
    "Asia/Dubai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  if (detected && !base.includes(detected)) {
    return [detected, ...base];
  }

  return base;
};

const formatTimeInZone = (iso: string, timeZone: string) => {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
};

const getDatePartsInZone = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
};

const buildStartTimeIso = (timeValue: string, timeZone: string) => {
  const [hour, minute] = timeValue.split(":").map((value) => Number(value));
  const { year, month, day } = getDatePartsInZone(timeZone);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const tzDate = new Date(utcDate.toLocaleString("en-US", { timeZone }));
  const offset = utcDate.getTime() - tzDate.getTime();
  return new Date(utcDate.getTime() + offset).toISOString();
};

export function ScheduleForm({
  initialValues,
  submitLabel = "Save Schedule",
  onSubmit,
  onCancel,
}: ScheduleFormProps) {
  const timezones = useMemo(() => getDefaultTimezones(), []);
  const defaultTimezone =
    initialValues?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC";

  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(
    initialValues?.daysOfWeek ?? [],
  );
  const [startTime, setStartTime] = useState(
    initialValues?.startTime
      ? formatTimeInZone(initialValues.startTime, defaultTimezone)
      : "20:00",
  );
  const [durationMode, setDurationMode] = useState(
    PRESET_DURATIONS.includes(initialValues?.duration ?? 60)
      ? "preset"
      : "custom",
  );
  const [duration, setDuration] = useState<number>(
    initialValues?.duration ?? 60,
  );
  const [customDuration, setCustomDuration] = useState(
    PRESET_DURATIONS.includes(initialValues?.duration ?? 60)
      ? ""
      : String(initialValues?.duration ?? ""),
  );
  const [reminderMinutes, setReminderMinutes] = useState<number>(
    initialValues?.reminderMinutes ?? 15,
  );
  const [timezone, setTimezone] = useState<string>(defaultTimezone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!initialValues) return;

    const timezoneValue = initialValues.timezone ?? timezone;
    setDaysOfWeek(initialValues.daysOfWeek ?? []);
    setStartTime(
      initialValues.startTime
        ? formatTimeInZone(initialValues.startTime, timezoneValue)
        : "20:00",
    );
    const preset = PRESET_DURATIONS.includes(initialValues.duration ?? 60)
      ? "preset"
      : "custom";
    setDurationMode(preset);
    setDuration(initialValues.duration ?? 60);
    setCustomDuration(
      preset === "custom" ? String(initialValues.duration ?? "") : "",
    );
    setReminderMinutes(initialValues.reminderMinutes ?? 15);
    if (initialValues.timezone) setTimezone(initialValues.timezone);
  }, [initialValues]);

  const toggleDay = (day: string) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const handleSubmit = async () => {
    if (!daysOfWeek.length) {
      toast.error("Pick at least one day.");
      return;
    }
    if (!startTime) {
      toast.error("Pick a start time.");
      return;
    }

    const durationValue =
      durationMode === "custom"
        ? Number(customDuration)
        : Number(duration);

    if (!durationValue || durationValue < 1) {
      toast.error("Enter a valid duration.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startTimeIso = buildStartTimeIso(startTime, timezone);

      await onSubmit({
        daysOfWeek,
        startTime: startTimeIso,
        duration: durationValue,
        timezone,
        reminderMinutes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Days</Label>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <Button
              key={day.value}
              type="button"
              size="sm"
              variant={daysOfWeek.includes(day.value) ? "default" : "outline"}
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="schedule-time">Time</Label>
          <Input
            id="schedule-time"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Duration</Label>
          <Select
            value={durationMode === "custom" ? "custom" : String(duration)}
            onValueChange={(value) => {
              if (value === "custom") {
                setDurationMode("custom");
                return;
              }
              setDurationMode("preset");
              setDuration(Number(value));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_DURATIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} min
                </SelectItem>
              ))}
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {durationMode === "custom" && (
            <Input
              type="number"
              min={1}
              placeholder="Minutes"
              value={customDuration}
              onChange={(event) => setCustomDuration(event.target.value)}
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Reminder</Label>
          <Select
            value={String(reminderMinutes)}
            onValueChange={(value) => setReminderMinutes(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Reminder" />
            </SelectTrigger>
            <SelectContent>
              {REMINDER_OPTIONS.map((value) => (
                <SelectItem key={value} value={String(value)}>
                  {value} min before
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
