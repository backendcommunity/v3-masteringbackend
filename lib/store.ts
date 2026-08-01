"use client";

import { create } from "zustand";
import {
  type User,
  type Course,
  type Project,
  type Challenge,
  type Interview,
  type Bootcamp,
  type LearningPath,
  type Roadmap,
  type Activity,
  type StreakData,
  type ContinueLearningItem,
  type SearchResults,
  type PortfolioResponse,
  type CertificateVerification,
  dataStore,
  updateUser as updateUserInStore,
  updateCourse as updateCourseInStore,
  updateProject as updateProjectInStore,
  updateChallenge as updateChallengeInStore,
  updateCourses,
  CoursesQuery,
  updateUserCourses,
  UserCourse,
  updatePopularCourses,
  Note,
  updateUserCourse,
  Quiz,
  Milestone,
  Exercise,
  Reward,
  UserRoadmapFilters,
  MBPayload,
  Project30Query,
  Project30,
  UserCohort,
  Lesson,
  Week,
  UserLesson,
  Playground,
  CourseFiltersData,
} from "./data";
import { fetchUser } from "./auth";
import {
  fetchCourse,
  fetchCourseQuizzes,
  fetchCourses,
  fetchCoursesFilters,
  fetchUserCourse,
  fetchUserCourses,
  handleCourseEnrollment,
  loadVideoNotes,
} from "./courses";
import { api, socketAPI } from "./api";

// Single source for the REST base URL used by the raw-fetch (streaming) actions.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v3";
import { analytics } from "./analytics";
import { getStoredUser, patchStoredUser } from "./user-store";

// In-flight/resolved cache for getPathItem, keyed by endpoint. Dedupes
// concurrent and repeat calls for the same step (video-step.tsx and
// path-context-panel.tsx both fetch the same endpoint independently).
const pathItemCache = new Map<string, Promise<any>>();

// Chat interview types
export interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: string;
  questionIndex: number;
  isQuestion?: boolean;
  artifactRef?: {
    type: "code" | "whiteboard";
    language?: string;
    svg?: string;
    code?: string;
  } | null;
  artifacts?: Array<{
    type: "code" | "whiteboard";
    language?: string;
    svg?: string;
    code?: string;
  }>;
}

export interface ChatArtifactRef {
  type: "code" | "whiteboard";
  data: string;
  language?: string;
  svg?: string;
}

// Kap tutor
export interface KapTutorMessage {
  role: "user" | "ai";
  content: string;
  ts?: string;
}
export interface KapInsights {
  keyTakeaways: string[];
  realWorldUse: string[];
}
export interface KapAskParams {
  scope: "video" | "project";
  videoId?: string;
  projectId?: string;
  taskId?: string;
  message: string;
}

export interface ChatInterviewTemplate {
  id: string;
  name: string | null;
  position: string | null;
  company: string | null;
  category: string | null;
  seniority: string | null;
  difficulty: string;
  duration: number;
  questions: number | null;
  topics: string[] | null;
  format: string | null;
  style: string | null;
  description: string | null;
}

export interface ChatInterviewSession {
  sessionId: string;
  sessionMode: string;
  interviewType: string | null;
  chatMessages: ChatMessage[];
  currentQuestionIndex: number;
  codeArtifact: string | null;
  codeLanguage: string | null;
  whiteboardArtifact: unknown;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  template: ChatInterviewTemplate;
}

const ROADMAP_RESOLVE_PAGE_SIZE = 200;
const roadmapSlugCache = new Map<string, string>();

// Chat-interview preview handoff: when an interview is created via "Start Now"
// we already hold its template, so we stash the preview here keyed by interview
// id. The chat room consumes it on mount to render the welcome screen instantly,
// skipping the GET /chat/:id/preview round-trip. One-shot (cleared on consume).
type ChatPreview = {
  template: ChatInterviewTemplate;
  sessionStatus: string | null;
};
const chatPreviewCache = new Map<string, ChatPreview>();

const isNumericIdentifier = (value: string) => /^\d+$/.test(value);

const resolveRoadmapSlug = async (identifier: string) => {
  if (!identifier || !isNumericIdentifier(identifier)) return identifier;

  const cached = roadmapSlugCache.get(identifier);
  if (cached) return cached;

  try {
    const { data } = await api.get(
      `/roadmaps?page=0&size=${ROADMAP_RESOLVE_PAGE_SIZE}`,
    );
    const roadmaps = data?.data?.roadmaps ?? data?.data ?? [];
    const match = roadmaps.find((roadmap: any) =>
      String(roadmap?.id) === identifier,
    );
    if (match?.slug) {
      roadmapSlugCache.set(identifier, match.slug);
      return match.slug;
    }
  } catch {
    // Fallback: keep original identifier when lookup fails.
  }

  return identifier;
};


interface AppState {
  // Data getters
  getUser: () => User | any;
  getPlan: (name: string) => any;
  getCourses: (queries?: CoursesQuery) => Course[] | any;
  getProject30s: (queries?: Project30Query) => Project30[] | any;
  getProject30: (slug: string) => Project30 | any;
  loadMyProject30s: (queries?: Project30Query) => Project30[] | any;
  getCourse: (slug: string, params?: any) => Course | any;
  getUserCourse: (slug: string) => UserCourse | any;
  getUserCourses: (queries?: CoursesQuery) => UserCourse[] | any;
  getVideoNotes: (courseId: string, videoId: string) => Note[] | any;
  getCourseQuizzes: (courseId: string) => Quiz[] | any;
  getCourseExercises: (courseId: string) => Quiz[] | any;
  getProjects: (queries?: Project30Query) => Project[] | any;
  getProject: (slug: string) => Project | any;
  getDeveloperPortfolio: (userId: string) => Promise<PortfolioResponse | null>;
  getPublicPortfolio: (userId: string) => Promise<PortfolioResponse | null>;
  verifyCertificate: (code: string) => Promise<CertificateVerification | null>;
  getPlans: () => any;
  getChallenges: () => Challenge[];
  getSavedPlaygrounds: () => Playground[] | any;
  getInterviews: () => Interview[];
  getMockInterviewTemplates: (params?: {
    size?: number;
    skip?: number;
    filters?: any;
  }) => any;
  getMockInterviewCategories: () => Promise<string[]>;
  getMockInterviewCompanies: () => Promise<string[]>;
  getUserBookedInterviews: (size?: number, skip?: number) => Promise<{ data: any[]; meta: { total: number; size: number; skip: number } }>;
  getUserCompletedInterviews: (size?: number, skip?: number) => Promise<{ data: any[]; meta: { total: number; size: number; skip: number } }>;
  getMyTemplates: () => any;
  deleteMyTemplate: (id: string) => Promise<void>;
  getMockInterviewTemplate: (id: string) => any;
  getInterviewAccess: () => any;
  getInterviewSession: (id: string) => any;
  createInterviewRoom: (sessionId: string, withAgent?: boolean) => any;
  getTransactions: (payload: { size?: number }) => any;
  getBootcamps: (filters: {
    skip?: number;
    size?: number;
    filters?: {
      type?: string;
      duration?: string;
      terms?: string;
      level?: string;
    };
  }) => Bootcamp[] | any;
  getBootcamp: (id: string) => Bootcamp | any;
  getBootcampBonuses: (id: string, cohort: string) => any;
  getAdminAssignments: (filters?: any) => Promise<any>;
  approveAssignment: (userLessonId: string) => Promise<any>;
  getCurrentWeekEvents: (id: string, weekId: string) => any;
  getLesson: (id: string, week: string, lesson: string) => Lesson | any;
  getWeek: (id: string, cohort: string, week: string) => Week | any;
  getBootcampLeaderboard: (
    bootcampId: string,
    cohortId: string,
  ) => Promise<any>;
  getLearningPaths: () => LearningPath[];
  getRoadmaps: (filters?: { skip?: number; size?: number }) => Roadmap[] | any;
  getUserRoadmaps: (data: UserRoadmapFilters) => any;
  getMyActivity: () => Promise<any>;
  getLeague: () => Promise<any>;
  getHallOfFame: () => Promise<any>;
  getQuiz: (id: string) => Quiz | any;
  getRoadmapBySlug: (slug: string) => any;
  getRoadmapMilestones: (slug: string) => any;
  getMilestone: (slug: string, topicId: string) => Milestone | any;
  getRoadmapItems: (slug: string, topicId: string) => any;
  getRoadmapCertificate: (slug: string) => Promise<any>;
  getExercise: (id: string) => Exercise | any;
  getSubmissionStatus: (exerciseId: string, submissionId: string) => Promise<any>;
  getRewards: () => Reward | any;
  getUserAchievement: (type?: string) => any;
  getBadges: () => any;
  getActivities: (queries: { size?: number; skip?: number }) => any;
  getVideo: (slug: string) => any;
  getProject30Achievements: (slug: string) => any;
  getProjectAchievements: (slug: string) => any;
  getMockInterviewSessionToken: (id: string) => any;
  getSessionReport: (sessionId: string) => any;
  getSessionTranscript: (sessionId: string) => any;
  endInterviewSession: (
    sessionId: string,
    transcripts?: Array<{
      speaker: "interviewer" | "candidate";
      text: string;
      timestamp: number;
    }>,
  ) => any;
  retryReportGeneration: (sessionId: string) => any;

