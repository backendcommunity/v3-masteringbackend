import { api } from "./api";
import { fetchUser } from "./auth";
import { setStoredUser, getStoredUser } from "./user-store";

export interface UserRoadmapFilters {
  skip?: number;
  size?: number;
  filters?: any;
}

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  isPreview: boolean;
  isCompleted: boolean;
  currentTopicId?: string;
  roadmap?: any;
  currentUserTopicId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  signedUpThrough?: string;
  xpToNextLevel: number;
  streak: number;
  title?: string;
  badges: Badge[];
  isPremium: boolean;
  subscription?: Subscription;
  points: number;
  numberOfCoursesCompleted?: number;
  numberOfCoursesInProgress?: number;
  numberOfProjectsBuilt?: number;
  numberOfProjectsBuiltThisMonth?: number;
  numberOfCertificateEarned?: number;
  bio?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  address?: string;
  country?: string;
  settings: any;
  phone?: string;
  createdAt?: Date | string;
  lastMonthCompletedCourses?: number;
  lastMonthCourses?: number;
  averageCourseTime?: string;
  githubInstallationId?: string;
  // Onboarding fields
  hasFinishedOnboarding?: boolean;
  experienceLevel?: string | null;
  learningGoal?: string | null;
  weeklyCommitment?: string | null;
  preferredLanguage?: ProgrammingLanguage | null;
  // Epic 5: Streak System
  currentStreak?: number;
  longestStreak?: number;
  // Epic 5: Notifications
  totalNotifications?: number;
  // Profile enhancements
  username?: string;
  openToWork?: boolean;
  twitter?: string;
  resume?: string;
  // Access control
  role?: "USER" | "ADMIN" | "INSTRUCTOR";
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  mb: number;
  category?: string;
  icon?: string;
  active?: boolean;
  popular?: boolean;
  enrolled?: boolean;
  userReward?: any;
  createdAt?: Date | string;
}

// Epic 5: Activity/Notification types
export interface Activity {
  id: string;
  title?: string;
  description?: string;
  type?: string;
  mb?: number;
  isRead: boolean;
  isNotification: boolean;
  createdAt: Date | string;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
  isStreakActiveToday: boolean;
}

export interface ContinueLearningItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  banner?: string | null;
  progress: number;
  currentTopicId: string | null;
}

// Epic 6: Global Search types
export interface SearchResultCourse {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  banner?: string;
  level?: string;
  isPremium?: boolean;
  isEnrolled: boolean;
  isCompleted: boolean;
}

export interface SearchResultRoadmap {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  banner?: string;
}

export interface SearchResultProject {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  level?: string;
}

export interface SearchResultBootcamp {
  id: string;
  title: string;
  summary?: string;
}

export interface SearchResults {
  courses: SearchResultCourse[];
  roadmaps: SearchResultRoadmap[];
  projects: SearchResultProject[];
  bootcamps: SearchResultBootcamp[];
  total: number;
}

// Epic 6: Portfolio API Response
export interface PortfolioResponse {
  user: {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    level: number;
    levelName: string;
    points: number;
    streak: number;
    title: string;
    location: string;
    longestStreak: number;
    joinedAt: string;
    socialLinks: {
      github?: string;
      linkedin?: string;
      website?: string;
    };
  };
  stats: {
    totalProjects: number;
    totalPoints: number;
    coursesCompleted: number;
    certificates: number;
    globalRank: number;
    totalUsers: number;
  };
  projects: Array<{
    id: string;
    title: string;
    level?: string;
    summary: string;
    technologies: string[];
    isCompleted: boolean;
    slug: string;
  }>;
  activity: {
    days: Array<{
      date: string;
      count: number;
      xp: number;
      types?: Array<{ label: string; count: number }>;
    }>;
    currentStreak: number;
    longestStreak: number;
    activeDaysCount: number;
    totalActivities: number;
    monthlyXp: number;
  };
  mockInterviews: {
    totalInterviews: number;
    averageScore: number;
    topicBreakdown: Array<{
      topic: string;
      score: number;
    }>;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon?: string;
    completed: boolean;
    progress: number;
    earnedAt?: string;
  }>;
  certificates: Array<{
    id: string;
    code: string;
    courseName: string;
    finalScore: number;
    date: string;
  }>;
  roadmaps: Array<{
    id: string;
    name: string;
    progress: number;
  }>;
  quizExerciseSummary: {
    quizzesPassed: number;
    quizzesTotal: number;
    quizAvgScore: number;
    exercisesCompleted: number;
    exercisesTotal: number;
    exerciseAvgScore: number;
  };
  bootcamps: Array<{
    id: string;
    name: string;
    status: string;
    completionPercent: number;
  }>;
  skills: Array<any>;
}

// Certificate verification response from GET /certifications/verify/:code
export interface CertificateVerification {
  valid: boolean;
  certificate?: {
    code: string;
    holderName: string;
    courseName: string;
    finalScore: number;
    issuedAt: string;
  };
}

export interface Subscription {
  id: string;
  name: string;
  planId?: string;
  userId?: string;
  subscriptionPlanId?: string;
  teamId?: string;
  user?: User;
  paymentChannelId?: string;
  subscriptionId?: string;
  expiry?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  switchToBasicDate?: Date | string;
  paymentChannel?: PaymentChannel;
  plan?: Plan;
}

export interface Level {
  id: number;
  name: string;
  point: number;
  icon?: string;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  paymentChannels?: PaymentChannel[];
  monthlyPrice?: number;
  annualPrice?: number;
  features?: Array<any>;
  popular?: boolean;
  cta?: string;
  disabled?: boolean;
}

