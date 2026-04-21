"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

type Params = { pathId: string; topicId: string; courseSlug: string };

// Redirect bare course path to the preview page
export default function PathCourseRedirect() {
  const { pathId, topicId, courseSlug } = useParams() as Params;
  const router = useRouter();

  useEffect(() => {
    router.replace(`/paths/${pathId}/${topicId}/${courseSlug}/preview`);
  }, [pathId, topicId, courseSlug, router]);

  return null;
}
