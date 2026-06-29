"use client";

import { useEffect, useRef } from "react";
import { DemoChatInterviewRoom } from "@/components/pages/mock-interviews/chat/demo-chat-interview-room";
import { useGuidedTour } from "@/hooks/use-guided-tour";
import {
  MOCK_INTERVIEW_STEPS,
  mockInterviewSampleControls,
  type DemoControls,
} from "@/lib/mock-interview-tour";
import { analytics } from "@/lib/analytics";
import { MOCK_INTERVIEW_EVENTS } from "@/lib/analytics-events";

export default function MockInterviewDemoPage() {
  const controlsRef = useRef<DemoControls | null>(null);
  const sample = useRef(mockInterviewSampleControls(controlsRef)).current;

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
    <div className="mx-auto h-[calc(100vh-4rem)] w-full max-w-4xl p-2 sm:p-4">
      <DemoChatInterviewRoom controlsRef={controlsRef} />
    </div>
  );
}
