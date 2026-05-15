"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { routes } from "@/lib/routes";
import { useEffect, useState } from "react";
import { Project30 } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { Certificate } from "../certificate";
import { formatDate } from "@/lib/utils";

interface Project30CertificatePageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export function Project30CertificatePage({
  slug,
  onNavigate,
}: Project30CertificatePageProps) {
  const store = useAppStore();
  const [project30, setProject] = useState<Project30>();
  const [loading, setLoading] = useState(false);
  const user = useUser();

  useEffect(() => {
    setLoading(true);
    async function findProject(slug: string) {
      const project30 = await store.getProject30(slug);
      setProject(project30);
      setLoading(false);
    }
    findProject(slug);
  }, [slug]);

  if (loading || !project30) return <div>loading.asa..</div>;

  const handleBackToProject = () => {
    const project30Path = routes.project30Detail(slug);
    onNavigate(project30Path);
  };

  const handleDownload = () => {};

  const handleShare = () => {
    // In a real app, this would open sharing options
    if (navigator.share) {
      navigator.share({
        title: `I completed ${project30.title} on MasteringBackend!`,
        text: `Check out my certificate for completing ${project30.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Only show certificate if project30 is completed
  if (project30?.progress !== 100) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBackToProject}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Certificate Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Complete the project30 to earn your certificate.
          </p>
          <Button onClick={handleBackToProject}>Continue Learning</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleBackToProject}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Project
        </Button>
      </div>

      {/* Certificate */}
      <Certificate
        type="project30"
        courseName={project30.title}
        studentName={user?.name ?? ""}
        instructorName={project30?.instructor?.name ?? "Masteringbackend"}
        completionDate={formatDate(
          project30.userProject30.updatedAt + "",
          user?.settings?.dateFormat,
        )}
        course={project30}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}