  // Project Solutions/Submissions
  getProjectSubmissions: (params?: {
    status?: string;
    mine?: boolean;
    page?: number;
    pageSize?: number;
  }) => any;
  getSubmissionStats: (params?: { mine?: boolean }) => any;

  // Actions
  updateUser: (updates: Partial<User>) => any;
  getUploadUrl: (
    type: "avatar" | "resume",
  ) => Promise<{ signedUrl: string; publicUrl: string; key: string }>;
  startProject30: (slug: string, id?: string) => Project30 | any;
  deleteAccount: (email: string) => Promise<any>;
  changePassword: (updates: {
    oldPassword: string;
    newPassword: string;
  }) => void;
  cancelSubscription: (id: string) => any;
  markDayComplete: (slug: string, videoId: string, payload: any) => any;
  resumeSubscription: (id: string) => any;
  deletCard: (id: string) => any;
  deleteActivities: (ids: Array<string>) => any;
  puaseSubscription: (id: string, data: { months: number }) => any;
  redeemReward: (id: string) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  createCustomMockInterview: (interview: any) => any;
  startMockInterview: (
    id: string,
    data: { scheduledTime?: Date | string; interviewConfig?: any },
  ) => any;
  getBookmarks: (size?: number, skip?: number) => Promise<{ bookmarks: any[]; meta: { total: number } }>;
  createBookmark: (input: {
    type: "COURSE" | "ROADMAP" | "PROJECT" | "MOCK_INTERVIEW";
    bookmarkType: "BOOKMARK" | "WISHLIST";
    courseId?: string;
    roadmapId?: string;
    projectId?: string;
    mockInterviewTemplateId?: string;
  }) => Promise<{ id: string; mockInterviewTemplateId?: string | null; courseId?: string | null }>;
  deleteBookmark: (opts: { mockInterviewTemplateId?: string; courseId?: string; roadmapId?: string; projectId?: string }) => Promise<void>;
  scheduleInterviewFromTemplate: (
    id: string,
    data: { scheduledTime?: string; interviewConfig?: any },
  ) => any;
  scheduleInterviewFromJD: (data: {
    company: string;
    position: string;
    seniority: string;
    difficulty: string;
    format?: string;
    description: string;
    style: string;
    duration: number;
    scheduledTime: string;
    interviewConfig?: string;
  }) => any;
  analyzeJD: (jdText: string, duration: number, style: string) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
  analyzeJDFile: (file: File, duration: number, style: string) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
  handleProjectEnrollment: (slug: string) => Project | any;
  updateUserProject: (slug: string, payload: any) => Project | any;
  updateChallenge: (id: string, updates: Partial<Challenge>) => void;
  updateInterview: (id: string, updates: Partial<Interview>) => void;
  enrollInCourse: (courseId: string) => void;
  enrollInBootcamp: (bootcampId: string, cohortId: string) => UserCohort | any;
  savePlayground: (payload: any) => Playground | any;
  markLessonCompleted: (
    id: string,
    cohortId: string,
    weekId: string,
    lessonId: string,
    payload: any,
  ) => UserLesson | any;
  enrollInPath: (pathId: string) => void;
  enrollInRoadmap: (slug: string, isPreview?: boolean) => Promise<any>;
  handleMBPayment: (payload: MBPayload) => any;
  completeChallenge: (challengeId: string) => void;
  addXP: (amount: number) => void;
  handleCourseEnrollment: (courseId: string, isPreview?: boolean) => UserCourse | any;
  handleRoadmapCourseEnrollment: (
    slug: string,
    topicId: string,
    courseId: string,
  ) => UserCourse | any;
  startQuiz: (id: string) => any;
  submitQuiz: (id: string, questions: any) => any;
  saveNote: (note: string, courseId: string, videoId: string) => any;
  startMilestone: (slug: string, topicId: string, data: any) => any;
  markRoadmapItemCompleted: (
    slug: string,
    topicId: string,
    itemId: string,
    data: any,
  ) => any;

  markCourseCompleted: (id: string) => any;
  markProjectTaskAsCompleted: (slug: string, id: string) => any;
  gradeProjectTask: (
    slug: string,
    id: string,
    /** Terminal-mode tasks only — the learner's typed values for each
     * required input, in order (pre-filled from the task's terminalSpec,
     * editable). Omitted for apiSpec (REST-API) tasks. */
    stdin?: string[],
  ) => Promise<{
    passed: boolean;
    checks: Array<{ kind: string; passed: boolean; detail: string }>;
    statusCode: number | null;
    latencyMs: number;
    pointsAwarded: number;
    projectCompleted: boolean;
    error?: string;
  }>;
  markRoadmapVideoCompleted: (
    slug: string,
    topicId: string,
    payload: {
      type: string;
      itemId: string;
      isChapterCompleted?: boolean;
      courseId: string;
      chapter?: any;
    },
  ) => any;
  executeCode: (payload: { language: string; code: string; stdin?: string }) => any;
  createMockInterviewRoom: (userInterviewId: string) => any;
  ensurePathMockInterview: (templateId: string) => Promise<any>;
  initiateAsyncpayCheckout: (bootcampId: string, cohortId: string) => any;
  getCoursesFilters: () => Promise<CourseFiltersData>;