export interface PaymentChannel {
  id: string;
  channel: PaymentChannelType;
  planId: string;
  originalMonthlyPrice: number;
  discountedMonthlyPrice: number;
  discountMonthlyDate?: Date | string;
  originalYearlyPrice: number;
  discountedYearlyPrice: number;
  discountYearlyDate?: Date | string;
  monthlyPlanId?: string;
  yearlyPlanId?: string;
  plan: Plan;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export enum PaymentChannelType {
  PAYSTACK,
  STRIPE,
  PADDLE,
}

export interface Note {
  id: string;
  content: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  video?: Video;
}
export interface CoursesQuery {
  page?: string;
  size?: string;
  skip?: string;
  filters?: CourseFilterOptions;
}

export interface Project30Query {
  page?: string | number;
  size?: string | number;
  filters?: Project30FilterOptions;
}

export interface Project30FilterOptions {
  desc?: boolean;
  duration?: number;
  free?: boolean;
  fromAmount?: number;
  fromDate?: string;
  paid?: boolean;
  sortBy?: string;
  terms?: string;
  toAmount?: number;
  toDate?: string;
  topicIds?: string;
  topics?: Array<string>;
  category?: string;
  level?: string;
  tab?: string;
}

export interface Project30 {
  id: string;
  title: string;
  description: string;
  slug: string;
  instructor: any;
  duration: string;
  totalContents: number;
  totalDuration?: string;
  level: string;
  category: any;
  students: number;
  amount: number;
  banner: string;
  technologies?: Array<string>;
  isEnrolled: boolean;
  isPremium: boolean;
  progress: number;
  totalDays?: number;
  lastAccessed?: string;
  highlights?: Array<string>;
  userProject30: UserProject30;
  rank: number;
  totalParticipants?: number;
  totalParticipantsToday?: number;
  totalProjectSubmitted?: number;
  totalMB: number;
  completionRate: number;
  courses: any[];
}

export interface UserProject30 {
  id: string;
  userId: string;
  offerId: string;
  currentTopic: string;
  isPreview: boolean;
  isCompleted: boolean;
  offer?: Project30;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  userChapters: UserChapter[];
  userCourses: UserCourse[];
  currentDay: number;
  streak: number;
  rank: number;
  endDate: Date | string;
  nextDeadline: Date | string;
  progress?: number;
  totalLessonsCompleted?: number;
  performers: any[];
  currentWeek?: string;
  nextWeek?: string;
  nextLesson?: string;
  userOfferItems: any[];
}

export interface CourseFilterOptions {
  desc?: boolean;
  duration?: number;
  free?: boolean;
  fromAmount?: number;
  fromDate?: string;
  paid?: boolean;
  sortBy?: string;
  terms?: string;
  toAmount?: number;
  toDate?: string;
  topicIds?: string;
  topics?: Array<string>;
  category?: string;
  level?: string;
  tab?: string;
  tag?: string;
}

export interface CourseFiltersData {
  categories: Array<{ id: string; name: string }>;
  tags: string[];
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  subscribe: boolean;
  signedUpThrough: "MASTERINGBACKEND" | "GOOGLE" | "GITHUB";
  source?: string;
}

export interface StarterKitItem {
  id: string;
  title: string;
  summary: string;
  banner: string;
  slug: string;
  level?: string;
  tags?: string[];
  skills?: string[];
  students: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string; //"Beginner" | "Intermediate" | "Advanced";
  progress: number;
  isCompleted?: boolean;
  chapters: Chapter[];
  enrolled: boolean;
  rating: number;
  students: number;
  price: number;
  tags: string[];
  longDescription?: string;
  summary: string;
  category: Category;
  slug: string;
  type: string;
  topics?: Topic[];
  amount: number;
  isPremium: boolean;
  banner: string;
  preview: string;
  totalDuration: number;
  isWaiting: boolean;
  waitingLink: string;
  hasQuizzes: boolean;
  hasPlaygrounds: boolean;
  hasProjects: boolean;
  hasExercises: boolean;
  paddlePlanCode: number;
  totalContent: number;
  isEnrolled: boolean;
  userCourse?: UserCourse;
  totalStudents: number;
  totalProjects: number;
  totalQuizzes: number;
  totalPlaygrounds: number;
  totalTasks: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserCourse {
  id: string;
  course?: Course;
  currentChapter?: Chapter;
  currentVideo?: Video;
  // currentArticle: Article
  isCompleted: boolean;
  progress?: number;
  user?: User;
  isPreview?: boolean;
  userVideos?: UserVideo[];
  // userArticles: UserArticle[]
  userChapters?: UserChapter[];
  createdAt: Date | string;
  updatedAt: Date | string;
  completedAt?: Date | string | null;
  enrollmentType?: "SUBSCRIPTION" | "ONETIME" | "COINS";
}

export interface MBPayload {
  type: string;
  mb: Number;
  id: string;
}

export interface UserVideo {
  id?: string;
  userId?: string;
  chapterId?: string;
  videoId?: string;
  isCompleted: Boolean;
  chapter?: Chapter;
  currentDuration?: number;
  video?: Video;
}

export interface UserCoursesResponse {
  userCourses: UserCourse[];
  meta: Meta;
}
export interface CoursesResponse {
  courses: Course[];
  meta: Meta;
}

export interface PopularCoursesResponse {
  courses: Course[];
  meta: Meta;
}

export interface Meta {
  total: number;
  netTotal: number;
}
export interface Topic {
  id: string;
  title: string;
  summary?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  summary: string;
  duration: string;
  isCompleted?: boolean;
  isPremium: boolean;
  slug: string;
  quiz?: Quiz;
  videos: Video[];
  quizzes?: Quiz[];
  exercise?: Exercise;
  playground?: Playground;
  type: "video" | "quiz" | "exercise" | "playground" | "mixed";
  order: number;
}

export interface UserChapter {
  id?: string;
  isCompleted: boolean;
  user?: User;
  chapter?: Chapter;
  chapterId: string;
}

export interface Video {
  id: string;
  title: string;
  duration: string;
  isCompleted?: boolean;
  slug: string;
  banner?: string;
  chapter: any;
  videoUrl?: string;
  chapterId?: string;
  description: string;
  summary: string;
  order: number;
  type?: string;
  quizId?: string;
  exerciseId?: string;
  quiz?: Quiz;
  exercise?: Exercise;
  resources?: Resource[];
  quizCourse?: {
    quiz: Quiz;
    required: boolean;
  };
  video: Number;
  mb: number;
  instructor?: any;
  technologies?: Array<string>;
  difficulty?: string;
  isPremium: boolean;
  playground: Playground;
}

export interface Resource {
  id: string;
  content?: string;
  summary?: string;
  title: string;
  link?: string;
  type: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number;
  passingScore: number;
  attempts: number;
  maxAttempts: number;
  completed: boolean;
  score?: number;
  enrolled?: boolean;
  userQuiz?: any;
  required?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "fill-blank";
  options?: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  language: string;
  languages?: string[];            // allowed language codes; empty/undefined = all
  graderType?: "OUTPUT_MATCH" | "TEST_CASES" | "CUSTOM";
  starterCode: string;
  solution: string;
  testCases: TestCase[];
  hints: string[];
  hint?: string;
  points?: number;
  passMark?: number;
  completed: boolean;
  attempts: number;
  instructions?: string;
  hintCost?: number;
  hintTaken?: boolean;
  userSubmission?: {
    code: string;
    language: string;
    status: "PASSED" | "FAILED" | "ERROR";
    score: number;
    bestScore: number;
    passed: boolean;
  };
}

export interface CaseResult {
  name: string;
  passed: boolean;
  timedOut: boolean;
  gotPreview?: string;
}

export interface SubmissionResult {
  submissionId: string;
  status: "PASSED" | "FAILED" | "ERROR";
  score: number;
  passedCount: number;
  totalCount: number;
  caseResults: CaseResult[];
  stderr?: string;
  timeMs?: number;
  error?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  expected?: string;
  description: string;
}

export interface Playground {
  id: string;
  title?: string;
  description?: string;
  language: string;
  files?: PlaygroundFile[];
  dependencies?: string[];
  completed?: boolean;
  code: string;
  isReadyOnly?: boolean;
  shouldShowInput?: boolean;
}

export interface PlaygroundFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  template?: string;
  baseRepository?: string;         // optional git repo the worker clones as the project baseline
  languages?: string[];            // project language codes; languages[0] seeds the starter
  playgroundConfig?: { terminalJail?: boolean } & Record<string, unknown>; // per-project playground settings; terminalJail defaults true (only false disables the worker jail)
  summary: string;
  difficulty: "Easy" | "Medium" | "Hard";
  level: string;
  userProject: any;
  enrolled: boolean;
  timeframe: string;
  totalTasks: number;
  isPremium: boolean;
  prerequisites: Array<string>;
  skills: Array<string>;
  instructor: any;
  PRDLink: string;
  frontendURL: string;
  duration: string;
  students: number;
  technologies: string[];
  status: "Not Started" | "In Progress" | "Completed" | "Submitted";
  progress: number;
  dueDate?: string;
  projectTasks: any;
  banner: string;
  cloned?: boolean;
  requirements: string[];
  resources: Resource[];
  updatedAt?: string;              // last-modified timestamp; used to version the showcase bundle
}

export interface Resource {
  id: string;
  title: string;
  type: string; // "documentation" | "video" | "article" | "code";
  url: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  completed: boolean;
  timeLimit?: string;
  participants: number;
}

export interface Interview {
  id: string;
  title: string;
  type: "System Design" | "Coding" | "Behavioral" | "Technical";
  difficulty: "Easy" | "Medium" | "Hard";
  duration: string;
  score?: number;
  status: "Available" | "In Progress" | "Completed";
  description: string;
  questions: Question[];
}

export interface Question {
  id: string;
  question: string;
  type: "multiple-choice" | "coding" | "essay";
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedDate: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
}

export interface Bootcamp {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  price: number;
  startDate: string;
  enrolled: boolean;
  spots: number;
  spotsLeft: number;
  instructor: string;
  rating: number;
  students: number;
  userCohort: any;
  cohort: Cohort;
  cohorts: Cohort[];
}

export interface Cohort {
  id: string;
  name: string;
  duration: number;
  amount: number;
  maxStudent: number;
  bootcampId: string;
  bootcamp: Bootcamp;
  startsAt: Date;
  endsAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  studyGroupLink?: string;
  userCohorts: UserCohort[];
}

export interface UserCohort {
  id: string;
  userId: string;
  cohortId: number;
  cohort: Cohort;
  completed: Boolean;
  score: number;
  currentWeekId: string;
  projectBuilt: number;
  totalAssigments: number;
  totalLessonsCompleted: number;
  currentLessonId: string;
  endedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userLessons: UserLesson[];
}

export interface Week {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
  bootcampId: string;
  bootcamp: Bootcamp;
  cohort?: Cohort;
  prevWeek?: { id: string; title: string; lessons?: Lesson[] };
  nextWeek?: { id: string; title: string; lessons?: Lesson[] };
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  summary: string;
  description: string;
  itemId: string;
  type: any;
  quizId: string;
  projectId: string;
  videoId: string;
  weekId: string;
  mb: number;
  week: Week;
  video: Video;
  quiz: Quiz;
  project: Project;
  exercise?: any;
  createdAt: Date;
  updatedAt: Date;
  userLessons: UserLesson[];
}

export interface UserLesson {
  id: string;
  userId?: string;
  cohortId?: string;
  lessonId: string;
  weekId: string;
  lesson?: Lesson;
  userCohortId?: string;
  userCohort?: UserCohort;
  completed: Boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningPath {
  id: string;
  slug?: string;
  title: string;
  description: string;
  courses: string[];
  projects: string[];
  topics?: any[];
  estimatedTime: string;
  level: string;
  progress: number;
  enrolled: boolean;
  isCompleted?: boolean;
}

export interface Roadmap {
  id: string;
  title: string;
  slug?: string;
  summary?: string;
  description: string;
  milestones: Milestone[];
  timeframe: string;
  difficulty: string;
  currentMilestone: number;
  progress: number;
  enrolled: boolean;
  completedMilestones: number;
  estimatedTime: string;
  longDescription?: string;
  thumbnail?: string;
  userRoadmap?: any;
  topics?: Milestone[] | any[];
  instructor?: string;
  level?: string;
  skills?: string[];
  prerequisites?: string[];
  started?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  courses: string[];
  projects?: string[];
  level?: string;
  order: number;
  userTopic?: any;
  completed: boolean;
  progress: number;
  duration: string;
  enrolled?: boolean;
}

export interface RoadmapCourse extends Course {
  milestoneId: string;
  order: number;
  requiredForProgress: boolean;
}

export interface RoadmapProject extends Project {
  milestoneId: string;
  order: number;
  requiredForProgress: boolean;
}

export interface RoadmapAssessment {
  id: string;
  title: string;
  description: string;
  type: "quiz" | "project" | "interview";
  duration: string;
  milestoneId: string;
  order: number;
  completed: boolean;
  questions?: QuizQuestion[];
  project?: Project;
  interview?: Interview;
}

// Level perks — what each level unlocks
export const LEVEL_PERKS: Record<number, { perks: string[]; icon: string }> = {
  1: {
    icon: "⭐",
    perks: [
      "Access to all free courses",
      "Basic progress tracking",
      "Public developer profile",
      "MB points system",
    ],
  },
  2: {
    icon: "🔧",
    perks: [
      "Roadmap tracking unlocked",
      "Weekly progress digest email",
      "MB leaderboard visibility",
      "Streak tracking",
    ],
  },
  3: {
    icon: "⚡",
    perks: [
      "Coding exercises unlocked",
      "Beginner project library access",
      "Logic Blacksmith profile badge",
      "Achievement system",
    ],
  },
  4: {
    icon: "🔐",
    perks: [
      "Unlimited quiz retries",
      "Intermediate project library",
      "Auth Alchemist badge",
      "Priority course search ranking",
    ],
  },
  5: {
    icon: "🗄️",
    perks: [
      "Mock interview scheduling",
      "Advanced course library",
      "Database Cartographer badge",
      "Portfolio showcase",
    ],
  },
  6: {
    icon: "🧙",
    perks: [
      "Early access to new courses",
      "Bootcamp priority registration",
      "Service Sorcerer badge",
      "10% MB bonus on all actions",
    ],
  },
  7: {
    icon: "🏗️",
    perks: [
      "Architect badge on portfolio",
      "Exclusive expert webinars",
      "Mentor match eligibility",
      "Custom roadmap creation",
    ],
  },
  8: {
    icon: "⚔️",
    perks: [
      "Performance analytics dashboard",
      "Full premium content library",
      "Performance Paladin badge",
      "Beta feature early access",
    ],
  },
  9: {
    icon: "🚀",
    perks: [
      "DevOps Enchanter badge",
      "Dedicated support channel",
      "Custom profile theme",
      "Exclusive community channels",
    ],
  },
  10: {
    icon: "👑",
    perks: [
      "Backend Overlord badge",
      "Hall of Fame listing",
      "Lifetime achievement certificate",
      "All platform perks unlocked",
    ],
  },
};

// JSON Data Store - All data stored as simple JavaScript objects
export const dataStore = {
  levels: [
    { id: 1, name: "Code Squire", point: 500 },
    { id: 2, name: "API Tinkerer", point: 1500 },
    { id: 3, name: "Logic Blacksmith", point: 3500 },
    { id: 4, name: "Auth Alchemist", point: 7000 },
    { id: 5, name: "Database Cartographer", point: 12000 },
    { id: 6, name: "Service Sorcerer", point: 20000 },
    { id: 7, name: "Architect", point: 32000 },
    { id: 8, name: "Performance Paladin", point: 50000 },
    { id: 9, name: "DevOps Enchanter", point: 62000 },
    { id: 10, name: "Backend Overlord", point: 75000 },
  ] as Level[],

  user: {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "/placeholder.svg?height=40&width=40",
    xp: 2450,
    points: 2450,
    bio: "",
    level: 0,
    numberOfCoursesCompleted: 90,
    numberOfCoursesInProgress: 100,
    numberOfProjectsBuiltThisMonth: 0,
    numberOfProjectsBuilt: 0,
    numberOfCertificateEarned: 0,
    xpToNextLevel: 3200,
    streak: 7,
    linkedin: "",
    github: "",
    website: "",
    address: "",
    phone: "",
    createdAt: "2024-01-15",
    title: "Backend Engineer",
    badges: [
      {
        id: "1",
        name: "API Master",
        description: "Completed 10 API projects",
        icon: "🏆",
        earnedDate: "2024-06-01",
        rarity: "Epic" as const,
      },
      {
        id: "2",
        name: "Course Crusher",
        description: "Finished 5 courses this month",
        icon: "📚",
        earnedDate: "2024-06-05",
        rarity: "Rare" as const,
      },
      {
        id: "3",
        name: "Community Helper",
        description: "Helped 25 fellow engineers",
        icon: "🤝",
        earnedDate: "2024-06-10",
        rarity: "Common" as const,
      },
    ],
  },

  notes: [],
  userCourse: {},
  coursesResponse: {
    courses: [] as Course[],
    meta: { total: 0, netTotal: 0 } as Meta,
  },

  userCoursesResponse: {
    userCourses: [] as UserCourse[],
    meta: { total: 0, netTotal: 0 } as Meta,
  },

  popularCoursesResponse: {
    courses: [] as Course[],
    meta: { total: 0, netTotal: 0 } as Meta,
  },

  projects: [
    {
      id: "1",
      title: "E-commerce API",
      description:
        "Build a complete e-commerce REST API with authentication, product management, and order processing.",
      difficulty: "Medium" as const,
      estimatedTime: "2-3 weeks",
      technologies: ["Node.js", "Express", "MongoDB", "JWT"],
      status: "In Progress" as const,
      progress: 60,
      dueDate: "2024-06-15",
      thumbnail: "/placeholder.svg?height=200&width=300",
      requirements: [
        "User authentication and authorization",
        "Product CRUD operations",
        "Shopping cart functionality",
        "Order management system",
        "Payment integration",
      ],
      resources: [
        {
          id: "1",
          title: "Express.js Documentation",
          type: "documentation" as const,
          url: "https://expressjs.com",
        },
        {
          id: "2",
          title: "MongoDB Tutorial",
          type: "video" as const,
          url: "/tutorial-mongodb",
        },
      ],
    },
    {
      id: "2",
      title: "Real-time Chat Application",
      description:
        "Create a scalable real-time chat application using WebSockets and modern backend technologies.",
      difficulty: "Hard" as const,
      estimatedTime: "3-4 weeks",
      technologies: ["Node.js", "Socket.io", "Redis", "PostgreSQL"],
      status: "Not Started" as const,
      progress: 0,
      dueDate: "2024-06-15",
      thumbnail: "/placeholder.svg?height=200&width=300",
      requirements: [
        "Real-time messaging",
        "User presence indicators",
        "Message history",
        "File sharing",
        "Group chat functionality",
      ],
      resources: [],
    },
    {
      id: "3",
      title: "Microservices Demo Platform",
      description:
        "Build a demonstration platform showcasing microservices architecture with multiple services.",
      difficulty: "Hard" as const,
      estimatedTime: "4-6 weeks",
      technologies: [
        "Node.js",
        "Docker",
        "Kubernetes",
        "API Gateway",
        "Message Queue",
      ],
      status: "Not Started" as const,
      progress: 0,
      dueDate: "2024-07-30",
      thumbnail: "/placeholder.svg?height=200&width=300",
      requirements: [
        "Multiple independent services",
        "Service discovery",
        "API gateway implementation",
        "Inter-service communication",
        "Containerization and orchestration",
        "Monitoring and logging",
      ],
      resources: [
        {
          id: "1",
          title: "Docker Documentation",
          type: "documentation" as const,
          url: "https://docs.docker.com",
        },
        {
          id: "2",
          title: "Kubernetes Basics",
          type: "documentation" as const,
          url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        },
      ],
    },
    {
      id: "4",
      title: "Distributed Database System",
      description:
        "Design and implement a distributed database system with sharding and replication.",
      difficulty: "Hard" as const,
      estimatedTime: "5-7 weeks",
      technologies: ["Go", "Raft Consensus", "gRPC", "Distributed Systems"],
      status: "Not Started" as const,
      progress: 0,
      dueDate: "2024-08-15",
      thumbnail: "/placeholder.svg?height=200&width=300",
      requirements: [
        "Data sharding strategy",
        "Replication for fault tolerance",
        "Consensus algorithm implementation",
        "Distributed transaction support",
        "Recovery mechanisms",
        "Performance benchmarking",
      ],
      resources: [
        {
          id: "1",
          title: "Raft Consensus Algorithm",
          type: "documentation" as const,
          url: "https://raft.github.io/",
        },
        {
          id: "2",
          title: "Distributed Systems Principles",
          type: "article" as const,
          url: "/articles/distributed-systems",
        },
      ],
    },
  ],

  plans: [
    {
      id: "free",
      name: "Free",
      description: "Basic access to get started",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { name: "Access to free courses", included: true },
        { name: "Limited project access", included: true },
        { name: "Limited land access", included: true },
        { name: "Limited interview access", included: true },
        { name: "Community forum access", included: true },
        { name: "Basic learning paths", included: true },
        { name: "Premium courses", included: false },
        { name: "Bootcamps", included: false },
        { name: "Interview preparation", included: false },
        { name: "Certification exams", included: false },
        { name: "1-on-1 mentorship", included: false },
        { name: "Career services", included: false },
      ],
      popular: false,
      cta: "Current Plan",
      disabled: true,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Everything you need to accelerate your career",
      features: [
        { name: "Access to free courses", included: true },
        { name: "Unlimited project access", included: true },
        { name: "Community forum access", included: true },
        { name: "All learning paths", included: true },
        { name: "Premium courses", included: true },
        { name: "Unlimited land access", included: true },
        { name: "Interview preparation", included: true },
        { name: "Bootcamps", included: false },
        { name: "Certification exams", included: false },
        { name: "1-on-1 mentorship", included: false },
        { name: "Career services", included: false },
      ],
      popular: true,
      cta: "Choose Pro",
      disabled: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Advanced features for teams and businesses",
      features: [
        { name: "Access to free courses", included: true },
        { name: "Unlimited project access", included: true },
        { name: "Community forum access", included: true },
        { name: "All learning paths", included: true },
        { name: "Additional 5 team members ($10 each)", included: true },
        { name: "Unlimited land access", included: true },
        { name: "Premium courses", included: true },
        { name: "Bootcamps", included: true },
        { name: "Interview preparation", included: true },
        { name: "Certification exams", included: true },
        { name: "1-on-1 mentorship", included: true },
        { name: "Career services", included: true },
      ],
      popular: false,
      cta: "Choose Enterprise",
      disabled: false,
    },
  ] as Plan[],

