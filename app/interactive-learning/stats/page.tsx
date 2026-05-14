'use client';

import React from 'react';
import { LearningProvider, useLearning } from '@/contexts/learning-context';
import { ProgressStats } from '@/components/interactive-learning/progress-stats';
import { AchievementsPanel } from '@/components/interactive-learning/achievements-panel';
import { LearningSidebar } from '@/components/interactive-learning/learning-sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart4, Award } from 'lucide-react';

function StatsContent() {
  const { hasCompletedOnboarding } = useLearning();

  if (!hasCompletedOnboarding) {
    return null;
  }

  return (
    <div>
      <LearningSidebar />

      <div className="lg:ml-64">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 md:gap-3">
                <BarChart4 className="w-6 md:w-8 h-6 md:h-8 text-blue-600 flex-shrink-0" />
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                  Your Statistics
                </h1>
              </div>
              <p className="text-base md:text-lg text-gray-600">
                Track your progress and achievements
              </p>
            </div>

            {/* Stats Section */}
            <div className="space-y-8">
              <ProgressStats />
            </div>

            {/* Achievements Section */}
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-amber-500" />
                <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              </div>
              <AchievementsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <LearningProvider>
      <StatsContent />
    </LearningProvider>
  );
}
