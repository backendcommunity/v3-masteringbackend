/**
 * Learning Path Generator
 * Dynamically generates personalized learning paths based on user's goal and experience level
 */

export type LearningPhase = 'learn' | 'build' | 'grow';
export type UserExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface LearningItem {
  id: string;
  title: string;
  description: string;
  phase: LearningPhase;
  order: number;
  duration: string;
  type: 'lesson' | 'project' | 'challenge';
  completed: boolean;
  resources?: string[];
}

export interface LearningPath {
  id: string;
  goal: string;
  experienceLevel: UserExperienceLevel;
  createdAt: Date;
  items: LearningItem[];
  currentPhase: LearningPhase;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

// Learning path templates based on different goals
const GOAL_TEMPLATES: Record<string, Record<UserExperienceLevel, string[]>> = {
  'Backend Fundamentals': {
    beginner: [
      'Introduction to HTTP and REST APIs',
      'Understanding Databases',
      'Authentication & Authorization',
      'Building Your First API',
      'Database Design Patterns',
      'API Security Best Practices',
      'Deploy Your API',
      'Real-world Backend Project',
    ],
    intermediate: [
      'Advanced API Design',
      'Microservices Architecture',
      'Database Optimization',
      'Caching Strategies',
      'Message Queues & Events',
      'Distributed Systems Basics',
      'Deploy Scalable Backend',
      'Large-scale Backend Project',
    ],
    advanced: [
      'System Design Masterclass',
      'Distributed Database Design',
      'High-performance Backend',
      'Event-driven Architecture',
      'Service Mesh & Orchestration',
      'Advanced Security Patterns',
      'Production-grade Infrastructure',
      'Enterprise Backend Project',
    ],
  },
  'Full-stack Development': {
    beginner: [
      'Frontend Basics with React',
      'Backend Basics with Node.js',
      'Connecting Frontend & Backend',
      'State Management Fundamentals',
      'Authentication Flow',
      'Building Forms & Validation',
      'Deploy Your Full-stack App',
      'Full-stack Todo Application',
    ],
    intermediate: [
      'Advanced React Patterns',
      'Advanced Backend Patterns',
      'Real-time Features',
      'Performance Optimization',
      'Testing Strategies',
      'CI/CD Pipelines',
      'Deploy with Docker',
      'Full-stack E-commerce Platform',
    ],
    advanced: [
      'Scalable Architecture Design',
      'Advanced System Design',
      'Optimizing for Scale',
      'Advanced Testing & Monitoring',
      'Multi-tenant Systems',
      'Advanced DevOps',
      'Cloud Infrastructure',
      'Enterprise Full-stack System',
    ],
  },
  'Web Performance': {
    beginner: [
      'Understanding Performance Metrics',
      'Basic Optimization Techniques',
      'Network Optimization',
      'Frontend Performance',
      'Backend Performance',
      'Caching Fundamentals',
      'Monitoring & Analytics',
      'Performance Audit Project',
    ],
    intermediate: [
      'Advanced Caching Strategies',
      'Database Query Optimization',
      'Load Balancing',
      'CDN & Edge Computing',
      'Code Splitting & Bundling',
      'Image Optimization',
      'Performance Testing',
      'E-commerce Performance Project',
    ],
    advanced: [
      'System-wide Performance',
      'Advanced Profiling',
      'Distributed Caching',
      'Traffic Shaping & Rate Limiting',
      'ML-based Optimization',
      'Advanced Monitoring',
      'Capacity Planning',
      'Large-scale Performance Project',
    ],
  },
  'DevOps & Infrastructure': {
    beginner: [
      'Linux Fundamentals',
      'Introduction to Docker',
      'Container Basics',
      'Introduction to Kubernetes',
      'CI/CD Pipelines',
      'Infrastructure as Code',
      'Cloud Basics (AWS/GCP)',
      'Deploy Your First Application',
    ],
    intermediate: [
      'Advanced Docker & Compose',
      'Kubernetes Orchestration',
      'Advanced CI/CD',
      'Infrastructure Automation',
      'Monitoring & Logging',
      'Database Administration',
      'Network Fundamentals',
      'Deploy Microservices Stack',
    ],
    advanced: [
      'Kubernetes at Scale',
      'Service Mesh (Istio)',
      'Advanced Networking',
      'Disaster Recovery',
      'Security & Compliance',
      'Cost Optimization',
      'Multi-cloud Strategy',
      'Enterprise Infrastructure Project',
    ],
  },
};

/**
 * Generates a learning path based on user's goal and experience level
 */
export function generateLearningPath(
  goal: string,
  experienceLevel: UserExperienceLevel
): LearningPath {
  const template = GOAL_TEMPLATES[goal] || GOAL_TEMPLATES['Backend Fundamentals'];
  const topics = template[experienceLevel];

  // Distribute topics across 3 phases: Learn, Build, Grow
  const itemsPerPhase = Math.ceil(topics.length / 3);
  const items: LearningItem[] = [];

  const phaseOrder: LearningPhase[] = ['learn', 'build', 'grow'];
  let itemId = 0;

  phaseOrder.forEach((phase, phaseIndex) => {
    const startIdx = phaseIndex * itemsPerPhase;
    const endIdx = Math.min(startIdx + itemsPerPhase, topics.length);

    for (let i = startIdx; i < endIdx; i++) {
      const topic = topics[i];
      const itemType = getItemType(phaseIndex, i - startIdx);
      
      items.push({
        id: `item-${itemId++}`,
        title: topic,
        description: `Master ${topic.toLowerCase()} through structured learning and hands-on practice`,
        phase,
        order: i - startIdx,
        duration: getEstimatedDuration(phaseIndex),
        type: itemType,
        completed: false,
        resources: generateMockResources(topic),
      });
    }
  });

  return {
    id: `path-${Date.now()}`,
    goal,
    experienceLevel,
    createdAt: new Date(),
    items,
    currentPhase: 'learn',
    progress: {
      completed: 0,
      total: items.length,
      percentage: 0,
    },
  };
}

/**
 * Determine item type based on phase and position
 */
function getItemType(phaseIndex: number, positionInPhase: number): 'lesson' | 'project' | 'challenge' {
  if (phaseIndex === 0) {
    // Learn phase: mostly lessons
    return positionInPhase % 3 === 2 ? 'challenge' : 'lesson';
  } else if (phaseIndex === 1) {
    // Build phase: mix of lessons and projects
    return positionInPhase % 2 === 0 ? 'project' : 'lesson';
  } else {
    // Grow phase: mostly projects and challenges
    return positionInPhase % 2 === 0 ? 'project' : 'challenge';
  }
}

/**
 * Get estimated duration for items in each phase
 */
function getEstimatedDuration(phaseIndex: number): string {
  const durations = [
    '1-2 weeks',  // Learn
    '2-3 weeks',  // Build
    '3-4 weeks',  // Grow
  ];
  return durations[phaseIndex];
}

/**
 * Generate mock resources for a topic
 */
function generateMockResources(topic: string): string[] {
  return [
    `${topic} - Video Course`,
    `${topic} - Documentation`,
    `${topic} - Practice Exercises`,
    `${topic} - Real-world Examples`,
  ];
}

/**
 * Calculate learning path progress
 */
export function calculateProgress(path: LearningPath): LearningPath {
  const completed = path.items.filter((item) => item.completed).length;
  const total = path.items.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    ...path,
    progress: {
      completed,
      total,
      percentage,
    },
  };
}

/**
 * Mark item as completed
 */
export function markItemAsCompleted(
  path: LearningPath,
  itemId: string
): LearningPath {
  const updatedItems = path.items.map((item) =>
    item.id === itemId ? { ...item, completed: true } : item
  );

  // Update current phase if all items in current phase are completed
  let currentPhase = path.currentPhase;
  const phases: LearningPhase[] = ['learn', 'build', 'grow'];
  const currentPhaseIndex = phases.indexOf(currentPhase);
  
  const phaseItems = updatedItems.filter((item) => item.phase === currentPhase);
  const phaseCompleted = phaseItems.every((item) => item.completed);

  if (phaseCompleted && currentPhaseIndex < phases.length - 1) {
    currentPhase = phases[currentPhaseIndex + 1];
  }

  return calculateProgress({
    ...path,
    items: updatedItems,
    currentPhase,
  });
}