  challenges: [
    {
      id: "1",
      title: "Database Optimization Challenge",
      description:
        "Optimize slow database queries and improve performance by 50%",
      xpReward: 250,
      difficulty: "Hard" as const,
      category: "Database",
      completed: false,
      timeLimit: "2 hours",
      participants: 156,
    },
    {
      id: "2",
      title: "API Rate Limiting",
      description: "Implement efficient rate limiting for a high-traffic API",
      xpReward: 150,
      difficulty: "Medium" as const,
      category: "API Design",
      completed: true,
      timeLimit: "1 hour",
      participants: 234,
    },
  ],

  interviews: [
    {
      id: "1",
      title: "System Design Interview",
      type: "System Design" as const,
      difficulty: "Hard" as const,
      duration: "45 minutes",
      status: "Available" as const,
      description: "Design a scalable URL shortening service like bit.ly",
      questions: [
        {
          id: "1",
          question:
            "How would you design the database schema for a URL shortening service?",
          type: "essay" as const,
          points: 25,
        },
        {
          id: "2",
          question: "What caching strategy would you implement?",
          type: "essay" as const,
          points: 25,
        },
      ],
    },
    {
      id: "2",
      title: "Algorithm Challenge",
      type: "Coding" as const,
      difficulty: "Medium" as const,
      duration: "30 minutes",
      score: 85,
      status: "Completed" as const,
      description:
        "Solve algorithmic problems commonly asked in backend interviews",
      questions: [
        {
          id: "1",
          question: "Implement a LRU Cache",
          type: "coding" as const,
          points: 50,
        },
      ],
    },
  ],

