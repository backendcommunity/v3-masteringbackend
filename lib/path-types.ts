// lib/path-types.ts
export type PathStepType =
  | "VIDEO" | "ARTICLE" | "QUIZ" | "EXERCISE"
  | "PROJECT" | "MOCK_INTERVIEW" | "BOOTCAMP" | "RESOURCE";

export type PathStepStatus = "DONE" | "IN_PROGRESS" | "NOT_STARTED";
export type PathRenderMode = "inline" | "playground" | "external";

export interface PathPayloadRef {
  mode: PathRenderMode;
  endpoint: string;
  route: string | null;
}

export interface PathSessionStep {
  id: string;
  order: number;
  type: PathStepType;
  itemId: string;
  groupId: string | null;
  topicId: string;
  title: string;
  url?: string | null;
  maxPoints: number;
  optional: boolean;
  status: PathStepStatus;
  recommended: boolean;
  earnedPoints: number;
  score: number | null;
  passed: boolean | null;
  masteryMet: boolean;
  access: { allowed: boolean; reason: string };
  payloadRef: PathPayloadRef;
}

export interface PathGroup {
  id: string;
  title: string;
  type: "COURSE";
  topicId: string;
  stepIds: string[];
}

export interface PathGroupState {
  id: string;
  progressPct: number;
  status: PathStepStatus;
}

export interface PathSession {
  path: {
    slug: string;
    title: string;
    progressPct: number;
    masteryPct: number;
    earnedPoints: number;
    certThreshold: number;
    isCompleted: boolean;
    certEligible: boolean;
  };
  cursor: {
    currentStepId: string | null;
    nextStepId: string | null;
    resumeStepId: string | null;
  };
  groups: PathGroup[];
  groupsState: PathGroupState[];
  steps: PathSessionStep[];
}

export interface PathSessionDelta {
  step: {
    id: string;
    status: PathStepStatus;
    score: number | null;
    earnedPoints: number;
    masteryMet: boolean;
  };
  cursor: { currentStepId: string | null; nextStepId: string | null };
  path: {
    progressPct: number;
    masteryPct: number;
    earnedPoints: number;
    certEligible: boolean;
  };
}
