"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PathCoursePreviewRedirect() {
  const { pathId } = useParams() as { pathId: string };
  const router = useRouter();
  useEffect(() => {
    router.replace(`/paths/${pathId}`);
  }, [pathId, router]);
  return null;
}