  // Return-Recap
  returnRecap: import("./data").RecapPayload | import("./data").WelcomeBackPayload | null;
  setReturnRecap: (r: import("./data").RecapPayload | import("./data").WelcomeBackPayload | null) => void;
  getJourneyRecap: (itemType: import("./data").RecapItemType, itemId: string) => Promise<import("./data").RecapPayload | null>;
  getWelcomeBack: () => Promise<import("./data").WelcomeBackPayload | null>;
  sendRecapFeedback: (eventId: string, useful: boolean) => Promise<void>;

  // Epic 5: Engagement features
  getStreak: () => Promise<StreakData>;
  getContinueLearning: () => Promise<ContinueLearningItem | null>;
  markActivityRead: (id: string) => Promise<void>;
  markAllActivitiesRead: () => Promise<void>;

  // Epic 6: Global Search
  search: (query: string) => Promise<SearchResults>;

  // Chat-based Mock Interview
  getChatInterviewPreview: (userInterviewId: string) => Promise<{ template: ChatInterviewTemplate; sessionStatus: string | null }>;
  /** Stash a just-created interview's preview so the chat room skips the fetch. */
  primeChatPreview: (id: string, preview: ChatPreview) => void;
  /** Read + clear a stashed preview (one-shot). Null if none was primed. */
  consumeChatPreview: (id: string) => ChatPreview | null;
  startChatInterview: (userInterviewId: string, interviewType?: string) => Promise<ChatInterviewSession>;
  getChatInterviewSession: (sessionId: string) => Promise<ChatInterviewSession>;
  streamChatMessage: (sessionId: string, content: string, artifacts?: ChatArtifactRef[]) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
  saveChatArtifact: (sessionId: string, type: "code" | "whiteboard", data: string, language?: string) => Promise<void>;
  streamKapTutor: (params: KapAskParams, signal?: AbortSignal) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
  getKapHistory: (scope: string, refId: string) => Promise<KapTutorMessage[]>;
  clearKapHistory: (scope: string, refId: string) => Promise<void>;
  getKapInsights: (videoId: string) => Promise<KapInsights>;
  endChatInterviewSession: (sessionId: string) => Promise<void>;
  getChatSessionReport: (sessionId: string) => Promise<any>;
  generateSessionReport: (sessionId: string) => Promise<any>;
  streamSessionReport: (sessionId: string) => Promise<ReadableStreamDefaultReader<Uint8Array>>;
  submitMessageFeedback: (sessionId: string, messageId: string, vote: "up" | "down", content: string) => Promise<void>;

  // Epic 7: Auto-progression
  autoProgressionEnabled: boolean;
  setAutoProgressionEnabled: (enabled: boolean) => void;
  getNextContent: (
    courseId: string,
    chapterId: string,
    videoId: string,
  ) => Promise<any>;

  // Force re-render trigger
  version: number;
  forceUpdate: () => void;

  // Level-up celebration modal
  levelUpModal: { oldLevel: number; newLevel: number } | null;
  setLevelUpModal: (data: { oldLevel: number; newLevel: number } | null) => void;

  // Sync user points/level from a mutation response without an extra API call
  syncUserSnapshot: (snapshot: { points: number; level: number; currentStreak?: number }) => void;

  // Path (Learning Path) actions
  getPathSession: (slug: string) => Promise<import("./path-types").PathSession>;
  getPathCertificate: (
    slug: string,
  ) => Promise<import("./path-types").PathCertificate>;
  getCourseCertificate: (
    slug: string,
  ) => Promise<import("./path-types").PathCertificate>;
  getProjectCertificate: (
    slug: string,
  ) => Promise<import("./path-types").PathCertificate>;
  // Project ↔ GitHub
  getProjectGithub: (
    slug: string,
  ) => Promise<{
    installed: boolean;
    connected: boolean;
    installUrl: string;
    repoFullName?: string;
    owner?: string;
    repo?: string;
  }>;
  connectProjectGithub: (
    slug: string,
    body: { mode: "auto" | "existing"; repoFullName?: string; isPrivate?: boolean },
  ) => Promise<{
    connected: true;
    repoFullName: string;
    owner: string;
    repo: string;
  }>;
  listGithubOwners: () => Promise<
    { login: string; type: "user" | "org"; avatarUrl?: string }[]
  >;
  listGithubRepos: (
    owner: string,
    q?: string,
  ) => Promise<
    { name: string; fullName: string; htmlUrl: string; private: boolean }[]
  >;
  createGithubRepo: (
    owner: string,
    name: string,
    isPrivate?: boolean,
  ) => Promise<{ name: string; fullName: string; htmlUrl: string; cloneUrl: string }>;
  connectProjectRepo: (
    slug: string,
    repository: string,
    owner: string,
  ) => Promise<{ fullName: string; htmlUrl: string }>;
  getPathItem: (endpoint: string) => Promise<any>;
  getArticleById: (id: string) => Promise<any>;
  createArticle: (payload: any) => Promise<any>;
  updateArticle: (id: string, payload: any) => Promise<any>;
  completePathStep: (
    slug: string,
    stepId: string,
    payload?: Record<string, any>,
  ) => Promise<import("./path-types").PathSessionDelta>;
  updatePathStepProgress: (
    slug: string,
    stepId: string,
    payload: { duration: number },
  ) => Promise<{ stepId: string; currentDuration?: number }>;

  // Course session actions (course watch reuses the path workspace, driven by
  // course data instead of a path session). Mirrors the path session methods.
  getCourseSession: (
    slug: string,
  ) => Promise<import("./path-types").PathSession>;
  completeCourseStep: (
    slug: string,
    stepId: string,
    payload?: Record<string, any>,
  ) => Promise<import("./path-types").PathSessionDelta>;
  updateCourseStepProgress: (
    slug: string,
    stepId: string,
    payload: { duration: number },
  ) => Promise<{ stepId: string; currentDuration?: number }>;
  takeExerciseHint: (
    exerciseId: string,
  ) => Promise<
    | { hint: string; points: number; charged: boolean; cost: number }
    | { error: "INSUFFICIENT"; shortfall: number }
  >;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Data getters - always return current data from JSON store
  getUser: async () => {
    const cached = getStoredUser();
    if (cached) return cached;

    const res = await fetchUser();
    updateUserInStore(res.data);
    analytics.identify(res.data.id, {
      email: res.data.email,
      name: res.data.name,
      isPremium: res.data.isPremium,
      country: res.data.country,
      role: res.data.role,
    });
    return res.data;
  },
  getSavedPlaygrounds: async () => {
    const { data } = await api.get(`/playgrounds/saved`);
    return data?.data;
  },

  getProject30Achievements: async (slug: string) => {
    const { data } = await api.get(`/project30s/${slug}/achievements`);
    return data?.data;
  },

  getProjectAchievements: async (slug: string) => {
    const { data } = await api.get(`/projects/${slug}/achievements`);
    return data?.data;
  },

