import type { PortfolioData, ActivityDay } from "./portfolio-types";
import { LEVEL_NAMES } from "./portfolio-types";

const TYPE_POOL = ["Project", "Quiz", "Course", "Exercise", "Interview"];

function generateActivityDays(): ActivityDay[] {
  const days: ActivityDay[] = [];
  const now = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const dayOfWeek = date.getDay();
    const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
    // Deterministic seed from date so it doesn't change on re-render
    const seed = date.getFullYear() * 1000 + date.getMonth() * 50 + date.getDate();
    const pseudo = ((seed * 9301 + 49297) % 233280) / 233280;
    let count = 0;
    if (pseudo > 0.3 && isWeekday) count = Math.floor(pseudo * 8) + 1;
    else if (pseudo > 0.55) count = Math.floor(pseudo * 4) + 1;

    // Generate activity type breakdown
    let types: { label: string; count: number }[] | undefined;
    if (count > 0) {
      const typeCount = Math.min(1 + Math.floor(pseudo * 3), count);
      const picked: { label: string; count: number }[] = [];
      let remaining = count;
      for (let t = 0; t < typeCount && remaining > 0; t++) {
        const idx = (seed + t * 7) % TYPE_POOL.length;
        const c = t === typeCount - 1 ? remaining : Math.max(1, Math.floor(remaining * pseudo));
        picked.push({ label: TYPE_POOL[idx], count: c });
        remaining -= c;
      }
      types = picked;
    }

    days.push({ date: dateStr, count, xp: count * 15, types });
  }
  return days;
}

const activityDays = generateActivityDays();

const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

