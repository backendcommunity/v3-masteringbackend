"use client";

import { useParams } from "next/navigation";
import { ChatInterviewReplayRoom } from "@/components/pages/mock-interviews/chat/chat-interview-replay-room";

export default function MockInterviewResultsPageRoute() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";

  if (!id) return null;

  return <ChatInterviewReplayRoom sessionId={id} />;
}
