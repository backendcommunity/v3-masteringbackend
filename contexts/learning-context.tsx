'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  LearningPath,
  generateLearningPath,
  markItemAsCompleted,
  calculateProgress,
  UserExperienceLevel,
} from '@/lib/learning-path-generator';

export interface OnboardingAnswers {
  goal: string;
  experienceLevel: UserExperienceLevel;
}

interface LearningContextType {
  // Onboarding state
  hasCompletedOnboarding: boolean;
  onboardingAnswers: OnboardingAnswers | null;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;

  // Learning path state
  learningPath: LearningPath | null;
  generatePath: (goal: string, experienceLevel: UserExperienceLevel) => void;
  completeItem: (itemId: string) => void;
  getCurrentPhaseItems: () => any[];
  getPhaseProgress: (phase: string) => { completed: number; total: number };
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [onboardingAnswers, setOnboardingAnswers] = useState<OnboardingAnswers | null>(null);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);

  const completeOnboarding = useCallback((answers: OnboardingAnswers) => {
    setOnboardingAnswers(answers);
    setHasCompletedOnboarding(true);
    // Generate learning path automatically
    const path = generateLearningPath(answers.goal, answers.experienceLevel);
    setLearningPath(path);
  }, []);

  const skipOnboarding = useCallback(() => {
    // Skip with default answers
    const defaultAnswers: OnboardingAnswers = {
      goal: 'Backend Fundamentals',
      experienceLevel: 'beginner',
    };
    completeOnboarding(defaultAnswers);
  }, [completeOnboarding]);

  const resetOnboarding = useCallback(() => {
    setHasCompletedOnboarding(false);
    setOnboardingAnswers(null);
    setLearningPath(null);
  }, []);

  const generatePath = useCallback((goal: string, experienceLevel: UserExperienceLevel) => {
    const path = generateLearningPath(goal, experienceLevel);
    setLearningPath(path);
  }, []);

  const completeItem = useCallback((itemId: string) => {
    if (!learningPath) return;
    const updatedPath = markItemAsCompleted(learningPath, itemId);
    setLearningPath(updatedPath);
  }, [learningPath]);

  const getCurrentPhaseItems = useCallback(() => {
    if (!learningPath) return [];
    return learningPath.items.filter((item) => item.phase === learningPath.currentPhase);
  }, [learningPath]);

  const getPhaseProgress = useCallback((phase: string) => {
    if (!learningPath) return { completed: 0, total: 0 };
    const phaseItems = learningPath.items.filter((item) => item.phase === phase);
    const completed = phaseItems.filter((item) => item.completed).length;
    return { completed, total: phaseItems.length };
  }, [learningPath]);

  return (
    <LearningContext.Provider
      value={{
        hasCompletedOnboarding,
        onboardingAnswers,
        completeOnboarding,
        skipOnboarding,
        resetOnboarding,
        learningPath,
        generatePath,
        completeItem,
        getCurrentPhaseItems,
        getPhaseProgress,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const context = useContext(LearningContext);
  if (context === undefined) {
    throw new Error('useLearning must be used within a LearningProvider');
  }
  return context;
}
