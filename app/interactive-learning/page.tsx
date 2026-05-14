'use client';

import React, { useEffect, useState } from 'react';
import { LearningProvider, useLearning } from '@/contexts/learning-context';
import { LearningDashboard } from '@/components/interactive-learning/learning-dashboard';
import { OnboardingModal } from '@/components/interactive-learning/onboarding-modal';
import { LearningSidebar } from '@/components/interactive-learning/learning-sidebar';

function InteractiveLearningContent() {
  const { hasCompletedOnboarding } = useLearning();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal isOpen={!hasCompletedOnboarding} />

      {/* Main Layout - Sidebar + Content */}
      {hasCompletedOnboarding && (
        <div className="flex min-h-screen">
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
