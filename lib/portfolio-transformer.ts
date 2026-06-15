import type {
  PortfolioResponse,
  PortfolioData,
  SkillDomain,
} from "./portfolio-types";
import { LEVEL_NAMES } from "./portfolio-types";
import { dataStore } from "./data";

/**
 * Computes how many XP points remain until the next level.
 * Mirrors the logic in hooks/use-level.ts.
 */
function computeXpToNextLevel(level: number, xp: number): number {
  const levels = dataStore.levels;
  const currentIdx = Math.max(0, levels.findIndex((l) => l.id === level));
  const nextLevel =
    currentIdx < levels.length - 1 ? levels[currentIdx + 1] : null;
  return nextLevel ? Math.max(0, nextLevel.point - xp) : 0;
}

/**
 * Completes Twitter URL if only username is provided
 * @param twitter - Twitter username or full URL
 * @returns Full Twitter URL or undefined
 */
function normalizeTwitterUrl(twitter?: string): string | undefined {
  if (!twitter) return undefined;
  // If already a full URL, return as-is
  if (twitter.startsWith("http")) return twitter;
  // If just a username, add Twitter domain
  const username = twitter.startsWith("@") ? twitter.slice(1) : twitter;
  return `https://twitter.com/${username}`;
}

/**
 * Transforms API PortfolioResponse to component PortfolioData format
 * Now includes enriched fields from database (Solution, UserCohort, Quiz/Exercise data)
 */
