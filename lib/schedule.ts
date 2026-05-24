import { api } from "./api";

export type Schedule = {
  id: string;
  userId: string;
  title?: string | null;
  daysOfWeek: string[];
  startTime: string;
  duration: number;
  timezone: string;
  reminderMinutes: number;
  isActive: boolean;
  streak: number;
  longestStreak: number;
  lastCompletedAt?: string | null;
  courseId?: string | null;
  roadmapId?: string | null;
  projectId?: string | null;
  course?: {
    id: string;
    course?: { id: string; title: string; slug: string } | null;
  } | null;
  roadmap?: {
    id: string;
    roadmap?: { id: string; title: string; slug: string } | null;
  } | null;
  project?: {
    id: string;
    project?: { id: string; title: string; slug: string } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSchedulePayload = {
  daysOfWeek: string[];
  startTime: string;
  duration: number;
  timezone: string;
  reminderMinutes?: number;
  courseId?: string;
  roadmapId?: string;
  projectId?: string;
  title?: string;
};

export type UpdateSchedulePayload = Partial<CreateSchedulePayload> & {
  isActive?: boolean;
};

const unwrap = (response: any) => response?.data?.data ?? response?.data ?? response;

export const createSchedule = async (payload: CreateSchedulePayload) => {
  const response = await api.post("/schedule", payload);
  return unwrap(response);
};

export const getSchedules = async (params?: { isActive?: boolean }) => {
  const response = await api.get("/schedule", { params });
  return unwrap(response) as Schedule[];
};

export const getSchedule = async (id: string) => {
  const response = await api.get(`/schedule/${id}`);
  return unwrap(response) as Schedule;
};

export const updateSchedule = async (
  id: string,
  payload: UpdateSchedulePayload
) => {
  const response = await api.put(`/schedule/${id}`, payload);
  return unwrap(response) as Schedule;
};

export const pauseSchedule = async (id: string) => {
  const response = await api.patch(`/schedule/${id}/pause`);
  return unwrap(response) as Schedule;
};

export const deleteSchedule = async (id: string) => {
  const response = await api.delete(`/schedule/${id}`);
  return unwrap(response);
};

export const getScheduleStreak = async (id: string) => {
  const response = await api.get(`/schedule/${id}/streak`);
  return unwrap(response) as {
    streak: number;
    longestStreak: number;
    lastCompletedAt: string | null;
  };
};
