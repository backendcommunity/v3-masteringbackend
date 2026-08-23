export const routes = {
  // Main dashboard
  dashboard: "/",
  home: "/dashboard",
  profile: "/profile",
  settings: "/settings",
  activity: "/activity",
  leaderboard: "/leaderboard",
  hallOfFame: "/leaderboard/hall-of-fame",

  // Courses
  courses: "/courses",
  courseDetail: (slug: string) => `/courses/${slug}`,
  coursePreview: (courseId: string) => `/courses/${courseId}/preview`,
  courseWatch: (
    courseSlug: string,
    chapterSlug: string,
    videoSlug?: string,
  ) => {
    if (videoSlug)
      return `/courses/${courseSlug}/watch/${chapterSlug}/${videoSlug}`;

    return `/courses/${courseSlug}/watch/${chapterSlug}`;
  },
  courseQuizzes: (courseId: string) => `/courses/${courseId}/quizzes`,
  courseQuiz: (courseId: string, quizId: string) =>
    `/courses/${courseId}/quizzes/${quizId}`,
  courseExercises: (courseId: string) => `/courses/${courseId}/exercises`,
  courseExercise: (courseId: string, exerciseId: string) =>
    `/courses/${courseId}/exercises/${exerciseId}`,
  coursePlaygrounds: (courseId: string) => `/courses/${courseId}/playgrounds`,
  coursePlayground: (courseId: string, playgroundId: string) =>
    `/courses/${courseId}/playgrounds/${playgroundId}`,
  courseProjects: (courseId: string) => `/courses/${courseId}/projects`,
  courseProject: (courseId: string, projectId: string) =>
    `/courses/${courseId}/projects/${projectId}`,
  courseCertificate: (courseId: string) => `/courses/${courseId}/certificate`,

  // Learning Paths
  paths: "/paths",
  pathDetail: (pathId: string) => `/paths/${pathId}`,
  // Workspace (unified player) — stepId is the compiled "topicId:TYPE:itemId"
  pathWorkspace: (pathId: string, stepId?: string) =>
    stepId
      ? `/paths/${pathId}/learn/${encodeURIComponent(stepId)}`
      : `/paths/${pathId}/learn`,

  // Bootcamps
  bootcamps: "/bootcamps",
  bootcampDetail: (bootcampId: string) => `/bootcamps/${bootcampId}`,
  bootcampCertificate: (bootcampId: string) =>
    `/bootcamps/${bootcampId}/certificate`,
  bootcampDashboard: (bootcampId: string) =>
    `/bootcamps/${bootcampId}/dashboard`,
  bootcampLeaderboard: (bootcampId: string, cohortId: string) =>
    `/bootcamps/${bootcampId}/leaderboard?cohortId=${cohortId}`,
  bootcampWeek: (bootcampId: string, cohort: string, weekId: string) =>
    `/bootcamps/${bootcampId}/${cohort}/weeks/${weekId}`,
  bootcampWatch: (
    bootcampId: string,
    cohort: string,
    weekId: string,
    slug: string,
  ) => `/bootcamps/${bootcampId}/${cohort}/weeks/${weekId}/${slug}`,

  // Project30
  project30: "/project30",
  project30Detail: (slug: string) => `/project30/${slug}`,
  project30Day: (courseId: string, dayNumber: string) =>
    `/project30/${courseId}/day/${dayNumber}`,
  project30Community: (courseId: string) => `/project30/${courseId}/community`,

  // Projects
  projects: "/projects",
  projectDetail: (slug: string) => `/projects/${slug}`,
  projectPlayground: (slug: string) => `/projects/${slug}/playground`,

  // MB Lands
  lands: "/lands",
  landDetail: (landId: string) => `/lands/${landId}`,
  stageDetail: (landId: string, stageId: string) =>
    `/lands/${landId}/stages/${stageId}`,
  challengeDetail: (landId: string, stageId: string, challengeId: string) =>
    `/lands/${landId}/stages/${stageId}/challenges/${challengeId}`,

  // Interviews
  interviews: "/interviews",
  interviewDetail: (interviewId: string) => `/interviews/${interviewId}`,
  interviewProject: (interviewId: string) =>
    `/interviews/${interviewId}/project`,
  interviewAlgorithm: (interviewId: string) =>
    `/interviews/${interviewId}/algorithm`,
  interviewResults: (interviewId: string) =>
    `/interviews/${interviewId}/results`,

  // Mock Interviews
  mockInterviews: "/mock-interviews",
  mockInterviewDetail: (id: string) => `/mock-interviews/${id}`,
  mockInterviewBooking: (id: string) => `/mock-interviews/?id=${id}`,
  mockInterviewResults: (id: string) => `/mock-interviews/${id}/results`,

  // Portfolio
  portfolio: (userId: string) => `/portfolios/${userId}`,

  // Certifications
  verifyCertificate: (code: string) => `/certifications/verify/${code}`,

  // Onboarding
  onboarding: "/onboarding",

  // Community
  community: "/community",

  // Team accounts
  team: "/team",
  teamOverview: "/team/overview",
  teamMembers: "/team/members",
  teamGroups: "/team/groups",
  teamLeaderboard: "/team/leaderboard",
  teamSettings: "/team/settings",
  teamSetup: "/team/setup",
  teamJoin: (token: string) => `/team/join/${token}`,

  // Subscription & Billing
  subscriptionPlans: "/subscription/plans",
  subscriptionManagement: "/subscription/management",
  billing: "/billing",
  checkout: (type: string, planId: string, cycle: string) =>
    `/checkout?type=${type}&plan=${planId}&cycle=${cycle}`,
  pricing: (redirect?: string) =>
    redirect ? `/pricing?redirect=${encodeURIComponent(redirect)}` : "/pricing",

  // Levels
  levels: "/levels",

  // MB Store & Redemption
  xpStore: "/xp-store",
  xpRedeem: (category: string, itemId: string) =>
    `/xp-store/redeem?category=${category}&item=${itemId}`,
  xpHistory: "/xp-store/history",

  // Auth
  logout: "/auth/login",
};

// Helper function to check if a path matches a route pattern
export const matchesRoute = (
  currentPath: string,
  routePattern: string,
): boolean => {
  if (currentPath === routePattern) return true;

  // Handle dynamic routes
  const currentSegments = currentPath.split("/").filter(Boolean);
  const patternSegments = routePattern.split("/").filter(Boolean);

  if (currentSegments.length !== patternSegments.length) return false;

  return patternSegments.every((segment, index) => {
    if (segment.startsWith(":")) return true; // Dynamic segment
    return segment === currentSegments[index];
  });
};

// Helper function to extract parameters from a route
export const extractRouteParams = (
  currentPath: string,
  routePattern: string,
): Record<string, string> => {
  const currentSegments = currentPath.split("/").filter(Boolean);
  const patternSegments = routePattern.split("/").filter(Boolean);
  const params: Record<string, string> = {};

  patternSegments.forEach((segment, index) => {
    if (segment.startsWith(":")) {
      const paramName = segment.slice(1);
      params[paramName] = currentSegments[index];
    }
  });

  return params;
};
