"use client";

import { useEffect, useRef, useState } from "react";
import { DemoChatInterviewRoom } from "@/components/pages/mock-interviews/chat/demo-chat-interview-room";
import { InterviewCompletionDialog } from "@/components/pages/mock-interviews/chat/interview-completion-dialog";
import { useGuidedTour } from "@/hooks/use-guided-tour";
import {
  MOCK_INTERVIEW_STEPS,
  mockInterviewSampleControls,
  type DemoControls,
} from "@/lib/mock-interview-tour";
import { analytics } from "@/lib/analytics";
import { MOCK_INTERVIEW_EVENTS } from "@/lib/analytics-events";
import { DEMO_TEMPLATE, DEMO_REPORT } from "@/lib/mock-interview-demo-script";
import { useAppStore } from "@/lib/store";

export default function MockInterviewDemoPage() {
  const controlsRef = useRef<DemoControls | null>(null);
  const sample = useRef(mockInterviewSampleControls(controlsRef)).current;
  const store = useAppStore();

  const [showCompletion, setShowCompletion] = useState(false);
  const [hasFullAccess, setHasFullAccess] = useState(false);

  useEffect(() => {
    analytics.track(MOCK_INTERVIEW_EVENTS.demoStarted, { surface: "demo_page" });
  }, []);

  useGuidedTour({
    ready: true,
    theme: "light",
    track: (event, extra) => {
      analytics.track(event, extra);
      if (event.endsWith("_tour_completed")) {
        analytics.track(MOCK_INTERVIEW_EVENTS.demoCompleted);
        setShowCompletion(true);
        analytics.track(MOCK_INTERVIEW_EVENTS.demoCtaShown);
        store
          .getInterviewAccess()
          .then((a: any) => setHasFullAccess(!!a?.hasAccess && a?.remainingSessions !== 0))
          .catch(() => setHasFullAccess(false));
      }
    },
    steps: MOCK_INTERVIEW_STEPS,
    eventPrefix: "mock_interview",
    autoStart: true,
    alwaysOffer: true,
    actions: sample.actions,
    reveals: sample.reveals,
  });

  return (
    <div className="mx-auto h-[calc(100vh-4rem)] w-full max-w-6xl p-2 sm:p-4">
      <DemoChatInterviewRoom controlsRef={controlsRef} />
      <InterviewCompletionDialog
        open={showCompletion}
        onClose={() => setShowCompletion(false)}
        currentTemplateId={DEMO_TEMPLATE.id}
        currentCategory={DEMO_TEMPLATE.category}
        overallScore={DEMO_REPORT.overallScore}
        hasFullAccess={hasFullAccess}
        source="demo"
      />
    </div>
  );
}
