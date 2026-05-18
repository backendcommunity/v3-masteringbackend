"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CoursePreviewRedirect() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  useEffect(() => {
    router.replace(`/courses/${slug}`);
  }, [slug, router]);
  return null;
}