  bootcamps: [
    {
      id: "1",
      title: "Full-Stack Backend Bootcamp",
      description:
        "Intensive 12-week program covering Node.js, databases, APIs, and deployment",
      duration: "12 weeks",
      level: "Intermediate" as const,
      price: 2999,
      startDate: "2024-07-01",
      enrolled: false,
      spots: 25,
      spotsLeft: 8,
      instructor: "Sarah Johnson",
      rating: 4.9,
      students: 156,
    },
    {
      id: "2",
      title: "Microservices Mastery Bootcamp",
      description:
        "Advanced 8-week bootcamp on microservices architecture and cloud deployment",
      duration: "8 weeks",
      level: "Advanced" as const,
      price: 3499,
      startDate: "2024-08-15",
      enrolled: true,
      spots: 20,
      spotsLeft: 3,
      instructor: "Michael Chen",
      rating: 4.8,
      students: 89,
    },
  ],

  learningPaths: [
    {
      id: "1",
      title: "Backend Engineer Career Path",
      description: "Complete journey from beginner to senior backend engineer",
      courses: ["1", "2", "3"],
      projects: ["1", "2"],
      estimatedTime: "6 months",
      level: "Beginner to Advanced",
      progress: 45,
      enrolled: true,
    },
    {
      id: "2",
      title: "DevOps Integration Path",
      description:
        "Learn to integrate DevOps practices with backend development",
      courses: ["2", "4"],
      projects: ["3"],
      estimatedTime: "4 months",
      level: "Intermediate",
      progress: 0,
      enrolled: false,
    },
    {
      id: "3",
      title: "Microservices Architecture Path",
      description: "Master microservices design patterns and implementation",
      courses: ["2", "5"],
      projects: ["2", "4"],
      estimatedTime: "5 months",
      level: "Advanced",
      progress: 20,
      enrolled: true,
    },
    {
      id: "4",
      title: "API Design & Development Path",
      description: "Become an expert in REST, GraphQL, and API best practices",
      courses: ["1", "6"],
      projects: ["1", "5"],
      estimatedTime: "3 months",
      level: "Intermediate",
      progress: 0,
      enrolled: false,
    },
    {
      id: "5",
      title: "Database Mastery Path",
      description: "Deep dive into SQL, NoSQL, and database optimization",
      courses: ["3", "7"],
      projects: ["6"],
      estimatedTime: "4 months",
      level: "Intermediate to Advanced",
      progress: 0,
      enrolled: false,
    },
    {
      id: "6",
      title: "Cloud Backend Engineer Path",
      description:
        "Learn cloud-native backend development with AWS, Azure, and GCP",
      courses: ["8", "9"],
      projects: ["7", "8"],
      estimatedTime: "6 months",
      level: "Advanced",
      progress: 0,
      enrolled: false,
    },
  ],

