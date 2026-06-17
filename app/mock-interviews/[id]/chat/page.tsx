"use client";

import { useParams } from "next/navigation";
import { ChatInterviewRoom } from "@/components/pages/mock-interviews/chat/chat-interview-room";

export default function ChatInterviewPage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) return null;

  return <ChatInterviewRoom userInterviewId={id} />;
}
