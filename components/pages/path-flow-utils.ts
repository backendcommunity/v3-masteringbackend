import { Roadmap } from "@/lib/data";

export interface PathCourse {
  id: string;
  slug?: string;
  title: string;
  summary?: string;
  description?: string;
  type?: string;
  duration?: string | number;
  chapters?: Array<unknown>;
  isCompleted?: boolean;
  banner?: string;
  raw: any;
}

export interface PathTopic {
  id: string;
  title: string;
  description?: string;
  summary?: string;
  order: number;
  progress: number;
  completed: boolean;
  courses: PathCourse[];
  raw: any;
}

const decodeBasicHtmlEntities = (value: string) =>
  value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

export const stripHtml = (value?: string | null) => {
  if (!value) return "";
  const withoutTags = value.replace(/<[^>]*>/g, " ");
  return decodeBasicHtmlEntities(withoutTags).replace(/\s+/g, " ").trim();
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

export const getPathProgress = (path?: Partial<Roadmap> | null) => {
  const progress = normalizeNumber(path?.progress, 0);
  return Math.max(0, Math.min(100, progress));
};

export const getRoadmapKey = (path: Partial<Roadmap>) =>
  path.slug || path.id || "";

export const getPathSubtitle = (path?: Partial<Roadmap> | null) =>
  stripHtml(path?.summary) ||
  stripHtml(path?.description) ||
  "No description available yet.";

export const getPathDuration = (path?: Partial<Roadmap> | null) => {
  const duration =
    (path as any)?.estimatedTime || (path as any)?.timeframe || path?.timeframe;
  return typeof duration === "string" && duration.trim() ? duration : "TBD";
};

const toPathCourse = (input: any): PathCourse | null => {
  if (!input) return null;
  const source = input?.course && typeof input.course === "object" ? input.course : input;
  const id =
    (typeof source?.id === "string" && source.id) ||
    (typeof input?.courseId === "string" && input.courseId) ||
    "";

  if (!id) return null;

  return {
    id,
    slug: typeof source?.slug === "string" ? source.slug : undefined,
    title:
      (typeof source?.title === "string" && source.title) || "Untitled course",
    summary: typeof source?.summary === "string" ? source.summary : undefined,
    description:
      typeof source?.description === "string" ? source.description : undefined,
    type: typeof source?.type === "string" ? source.type : undefined,
    duration:
      typeof source?.duration === "string" || typeof source?.duration === "number"
        ? source.duration
        : undefined,
    chapters: Array.isArray(source?.chapters) ? source.chapters : [],
    isCompleted:
      typeof source?.isCompleted === "boolean"
        ? source.isCompleted
        : typeof input?.isCompleted === "boolean"
        ? input.isCompleted
        : undefined,
    banner: typeof source?.banner === "string" ? source.banner : undefined,
    raw: input,
  };
};

const toPathTopic = (input: any, index: number): PathTopic | null => {
  if (!input) return null;
  const id = typeof input?.id === "string" ? input.id : "";
  if (!id) return null;

  const courses = Array.isArray(input?.courses)
    ? input.courses.map(toPathCourse).filter(Boolean)
    : [];

  const progress = normalizeNumber(
    input?.progress ?? input?.userTopic?.progress ?? 0,
    0,
  );

  const completed = Boolean(input?.completed ?? input?.userTopic?.completed);

  return {
    id,
    title:
      (typeof input?.title === "string" && input.title) || `Topic ${index + 1}`,
    description:
      typeof input?.description === "string" ? input.description : undefined,
    summary: typeof input?.summary === "string" ? input.summary : undefined,
    order: normalizeNumber(input?.order, index),
    progress: Math.max(0, Math.min(100, progress)),
    completed,
    courses: courses as PathCourse[],
    raw: input,
  };
};

export const getPathTopics = (path?: Partial<Roadmap> | null): PathTopic[] => {
  const rawTopics = Array.isArray((path as any)?.topics)
    ? (path as any).topics
    : Array.isArray((path as any)?.milestones)
    ? (path as any).milestones
    : [];

  return rawTopics
    .map((topic: any, index: number) => toPathTopic(topic, index))
    .filter(Boolean)
    .sort((a: PathTopic, b: PathTopic) => a.order - b.order) as PathTopic[];
};

export const getCurrentTopic = (
  path: Partial<Roadmap> | null,
  topics: PathTopic[],
) => {
  if (!topics.length) return null;

  const userRoadmap = (path as any)?.userRoadmap;
  const candidateIds = [
    userRoadmap?.currentTopicId,
    userRoadmap?.currentTopic?.id,
    userRoadmap?.currentUserTopic?.topicId,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  const matchedByUserRoadmap = topics.find((topic) =>
    candidateIds.includes(topic.id),
  );
  if (matchedByUserRoadmap) return matchedByUserRoadmap;

  const inProgressTopic = topics.find((topic) => topic.progress > 0 && !topic.completed);
  if (inProgressTopic) return inProgressTopic;

  const firstUncompleted = topics.find((topic) => !topic.completed);
  if (firstUncompleted) return firstUncompleted;

  return topics[0];
};

export const getPrimaryCourse = (topic?: PathTopic | null) =>
  topic?.courses?.[0] || null;

export const getCourseRouteParam = (course?: PathCourse | null) => {
  if (!course) return "";
  return course.slug || course.id;
};