  getProject30: async (slug: string) => {
    const { data } = await api.get(`/project30s/${slug}`);
    return data?.data;
  },
  getPlan: async (name: string) => {
    const key = `mb_plan_${name}`;
    const tsKey = `${key}_ts`;
    const TTL = 60 * 60 * 1000; // 1 hour

    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(key);
      const ts = Number(localStorage.getItem(tsKey) || 0);
      if (cached && Date.now() - ts < TTL) return JSON.parse(cached);
    }

    const { data } = await api.get(`/plans/${name}`);

    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(data?.data));
      localStorage.setItem(tsKey, String(Date.now()));
    }

    return data?.data;
  },
  getActivities: async (params: { size?: number; skip?: number }) => {
    const { data } = await api.get(`/activities`, {
      params,
    });
    return data?.data;
  },
  getRewards: async () => {
    const { data } = await api.get(`/rewards`);
    return data?.data;
  },
  getRoadmapItems: async (slug: string, topicId: string) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(
      `/roadmaps/${resolvedSlug}/topics/${topicId}/items`,
    );
    return data?.data;
  },

  getPlans: async () => {
    const { data } = await api.get(`/plans`);
    return data?.data;
  },

  loadMyProject30s: async (queries?: Project30Query) => {
    const { data } = await api.get(`/users/project30s`, {
      params: queries,
    });
    return data.data;
  },

  getCourses: async (queries?: CoursesQuery) => {
    try {
      const res = await fetchCourses(queries!);

      if (queries?.filters?.tab?.includes("popular")) {
        updatePopularCourses(res.data);
        return res.data;
      }
      updateCourses(res.data);
      return res.data;
    } catch (error) {
      throw error;
    }
  },
  getUserCourses: async (queries?: CoursesQuery) => {
    try {
      const res = await fetchUserCourses(queries!);
      updateUserCourses(res.data);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getUserCourse: async (courseId: string) => {
    try {
      const res = await fetchUserCourse(courseId);
      updateUserCourse(res.data);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getCourse: async (slug: string, params?: any) => {
    try {
      const res = await fetchCourse(slug, params);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  getProject30s: async (queries?: Project30Query) => {
    const { data } = await api.get(`/project30s`, {
      params: queries,
    });
    return data.data;
  },

  getTransactions: async (payload) => {
    let url = `/payments/transactions`;
    if (payload.size) url = `/payments/transactions?size=${payload.size}`;
    const { data } = await api.get(url);
    return data?.data;
  },

  getVideoNotes: async (courseId: string, videoId: string) => {
    const res = await loadVideoNotes(courseId, videoId);
    return res.data;
  },
  getCourseQuizzes: async (courseId: string): Promise<Quiz[] | any> => {
    const res = await fetchCourseQuizzes(courseId);
    return res.data;
  },
  getCourseExercises: async (courseId: string): Promise<Exercise[] | any> => {
    const { data } = await api.get(`/courses/${courseId}/exercises`);
    return data.data;
  },
  getQuiz: async (id: string): Promise<Quiz | any> => {
    const { data } = await api.get("/quizzes/" + id);
    return data?.data;
  },
  getExercise: async (id: string): Promise<Exercise | any> => {
    const { data } = await api.get("/exercises/" + id);
    return data?.data;
  },
  getSubmissionStatus: async (exerciseId: string, submissionId: string) => {
    const { data } = await api.get(`/exercises/${exerciseId}/submissions/${submissionId}`);
    return data?.data;
  },
  takeExerciseHint: async (exerciseId: string) => {
    try {
      const { data } = await api.post(`/exercises/${exerciseId}/hint`);
      return data?.data;
    } catch (e: any) {
      if (e?.response?.status === 402)
        return { error: "INSUFFICIENT", shortfall: e.response.data?.shortfall ?? 0 };
      throw e;
    }
  },
  getMilestone: async (slug: string, topicId: string) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(`/roadmaps/${resolvedSlug}/topics/${topicId}`);
    return data?.data;
  },
  getProjects: async (queries?: Project30Query) => {
    const { page, size, filters } = queries!;
    const { data } = await api.get(`/projects/`, {
      params: {
        skip: size,
        size: page,
        filters,
      },
    });
    return data?.data;
  },
  getProject: async (slug: string) => {
    const { data } = await api.get(`/projects/${slug}`);
    return data?.data;
  },

  getDeveloperPortfolio: async (userId: string) => {
    try {
      const { data } = await api.get(`/portfolio/${userId}`);
      return data?.data as PortfolioResponse;
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      return null;
    }
  },

  getPublicPortfolio: async (userId: string) => {
    try {
      const { data } = await api.get(`/portfolio/public/${userId}`);
      return (data?.data as PortfolioResponse) ?? null;
    } catch (error) {
      console.error("Failed to fetch public portfolio:", error);
      return null;
    }
  },

  verifyCertificate: async (code: string) => {
    try {
      const { data } = await api.get(`/certifications/verify/${code}`);
      return (data?.data as CertificateVerification) ?? null;
    } catch (error) {
      console.error("Failed to verify certificate:", error);
      return null;
    }
  },
  getChallenges: () => dataStore.challenges,
  getInterviews: () => dataStore.interviews,
  getBootcamps: async (filters?) => {
    const { data } = await api.get(`/bootcamps`, { params: filters });
    return data?.data;
  },

  getBootcampBonuses: async (id: string, cohort: string) => {
    const { data } = await api.get(
      `/bootcamps/${id}/cohorts/${cohort}/bonuses`,
    );
    return data?.data;
  },

  getAdminAssignments: async (filters?: { bootcampId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.bootcampId) {
      params.append("bootcampId", filters.bootcampId);
    }
    const { data } = await api.get(
      `/bootcamps/admin/assignments${params.toString() ? `?${params}` : ""}`,
    );
    return data?.data;
  },

  approveAssignment: async (userLessonId: string) => {
    const { data } = await api.patch(
      `/bootcamps/admin/assignments/${userLessonId}`,
    );
    return data?.data;
  },

  initiateAsyncpayCheckout: async (bootcampId: string, cohortId: string) => {
    const { data } = await api.post(
      `/bootcamps/${bootcampId}/cohorts/${cohortId}/asyncpay/initiate`,
    );
    return data?.data;
  },

  getCurrentWeekEvents: async (id: string, weekId: string) => {
    try {
      const url = `/bootcamps/${id}/weeks/${weekId}/events`;
      const { data } = await api.get(url);
      const events = data?.data || [];
      return events;
    } catch (error) {
      return [];
    }
  },

  async getMockInterviewSessionToken(id) {
    const { data } = await api.get(`/mock-interviews/sessions/${id}/token`);
    return data?.data;
  },

  getSessionReport: async (sessionId: string) => {
    const { data } = await api.get(
      `/mock-interviews/sessions/${sessionId}/report`,
    );
    return data?.data;
  },

  getSessionTranscript: async (sessionId: string) => {
    const { data } = await api.get(
      `/mock-interviews/sessions/${sessionId}/transcript`,
    );
    return data?.data;
  },

  endInterviewSession: async (
    sessionId: string,
    transcripts?: Array<{
      speaker: "interviewer" | "candidate";
      text: string;
      timestamp: number;
    }>,
  ) => {
    // If transcript provided, batch append it first
    if (transcripts && transcripts.length > 0) {
      await api.post(
        `/mock-interviews/sessions/${sessionId}/transcript/batch`,
        {
          entries: transcripts.map((t) => ({
            role: t.speaker,
            content: t.text,
            timestamp: new Date(t.timestamp).toISOString(),
          })),
        },
      );
    }
    // End the session room
    const { data } = await api.delete(
      `/mock-interviews/sessions/${sessionId}/room`,
    );
    return data?.data;
  },

  retryReportGeneration: async (sessionId: string) => {
    const { data } = await api.post(
      `/mock-interviews/sessions/${sessionId}/report/retry`,
    );
    return data?.data;
  },

  // Chat-based Mock Interview implementations
  getChatInterviewPreview: async (userInterviewId: string) => {
    const { data } = await api.get(
      `/mock-interviews/chat/${userInterviewId}/preview`,
    );
    return data?.data;
  },
  primeChatPreview: (id, preview) => {
    chatPreviewCache.set(id, preview);
  },
  consumeChatPreview: (id) => {
    const p = chatPreviewCache.get(id) ?? null;
    if (p) chatPreviewCache.delete(id);
    return p;
  },

  startChatInterview: async (userInterviewId: string, interviewType?: string) => {
    const { data } = await api.post(
      `/mock-interviews/chat/${userInterviewId}/start`,
      { interviewType },
    );
    return data?.data;
  },

  getChatInterviewSession: async (sessionId: string) => {
    const { data } = await api.get(
      `/mock-interviews/chat/sessions/${sessionId}`,
    );
    return data?.data;
  },

  streamChatMessage: async (
    sessionId: string,
    content: string,
    artifacts?: ChatArtifactRef[],
  ) => {
    const baseURL = API_BASE;
    const response = await fetch(
      `${baseURL}/mock-interviews/chat/sessions/${sessionId}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, artifacts: artifacts ?? [] }),
      },
    );
    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
  },

  streamKapTutor: async (params: KapAskParams, signal?: AbortSignal) => {
    const baseURL = API_BASE;
    const response = await fetch(`${baseURL}/kap-tutor/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(params),
      signal,
    });
    if (!response.ok) {
      let message = `Request failed: ${response.status}`;
      try {
        const j = await response.json();
        if (j?.message) message = j.message;
      } catch {}
      const err: any = new Error(message);
      err.status = response.status;
      throw err;
    }
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
  },

  getKapHistory: async (scope: string, refId: string) => {
    const baseURL = API_BASE;
    const res = await fetch(
      `${baseURL}/kap-tutor/history?scope=${scope}&refId=${refId}`,
      { credentials: "include" },
    );
    if (!res.ok) return [];
    const j = await res.json();
    return j?.data ?? [];
  },

  clearKapHistory: async (scope: string, refId: string) => {
    const baseURL = API_BASE;
    await fetch(
      `${baseURL}/kap-tutor/history?scope=${scope}&refId=${refId}`,
      { method: "DELETE", credentials: "include" },
    );
  },

  getKapInsights: async (videoId: string) => {
    const baseURL = API_BASE;
    const res = await fetch(`${baseURL}/kap-tutor/videos/${videoId}/insights`, {
      credentials: "include",
    });
    if (!res.ok) return { keyTakeaways: [], realWorldUse: [] };
    const j = await res.json();
    return j?.data ?? { keyTakeaways: [], realWorldUse: [] };
  },

  saveChatArtifact: async (
    sessionId: string,
    type: "code" | "whiteboard",
    data: string,
    language?: string,
  ) => {
    await api.post(`/mock-interviews/chat/sessions/${sessionId}/artifact`, {
      type,
      data,
      language,
    });
  },

  endChatInterviewSession: async (sessionId: string) => {
    await api.delete(`/mock-interviews/chat/sessions/${sessionId}`);
  },

  getChatSessionReport: async (sessionId: string) => {
    const { data } = await api.get(
      `/mock-interviews/chat/sessions/${sessionId}/report`,
    );
    return data?.data;
  },

  generateSessionReport: async (sessionId: string) => {
    const { data } = await api.post(
      `/mock-interviews/chat/sessions/${sessionId}/report`,
    );
    return data?.data;
  },

  submitMessageFeedback: async (sessionId: string, messageId: string, vote: "up" | "down", content: string) => {
    await api.post(`/mock-interviews/chat/sessions/${sessionId}/feedback`, {
      messageId, vote, content,
    });
  },

  streamSessionReport: async (sessionId: string) => {
    const baseURL = API_BASE;
    const response = await fetch(
      `${baseURL}/mock-interviews/chat/sessions/${sessionId}/report/stream`,
      { method: "GET", credentials: "include" },
    );
    if (!response.ok) throw new Error(`Stream request failed: ${response.status}`);
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
  },

  // Project Solutions/Submissions
  getProjectSubmissions: async (params?: {
    status?: string;
    mine?: boolean;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await api.get("/solutions", { params });
    return data?.data;
  },

  getSubmissionStats: async (params?: { mine?: boolean }) => {
    const { data } = await api.get("/solutions/stats", { params });
    return data?.data;
  },

  getBootcamp: async (id: string) => {
    const { data } = await api.get(`/bootcamps/${id}`);
    return data?.data;
  },
  getLesson: async (id: string, week: string, lesson: string) => {
    const { data } = await api.get(
      `/bootcamps/${id}/weeks/${week}/lessons/${lesson}`,
    );
    return data?.data;
  },

  getWeek: async (id: string, cohort: string, week: string) => {
    const { data } = await api.get(
      `/bootcamps/${id}/cohorts/${cohort}/weeks/${week}`,
    );
    return data?.data;
  },

  getBootcampLeaderboard: async (bootcampId: string, cohortId: string) => {
    const { data } = await api.get(
      `/bootcamps/${bootcampId}/cohorts/${cohortId}/leaderboard`,
    );
    return data?.data;
  },

  getLearningPaths: () => dataStore.learningPaths,
  getRoadmaps: async (filters?) => {
    const { data } = await api.get(
      `/roadmaps?page=${filters?.skip}&size=${filters?.size}`,
    );
    return data?.data;
  },
  getUserRoadmaps: async ({ filters, size, skip }: UserRoadmapFilters) => {
    const { data } = await api.get(
      `/users/roadmaps?skip=${skip}&size=${size}&filters=${filters}`,
    );
    return data?.data;
  },
  getMyActivity: async () => {
    const { data } = await api.get("/users/activity");
    return data?.data;
  },
  getLeague: async () => {
    const { data } = await api.get("/leaderboard");
    return data?.data;
  },
  getHallOfFame: async () => {
    const { data } = await api.get("/users/leaderboard");
    return data?.data;
  },
  getUserAchievement: async (type?: string) => {
    let url = `/users/achievements`;
    if (type) url = `/users/achievements?type=${type}`;
    const { data } = await api.get(url);
    return data?.data;
  },

  getVideo: async (slug: string) => {
    const { data } = await api.get(`/courses/videos/${slug}`);
    return data?.data;
  },

  getBadges: async () => {
    const { data } = await api.get("/rewards/badges");
    return data?.data;
  },

  getMockInterviewTemplates: async (params?: {
    size?: number;
    skip?: number;
    filters?: any;
  }) => {
    const { data } = await api.get("/mock-interviews", { params });
    return data?.data;
  },

  getMockInterviewCategories: async (): Promise<string[]> => {
    const { data } = await api.get("/mock-interviews/categories");
    return data?.data ?? [];
  },

  getMockInterviewCompanies: async (): Promise<string[]> => {
    const { data } = await api.get("/mock-interviews/companies");
    return data?.data ?? [];
  },

  getUserBookedInterviews: async (size = 12, skip = 0) => {
    const { data } = await api.get(`/mock-interviews/user/booked?size=${size}&skip=${skip}`);
    return { data: data?.data ?? [], meta: data?.meta ?? { total: 0, size, skip } };
  },

  getUserCompletedInterviews: async (size = 12, skip = 0) => {
    const { data } = await api.get(`/mock-interviews/user/completed?size=${size}&skip=${skip}`);
    return { data: data?.data ?? [], meta: data?.meta ?? { total: 0, size, skip } };
  },

  getMockInterviewTemplate: async (id: string) => {
    const { data } = await api.get(`/mock-interviews/${id}`);
    return data?.data;
  },


  getMyTemplates: async () => {
    const { data } = await api.get("/mock-interviews/my-templates");
    return data?.data;
  },

  deleteMyTemplate: async (id: string) => {
    await api.delete(`/mock-interviews/my-templates/${id}`);
  },

  getInterviewAccess: async () => {
    const { data } = await api.get("/mock-interviews/access");
    return data?.data;
  },

  getInterviewSession: async (id: string) => {
    const { data } = await api.get(`/mock-interviews/sessions/${id}`);
    return data?.data;
  },

  createInterviewRoom: async (sessionId: string, withAgent: boolean = true) => {
    const { data } = await api.post(
      `/mock-interviews/${sessionId}/room?agent=${withAgent}`,
    );
    return data?.data;
  },

  getRoadmapBySlug: async (slug: string) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get("/roadmaps/" + resolvedSlug);
    return data?.data;
  },

  getRoadmapCertificate: async (slug: string) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(`/roadmaps/${resolvedSlug}/certificate`);
    return data?.data;
  },

  getRoadmapMilestones: async (slug: string) => {
    const roadmap = await get().getRoadmapBySlug(slug);
    return roadmap ? roadmap.topics : [];
  },

  // Force re-render system
  version: 0,
  forceUpdate: () => set((state) => ({ version: state.version + 1 })),

  // Level-up celebration modal
  levelUpModal: null,
  setLevelUpModal: (data) => set({ levelUpModal: data }),

  // Sync user points/level from a mutation response — zero extra API calls
  syncUserSnapshot: (snapshot: { points: number; level: number; currentStreak?: number }) => {
    updateUserInStore({
      points: snapshot.points,
      level: snapshot.level,
      ...(snapshot.currentStreak !== undefined ? { currentStreak: snapshot.currentStreak } : {}),
    });
    set((state) => ({ version: state.version + 1 }));
  },

  // Actions
  startProject30: async (slug: string, id?: string) => {
    const startWithIdentifier = async (identifier: string) => {
      try {
        const { data } = await api.post(`/project30s/${identifier}/start`);
        return data?.data ?? data;
      } catch (error: any) {
        if (error?.response?.status !== 404) throw error;
        const { data } = await api.post(`/project30s/${identifier}`);
        return data?.data ?? data;
      }
    };

    try {
      return await startWithIdentifier(slug);
    } catch (error: any) {
      const status = error?.response?.status;
      const shouldTryId = id && id !== slug && (status === 404 || status === 500);
      if (!shouldTryId) throw error;
      return await startWithIdentifier(id);
    }
  },
  executeCode: async (payload: { language: string; code: string; stdin?: string }) => {
    const { data } = await api.post(`/playgrounds/execute`, payload);
    return data?.data ?? data;
  },
  handleProjectEnrollment: async (slug: string) => {
    const { data } = await api.post(`/projects/${slug}`);
    return data?.data;
  },
  updateUserProject: async (slug: string, payload: any) => {
    const { data } = await api.put(`/users/projects/${slug}`, payload);
    return data?.data;
  },
  startQuiz: async (id: string) => {
    const { data } = await api.post("/quizzes/" + id + "/start");
    return data?.data;
  },
  resumeSubscription: async (id: string) => {
    const { data } = await api.post(`/payments/subscriptions/${id}/resume`);
    return data?.data;
  },
  markProjectTaskAsCompleted: async (slug: string, id: string) => {
    const { data } = await api.post(`/projects/${slug}/tasks/${id}`);
    return data?.data;
  },
  gradeProjectTask: async (slug: string, id: string, stdin?: string[]) => {
    const { data } = await api.post(`/projects/${slug}/tasks/${id}/grade`, stdin ? { stdin } : {});
    return data?.data;
  },
  cancelSubscription: async (id: string) => {
    const { data } = await api.post(`/payments/subscriptions/${id}/cancel`);
    return data?.data;
  },
  puaseSubscription: async (id: string, payload: { months: number }) => {
    const url = `/payments/subscriptions/${id}/pause`;
    const { data } = await api.post(url, payload);
    return data?.data;
  },

  deletCard: async (id: string) => {
    const url = `/payments/subscriptions/${id}/cards`;
    const { data } = await api.delete(url);
    return data?.data;
  },

  deleteActivities: async (ids: Array<string>) => {
    const { data } = await api.delete("/activities", {
      params: { ids },
    });
    return data?.data;
  },

  redeemReward: async (id: string) => {
    const { data } = await api.post("/rewards/" + id);
    return data?.data;
  },

  startMockInterview: async (
    id: string,
    payload: { scheduledTime?: Date | string; interviewConfig?: any },
  ) => {
    const { data } = await api.post("/mock-interviews/" + id, payload);
    return data?.data;
  },

  createMockInterviewRoom: async (userInterviewId: string) => {
    const { data } = await api.post(
      "/mock-interviews/" + userInterviewId + "/room",
    );

    return data?.data;
  },

  // Idempotent ensure-or-create: returns the user's in-progress UserMockInterview
  // for this template (or creates one), with the template (incl. format) embedded.
  // Used by the path MOCK_INTERVIEW step. Path-granted templates skip the paywall.
  ensurePathMockInterview: async (templateId: string) => {
    const { data } = await api.post(
      `/mock-interviews/schedules/${templateId}`,
      {},
    );
    return data?.data; // { interview: {...template}, session }
  },

  getBookmarks: async (size = 12, skip = 0) => {
    const { data } = await api.get(`/bookmarks?size=${size}&skip=${skip}`);
    return { bookmarks: data?.data?.bookmarks ?? [], meta: data?.data?.meta ?? { total: 0 } };
  },

  createBookmark: async (input: {
    type: "COURSE" | "ROADMAP" | "PROJECT" | "MOCK_INTERVIEW";
    bookmarkType: "BOOKMARK" | "WISHLIST";
    courseId?: string;
    roadmapId?: string;
    projectId?: string;
    mockInterviewTemplateId?: string;
  }) => {
    const { data } = await api.post("/bookmarks", input);
    return data?.data;
  },

  deleteBookmark: async (opts: { mockInterviewTemplateId?: string; courseId?: string; roadmapId?: string; projectId?: string }) => {
    const params = new URLSearchParams();
    if (opts.mockInterviewTemplateId) params.set("mockInterviewTemplateId", opts.mockInterviewTemplateId);
    if (opts.courseId) params.set("courseId", opts.courseId);
    if (opts.roadmapId) params.set("roadmapId", opts.roadmapId);
    if (opts.projectId) params.set("projectId", opts.projectId);
    await api.delete(`/bookmarks?${params.toString()}`);
  },

  scheduleInterviewFromTemplate: async (
    id: string,
    payload: { scheduledTime?: string; interviewConfig?: any },
  ) => {
    const { data } = await api.post(
      `/mock-interviews/schedules/${id}`,
      payload,
    );
    return data?.data;
  },

  scheduleInterviewFromJD: async (payload: {
    company: string;
    position: string;
    seniority: string;
    difficulty: string;
    format?: string;
    description: string;
    style: string;
    duration: number;
    scheduledTime: string;
    interviewConfig?: string;
  }) => {
    const { data } = await api.post("/mock-interviews/schedules/jd", payload);
    return data?.data;
  },

  analyzeJD: async (jdText: string, duration: number, style: string) => {
    const baseURL = API_BASE;
    const response = await fetch(`${baseURL}/mock-interviews/analyze-jd`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jdText, duration, style }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `Request failed: ${response.status}`);
    }
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
  },

  analyzeJDFile: async (file: File, duration: number, style: string) => {
    const baseURL = API_BASE;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("duration", String(duration));
    formData.append("style", style);
    const response = await fetch(`${baseURL}/mock-interviews/analyze-jd/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(err.message || `Request failed: ${response.status}`);
    }
    if (!response.body) throw new Error("No response body");
    return response.body.getReader();
  },

  markDayComplete: async (slug: string, videoId: string, payload: any) => {
    const { data } = await api.post(
      `/project30s/${slug}/days/${videoId}`,
      payload,
    );
    return data?.data;
  },
  markRoadmapItemCompleted: async (
    slug: string,
    topicId: string,
    courseId: string,
    input: any,
  ) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/roadmaps/${resolvedSlug}/topics/${topicId}/courses/${courseId}/complete`,
      input,
    );
    return data?.data;
  },

  markRoadmapVideoCompleted: async (
    slug: string,
    topicId: string,
    payload: {
      type: string;
      itemId: string;
      isChapterCompleted?: boolean;
      chapter?: any;
    },
  ) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/roadmaps/${resolvedSlug}/topics/${topicId}/video`,
      payload,
    );
    const result = data?.data;
    if (result?.user) get().syncUserSnapshot(result.user);
    return result;
  },

  markCourseCompleted: async (userCourseId: string) => {
    const { data } = await api.post(`/courses/${userCourseId}/completed`);
    const result = data?.data;
    if (result?.user) get().syncUserSnapshot(result.user);
    return result;
  },

  createCustomMockInterview: async (interview: any) => {
    const { data } = await api.post(`/mock-interviews`, interview);
    return data?.data;
  },

  changePassword: async (updates) => {
    const { data } = await api.post(`/auth/password/change`, updates);
    return data?.data;
  },

  deleteAccount: async (email: string) => {
    // Epic 4: Delete account with email verification (works for OAuth & email/password users)
    const { data } = await api.post(`/users/delete-account`, {
      email,
      confirmDelete: true,
    });
    return data?.data;
  },

  getCoursesFilters: async (): Promise<CourseFiltersData> => {
    const res = await fetchCoursesFilters();
    return res.data as CourseFiltersData;
  },

  // Return-Recap
  returnRecap: null,
  setReturnRecap: (r) => set({ returnRecap: r }),
  getJourneyRecap: async (itemType, itemId) => {
    const { data } = await api.get(`/journey/recap`, { params: { itemType, itemId } });
    return data?.data ?? null;
  },
  getWelcomeBack: async () => {
    const { data } = await api.get(`/journey/welcome-back`);
    return data?.data ?? null;
  },
  sendRecapFeedback: async (eventId, useful) => {
    await api.post(`/journey/recap/${eventId}/feedback`, { useful });
  },

  // Epic 5: Engagement features
  getStreak: async () => {
    const { data } = await api.get(`/users/streak`);
    return data?.data;
  },

  getContinueLearning: async () => {
    const { data } = await api.get(`/users/continue-learning`);
    return data?.data ?? null;
  },

  markActivityRead: async (id: string) => {
    await api.patch(`/activities/${id}/read`);
  },

  markAllActivitiesRead: async () => {
    await api.patch(`/activities/read-all`);
  },

  search: async (query: string) => {
    const { data } = await api.get(`/search`, { params: { q: query } });
    return data?.data;
  },

  // Epic 7: Auto-progression
  autoProgressionEnabled: true, // Default enabled
  setAutoProgressionEnabled: (enabled: boolean) => {
    set({ autoProgressionEnabled: enabled });
  },
  getNextContent: async (
    courseId: string,
    chapterId: string,
    videoId: string,
  ) => {
    try {
      const { data } = await api.get(
        `/courses/${courseId}/chapters/${chapterId}/videos/${videoId}/next-content`,
      );
      return data?.data;
    } catch (error) {
      console.error("Failed to fetch next content:", error);
      return null;
    }
  },

  saveNote: async (note: string, courseId: string, videoId: string) => {
    const { data } = await api.post(
      `/courses/${courseId}/videos/${videoId}/notes`,
      { note: note },
    );
    return data?.data;
  },

  startMilestone: async (slug: string, topicId: string, payload: any = {}) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/roadmaps/${resolvedSlug}/topics/${topicId}`,
      payload,
    );
    return data?.data;
  },

  handleMBPayment: async (payload: MBPayload) => {
    const { data } = await api.post("/payments", payload);
    return data?.data;
  },

  submitQuiz: async (id: string, questions: any) => {
    const { data } = await api.post("/quizzes/" + id + "/submit", questions);
    const result = data?.data;
    if (result?.user) get().syncUserSnapshot(result.user);
    return result;
  },
  updateUser: async (updates) => {
    const { data } = await api.put(`/users`, {
      ...updates,
    });
    updateUserInStore(data?.data);
    get().forceUpdate();
    return data?.data;
  },

  getUploadUrl: async (type: "avatar" | "resume") => {
    const { data } = await api.get(`/users/upload-url?type=${type}`);
    return data?.data as { signedUrl: string; publicUrl: string; key: string };
  },

  savePlayground: async (payload: any) => {
    const { data } = await api.post("/playgrounds/save", payload);
    return data?.data;
  },

  updateCourse: (id, updates) => {
    updateCourseInStore(id, updates);
    get().forceUpdate();
  },

  handleCourseEnrollment: async (
    courseId: string,
    isPreview?: boolean,
  ): Promise<UserCourse | any> => {
    const res = await handleCourseEnrollment(courseId, isPreview);
    return res.data;
  },

  handleRoadmapCourseEnrollment: async (
    slug: string,
    topicId: string,
    courseId: string,
  ) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/roadmaps/${resolvedSlug}/topics/${topicId}/courses/${courseId}`,
    );

    return data?.data;
  },

  updateProject: (id, updates) => {
    updateProjectInStore(id, updates);
    get().forceUpdate();
  },

  updateChallenge: (id, updates) => {
    updateChallengeInStore(id, updates);
    get().forceUpdate();
  },

  updateInterview: (id, updates) => {
    const interview = dataStore.interviews.find((i) => i.id === id);
    if (interview) {
      Object.assign(interview, updates);
      get().forceUpdate();
    }
  },

  enrollInCourse: (courseId) => {
    const course = dataStore.coursesResponse.courses.find(
      (c) => c.id === courseId,
    );
    if (course) {
      course.enrolled = true;
      get().forceUpdate();
    }
  },

  enrollInBootcamp: async (bootcampId: string, cohortId: string) => {
    const { data } = await api.post(
      `/bootcamps/${bootcampId}/cohorts/${cohortId}`,
    );
    return data?.data;
  },

  markLessonCompleted: async (
    id: string,
    cohortId: string,
    weekId: string,
    lessonId: string,
    payload: any,
  ) => {
    const { data } = await api.post(
      `/bootcamps/${id}/cohorts/${cohortId}/weeks/${weekId}/lessons/${lessonId}`,
      payload,
    );
    return data?.data;
  },

  enrollInPath: (pathId) => {
    const path = dataStore.learningPaths.find((p) => p.id === pathId);
    if (path) {
      path.enrolled = true;
      get().forceUpdate();
    }
  },

  enrollInRoadmap: async (slug, isPreview?) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const response = await api.post(`/roadmaps/${resolvedSlug}`, { isPreview });
    const { data } = response;
    if (!data?.success) {
      throw new Error(data?.message || "Failed to enroll in roadmap");
    }
    const enrollData = Array.isArray(data?.data) ? data?.data[0] : data?.data;
    return enrollData;
  },

  completeChallenge: (challengeId) => {
    const challenge = dataStore.challenges.find((c) => c.id === challengeId);
    if (challenge && !challenge.completed) {
      challenge.completed = true;
      get().addXP(challenge.xpReward);
    }
  },

  addXP: (amount) => {
    const user = getStoredUser() ?? dataStore.user;
    const newXP = user.xp + amount;
    let newLevel = user.level;
    let newXPToNextLevel = user.xpToNextLevel;

    while (newXP >= newXPToNextLevel) {
      newLevel++;
      newXPToNextLevel += 1000;
    }

    patchStoredUser({ xp: newXP, level: newLevel, xpToNextLevel: newXPToNextLevel });
    Object.assign(dataStore.user, { xp: newXP, level: newLevel, xpToNextLevel: newXPToNextLevel });
  },

  getPathSession: async (slug) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(`/paths/${resolvedSlug}/session`);
    return data?.data;
  },

  getPathCertificate: async (slug: string) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.get(`/paths/${resolvedSlug}/certificate`);
    return data?.data;
  },

  // Course certificate — same PathCertificate shape, course endpoint (no roadmap
  // slug resolution; course slugs are used directly).
  getCourseCertificate: async (slug: string) => {
    const { data } = await api.get(`/courses/${slug}/certificate`);
    return data?.data;
  },

  // Project certificate — same PathCertificate shape, project endpoint. Used by
  // the standalone /projects/[slug]/tasks page (not the in-path project step).
  getProjectCertificate: async (slug: string) => {
    const { data } = await api.get(`/projects/${slug}/certificate`);
    return data?.data;
  },

  // Project ↔ GitHub
  getProjectGithub: async (slug: string) => {
    const { data } = await api.get(`/projects/${slug}/github`);
    return data?.data;
  },
  // One-click connect (auto-provision) or link an existing repo. On a 409 the
  // axios error is rethrown so the caller can read response.data.{installUrl,
  // authUrl,message} to drive the install / re-authorize redirect.
  connectProjectGithub: async (
    slug: string,
    body: { mode: "auto" | "existing"; repoFullName?: string; isPrivate?: boolean },
  ) => {
    const { data } = await api.post(`/projects/${slug}/github`, body);
    return data?.data;
  },
  listGithubOwners: async () => {
    // Backend proxies the executor and returns the owners array as `data`
    // directly (no `.owners` envelope), so unwrap `data.data`.
    const { data } = await api.get(`/github/owners`);
    return data?.data ?? [];
  },
  listGithubRepos: async (owner: string, q = "") => {
    // Same bare-array shape as owners — `data.data` is the repos array.
    const { data } = await api.get(`/github/repos`, { params: { owner, q } });
    return data?.data ?? [];
  },
  createGithubRepo: async (owner: string, name: string, isPrivate = false) => {
    const { data } = await api.post(`/github/repos`, { owner, name, isPrivate });
    return data?.data?.repo;
  },
  connectProjectRepo: async (slug: string, repository: string, owner: string) => {
    const { data } = await api.post(`/projects/${slug}/github`, {
      repository,
      owner,
    });
    return data?.data?.repo;
  },

  getPathItem: async (endpoint: string) => {
    const cached = pathItemCache.get(endpoint);
    if (cached) return cached;
    const promise = (async () => {
      const path = endpoint.replace(/^\/api\/v3/, "");
      const { data } = await api.get(path);
      return data?.data;
    })();
    pathItemCache.set(endpoint, promise);
    promise.catch(() => pathItemCache.delete(endpoint));
    return promise;
  },

  getArticleById: async (id: string) => {
    const { data } = await api.get(`/courses/articles/${id}`);
    return data?.data;
  },

  createArticle: async (payload: any) => {
    const { data } = await api.post(`/courses/articles`, payload);
    return data?.data;
  },

  updateArticle: async (id: string, payload: any) => {
    const { data } = await api.put(`/courses/articles/${id}`, payload);
    return data?.data;
  },

  completePathStep: async (slug, stepId, payload = {}) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.post(
      `/paths/${resolvedSlug}/steps/${encodeURIComponent(stepId)}/complete`,
      payload,
    );
    return data?.data;
  },

  updatePathStepProgress: async (slug, stepId, payload) => {
    const resolvedSlug = await resolveRoadmapSlug(slug);
    const { data } = await api.patch(
      `/paths/${resolvedSlug}/steps/${encodeURIComponent(stepId)}/progress`,
      payload,
    );
    return data?.data;
  },

  // Course session — mirrors the path session methods but hits the course
  // endpoints. Course slugs are used directly (no roadmap slug resolution).
  getCourseSession: async (slug) => {
    const { data } = await api.get(`/courses/${slug}/session`);
    return data?.data;
  },

  completeCourseStep: async (slug, stepId, payload = {}) => {
    const { data } = await api.post(
      `/courses/${slug}/steps/${encodeURIComponent(stepId)}/complete`,
      payload,
    );
    return data?.data;
  },

  updateCourseStepProgress: async (slug, stepId, payload) => {
    const { data } = await api.post(
      `/courses/${slug}/steps/${encodeURIComponent(stepId)}/progress`,
      payload,
    );
    return data?.data;
  },
}));
