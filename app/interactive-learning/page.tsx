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
    <div>
      {/* Onboarding Modal */}
      <OnboardingModal isOpen={!hasCompletedOnboarding} />

      {/* Sidebar - Only show if onboarding completed */}
      {hasCompletedOnboarding && <LearningSidebar />}

      {/* Main Content */}
      <div className={hasCompletedOnboarding ? 'lg:ml-64' : ''}>
        {hasCompletedOnboarding && <LearningDashboard />}
      </div>
    </div>
  );
}

export default function InteractiveLearningPage() {
  return (
    <LearningProvider>
      <InteractiveLearningContent />
    </LearningProvider>
  );
}