  roadmaps: [
    {
      id: "1",
      title: "Backend Engineer Career Roadmap",
      description:
        "Step-by-step roadmap to advance your backend engineering career",
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Sarah Johnson",
      level: "Beginner to Advanced",
      progress: 40,
      enrolled: true,
      started: true,
      timeframe: "12-18 months",
      difficulty: "Progressive",
      currentMilestone: 2,
      completedMilestones: 1,
      estimatedTime: "8-10 months remaining",
      skills: [
        "Node.js",
        "Express",
        "Databases",
        "API Design",
        "System Architecture",
        "Microservices",
        "DevOps",
        "Cloud Platforms",
      ],
      prerequisites: [
        "Basic JavaScript knowledge",
        "Understanding of web technologies",
        "Problem-solving skills",
      ],
      longDescription: `This comprehensive roadmap guides you through the journey from a beginner to a senior backend engineer. It's designed to build your skills progressively, focusing on both theoretical knowledge and practical implementation.

You'll start with the fundamentals of backend development, including server-side programming, databases, and API design. As you progress, you'll tackle more advanced topics like system design, microservices architecture, and distributed systems.

The roadmap includes hands-on projects that simulate real-world scenarios, allowing you to apply what you've learned and build a portfolio of work. You'll also prepare for technical interviews and learn how to communicate complex technical concepts effectively.

By following this roadmap, you'll develop the skills and confidence needed to excel in backend engineering roles at top companies.`,
      milestones: [
        {
          id: "m1",
          title: "Backend Fundamentals",
          description: "Master core backend technologies and concepts",
          courses: ["1"],
          projects: ["1"],
          assessments: ["a1"],
          order: 1,
          completed: true,
          progress: 100,
          duration: "2-3 months",
        },
        {
          id: "m2",
          title: "Production Applications",
          description: "Build and deploy real-world applications",
          courses: ["2"],
          projects: ["2"],
          assessments: ["a2"],
          order: 2,
          completed: false,
          progress: 65,
          duration: "3-4 months",
        },
        {
          id: "m3",
          title: "System Design",
          description: "Learn to design scalable systems",
          courses: ["4"],
          projects: ["3"],
          assessments: ["a3"],
          order: 3,
          completed: false,
          progress: 0,
          duration: "4-6 months",
        },
        {
          id: "m4",
          title: "Advanced Technologies",
          description: "Explore cutting-edge backend technologies",
          courses: ["5"],
          projects: ["4"],
          assessments: ["a4"],
          order: 4,
          completed: false,
          progress: 0,
          duration: "3-4 months",
        },
        {
          id: "m5",
          title: "Leadership Skills",
          description: "Develop technical leadership abilities",
          courses: [],
          projects: [],
          assessments: ["a5"],
          order: 5,
          completed: false,
          progress: 0,
          duration: "6+ months",
        },
      ],
    },
    {
      id: "2",
      title: "Backend to Full-Stack Engineer",
      description: "Expand your skills to become a full-stack developer",
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Michael Chen",
      level: "Intermediate",
      progress: 0,
      enrolled: false,
      timeframe: "8-12 months",
      difficulty: "Intermediate",
      currentMilestone: 0,
      completedMilestones: 0,
      estimatedTime: "8-12 months",
      milestones: [
        {
          id: "m1",
          title: "Master backend fundamentals",
          description: "Ensure solid backend engineering foundation",
          courses: ["1", "3"],
          projects: [],
          assessments: [],
          order: 1,
          completed: false,
          progress: 0,
          duration: "2-3 months",
        },
        {
          id: "m2",
          title: "Learn frontend frameworks",
          description: "Master modern frontend technologies",
          courses: [],
          projects: [],
          assessments: [],
          order: 2,
          completed: false,
          progress: 0,
          duration: "2-3 months",
        },
        {
          id: "m3",
          title: "Build full-stack applications",
          description: "Create end-to-end applications",
          courses: [],
          projects: [],
          assessments: [],
          order: 3,
          completed: false,
          progress: 0,
          duration: "2-3 months",
        },
        {
          id: "m4",
          title: "Deploy to production",
          description: "Learn CI/CD and deployment strategies",
          courses: [],
          projects: [],
          assessments: [],
          order: 4,
          completed: false,
          progress: 0,
          duration: "1-2 months",
        },
        {
          id: "m5",
          title: "Land full-stack role",
          description: "Prepare for interviews and job search",
          courses: [],
          projects: [],
          assessments: [],
          order: 5,
          completed: false,
          progress: 0,
          duration: "1-2 months",
        },
      ],
    },
    {
      id: "3",
      title: "Backend Engineer to Tech Lead",
      description:
        "Transition from individual contributor to technical leadership",
      thumbnail: "/placeholder.svg?height=200&width=300",
      instructor: "Emily Rodriguez",
      level: "Advanced",
      progress: 20,
      enrolled: true,
      timeframe: "18-24 months",
      difficulty: "Advanced",
      currentMilestone: 1,
      completedMilestones: 0,
      estimatedTime: "18-24 months",
      milestones: [
        {
          id: "m1",
          title: "Master advanced backend concepts",
          description: "Deepen technical expertise",
          courses: ["4", "5"],
          projects: [],
          assessments: [],
          order: 1,
          completed: false,
          progress: 40,
          duration: "4-6 months",
        },
        {
          id: "m2",
          title: "Lead technical projects",
          description: "Learn project management and leadership",
          courses: [],
          projects: [],
          assessments: [],
          order: 2,
          completed: false,
          progress: 0,
          duration: "4-6 months",
        },
        {
          id: "m3",
          title: "Mentor junior developers",
          description: "Develop coaching and mentoring skills",
          courses: [],
          projects: [],
          assessments: [],
          order: 3,
          completed: false,
          progress: 0,
          duration: "3-4 months",
        },
        {
          id: "m4",
          title: "Design system architecture",
          description: "Lead system design and architecture decisions",
          courses: [],
          projects: [],
          assessments: [],
          order: 4,
          completed: false,
          progress: 0,
          duration: "4-6 months",
        },
        {
          id: "m5",
          title: "Secure tech lead position",
          description: "Interview preparation and career advancement",
          courses: [],
          projects: [],
          assessments: [],
          order: 5,
          completed: false,
          progress: 0,
          duration: "2-3 months",
        },
      ],
    },
  ],

