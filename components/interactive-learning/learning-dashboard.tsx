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
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 lg:py-10 space-y-8">
        {/* Header */}
        <header className="space-y-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Target className="w-7 md:w-8 h-7 md:h-8 text-primary flex-shrink-0" aria-hidden="true" />
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">Your Learning Path</h1>
          </div>
          <p className="text-base md:text-lg text-muted-foreground">{learningPath.goal}</p>
        </header>

        {/* Overall Progress Card */}
        <Card className="border shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Overall Progress</CardTitle>
                <CardDescription>
                  {learningPath.progress.completed} of {learningPath.progress.total} items completed
                </CardDescription>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-primary">
                {learningPath.progress.percentage}%
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Progress value={learningPath.progress.percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">Measure of completion across all phases</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['learn', 'build', 'grow'] as LearningPhase[]).map((phase) => {
                const progress = getPhaseProgress(phase);
                const phaseInfo = PHASE_INFO[phase];
                const isActive = phase === learningPath.currentPhase;
                const percentage = (progress.completed / progress.total) * 100;
                
                return (
                  <div
                    key={phase}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                    role="region"
                    aria-label={`${phase} phase progress`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg" aria-hidden="true">{phaseInfo.icon}</span>
                      <span className="font-semibold capitalize text-sm text-foreground">{phase}</span>
                      {isActive && <Badge className="ml-auto text-xs">Current</Badge>}
                    </div>
                    <div className="text-2xl font-bold text-foreground mb-2">
                      {progress.completed}/{progress.total}
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Current Phase Section */}
        <section>
          <CurrentPhaseSection />
        </section>

        {/* Learning Path Roadmap */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Your Complete Roadmap</h2>
          </div>
          <LearningPathRoadmap />
        </section>
      </div>
    </main>
  );
}
