"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Bootcamp } from "@/lib/data";
import { useUser } from "@/hooks/use-user";
import { Certificate } from "../certificate";
import { formatDate } from "@/lib/utils";
import { Loader } from "../ui/loader";

interface BootcampCertificatePageProps {
  id: string;
  onNavigate: (path: string) => void;
}

export function BootcampCertificatePage({
  id,
  onNavigate,
}: BootcampCertificatePageProps) {
  const store = useAppStore();
  const [bootcamp, setBootcamp] = useState<Bootcamp>();
  const [loading, setLoading] = useState(false);
  const user = useUser();

  useEffect(() => {
    setLoading(true);
    async function load(id: string) {
      const bootcamp = await store.getBootcamp(id);
      setBootcamp(bootcamp);
      setLoading(false);
    }
    load(id);
  }, [id]);
  const handleBack = () => {
    onNavigate(`/bootcamps/${id}`);
  };
  if (loading) return <Loader isLoader={false} />;
  if (!bootcamp)
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => onNavigate("/bootcamps")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bootcamp
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Bootcamp Not Available</h2>
          <Button onClick={() => onNavigate("/bootcamps")}>
            Back to Bootcamps
          </Button>
        </div>
      </div>
    );

  const handleDownload = () => {};

  const handleShare = () => {
    // In a real app, this would open sharing options
    if (navigator.share) {
      navigator.share({
        title: `I completed ${bootcamp?.title} on MasteringBackend!`,
        text: `Check out my certificate for completing ${bootcamp?.title}`,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Only show certificate if bootcamp is completed
  if (bootcamp?.userCohort?.progress !== 100) {
    return (
      <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bootcamp
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Certificate Not Available</h2>
          <p className="text-muted-foreground mb-6">
            Complete the bootcamp to earn your certificate.
          </p>
          <Button onClick={handleBack}>Continue Learning</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bootcamp
        </Button>
      </div>

      {/* Certificate */}
      <Certificate
        type="bootcamp"
        courseName={bootcamp.title}
        studentName={user?.name!}
        instructorName={bootcamp?.instructor ?? "Masteringbackend"}
        completionDate={formatDate(bootcamp?.userCohort?.updatedAt + "", user?.settings?.dateFormat)}
        course={bootcamp}
        onDownload={handleDownload}
        onShare={handleShare}
      />
    </div>
  );
}
