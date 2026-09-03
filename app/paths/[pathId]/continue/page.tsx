"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LearningPathContinueRedirect() {
  const router = useRouter();
  const { pathId } = useParams() as { pathId: string };

  useEffect(() => {
    router.replace(`/paths/${pathId}`);
  }, [pathId, router]);

  return null;
}
