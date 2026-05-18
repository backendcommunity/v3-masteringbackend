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
import { analytics } from "./analytics";
import { getStoredUser, patchStoredUser } from "./user-store";

const ROADMAP_RESOLVE_PAGE_SIZE = 200;
const roadmapSlugCache = new Map<string, string>();

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
  getProjectLeaderboard: (projectSlug: string, filters?: any) => any;
  getGlobalProjectLeaderboard: (params?: {
    size?: number;
    skip?: number;
  }) => any;
  getDeveloperPortfolio: (userId: string) => Promise<PortfolioResponse | null>;
  getPlans: () => any;
  getChallenges: () => Challenge[];
  getSavedPlaygrounds: () => Playground[] | any;
  getInterviews: () => Interview[];
  getMockInterviewTemplates: (params?: {
    size?: number;
    skip?: number;
    filters?: any;
  }) => any;
  getUserBookedInterviews: () => any;
  getUserCompletedInterviews: () => any;
  getMockInterviewTemplate: (id: string) => any;
  getUserInterviewStats: () => any;
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
  getQuiz: (id: string) => Quiz | any;
  getRoadmapBySlug: (slug: string) => any;
  getRoadmapMilestones: (slug: string) => any;
  getMilestone: (slug: string, topicId: string) => Milestone | any;
  getRoadmapItems: (slug: string, topicId: string) => any;
  getRoadmapCertificate: (slug: string) => Promise<any>;
  getExercise: (id: string) => Exercise | any;
  getRewards: () => Reward | any;
  getUserAchievement: (type?: string) => any;
  getBadges: () => any;
  getActivities: (queries: { size?: number; skip?: number }) => any;
  getVideo: (slug: string) => any;
  getProject30Leaderboard: (slug: string, filter?: any) => any;
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
  getProjectsLeaderboard: (params?: {
    timeframe?: string;
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
  scheduleInterviewFromTemplate: (
    id: string,
    data: { scheduledTime?: string; interviewConfig?: any },
  ) => any;
  scheduleInterviewFromJD: (data: {
    company: string;
    position: string;
    seniority: string;
    difficulty: string;
    format: string;
    description: string;
    style: string;
    duration: number;
    scheduledTime: string;
    interviewConfig?: string;
  }) => any;
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
  executeCode: (payload: { language: string; code: string }) => any;
  createMockInterviewRoom: (userInterviewId: string) => any;
  initiateAsyncpayCheckout: (bootcampId: string, cohortId: string) => any;
  getCoursesFilters: () => Promise<CourseFiltersData>;

  // Epic 5: Engagement features
  getStreak: () => Promise<StreakData>;
  getContinueLearning: () => Promise<ContinueLearningItem | null>;
  markActivityRead: (id: string) => Promise<void>;
  markAllActivitiesRead: () => Promise<void>;

  // Epic 6: Global Search
  search: (query: string) => Promise<SearchResults>;

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
  getProject30Leaderboard: async (slug: string, filters?: any) => {
    const { data } = await api.get(
      `/project30s/${slug}/leaderboard?filters=${JSON.stringify(filters)}`,
    );
    return data?.data;
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

  getProjectLeaderboard: async (slug: string, filters?: any) => {
    const { data } = await api.get(`/projects/${slug}/leaderboard`, {
      params: {
        filters,
      },
    });
    return data?.data;
  },

  getGlobalProjectLeaderboard: async (params?: {
    size?: number;
    skip?: number;
  }) => {
    // Using dummy data in component - API will be added later
    return { leaderboard: [] };
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

  getProjectsLeaderboard: async (params?: {
    timeframe?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { data } = await api.get("/projects/leaderboard", { params });
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

  getUserBookedInterviews: async () => {
    const { data } = await api.get("/mock-interviews/user/booked");
    return data?.data;
  },

  getUserCompletedInterviews: async () => {
    const { data } = await api.get("/mock-interviews/user/completed");
    return data?.data;
  },

  getMockInterviewTemplate: async (id: string) => {
    const { data } = await api.get(`/mock-interviews/${id}`);
    return data?.data;
  },

  getUserInterviewStats: async () => {
    const { data } = await api.get("/mock-interviews/user/stats");
    return data?.data;
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
  executeCode: async (payload: { language: string; code: string }) => {
    const { data } = await socketAPI.post(`/projects/execute`, payload);
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
    format: string;
    description: string;
    style: string;
    duration: number;
    scheduledTime: string;
    interviewConfig?: string;
  }) => {
    const { data } = await api.post("/mock-interviews/schedules/jd", payload);
    return data?.data;
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
}));
