"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { CourseCertificatePage } from "@/components/pages/course-certificate";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

function CertPageInner() {
  const router = useRouter();
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const certCode = searchParams?.get("code") ?? undefined;

  return (
    <DashboardLayout>
      <CourseCertificatePage slug={slug} certCode={certCode} onNavigate={(path) => router.push(path)} />
    </DashboardLayout>
  );
}

export default function CourseCertificatePageRoute() {
  return (
    <Suspense>
      <CertPageInner />
    </Suspense>
  );
}