export function transformPortfolioResponse(
  response: PortfolioResponse,
): PortfolioData {
  return {
    user: {
      id: response.user.id,
      name: response.user.name,
      title: response.user.title, // Not provided by API
      bio: response.user.bio,
      avatar: response.user.avatar,
      location: response.user.location || "",
      level: response.user.level,
      levelName:
        response.user.levelName ||
        LEVEL_NAMES[response.user.level] ||
        "Developer",
      xp: response.user.xp || response.user.points || 0,
      xpToNextLevel: computeXpToNextLevel(
        response.user.level,
        response.user.xp || response.user.points || 0
      ),
      points: response.user.points,
      streak: response.user.streak,
      isVerified: response.user.isVerified || false, // ✅ From API (emailConfirmed)
      isPremium: response.user.isPremium ?? false, // ✅ From API (User.isPremium)
      isTrial: response.user.isTrial ?? false, // ✅ From API (User.isTrial)
      isOpenToWork: response.user.openToWork || false, // ✅ From API (user.openToWork)
      joinedAt: response.user.joinedAt,
      resume: response.user.resume, // ✅ From API (user.resume)
      socialLinks: {
        github: response.user.socialLinks?.github,
        linkedin: response.user.socialLinks?.linkedin,
        website: response.user.socialLinks?.website,
        twitter: normalizeTwitterUrl(response.user.socialLinks?.twitter), // ✅ From API (user.twitter - converted to full URL)
      },
    },
    stats: {
      totalProjects: response.stats.totalProjects,
      totalPoints: response.stats.totalPoints,
      coursesCompleted: response.stats.coursesCompleted,
      certificates: response.stats.certificates,
      globalRank: response.stats.globalRank,
      totalUsers: response.stats.totalUsers,
      interviewAvgScore: response.stats.interviewAvgScore,
      isInterviewReady: response.stats.isInterviewReady,
    },
    skills: (response.skills ?? []).map((s) => ({
      name: s.name,
      domain: s.domain as SkillDomain,
      projectCount: s.projectCount,
      maxProjectCount: s.maxProjectCount,
      coursesCompleted: s.coursesCompleted || 0,
      courseCount: s.courseCount ?? s.coursesCompleted ?? 0, // ✅ From API (evidence count)
      projects: s.projects ?? [], // ✅ From API (evidence: linked projects, capped at 6)
      courses: s.courses ?? [], // ✅ From API (evidence: linked courses, capped at 6)
    })),
    projects: response.projects.map((p) => ({
      id: p.id,
      title: p.title,
      level: p.level || "Intermediate",
      score: p.score || 0, // ✅ From API (Solution.score)
      status: p.status || "in_progress", // ✅ From API (Solution.status)
      isVerified: p.isVerified || false, // ✅ From API (Solution.status == 'APPROVED')
      technologies: p.technologies || [],
      repositoryUrl: p.repositoryUrl, // ✅ From API (Solution.repository)
      liveUrl: p.liveUrl, // ✅ From API (Solution.baseURL)
      summary: p.summary,
      completedAt: p.completedAt, // ✅ From API (Solution.createdAt)
      featured: p.featured || false, // ✅ From API (Solution.isPublic)
      challenges: p.challenges, // ✅ From API (Solution.challenges)
      tools: p.tools, // ✅ From API (Solution.tools)
      docsUrl: p.docsUrl, // ✅ From API (Solution.docsURL)
      slug: p.slug, // ✅ From API (added in PortfolioAggregator)
    })),
    activity: {
      days: response.activity.days.map((d) => ({
        date: d.date,
        count: d.count,
        xp: d.xp,
        types: d.types,
      })),
      currentStreak: response.activity.currentStreak,
      longestStreak: response.activity.longestStreak,
      activeDaysCount: response.activity.activeDaysCount,
      totalActivities: response.activity.totalActivities,
      monthlyXp: response.activity.monthlyXp,
    },
    mockInterviews: {
      totalInterviews: response.mockInterviews.totalInterviews,
      averageScore: response.mockInterviews.averageScore,
      practicedHours: response.mockInterviews.practicedHours || 0, // ✅ From API
      topicBreakdown: response.mockInterviews.topicBreakdown.map((t) => ({
        topic: t.topic,
        score: t.score,
        totalQuestions: 0, // Would need more API data
      })),
      strengths: response.mockInterviews.strengths || [], // ✅ From API
      practiceTemplates: response.mockInterviews.practiceTemplates || [], // ✅ From API
    },
    achievements: response.achievements.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon: a.icon || "🏆",
      rarity: "Common" as const, // Not provided by API
      completed: a.completed,
      progress: a.progress,
      earnedAt: a.earnedAt,
    })),
    certificates: response.certificates.map((c) => ({
      id: c.id,
      code: c.code,
      courseName: c.courseName,
      finalScore: c.finalScore,
      date: c.date,
      verifyUrl: undefined, // Not provided by API
    })),
    roadmaps: response.roadmaps.map((r) => ({
      id: r.id,
      name: r.name,
      progress: r.progress,
      topicsCompleted: r.topicsCompleted || 0, // ✅ From API
      topicsTotal: r.topicsTotal || 0, // ✅ From API
    })),
    quizExerciseSummary: {
      quizzesPassed: response.quizExerciseSummary.quizzesPassed,
      quizzesTotal: response.quizExerciseSummary.quizzesTotal, // ✅ From API
      quizAvgScore: response.quizExerciseSummary.quizAvgScore, // ✅ From API
      exercisesCompleted: response.quizExerciseSummary.exercisesCompleted,
      exercisesTotal: response.quizExerciseSummary.exercisesTotal, // ✅ From API
      exerciseAvgScore: response.quizExerciseSummary.exerciseAvgScore, // ✅ From API
    },
    bootcamps: response.bootcamps.map((b) => ({
      id: b.id,
      name: b.name,
      cohortName: b.cohortName || "", // ✅ From API (Cohort.name)
      status:
        (b.status as "completed" | "in_progress" | "upcoming") || "in_progress",
      completionPercent: b.completionPercent,
      score: b.score || 0, // ✅ From API (UserCohort.score)
      attendanceRate: b.attendanceRate || 0, // ✅ From API
      peerRank: b.peerRank || 0, // ✅ From API
      totalPeers: b.totalPeers || 0, // ✅ From API (count of UserCohort)
      startedAt: b?.startedAt, // ✅ From API (Cohort.startsAt)
      completedAt: b.completedAt, // ✅ From API (UserCohort.endedAt)
    })),
  };
}
