// Types for MB Lands
export interface Land {
  id: string
  title: string
  description: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert"
  thumbnail: string
  stages: Stage[]
  totalXP: number
  completedXP: number
  progress: number
  unlocked: boolean
  completed: boolean
  category: string
  tags: string[]
  estimatedTime: string
  users: number
}

export interface Stage {
  id: string
  landId: string
  title: string
  description: string
  order: number
  challenges: Challenge[]
  totalXP: number
  completedXP: number
  progress: number
  unlocked: boolean
  completed: boolean
  estimatedTime: string
}

export interface Challenge {
  id: string
  stageId: string
  landId: string
  title: string
  description: string
  type: "coding" | "quiz" | "puzzle" | "debug"
  difficulty: "Easy" | "Medium" | "Hard" | "Expert"
  xpReward: number
  completed: boolean
  unlocked: boolean
  order: number
  timeEstimate: string
  hints: Hint[]
  usedHints: number
}

export interface Hint {
  id: string
  content: string
  xpCost: number
  used: boolean
}

export interface CodingChallenge extends Challenge {
  type: "coding"
  instructions: string
  starterCode: string
  testCases: TestCase[]
  language: string
  solution: string
}

export interface QuizChallenge extends Challenge {
  type: "quiz"
  questions: QuizQuestion[]
  timeLimit: number
  passingScore: number
}

export interface PuzzleChallenge extends Challenge {
  type: "puzzle"
  puzzleData: any
  solution: any
}

export interface DebugChallenge extends Challenge {
  type: "debug"
  buggyCode: string
  expectedOutput: string
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  isHidden: boolean
  description: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: "multiple-choice" | "true-false" | "fill-blank"
  options?: string[]
  correctAnswer: string
  explanation: string
  points: number
}

