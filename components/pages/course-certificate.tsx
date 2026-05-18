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

interface CourseCertificatePageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function CourseCertificatePage({
  slug,
  onNavigate,
}: CourseCertificatePageProps) {
  const store = useAppStore();
  const [course, setCourse] = useState<Course>();
  const [userCourse, setUserCourse] = useState<UserCourse>();
  const [loading, setLoading] = useState(false);
  const user = useUser();

  useEffect(() => {
    setLoading(true);
    async function loadData(slug: string) {
      const [courseData, userCourseData] = await Promise.allSettled([
        store.getCourse(slug),
        store.getUserCourse(slug),
      ]);
      if (courseData.status === "fulfilled") setCourse(courseData.value);
      if (userCourseData.status === "fulfilled") setUserCourse(userCourseData.value);
      setLoading(false);
    }
    loadData(slug);
  }, [slug]);

  if (loading) return <Loader isLoader={false} />;
  if (!course) return <div>No course found</div>;

  const completionDate = userCourse?.completedAt
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

  // Only show certificate if course is completed
  if (course?.progress !== 100) {
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
        studentName={user?.name!}
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
