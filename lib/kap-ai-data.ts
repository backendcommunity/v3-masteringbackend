export interface KapMessage {
  id: string;
  content: string;
  sender: "user" | "kap";
  timestamp: Date;
  type?: "text" | "code" | "suggestion";
}

export interface KapConversation {
  id: string;
  title: string;
  messages: KapMessage[];
  createdAt: Date;
  updatedAt: Date;
  category?: "general" | "navigation" | "technical" | "learning";
}

export interface KapSuggestedQuestion {
  id: string;
  question: string;
  category: "navigation" | "learning" | "technical" | "platform";
  icon: string;
}

// Mock conversations data
export const mockConversations: KapConversation[] = [
  {
    id: "1",
    title: "Getting Started with Node.js Course",
    category: "learning",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    messages: [
      {
        id: "1",
        content:
          "Hi Kap! I'm new to the platform. Can you help me get started with the Node.js course?",
        sender: "user",
        timestamp: new Date("2024-01-15T10:00:00"),
      },
      {
        id: "2",
        content:
          "Hello! Welcome to MasteringBackend! 🎉 I'd be happy to help you get started with our Node.js course.\n\nHere's what I recommend:\n\n1. **Start with the Node.js Fundamentals** - This covers the basics\n2. **Complete the hands-on projects** - Practice is key!\n3. **Join our community discussions** - Learn from other developers\n\nWould you like me to navigate you directly to the Node.js course page?",
        sender: "kap",
        timestamp: new Date("2024-01-15T10:01:00"),
      },
      {
        id: "3",
        content:
          "Yes, that would be great! Also, how long does it typically take to complete?",
        sender: "user",
        timestamp: new Date("2024-01-15T10:02:00"),
      },
      {
        id: "4",
        content:
          "Perfect! The Node.js course typically takes 4-6 weeks if you dedicate 2-3 hours per week. Here's the breakdown:\n\n• **Week 1-2**: Fundamentals and Setup\n• **Week 3-4**: Advanced Concepts and APIs\n• **Week 5-6**: Projects and Real-world Applications\n\nI can navigate you to the course now. Just click [here](/courses/nodejs-fundamentals) or I can guide you through the dashboard!",
        sender: "kap",
        timestamp: new Date("2024-01-15T10:03:00"),
      },
    ],
  },
  {
    id: "2",
    title: "Database Design Best Practices",
    category: "technical",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-12"),
    messages: [
      {
        id: "5",
        content:
          "What are the best practices for database design in backend development?",
        sender: "user",
        timestamp: new Date("2024-01-10T14:00:00"),
      },
      {
        id: "6",
        content:
          "Great question! As a Level 9 Backend Engineer, here are the key database design principles I always follow:\n\n**1. Normalization & Denormalization**\n• Start with 3NF (Third Normal Form)\n• Denormalize strategically for performance\n\n**2. Indexing Strategy**\n• Index frequently queried columns\n• Avoid over-indexing (impacts writes)\n\n**3. Data Types & Constraints**\n• Use appropriate data types\n• Implement proper constraints\n\n**4. Scalability Planning**\n• Consider partitioning strategies\n• Plan for horizontal scaling\n\nWe have an excellent Database Design course that covers all these topics in depth. Would you like me to show you where to find it?",
        sender: "kap",
        timestamp: new Date("2024-01-10T14:02:00"),
      },
    ],
  },
  {
    id: "3",
    title: "Platform Navigation Help",
    category: "navigation",
    createdAt: new Date("2024-01-08"),
    updatedAt: new Date("2024-01-08"),
    messages: [
      {
        id: "7",
        content:
          "I'm having trouble finding the interview preparation section. Can you help?",
        sender: "user",
        timestamp: new Date("2024-01-08T16:00:00"),
      },
      {
        id: "8",
        content:
          "The interview preparation section is one of my favorite features. Here's how to access it:\n\n**Method 1: Sidebar Navigation**\n• Look for \"Interviews\" in the left sidebar\n• Click on it to see all interview types\n\n**Method 2: Direct Navigation**\n• I can take you there directly: [Interview Section](/interviews)\n\n**What you'll find:**\n• 🧠 Algorithm Challenges\n• 💼 Project-based Interviews\n• 🎯 Mock Interview Sessions\n• 📊 Performance Analytics\n\nWhich type of interview prep are you most interested in?",
        sender: "kap",
        timestamp: new Date("2024-01-08T16:01:00"),
      },
    ],
  },
];

// Suggested questions
export const suggestedQuestions: KapSuggestedQuestion[] = [
  {
    id: "1",
    question: "How do I get started with my first course?",
    category: "learning",
    icon: "🚀",
  },
  {
    id: "2",
    question: "Where can I find the interview preparation section?",
    category: "navigation",
    icon: "🧭",
  },
  {
    id: "3",
    question: "What are the best practices for API design?",
    category: "technical",
    icon: "⚡",
  },
  {
    id: "4",
    question: "How do I track my learning progress?",
    category: "platform",
    icon: "📊",
  },
  {
    id: "5",
    question: "Can you explain microservices architecture?",
    category: "technical",
    icon: "🏗️",
  },
  {
    id: "6",
    question: "How do I join the community discussions?",
    category: "platform",
    icon: "💬",
  },
  {
    id: "7",
    question: "What's the difference between bootcamps and courses?",
    category: "learning",
    icon: "🎓",
  },
  {
    id: "8",
    question: "How do I access my certificates?",
    category: "navigation",
    icon: "🏆",
  },
];

// Kap's personality and knowledge base
export const kapPersonality = {
  name: "Kap",
  title: "Level 9 Backend Engineer & AI Assistant",
  expertise: [
    "Backend Development",
    "System Architecture",
    "Database Design",
    "API Development",
    "DevOps & Cloud",
    "Performance Optimization",
    "Security Best Practices",
    "MasteringBackend Platform",
  ],
  traits: [
    "Professional and friendly",
    "Highly knowledgeable",
    "Patient and helpful",
    "Practical and solution-oriented",
    "Encouraging and supportive",
  ],
};

// Platform knowledge for Kap
export const platformKnowledge = {
  courses: {
    description: "Comprehensive backend development courses",
    features: ["Video lessons", "Hands-on projects", "Quizzes", "Certificates"],
    navigation: "/courses",
  },
  bootcamps: {
    description: "Intensive, structured learning programs",
    features: [
      "Weekly modules",
      "Live sessions",
      "Mentorship",
      "Career support",
    ],
    navigation: "/bootcamps",
  },
  interviews: {
    description: "Technical interview preparation",
    features: [
      "Algorithm challenges",
      "Project interviews",
      "Mock sessions",
      "Analytics",
    ],
    navigation: "/interviews",
  },
  projects: {
    description: "Real-world project portfolio",
    features: ["Guided projects", "Code reviews", "Deployment", "Showcase"],
    navigation: "/projects",
  },
  community: {
    description: "Connect with fellow developers",
    features: ["Discussions", "Code sharing", "Mentorship", "Events"],
    navigation: "/community",
  },
  roadmaps: {
    description: "Structured learning paths",
    features: [
      "Career guidance",
      "Skill progression",
      "Industry insights",
      "Milestones",
    ],
    navigation: "/roadmaps",
  },
};