// Sample data for MB Lands
export const landsData: Land[] = [
  {
    id: "javascript-fundamentals",
    title: "JavaScript Fundamentals",
    description: "Master the core concepts of JavaScript programming language",
    difficulty: "Beginner",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 5000,
    completedXP: 2500,
    progress: 50,
    unlocked: true,
    completed: false,
    category: "Programming",
    tags: ["JavaScript", "Web Development", "Programming Basics"],
    estimatedTime: "20 hours",
    users: 1250,
    stages: [
      {
        id: "js-basics",
        landId: "javascript-fundamentals",
        title: "JavaScript Basics",
        description: "Learn the fundamental concepts of JavaScript",
        order: 1,
        totalXP: 1500,
        completedXP: 1500,
        progress: 100,
        unlocked: true,
        completed: true,
        estimatedTime: "5 hours",
        challenges: [
          {
            id: "js-variables",
            stageId: "js-basics",
            landId: "javascript-fundamentals",
            title: "Variables and Data Types",
            description: "Learn about variables and data types in JavaScript",
            type: "quiz",
            difficulty: "Easy",
            xpReward: 300,
            completed: true,
            unlocked: true,
            order: 1,
            timeEstimate: "30 minutes",
            hints: [
              {
                id: "hint-1",
                content: "Remember that JavaScript has primitive and reference types",
                xpCost: 50,
                used: false,
              },
            ],
            usedHints: 0,
          } as QuizChallenge,
          {
            id: "js-operators",
            stageId: "js-basics",
            landId: "javascript-fundamentals",
            title: "Operators and Expressions",
            description: "Master JavaScript operators and expressions",
            type: "coding",
            difficulty: "Easy",
            xpReward: 400,
            completed: true,
            unlocked: true,
            order: 2,
            timeEstimate: "45 minutes",
            hints: [
              {
                id: "hint-1",
                content: "Don't forget about operator precedence",
                xpCost: 50,
                used: false,
              },
            ],
            usedHints: 0,
            instructions: "Write a function that calculates the area of a triangle",
            starterCode: "function calculateTriangleArea(base, height) {\n  // Your code here\n}",
            testCases: [
              {
                id: "test-1",
                input: "calculateTriangleArea(5, 10)",
                expectedOutput: "25",
                isHidden: false,
                description: "Calculate area with base 5 and height 10",
              },
            ],
            language: "javascript",
            solution: "function calculateTriangleArea(base, height) {\n  return (base * height) / 2;\n}",
          } as CodingChallenge,
          {
            id: "js-control-flow",
            stageId: "js-basics",
            landId: "javascript-fundamentals",
            title: "Control Flow",
            description: "Learn about conditional statements and loops",
            type: "coding",
            difficulty: "Medium",
            xpReward: 500,
            completed: true,
            unlocked: true,
            order: 3,
            timeEstimate: "1 hour",
            hints: [
              {
                id: "hint-1",
                content: "Remember to handle edge cases",
                xpCost: 75,
                used: false,
              },
            ],
            usedHints: 0,
            instructions: "Write a function that checks if a number is prime",
            starterCode: "function isPrime(num) {\n  // Your code here\n}",
            testCases: [
              {
                id: "test-1",
                input: "isPrime(7)",
                expectedOutput: "true",
                isHidden: false,
                description: "Check if 7 is prime",
              },
              {
                id: "test-2",
                input: "isPrime(4)",
                expectedOutput: "false",
                isHidden: false,
                description: "Check if 4 is prime",
              },
            ],
            language: "javascript",
            solution:
              "function isPrime(num) {\n  if (num <= 1) return false;\n  if (num <= 3) return true;\n  if (num % 2 === 0 || num % 3 === 0) return false;\n  let i = 5;\n  while (i * i <= num) {\n    if (num % i === 0 || num % (i + 2) === 0) return false;\n    i += 6;\n  }\n  return true;\n}",
          } as CodingChallenge,
        ],
      },
      {
        id: "js-functions",
        landId: "javascript-fundamentals",
        title: "Functions and Scope",
        description: "Master JavaScript functions and variable scope",
        order: 2,
        totalXP: 1800,
        completedXP: 1000,
        progress: 55,
        unlocked: true,
        completed: false,
        estimatedTime: "6 hours",
        challenges: [
          {
            id: "js-function-basics",
            stageId: "js-functions",
            landId: "javascript-fundamentals",
            title: "Function Basics",
            description: "Learn about function declarations and expressions",
            type: "quiz",
            difficulty: "Easy",
            xpReward: 350,
            completed: true,
            unlocked: true,
            order: 1,
            timeEstimate: "45 minutes",
            hints: [
              {
                id: "hint-1",
                content: "Remember the difference between function declarations and expressions",
                xpCost: 50,
                used: false,
              },
            ],
            usedHints: 0,
          } as QuizChallenge,
          {
            id: "js-closures",
            stageId: "js-functions",
            landId: "javascript-fundamentals",
            title: "Closures",
            description: "Understand JavaScript closures and their applications",
            type: "coding",
            difficulty: "Medium",
            xpReward: 600,
            completed: true,
            unlocked: true,
            order: 2,
            timeEstimate: "1.5 hours",
            hints: [
              {
                id: "hint-1",
                content: "A closure is a function that has access to its outer function's variables",
                xpCost: 75,
                used: false,
              },
            ],
            usedHints: 0,
            instructions: "Create a counter function using closures",
            starterCode: "function createCounter() {\n  // Your code here\n}",
            testCases: [
              {
                id: "test-1",
                input: "const counter = createCounter(); counter(); counter(); counter();",
                expectedOutput: "3",
                isHidden: false,
                description: "Counter should increment on each call",
              },
            ],
            language: "javascript",
            solution:
              "function createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}",
          } as CodingChallenge,
          {
            id: "js-recursion",
            stageId: "js-functions",
            landId: "javascript-fundamentals",
            title: "Recursion",
            description: "Master recursive functions in JavaScript",
            type: "coding",
            difficulty: "Hard",
            xpReward: 750,
            completed: false,
            unlocked: true,
            order: 3,
            timeEstimate: "2 hours",
            hints: [
              {
                id: "hint-1",
                content: "Remember to define a base case to prevent infinite recursion",
                xpCost: 100,
                used: false,
              },
            ],
            usedHints: 0,
            instructions: "Implement a recursive function to calculate the nth Fibonacci number",
            starterCode: "function fibonacci(n) {\n  // Your code here\n}",
            testCases: [
              {
                id: "test-1",
                input: "fibonacci(6)",
                expectedOutput: "8",
                isHidden: false,
                description: "Calculate the 6th Fibonacci number",
              },
            ],
            language: "javascript",
            solution:
              "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
          } as CodingChallenge,
        ],
      },
      {
        id: "js-objects",
        landId: "javascript-fundamentals",
        title: "Objects and Prototypes",
        description: "Learn about JavaScript objects and prototype inheritance",
        order: 3,
        totalXP: 1700,
        completedXP: 0,
        progress: 0,
        unlocked: false,
        completed: false,
        estimatedTime: "5 hours",
        challenges: [
          {
            id: "js-object-basics",
            stageId: "js-objects",
            landId: "javascript-fundamentals",
            title: "Object Basics",
            description: "Learn about object creation and properties",
            type: "quiz",
            difficulty: "Easy",
            xpReward: 350,
            completed: false,
            unlocked: false,
            order: 1,
            timeEstimate: "45 minutes",
            hints: [
              {
                id: "hint-1",
                content: "Objects can be created using object literals or constructors",
                xpCost: 50,
                used: false,
              },
            ],
            usedHints: 0,
          } as QuizChallenge,
        ],
      },
    ],
  },
  {
    id: "node-backend",
    title: "Node.js Backend Development",
    description: "Build scalable backend applications with Node.js",
    difficulty: "Intermediate",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 7500,
    completedXP: 1500,
    progress: 20,
    unlocked: true,
    completed: false,
    category: "Backend",
    tags: ["Node.js", "Express", "API", "Backend"],
    estimatedTime: "30 hours",
    users: 850,
    stages: [
      {
        id: "node-basics",
        landId: "node-backend",
        title: "Node.js Fundamentals",
        description: "Learn the core concepts of Node.js",
        order: 1,
        totalXP: 1500,
        completedXP: 1500,
        progress: 100,
        unlocked: true,
        completed: true,
        estimatedTime: "5 hours",
        challenges: [
          {
            id: "node-modules",
            stageId: "node-basics",
            landId: "node-backend",
            title: "Node.js Modules",
            description: "Learn about the Node.js module system",
            type: "quiz",
            difficulty: "Easy",
            xpReward: 300,
            completed: true,
            unlocked: true,
            order: 1,
            timeEstimate: "30 minutes",
            hints: [
              {
                id: "hint-1",
                content: "Node.js has both CommonJS and ES modules",
                xpCost: 50,
                used: false,
              },
            ],
            usedHints: 0,
          } as QuizChallenge,
        ],
      },
      {
        id: "express-basics",
        landId: "node-backend",
        title: "Express.js Fundamentals",
        description: "Build web applications with Express.js",
        order: 2,
        totalXP: 2000,
        completedXP: 0,
        progress: 0,
        unlocked: true,
        completed: false,
        estimatedTime: "8 hours",
        challenges: [
          {
            id: "express-routes",
            stageId: "express-basics",
            landId: "node-backend",
            title: "Express Routes",
            description: "Learn how to define and use Express routes",
            type: "coding",
            difficulty: "Medium",
            xpReward: 500,
            completed: false,
            unlocked: true,
            order: 1,
            timeEstimate: "1 hour",
            hints: [
              {
                id: "hint-1",
                content: "Express routes can be defined using app.get(), app.post(), etc.",
                xpCost: 75,
                used: false,
              },
            ],
            usedHints: 0,
            instructions: "Create an Express server with routes for GET, POST, PUT, and DELETE",
            starterCode:
              "const express = require('express');\nconst app = express();\n\n// Your code here\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});",
            testCases: [
              {
                id: "test-1",
                input: "GET /users",
                expectedOutput: "Returns all users",
                isHidden: false,
                description: "Should handle GET request",
              },
            ],
            language: "javascript",
            solution:
              "const express = require('express');\nconst app = express();\n\napp.use(express.json());\n\napp.get('/users', (req, res) => {\n  res.json({ message: 'Returns all users' });\n});\n\napp.post('/users', (req, res) => {\n  res.status(201).json({ message: 'User created' });\n});\n\napp.put('/users/:id', (req, res) => {\n  res.json({ message: `User ${req.params.id} updated` });\n});\n\napp.delete('/users/:id', (req, res) => {\n  res.json({ message: `User ${req.params.id} deleted` });\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});",
          } as CodingChallenge,
        ],
      },
    ],
  },
  {
    id: "database-mastery",
    title: "Database Mastery",
    description: "Master SQL and NoSQL database concepts and implementations",
    difficulty: "Intermediate",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 8000,
    completedXP: 0,
    progress: 0,
    unlocked: false,
    completed: false,
    category: "Database",
    tags: ["SQL", "NoSQL", "MongoDB", "PostgreSQL"],
    estimatedTime: "35 hours",
    users: 620,
    stages: [
      {
        id: "sql-basics",
        landId: "database-mastery",
        title: "SQL Fundamentals",
        description: "Learn the basics of SQL and relational databases",
        order: 1,
        totalXP: 2000,
        completedXP: 0,
        progress: 0,
        unlocked: false,
        completed: false,
        estimatedTime: "8 hours",
        challenges: [],
      },
    ],
  },
  {
    id: "react-frontend",
    title: "React Frontend Development",
    description: "Build modern user interfaces with React",
    difficulty: "Intermediate",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 7000,
    completedXP: 0,
    progress: 0,
    unlocked: false,
    completed: false,
    category: "Frontend",
    tags: ["React", "JavaScript", "UI", "Frontend"],
    estimatedTime: "28 hours",
    users: 980,
    stages: [
      {
        id: "react-basics",
        landId: "react-frontend",
        title: "React Fundamentals",
        description: "Learn the core concepts of React",
        order: 1,
        totalXP: 1800,
        completedXP: 0,
        progress: 0,
        unlocked: false,
        completed: false,
        estimatedTime: "7 hours",
        challenges: [],
      },
    ],
  },
  {
    id: "algorithms",
    title: "Algorithms and Data Structures",
    description: "Master essential algorithms and data structures",
    difficulty: "Advanced",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 10000,
    completedXP: 0,
    progress: 0,
    unlocked: false,
    completed: false,
    category: "Computer Science",
    tags: ["Algorithms", "Data Structures", "Problem Solving"],
    estimatedTime: "45 hours",
    users: 540,
    stages: [
      {
        id: "array-algorithms",
        landId: "algorithms",
        title: "Array Algorithms",
        description: "Learn algorithms for working with arrays",
        order: 1,
        totalXP: 2500,
        completedXP: 0,
        progress: 0,
        unlocked: false,
        completed: false,
        estimatedTime: "10 hours",
        challenges: [],
      },
    ],
  },
  {
    id: "system-design",
    title: "System Design",
    description: "Learn to design scalable and reliable systems",
    difficulty: "Expert",
    thumbnail: "/placeholder.svg?height=200&width=300",
    totalXP: 12000,
    completedXP: 0,
    progress: 0,
    unlocked: false,
    completed: false,
    category: "Architecture",
    tags: ["System Design", "Scalability", "Architecture"],
    estimatedTime: "50 hours",
    users: 320,
    stages: [
      {
        id: "design-fundamentals",
        landId: "system-design",
        title: "Design Fundamentals",
        description: "Learn the fundamentals of system design",
        order: 1,
        totalXP: 3000,
        completedXP: 0,
        progress: 0,
        unlocked: false,
        completed: false,
        estimatedTime: "12 hours",
        challenges: [],
      },
    ],
  },
]