  roadmapAssessments: [
    {
      id: "a1",
      title: "Backend Fundamentals Assessment",
      description:
        "Comprehensive assessment of backend development fundamentals",
      type: "quiz",
      duration: "45 minutes",
      milestoneId: "m1",
      order: 1,
      completed: true,
      questions: [
        {
          id: "qa1",
          question: "Which of the following is NOT a core Node.js module?",
          type: "multiple-choice",
          options: ["fs", "http", "path", "express"],
          correctAnswer: "express",
          explanation:
            "Express is a third-party framework, not a core Node.js module.",
          points: 10,
        },
        {
          id: "qa2",
          question: "What does the 'use strict' directive do in JavaScript?",
          type: "multiple-choice",
          options: [
            "Enables strict type checking",
            "Enforces stricter parsing and error handling",
            "Increases performance",
            "Enables new ES6 features",
          ],
          correctAnswer: "Enforces stricter parsing and error handling",
          explanation:
            "Strict mode enforces stricter parsing and error handling, catching common coding mistakes and 'unsafe' actions.",
          points: 10,
        },
      ],
    },
    {
      id: "a2",
      title: "Microservices Architecture Project",
      description: "Build a simple microservices-based application",
      type: "project",
      duration: "2 weeks",
      milestoneId: "m2",
      order: 1,
      completed: false,
      project: {
        id: "p2",
        title: "Microservices Demo",
        description:
          "Create a simple microservices architecture with 3 services",
        difficulty: "Medium",
        estimatedTime: "2 weeks",
        technologies: ["Node.js", "Docker", "Express", "MongoDB"],
        status: "In Progress",
        progress: 65,
        requirements: [
          "User service for authentication",
          "Product service for catalog management",
          "Order service for processing orders",
          "API Gateway for routing requests",
          "Service discovery mechanism",
        ],
        resources: [],
      },
    },
    {
      id: "a3",
      title: "System Design Interview",
      description: "Mock system design interview with feedback",
      type: "interview",
      duration: "60 minutes",
      milestoneId: "m3",
      order: 1,
      completed: false,
      interview: {
        id: "i1",
        title: "System Design Interview Practice",
        type: "System Design",
        difficulty: "Hard",
        duration: "60 minutes",
        status: "Available",
        description:
          "Design a distributed file storage system like Dropbox or Google Drive",
        questions: [
          {
            id: "q1",
            question:
              "How would you handle file synchronization across multiple devices?",
            type: "essay",
            points: 25,
          },
          {
            id: "q2",
            question: "Design the database schema for storing file metadata",
            type: "essay",
            points: 25,
          },
          {
            id: "q3",
            question: "How would you handle large file uploads efficiently?",
            type: "essay",
            points: 25,
          },
        ],
      },
    },
    {
      id: "a4",
      title: "Advanced Backend Technologies Quiz",
      description: "Test your knowledge of cutting-edge backend technologies",
      type: "quiz",
      duration: "30 minutes",
      milestoneId: "m4",
      order: 1,
      completed: false,
      questions: [
        {
          id: "qa3",
          question:
            "Which of the following is NOT a benefit of GraphQL over REST?",
          type: "multiple-choice",
          options: [
            "Reduced network requests",
            "Strongly typed schema",
            "Better caching",
            "Client-specified queries",
          ],
          correctAnswer: "Better caching",
          explanation:
            "REST actually has better built-in caching mechanisms compared to GraphQL.",
          points: 10,
        },
        {
          id: "qa4",
          question: "What is the primary purpose of Kubernetes?",
          type: "multiple-choice",
          options: [
            "Container creation",
            "Container orchestration",
            "Application development",
            "Database management",
          ],
          correctAnswer: "Container orchestration",
          explanation:
            "Kubernetes is a container orchestration platform that automates deployment, scaling, and management of containerized applications.",
          points: 10,
        },
      ],
    },
    {
      id: "a5",
      title: "Technical Leadership Assessment",
      description: "Evaluate your technical leadership and mentoring skills",
      type: "interview",
      duration: "45 minutes",
      milestoneId: "m5",
      order: 1,
      completed: false,
      interview: {
        id: "i2",
        title: "Technical Leadership Interview",
        type: "Behavioral",
        difficulty: "Hard",
        duration: "45 minutes",
        status: "Available",
        description:
          "Assess your ability to lead technical teams and mentor junior developers",
        questions: [
          {
            id: "q4",
            question:
              "Describe a situation where you had to make a difficult technical decision with limited information",
            type: "essay",
            points: 25,
          },
          {
            id: "q5",
            question:
              "How would you approach mentoring a junior developer who is struggling with a complex task?",
            type: "essay",
            points: 25,
          },
          {
            id: "q6",
            question:
              "Describe how you would lead a technical project from conception to delivery",
            type: "essay",
            points: 25,
          },
        ],
      },
    },
  ],

