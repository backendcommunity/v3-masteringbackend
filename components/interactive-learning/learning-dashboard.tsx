'use client';

import React from 'react';
import { useLearning } from '@/contexts/learning-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Hammer,
  TrendingUp,
  CheckCircle2,
  Circle,
  ArrowRight,
  Zap,
  Target,
} from 'lucide-react';
import { LearningPhase } from '@/lib/learning-path-generator';
import { LearningPathRoadmap } from './learning-path-roadmap';
import { CurrentPhaseSection } from './current-phase-section';

const PHASE_INFO: Record<LearningPhase, { icon: React.ReactNode; color: string; description: string }> = {
  learn: {
    icon: <BookOpen className="w-5 h-5" />,
    color: 'bg-blue-50 border-blue-200',
    description: 'Build foundational knowledge through lessons and tutorials',
  },
  build: {
    icon: <Hammer className="w-5 h-5" />,
    color: 'bg-purple-50 border-purple-200',
    description: 'Apply your knowledge by building real projects',
  },
  grow: {
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-green-50 border-green-200',
    description: 'Master advanced concepts through challenges and optimization',
  },
};

export function LearningDashboard() {
  const { learningPath, completeItem, getPhaseProgress } = useLearning();

  if (!learningPath) {
    return null;
  }

  const currentPhaseInfo = PHASE_INFO[learningPath.currentPhase];
  const phaseProgress = getPhaseProgress(learningPath.currentPhase);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Target className="w-6 md:w-8 h-6 md:h-8 text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Your Learning Path</h1>
          </div>
          <p className="text-base md:text-lg text-gray-600">{learningPath.goal}</p>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  {learningPath.progress.completed} of {learningPath.progress.total} items completed
                </CardDescription>
              </div>
              <div className="text-4xl font-bold text-blue-600">
                {learningPath.progress.percentage}%
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={learningPath.progress.percentage} className="h-3" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {(['learn', 'build', 'grow'] as LearningPhase[]).map((phase) => {
                const progress = getPhaseProgress(phase);
                const phaseInfo = PHASE_INFO[phase];
                return (
                  <div
                    key={phase}
                    className={`p-4 rounded-lg border ${
                      phase === learningPath.currentPhase ? phaseInfo.color : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{phaseInfo.icon}</span>
                      <span className="font-semibold capitalize text-sm">{phase}</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {progress.completed}/{progress.total}
                    </div>
                    <Progress value={(progress.completed / progress.total) * 100} className="h-2 mt-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Phase Section */}
        <CurrentPhaseSection />

        {/* Learning Path Roadmap */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-gray-900">Your Complete Roadmap</h2>
          </div>
          <LearningPathRoadmap />
        </div>
      </div>
    </div>
  );
}