// Helper functions
export function getLands() {
  return landsData
}

export function getLandById(id: string) {
  return landsData.find((land) => land.id === id)
}

export function getStageById(landId: string, stageId: string) {
  const land = getLandById(landId)
  return land?.stages.find((stage) => stage.id === stageId)
}

export function getChallengeById(landId: string, stageId: string, challengeId: string) {
  const stage = getStageById(landId, stageId)
  return stage?.challenges.find((challenge) => challenge.id === challengeId)
}

// Update functions
export function completeChallenge(landId: string, stageId: string, challengeId: string) {
  const land = getLandById(landId)
  if (!land) return

  const stage = land.stages.find((s) => s.id === stageId)
  if (!stage) return

  const challenge = stage.challenges.find((c) => c.id === challengeId)
  if (!challenge || challenge.completed) return

  challenge.completed = true
  stage.completedXP += challenge.xpReward
  land.completedXP += challenge.xpReward

  // Update progress
  stage.progress = Math.round((stage.completedXP / stage.totalXP) * 100)
  land.progress = Math.round((land.completedXP / land.totalXP) * 100)

  // Check if stage is completed
  const allChallengesCompleted = stage.challenges.every((c) => c.completed)
  if (allChallengesCompleted) {
    stage.completed = true

    // Unlock next stage if available
    const nextStage = land.stages.find((s) => s.order === stage.order + 1)
    if (nextStage) {
      nextStage.unlocked = true
    }
  }

  // Check if land is completed
  const allStagesCompleted = land.stages.every((s) => s.completed)
  if (allStagesCompleted) {
    land.completed = true
  }

  return challenge.xpReward
}

export function useHint(landId: string, stageId: string, challengeId: string, hintId: string) {
  const land = getLandById(landId)
  if (!land) return 0

  const stage = land.stages.find((s) => s.id === stageId)
  if (!stage) return 0

  const challenge = stage.challenges.find((c) => c.id === challengeId)
  if (!challenge) return 0

  const hint = challenge.hints.find((h) => h.id === hintId)
  if (!hint || hint.used) return 0

  hint.used = true
  challenge.usedHints += 1

  return hint.xpCost
}
