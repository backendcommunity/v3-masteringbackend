'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLearning, type OnboardingAnswers } from '@/contexts/learning-context';
import { UserExperienceLevel } from '@/lib/learning-path-generator';
import { Zap, BookOpen, Lightbulb, Brain } from 'lucide-react';

const LEARNING_GOALS = [
  {
    id: 'backend-fundamentals',
    title: 'Backend Fundamentals',
    description: 'Master core backend concepts and build APIs',
    icon: BookOpen,
  },
  {
    id: 'fullstack-development',
    title: 'Full-stack Development',
    description: 'Build complete applications from frontend to backend',
    icon: Zap,
  },
  {
    id: 'web-performance',
    title: 'Web Performance',
    description: 'Optimize systems for speed and scale',
    icon: Lightbulb,
  },
  {
    id: 'devops-infrastructure',
    title: 'DevOps & Infrastructure',
    description: 'Deploy and manage scalable systems',
    icon: Brain,
  },
];

const EXPERIENCE_LEVELS: { value: UserExperienceLevel; label: string; description: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Just starting or new to this area',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Some experience, ready to advance',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Experienced, looking for mastery',
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
}

export function OnboardingModal({ isOpen }: OnboardingModalProps) {
  const { completeOnboarding, skipOnboarding } = useLearning();
  const [step, setStep] = useState<'goal' | 'experience'>('goal');
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<UserExperienceLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoalSelect = (goalId: string) => {
    setSelectedGoal(goalId);
  };

  const handleExperienceSelect = (level: UserExperienceLevel) => {
    setSelectedExperience(level);
  };

  const handleNext = () => {
    if (step === 'goal' && selectedGoal) {
      setStep('experience');
    }
  };

  const handleComplete = () => {
    if (!selectedGoal || !selectedExperience) return;

    setIsLoading(true);
    // Simulate path generation delay
    setTimeout(() => {
      completeOnboarding({
        goal: selectedGoal,
        experienceLevel: selectedExperience,
      });
      setIsLoading(false);
    }, 500);
  };

  const handleSkip = () => {
    skipOnboarding();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">
            {step === 'goal' ? 'What do you want to learn?' : 'What&apos;s your experience level?'}
          </CardTitle>
          <CardDescription>
            {step === 'goal'
              ? 'Choose a learning path that matches your goals'
              : 'We&apos;ll tailor the content to your experience'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === 'goal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEARNING_GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalSelect(goal.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === 'experience' && (
            <div className="grid grid-cols-1 gap-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => handleExperienceSelect(level.value)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedExperience === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <h3 className="font-semibold text-gray-900">{level.label}</h3>
                  <p className="text-sm text-gray-600">{level.description}</p>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-6">
            {step === 'experience' && (
              <Button
                variant="outline"
                onClick={() => setStep('goal')}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
            )}

            {step === 'goal' && (
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip for now
              </Button>
            )}

            <Button
              onClick={step === 'goal' ? handleNext : handleComplete}
              disabled={
                (step === 'goal' && !selectedGoal) ||
                (step === 'experience' && !selectedExperience) ||
                isLoading
              }
              className="flex-1"
            >
              {isLoading ? 'Generating path...' : step === 'goal' ? 'Next' : 'Start Learning'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