export const DUMMY_PORTFOLIO_DATA: PortfolioData = {
  user: {
    id: "usr_abc123",
    name: "Sarah Johnson",
    title: "Senior Backend Engineer",
    bio: "Backend developer with 5+ years building scalable distributed systems. Node.js, Go, and cloud-native architecture. Open-source contributor and technical writer.",
    avatar: "",
    location: "San Francisco, CA",
    level: 7,
    levelName: LEVEL_NAMES[6],
    xp: 23450,
    xpToNextLevel: 30000,
    points: 23450,
    streak: 14,
    isVerified: true,
    isOpenToWork: true,
    isPremium: false,
    isTrial: false,
    joinedAt: "2024-01-15T00:00:00Z",
    socialLinks: {
      github: "https://github.com/sarahjohnson",
      linkedin: "https://linkedin.com/in/sarahjohnson",
      website: "https://sarahjohnson.dev",
      twitter: "https://twitter.com/sarahj_dev",
    },
  },
  stats: {
    totalProjects: 18,
    totalPoints: 23450,
    coursesCompleted: 12,
    certificates: 3,
    globalRank: 24,
    totalUsers: 1247,
  },
  skills: [
    { name: "Node.js", domain: "Languages", projectCount: 14, maxProjectCount: 14, coursesCompleted: 3, quizAvgScore: 92 },
    { name: "TypeScript", domain: "Languages", projectCount: 12, maxProjectCount: 14, coursesCompleted: 2, quizAvgScore: 88 },
    { name: "Go", domain: "Languages", projectCount: 5, maxProjectCount: 14 },
    { name: "Python", domain: "Languages", projectCount: 4, maxProjectCount: 14 },
    { name: "PostgreSQL", domain: "Databases", projectCount: 11, maxProjectCount: 14, coursesCompleted: 1, quizAvgScore: 91 },
    { name: "Redis", domain: "Databases", projectCount: 9, maxProjectCount: 14 },
    { name: "MongoDB", domain: "Databases", projectCount: 6, maxProjectCount: 14 },
    { name: "Docker", domain: "Infrastructure", projectCount: 13, maxProjectCount: 14, coursesCompleted: 2, quizAvgScore: 85 },
    { name: "Kubernetes", domain: "Infrastructure", projectCount: 7, maxProjectCount: 14 },
    { name: "AWS", domain: "Infrastructure", projectCount: 10, maxProjectCount: 14 },
    { name: "Terraform", domain: "Infrastructure", projectCount: 4, maxProjectCount: 14 },
    { name: "Microservices", domain: "Patterns", projectCount: 8, maxProjectCount: 14 },
    { name: "Event-Driven", domain: "Patterns", projectCount: 6, maxProjectCount: 14 },
    { name: "CQRS", domain: "Patterns", projectCount: 3, maxProjectCount: 14 },
    { name: "LangChain", domain: "AI/ML", projectCount: 2, maxProjectCount: 14 },
    { name: "RAG Pipelines", domain: "AI/ML", projectCount: 1, maxProjectCount: 14 },
  ],
  projects: [
    {
      id: "p1",
      slug: "distributed-task-queue",
      title: "Distributed Task Queue",
      level: "Advanced",
      score: 95,
      status: "approved",
      isVerified: true,
      featured: true,
      technologies: ["Node.js", "Redis", "Docker", "PostgreSQL"],
      repositoryUrl: "https://github.com/sarahjohnson/task-queue",
      liveUrl: "https://taskqueue.sarahjohnson.dev",
      summary:
        "A distributed task queue with retries, dead-letter queues, and a monitoring dashboard.",
      completedAt: "2025-03-15T00:00:00Z",
      challenges: ["Handling exactly-once delivery semantics", "Scaling across multiple workers with fair distribution"],
      tools: ["Bull", "Bottleneck", "Prometheus"],
      docsUrl: "https://sarahjohnson.dev/blog/task-queue",
    },
    {
      id: "p2",
      slug: "rest-api-rate-limiting",
      title: "REST API with Rate Limiting",
      level: "Intermediate",
      score: 88,
      status: "approved",
      isVerified: true,
      technologies: ["Node.js", "Express", "Redis", "PostgreSQL"],
      repositoryUrl: "https://github.com/sarahjohnson/rate-limiter-api",
      summary:
        "Production-ready REST API with Redis-based sliding window rate limiting.",
      completedAt: "2025-02-10T00:00:00Z",
      challenges: ["Sliding window algorithm correctness under high concurrency"],
      tools: ["ioredis", "Express middleware"],
      docsUrl: "https://sarahjohnson.dev/blog/rate-limiter",
    },
    {
      id: "p3",
      slug: "realtime-chat-application",
      title: "Real-time Chat Application",
      level: "Intermediate",
      score: 72,
      status: "approved",
      isVerified: false,
      technologies: ["Node.js", "Socket.io", "MongoDB", "Docker"],
      repositoryUrl: "https://github.com/sarahjohnson/realtime-chat",
      summary:
        "Scalable real-time chat system using WebSockets with presence detection.",
      completedAt: "2025-01-20T00:00:00Z",
    },
    {
      id: "p4",
      slug: "graphql-api-dataloader",
      title: "GraphQL API with DataLoader",
      level: "Intermediate",
      score: 91,
      status: "approved",
      isVerified: true,
      featured: true,
      technologies: ["Node.js", "GraphQL", "DataLoader", "PostgreSQL"],
      repositoryUrl: "https://github.com/sarahjohnson/graphql-api",
      summary:
        "Optimized GraphQL API with N+1 query resolution using DataLoader.",
      completedAt: "2024-12-05T00:00:00Z",
      challenges: ["Batch loading with complex nested relationships", "Cache invalidation across resolvers"],
      tools: ["Apollo Server", "DataLoader", "pg-pool"],
    },
    {
      id: "p5",
      slug: "microservices-ecommerce-platform",
      title: "Microservices E-commerce Platform",
      level: "Advanced",
      score: 0,
      status: "in_progress",
      isVerified: false,
      technologies: ["Node.js", "Kubernetes", "RabbitMQ", "MongoDB", "Go"],
      repositoryUrl: "https://github.com/sarahjohnson/ecommerce-microservices",
      summary:
        "Microservices-based e-commerce platform with event sourcing and CQRS.",
    },
    {
      id: "p6",
      slug: "oauth2-server-implementation",
      title: "OAuth2 Server Implementation",
      level: "Advanced",
      score: 55,
      status: "rejected",
      isVerified: false,
      technologies: ["Node.js", "TypeScript", "PostgreSQL"],
      repositoryUrl: "https://github.com/sarahjohnson/oauth2-server",
      summary: "Custom OAuth2 authorization server with PKCE flow support.",
      completedAt: "2024-11-01T00:00:00Z",
    },
  ],
  activity: {
    days: activityDays,
    currentStreak: 14,
    longestStreak: 42,
    activeDaysCount: activityDays.filter((d) => d.count > 0).length,
    totalActivities: activityDays.reduce((sum, d) => sum + d.count, 0),
    monthlyXp: activityDays
      .filter((d) => {
        const date = new Date(d.date);
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        );
      })
      .reduce((sum, d) => sum + d.xp, 0),
  },
  mockInterviews: {
    totalInterviews: 23,
    averageScore: 78,
    practicedHours: 34.5,
    topicBreakdown: [
      { topic: "System Design", score: 85, totalQuestions: 45 },
      { topic: "API Design", score: 82, totalQuestions: 38 },
      { topic: "Databases", score: 76, totalQuestions: 30 },
      { topic: "Algorithms", score: 68, totalQuestions: 52 },
      { topic: "Behavioral", score: 90, totalQuestions: 20 },
      { topic: "DevOps", score: 72, totalQuestions: 15 },
    ],
    strengths: ["System Design", "API Architecture", "Communication"],
    practiceTemplates: ["Google", "Meta", "Stripe", "Shopify", "Datadog"],
  },
  achievements: [
    {
      id: "a1",
      name: "Backend Overlord",
      description: "Complete 15+ projects with 80%+ scores",
      icon: "crown",
      rarity: "Legendary",
      completed: true,
      progress: 100,
      earnedAt: "2025-03-01T00:00:00Z",
    },
    {
      id: "a2",
      name: "Code Warrior",
      description: "Maintain a 30-day streak",
      icon: "flame",
      rarity: "Epic",
      completed: true,
      progress: 100,
      earnedAt: "2025-02-15T00:00:00Z",
    },
    {
      id: "a3",
      name: "API Master",
      description: "Complete 10 API-related projects",
      icon: "zap",
      rarity: "Epic",
      completed: true,
      progress: 100,
      earnedAt: "2025-01-20T00:00:00Z",
    },
    {
      id: "a4",
      name: "Course Crusher",
      description: "Finish 10 courses",
      icon: "book",
      rarity: "Rare",
      completed: true,
      progress: 100,
      earnedAt: "2024-12-10T00:00:00Z",
    },
    {
      id: "a5",
      name: "Community Helper",
      description: "Help 50 fellow engineers",
      icon: "users",
      rarity: "Rare",
      completed: false,
      progress: 72,
    },
    {
      id: "a6",
      name: "First Steps",
      description: "Complete your first project",
      icon: "rocket",
      rarity: "Common",
      completed: true,
      progress: 100,
      earnedAt: "2024-01-25T00:00:00Z",
    },
    {
      id: "a7",
      name: "Interview Ready",
      description: "Complete 25 mock interviews",
      icon: "mic",
      rarity: "Epic",
      completed: false,
      progress: 92,
    },
    {
      id: "a8",
      name: "Full Stack Path",
      description: "Complete the Backend to Full-Stack roadmap",
      icon: "map",
      rarity: "Legendary",
      completed: false,
      progress: 45,
    },
  ],
  certificates: [
    {
      id: "c1",
      code: "MB-2025-ADV-001",
      courseName: "Advanced Node.js Patterns",
      finalScore: 94,
      date: "2025-03-01T00:00:00Z",
      verifyUrl: "/certificates/MB-2025-ADV-001",
    },
    {
      id: "c2",
      code: "MB-2025-SYS-002",
      courseName: "System Design Fundamentals",
      finalScore: 88,
      date: "2025-01-15T00:00:00Z",
      verifyUrl: "/certificates/MB-2025-SYS-002",
    },
    {
      id: "c3",
      code: "MB-2024-DB-015",
      courseName: "Database Optimization Mastery",
      finalScore: 91,
      date: "2024-11-20T00:00:00Z",
      verifyUrl: "/certificates/MB-2024-DB-015",
    },
  ],
  roadmaps: [
    {
      id: "r1",
      name: "Backend Engineer Career Path",
      progress: 78,
      topicsCompleted: 14,
      topicsTotal: 18,
    },
    {
      id: "r2",
      name: "Backend to Full-Stack Engineer",
      progress: 45,
      topicsCompleted: 5,
      topicsTotal: 11,
    },
    {
      id: "r3",
      name: "DevOps Integration Path",
      progress: 20,
      topicsCompleted: 2,
      topicsTotal: 10,
    },
  ],
  quizExerciseSummary: {
    quizzesPassed: 47,
    quizzesTotal: 52,
    quizAvgScore: 89,
    exercisesCompleted: 34,
    exercisesTotal: 40,
    exerciseAvgScore: 84,
  },
  bootcamps: [
    {
      id: "b1",
      name: "Backend Engineering Bootcamp",
      cohortName: "Cohort 7 — Jan 2025",
      status: "completed",
      completionPercent: 100,
      score: 92,
      attendanceRate: 96,
      peerRank: 3,
      totalPeers: 48,
      startedAt: "2025-01-06T00:00:00Z",
      completedAt: "2025-03-28T00:00:00Z",
    },
    {
      id: "b2",
      name: "System Design Masterclass",
      cohortName: "Cohort 2 — Mar 2025",
      status: "in_progress",
      completionPercent: 65,
      score: 78,
      attendanceRate: 88,
      peerRank: 8,
      totalPeers: 35,
      startedAt: "2025-03-10T00:00:00Z",
    },
  ],
};
