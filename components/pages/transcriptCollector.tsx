import { useEffect } from "react";
import { useTranscriptions } from "@livekit/components-react";

export function TranscriptCollector({
  onUpdate,
}: {
  onUpdate: (t: string) => void;
}) {
  const transcriptions = useTranscriptions();

  useEffect(() => {
    const full = transcriptions
      .map((t) => `${t.participantInfo?.identity ?? "Unknown"}: ${t.text}`)
      .join("\n");

    onUpdate(full);
  }, [transcriptions]);

  return null;
}
