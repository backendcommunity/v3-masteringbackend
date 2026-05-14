'use client';

import React, { useEffect, useState } from 'react';
import { LearningProvider, useLearning } from '@/contexts/learning-context';
import { LearningDashboard } from '@/components/interactive-learning/learning-dashboard';
import { OnboardingModal } from '@/components/interactive-learning/onboarding-modal';
import { LearningSidebar } from '@/components/interactive-learning/learning-sidebar';

function InteractiveLearningContent() {
  const { hasCompletedOnboarding } = useLearning();

  return (
    <>
      {/* Onboarding Modal - Show while onboarding not complete */}
      {!hasCompletedOnboarding && <OnboardingModal isOpen={true} />}

      {/* Main Layout - Sidebar + Content - Show after onboarding complete */}
      {hasCompletedOnboarding && (
        <div className="flex min-h-screen bg-gradient-to-br from-background to-muted">
          <LearningSidebar />
          <div className="flex-1 w-full">
            <LearningDashboard />
          </div>
        </div>
      )}
    </>
  );
}

export default function InteractiveLearningPage() {
  return (
    <LearningProvider>
      <InteractiveLearningContent />
    </LearningProvider>
  );
}
