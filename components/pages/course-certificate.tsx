"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Certificate } from "@/components/certificate";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { Course, UserCourse } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { Loader } from "../ui/loader";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface VerifiedCert {
  code: string;
  holderName: string;
  courseName: string;
  finalScore: number;
  issuedAt: string;
}

interface CourseCertificatePageProps {
  slug: string;
  certCode?: string;
  onNavigate: (path: string) => void;
}

export function CourseCertificatePage({
  slug,
  certCode,
  onNavigate,
}: CourseCertificatePageProps) {
  const store = useAppStore();
  const [course, setCourse] = useState<Course>();
  const [userCourse, setUserCourse] = useState<UserCourse>();
  const [verifiedCert, setVerifiedCert] = useState<VerifiedCert | null>(null);
  const [certInvalid, setCertInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = useUser();

  useEffect(() => {
    setLoading(true);
    async function loadData(slug: string) {
      const promises: Promise<any>[] = [
        store.getCourse(slug),
        store.getUserCourse(slug),
      ];
      if (certCode) {
        promises.push(
          api.get(`/certifications/verify/${certCode}`)
            .then((res) => res.data)
            .catch(() => null)
        );
      }
      const [courseData, userCourseData, certData] = await Promise.allSettled(promises);
      if (courseData.status === "fulfilled") setCourse(courseData.value);
      if (userCourseData.status === "fulfilled") setUserCourse(userCourseData.value);
      if (certCode) {
        const cert = certData?.status === "fulfilled" ? certData.value : null;
        if (cert?.data?.valid) {
          setVerifiedCert(cert.data.certificate);
        } else {
          setCertInvalid(true);
        }
      }
      setLoading(false);
    }
    loadData(slug);
  }, [slug, certCode]);

  if (loading) return <Loader isLoader={false} />;
  if (!course) return <div>No course found</div>;

  // If a certCode was supplied but verification failed, show invalid state
  if (certCode && certInvalid) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => onNavigate(routes.courseDetail(slug))}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Invalid Certificate</h2>
          <p className="text-muted-foreground">This certificate code could not be verified.</p>
        </div>
      </div>
    );
  }

  // Use verified cert data when accessed via code, else fall back to userCourse/user
  const studentName = verifiedCert?.holderName ?? user?.name ?? "";
  const completionDate = verifiedCert
    ? new Date(verifiedCert.issuedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : userCourse?.completedAt
      ? new Date(userCourse.completedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleBackToCourse = () => {
    onNavigate(routes.courseDetail(slug));
  };

  const handleDownload = () => {
    // Certificate component handles PDF generation; this is the post-download callback
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `I completed ${course?.title} on MasteringBackend!`,
        text: `Check out my certificate for completing ${course?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Certificate link copied to clipboard!");
    }
  };

  // Show certificate if: course completed OR accessed via a valid cert code
  if (!verifiedCert && course?.progress !== 100) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBackToCourse}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Certificate Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Complete the course to earn your certificate.
          </p>
          <Button onClick={handleBackToCourse}>Continue Learning</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleBackToCourse}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Course
        </Button>
      </div>

      {/* Certificate */}
      <Certificate
        courseName={course?.title!}
        studentName={studentName}
        type="course"
        instructorName={course?.instructor ?? "Solomon Eseme"}
        completionDate={completionDate}
        course={course!}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}