  roadmapCourses: [
    {
      id: "rc1",
      courseId: "1",
      milestoneId: "m1",
      order: 1,
      requiredForProgress: true,
    },
    {
      id: "rc2",
      courseId: "2",
      milestoneId: "m2",
      order: 1,
      requiredForProgress: true,
    },
    {
      id: "rc3",
      courseId: "4",
      milestoneId: "m3",
      order: 1,
      requiredForProgress: true,
    },
    {
      id: "rc4",
      courseId: "5",
      milestoneId: "m4",
      order: 1,
      requiredForProgress: true,
    },
  ],

  roadmapProjects: [
    {
      id: "rp1",
      projectId: "1",
      milestoneId: "m1",
      order: 2,
      requiredForProgress: true,
    },
    {
      id: "rp2",
      projectId: "2",
      milestoneId: "m2",
      order: 2,
      requiredForProgress: true,
    },
    {
      id: "rp3",
      projectId: "3",
      milestoneId: "m3",
      order: 2,
      requiredForProgress: true,
    },
    {
      id: "rp4",
      projectId: "4",
      milestoneId: "m4",
      order: 2,
      requiredForProgress: true,
    },
  ],
};

// Helper functions to work with the JSON data store
export const getUser = async () => await fetchUser();
export const getCourses = () => dataStore.coursesResponse.courses;
export const getNotes = () => dataStore.notes;
export const getUserCourses = () => dataStore.userCoursesResponse.userCourses;
export const getProjects = () => dataStore.projects;
export const getChallenges = () => dataStore.challenges;
export const getInterviews = () => dataStore.interviews;
export const getBootcamps = () => dataStore.bootcamps;
export const getLearningPaths = () => dataStore.learningPaths;
export const getRoadmaps = () => dataStore.roadmaps;
export const getRoadmapAssessments = () => dataStore.roadmapAssessments;
export const getRoadmapCourses = () => dataStore.roadmapCourses;
export const getRoadmapProjects = () => dataStore.roadmapProjects;

export const getRoadmapById = (id: string) =>
  dataStore.roadmaps.find((r) => r.id === id);
export const getRoadmapMilestones = (roadmapId: string) => {
  const roadmap = getRoadmapById(roadmapId);
  return roadmap ? roadmap.milestones : [];
};

export const getRoadmapMilestoneById = (
  roadmapId: string,
  milestoneId: string,
) => {
  const milestones = getRoadmapMilestones(roadmapId);
  return milestones.find((m) => m.id === milestoneId);
};

export const getRoadmapCoursesByMilestone = (milestoneId: string) => {
  const roadmapCourses = dataStore.roadmapCourses.filter(
    (rc) => rc.milestoneId === milestoneId,
  );
  return roadmapCourses
    .map((rc) => {
      const course = dataStore.coursesResponse.courses.find(
        (c) => c.id === rc.courseId,
      );
      return {
        ...course,
        milestoneId,
        order: rc.order,
        requiredForProgress: rc.requiredForProgress,
      };
    })
    .filter(Boolean) as RoadmapCourse[];
};

export const getRoadmapProjectsByMilestone = (milestoneId: string) => {
  const roadmapProjects = dataStore.roadmapProjects.filter(
    (rp) => rp.milestoneId === milestoneId,
  );
  return roadmapProjects
    .map((rp) => {
      const project = dataStore.projects.find((p) => p.id === rp.projectId);
      return {
        ...project,
        milestoneId,
        order: rp.order,
        requiredForProgress: rp.requiredForProgress,
      };
    })
    .filter(Boolean) as RoadmapProject[];
};

export const getRoadmapAssessmentsByMilestone = (milestoneId: string) => {
  return dataStore.roadmapAssessments.filter(
    (a) => a.milestoneId === milestoneId,
  );
};

export const getCourseById = (id: string) =>
  dataStore.coursesResponse.courses.find((c) => c.id === id);
export const getProjectById = (id: string) =>
  dataStore.projects.find((p) => p.id === id);
export const getChallengeById = (id: string) =>
  dataStore.challenges.find((c) => c.id === id);
export const getInterviewById = (id: string) =>
  dataStore.interviews.find((i) => i.id === id);
export const getBootcampById = (id: string) =>
  dataStore.bootcamps.find((b) => b.id === id);
export const getLearningPathById = (id: string) =>
  dataStore.learningPaths.find((lp) => lp.id === id);

export const getCourseChapters = (courseId: string) => {
  const course = getCourseById(courseId);
  return course ? course?.chapters! : [];
};

export const getCourseChapterById = (courseId: string, chapterId: string) => {
  const chapters = getCourseChapters(courseId);
  return chapters.find((c) => c.id === chapterId);
};

export const getCourseQuizzes = (courseId: string) => {
  const chapters = getCourseChapters(courseId);
  return chapters
    .filter((c) => c.quiz)
    .map((c) => c.quiz)
    .filter(Boolean) as Quiz[];
};

export const getCourseExercises = (courseId: string) => {
  const chapters = getCourseChapters(courseId);
  return chapters
    .filter((c) => c.exercise)
    .map((c) => c.exercise)
    .filter(Boolean) as Exercise[];
};

export const getCoursePlaygrounds = (courseId: string) => {
  const chapters = getCourseChapters(courseId);
  return chapters
    .filter((c) => c.playground)
    .map((c) => c.playground)
    .filter(Boolean) as Playground[];
};

export const getCourseProjects = (courseId: string) => {
  // For now, return all projects - in a real app, you'd filter by course
  return dataStore.projects;
};

export const getQuizById = (courseId: string, quizId: string) => {
  const quizzes = getCourseQuizzes(courseId);
  return quizzes.find((q) => q.id === quizId);
};

export const getExerciseById = (courseId: string, exerciseId: string) => {
  const exercises = getCourseExercises(courseId);
  return exercises.find((e) => e.id === exerciseId);
};

export const getPlaygroundById = (courseId: string, playgroundId: string) => {
  const playgrounds = getCoursePlaygrounds(courseId);
  return playgrounds.find((p) => p.id === playgroundId);
};

// Update functions (for demo purposes - in a real app, these would update a database)
export const updateCourseProgress = (courseId: string, progress: number) => {
  const course = getCourseById(courseId);
  if (course) {
    course.progress = progress;
  }
};

export const markChapterComplete = (courseId: string, chapterId: string) => {
  const chapter = getCourseChapterById(courseId, chapterId);
  if (chapter) {
    chapter.isCompleted = true;
  }
};

export const markVideoComplete = (
  courseId: string,
  chapterId: string,
  videoId: string,
) => {
  const chapter = getCourseChapterById(courseId, chapterId);
  if (chapter) {
    const video = chapter.videos.find((v) => v.id === videoId);
    if (video) {
      video.isCompleted = true;
    }
  }
};

export const submitQuizAttempt = (
  courseId: string,
  quizId: string,
  score: number,
) => {
  const quiz = getQuizById(courseId, quizId);
  if (quiz) {
    quiz.attempts += 1;
    quiz.score = score;
    quiz.completed = score >= quiz.passingScore;
  }
};

export const submitExerciseAttempt = (
  courseId: string,
  exerciseId: string,
  success: boolean,
) => {
  const exercise = getExerciseById(courseId, exerciseId);
  if (exercise) {
    exercise.attempts += 1;
    if (success) {
      exercise.completed = true;
    }
  }
};

export const markPlaygroundComplete = (
  courseId: string,
  playgroundId: string,
) => {
  const playground = getPlaygroundById(courseId, playgroundId);
  if (playground) {
    playground.completed = true;
  }
};

export const updateProjectProgress = (
  projectId: string,
  progress: number,
  status?: Project["status"],
) => {
  const project = getProjectById(projectId);
  if (project) {
    project.progress = progress;
    if (status) {
      project.status = status as any;
    }
  }
};

export const enrollInCourse = (courseId: string) => {
  const course = getCourseById(courseId);
  if (course) {
    course.enrolled = true;
  }
};

export const enrollInBootcamp = (bootcampId: string) => {
  const bootcamp = getBootcampById(bootcampId);
  if (bootcamp) {
    bootcamp.enrolled = true;
    bootcamp.spotsLeft -= 1;
  }
};

export const enrollInLearningPath = (pathId: string) => {
  const path = getLearningPathById(pathId);
  if (path) {
    path.enrolled = true;
  }
};

export const enrollInRoadmap = async (slug: string) => {
  const { data } = await api.post("/roadmaps/" + slug);
  return data?.data;
};

export const updateRoadmapProgress = (
  roadmapId: string,
  progress: number,
  currentMilestone?: number,
) => {
  const roadmap = getRoadmapById(roadmapId);
  if (roadmap) {
    roadmap.progress = progress;
    if (currentMilestone !== undefined) {
      roadmap.currentMilestone = currentMilestone;
    }
  }
};

export const completeMilestone = (roadmapId: string, milestoneId: string) => {
  const roadmap = getRoadmapById(roadmapId);
  if (roadmap) {
    const milestone = roadmap.milestones.find((m) => m.id === milestoneId);
    if (milestone) {
      milestone.completed = true;
      milestone.progress = 100;
      roadmap.completedMilestones += 1;
    }
  }
};

export const updateUser = (updates: Partial<User> | null) => {
  if (!updates) {
    setStoredUser(null);
    return;
  }
  const current = getStoredUser();
  const merged = current
    ? { ...current, ...updates }
    : { ...dataStore.user, ...updates };
  setStoredUser(merged as User);
  Object.assign(dataStore.user, updates);
};

export const updateCourse = (_slug: string, _updates: Partial<Course>) => {
  // Course state is managed server-side; API is the source of truth
};

export const updatePopularCourses = (
  updates: Partial<PopularCoursesResponse>,
) => {
  const courses = [...(updates?.courses ?? [])];
  dataStore.popularCoursesResponse.courses = [...courses];
  dataStore.popularCoursesResponse.meta = updates?.meta!;
};

export const updateCourses = (updates: Partial<CoursesResponse>) => {
  const courses = [...(updates?.courses ?? [])];
  dataStore.coursesResponse.courses = [...courses];
  dataStore.coursesResponse.meta = updates?.meta!;
};

export const updateUserCourses = (updates: Partial<UserCoursesResponse>) => {
  const courses = [...(updates?.userCourses ?? [])];
  dataStore.userCoursesResponse.userCourses = [...courses];

  dataStore.userCoursesResponse.meta = updates?.meta!;
};

export const updateUserCourse = (update: Partial<UserCourse>) => {
  dataStore.userCourse = update;
};

export const updateProject = (id: string, updates: Partial<Project>) => {
  const project = dataStore.projects.find((p) => p.id === id);
  if (project) {
    Object.assign(project, updates);
  }
};

export const updateChallenge = (id: string, updates: Partial<Challenge>) => {
  const challenge = dataStore.challenges.find((c) => c.id === id);
  if (challenge) {
    Object.assign(challenge, updates);
  }
};

// Mock data for compatibility with existing components
export const mockInterviews = dataStore.interviews;
export const mockBootcamps = dataStore.bootcamps;
export const mockPaths = dataStore.learningPaths;
export const mockCourses = dataStore.coursesResponse.courses;
export const mockProjects = dataStore.projects;
export const mockRoadmaps = dataStore.roadmaps;

// Named exports for direct access to data arrays
export const courses = dataStore.coursesResponse.courses;
export const projects = dataStore.projects;
export const challenges = dataStore.challenges;
export const interviews = dataStore.interviews;
export const bootcamps = dataStore.bootcamps;
export const learningPaths = dataStore.learningPaths;
export const roadmaps = dataStore.roadmaps;
export const user = dataStore.user;

// ─── Onboarding Types ────────────────────────────────────────────────────────

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type LearningGoal =
  | "fundamentals"
  | "projects"
  | "interviews"
  | "advanced";
export type WeeklyCommitment = "casual" | "steady" | "intensive";
export type ProgrammingLanguage =
  | "PYTHON"
  | "JAVA"
  | "NODEJS"
  | "RUST"
  | "RUBY";

export interface OnboardingRecommendation {
  course: {
    id: string;
    title: string;
    slug: string;
    level: string | null;
    totalDuration: number;
    totalStudents: number;
    banner: string | null;
    firstChapterSlug: string | null;
    firstVideoSlug: string | null;
  } | null;
  project: {
    id: string;
    title: string;
    slug: string;
    level: string | null;
    duration: number;
  } | null;
  roadmap: {
    id: string;
    title: string;
    slug: string;
    topicsCount: number;
    firstTopics: string[];
  } | null;
  stats: {
    weeksToGoal: number;
    lessonsPlanned: number;
    projectsToComplete: number;
  };
  motivationalMessage: string;
  interviewRecommendation?: {
    hasInterviewPath: boolean;
    phases: Array<{
      phase: number;
      title: string;
      description: string;
      steps: Array<{
        step: number;
        title: string;
        description: string;
        type: "mock_interview" | "course";
        resource: {
          id: string;
          title: string;
          difficulty?: string;
        };
        duration?: string;
      }>;
    }>;
  } | null;
}

export interface OnboardingInput {
  experienceLevel?: ExperienceLevel;
  learningGoal?: LearningGoal;
  weeklyCommitment?: WeeklyCommitment;
  preferredLanguage?: ProgrammingLanguage;
  skipped: boolean;
}

// Return-Recap types
export type RecapItemType = "COURSE" | "PATH" | "PROJECT" | "MOCK_INTERVIEW";
export type RecapTier = "DAY" | "WEEK" | "MONTH";
export interface RecapKeyPoint { heading: string; body: string }
export interface RecapPayload {
  eventId: string; surface: "ITEM"; itemType: RecapItemType; itemId: string; tier: RecapTier;
  awayText: string;
  recap: { courseTitle: string; chapterTitle: string; intro: string; keyPoints: RecapKeyPoint[]; source: "INSIGHT" | "BODY" };
  bridge: string;
  nextStep: { title: string; type: string; goal: string };
  stats: { xpEarned: number; currentStreak: number; isStreakActive: boolean };
}
export interface WelcomeBackItem { itemType: RecapItemType; itemId: string; title: string; progressPct: number; nextStepTitle: string; deeplink: string }
export interface WelcomeBackPayload { eventId: string; surface: "DASHBOARD"; tier: RecapTier; headline: string; items: WelcomeBackItem[] }
