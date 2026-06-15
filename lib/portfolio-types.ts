export type BadgeRarity = "Common" | "Rare" | "Epic" | "Legendary";
export type ProjectStatus = "approved" | "pending" | "rejected" | "in_progress";
export type SkillDomain =
  | "Languages"
  | "Databases"
  | "Infrastructure"
  | "Patterns"
  | "AI/ML";

export const LEVEL_NAMES = [
  "Code Squire",
  "API Tinkerer",
  "Logic Blacksmith",
  "Auth Alchemist",
  "Database Cartographer",
  "Service Sorcerer",
  "Architect",
  "Performance Paladin",
  "DevOps Enchanter",
  "Backend Overlord",
] as const;

export const RARITY_COLORS: Record<BadgeRarity, string> = {
  Legendary: "#F2C94C",
  Epic: "#9B59B6",
  Rare: "#13AECE",
  Common: "#6B7280",
};

export interface PortfolioUser {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar: string;
  location: string;
  level: number;
  levelName: string;
  xp: number;
  xpToNextLevel: number;
  points: number;
  streak: number;
  isVerified: boolean;
  isPremium: boolean;
  isTrial: boolean;
  isOpenToWork: boolean;
  joinedAt: string;
  resume?: string; // Resume URL
  socialLinks: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
}

export interface PortfolioStats {
  totalProjects: number;
  totalPoints: number;
  coursesCompleted: number;
  certificates: number;
  globalRank: number;
  totalUsers: number;
}

export interface SkillEvidenceItem {
  slug: string;
  title: string;
}

export interface PortfolioSkill {
  name: string;
  domain: SkillDomain;
  projectCount: number;
  maxProjectCount: number;
  coursesCompleted?: number;
  courseCount?: number;
  quizAvgScore?: number;
  projects?: SkillEvidenceItem[];
  courses?: SkillEvidenceItem[];
}

export interface PortfolioProject {
  id: string;
  title: string;
  level: string;
  score: number;
  status: ProjectStatus | string;
  isVerified: boolean;
  technologies: string[];
  repositoryUrl?: string;
  liveUrl?: string;
  summary: string;
  completedAt?: string;
  featured?: boolean;
  challenges?: string[];
  tools?: string[];
  docsUrl?: string;
  slug: string;
}

export interface ActivityDay {
  date: string;
  count: number;
  xp: number;
  types?: { label: string; count: number }[];
}

export interface PortfolioActivity {
  days: ActivityDay[];
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  totalActivities: number;
  monthlyXp: number;
}

export interface InterviewTopicScore {
  topic: string;
  score: number;
  totalQuestions: number;
}

export interface PortfolioMockInterviews {
  totalInterviews: number;
  averageScore: number;
  practicedHours: number;
  topicBreakdown: InterviewTopicScore[];
  strengths: string[];
  practiceTemplates: string[];
}

export interface PortfolioAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: BadgeRarity;
  completed: boolean;
  progress: number;
  earnedAt?: string;
}

export interface PortfolioCertificate {
  id: string;
  code: string;
  courseName: string;
  finalScore: number;
  date: string;
  verifyUrl?: string;
}

export interface PortfolioRoadmap {
  id: string;
  name: string;
  progress: number;
  topicsCompleted: number;
  topicsTotal: number;
}

export interface PortfolioQuizExerciseSummary {
  quizzesPassed: number;
  quizzesTotal: number;
  quizAvgScore: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  exerciseAvgScore: number;
}

export interface PortfolioBootcamp {
  id: string;
  name: string;
  cohortName: string;
  status: "completed" | "in_progress" | "upcoming";
  completionPercent: number;
  score: number;
  attendanceRate: number;
  peerRank: number;
  totalPeers: number;
  startedAt?: string;
  completedAt?: string;
}

export interface PortfolioData {
  user: PortfolioUser;
  stats: PortfolioStats;
  skills: PortfolioSkill[];
  projects: PortfolioProject[];
  activity: PortfolioActivity;
  mockInterviews: PortfolioMockInterviews;
  achievements: PortfolioAchievement[];
  certificates: PortfolioCertificate[];
  roadmaps: PortfolioRoadmap[];
  quizExerciseSummary: PortfolioQuizExerciseSummary;
  bootcamps: PortfolioBootcamp[];
}

// Backend API Response Type with enriched fields from database
export interface PortfolioResponse {
  user: {
    id: string;
    name: string;
    bio: string;
    avatar: string;
    level: number;
    title: string; // From user.title
    levelName: string;
    xp?: number; // From user.points
    points: number;
    streak: number;
    longestStreak: number;
    isVerified?: boolean; // From user.emailConfirmed
    isPremium?: boolean; // From User.isPremium
    isTrial?: boolean; // From User.isTrial
    joinedAt: string;
    location: string; // From user.address
    openToWork?: boolean; // From user.openToWork
    resume?: string; // From user.resume (URL)
    socialLinks: {
      github?: string;
      linkedin?: string;
      website?: string;
      twitter?: string; // From user.twitter (username or URL)
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
    score?: number; // From Solution.score
    status?: string; // From Solution.status
    isVerified?: boolean; // From Solution.status == 'APPROVED'
    repositoryUrl?: string; // From Solution.repository
    liveUrl?: string; // From Solution.baseURL
    completedAt?: string; // From Solution.createdAt
    featured?: boolean; // From Solution.isPublic
    challenges?: string[]; // From Solution.challenges
    tools?: string[]; // From Solution.tools
    docsUrl?: string; // From Solution.docsURL
    slug: string; // From PortfolioAggregator
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
    practicedHours?: number; // From aggregated mock interview data
    topicBreakdown: Array<{
      topic: string;
      score: number;
    }>;
    strengths?: string[]; // From mock interview analysis
    practiceTemplates?: string[]; // Available practice templates
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
    topicsCompleted?: number; // From RoadmapTopic completion count
    topicsTotal?: number; // From total RoadmapTopic count
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
    cohortName?: string; // From Cohort.name
    score?: number; // From UserCohort.score
    attendanceRate?: number; // From UserCohort
    peerRank?: number; // Rank within cohort
    totalPeers?: number; // Count of UserCohort members
    startedAt?: string; // From Cohort.startsAt
    completedAt?: string; // From UserCohort.endedAt
  }>;
  skills: Array<{
    name: string;
    domain: string;
    projectCount: number;
    maxProjectCount: number;
    coursesCompleted: number;
    courseCount?: number;
    projects?: SkillEvidenceItem[]; // Evidence: projects using this skill (capped at 6)
    courses?: SkillEvidenceItem[]; // Evidence: courses teaching this skill (capped at 6)
  }>;
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
