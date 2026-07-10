"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  Award,
  Calendar,
  CheckCircle2,
  BookOpen,
  Star,
  Zap,
  Copy,
  Check,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Course } from "@/lib/data";
import React, { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { CompletionShare } from "@/components/week-completion-share";
import { toast } from "sonner";

interface CertificateProps {
  courseName: string;
  studentName: string;
  instructorName: string;
  type: string;
  completionDate: string;
  course: Course | any;
  certCode?: string;
  onDownload?: () => void;
  onShare?: () => void;
}

export function Certificate({
  courseName,
  studentName,
  course,
  type = "course",
  instructorName,
  completionDate,
  certCode,
  onDownload,
  onShare,
}: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setQrUrl(
      certCode
        ? `${window.location.origin}/certifications/verify/${certCode}`
        : window.location.href,
    );
  }, []);

  const handleDownload = async () => {
    if (!certificateRef.current) return;

    setIsGeneratingPDF(true);

    // Render the HTML element to canvas
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = imgProps.width;
    const imgHeight = imgProps.height;

    // Calculate scale to fit image within PDF page, preserving aspect ratio
    const scale = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Center the image precisely
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Add image to PDF
    pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

    // Download the file
    pdf.save(`${studentName}-certificate.pdf`);
    setIsGeneratingPDF(false);

    onDownload?.();
  };

  const handleLinkedInShare = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`I completed ${courseName}`)}&summary=${encodeURIComponent(`I just earned a certificate for completing ${courseName} on Mastering Backend! @masteringbackend`)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const handleTwitterShare = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const text = `I just earned a certificate for completing ${courseName} on @master_backend! 🎓\n\nJoin me and level up your backend engineering skills!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleAddToResume = async () => {
    try {
      const resumeText = `Certificate of Completion\nCourse: ${courseName}\nCompletion Date: ${completionDate}\nInstructor: ${instructorName}\nIssued by: Mastering Backend`;
      await navigator.clipboard.writeText(resumeText);
      setCopiedResume(true);
      toast.success("Certificate details copied to clipboard!");
      setTimeout(() => setCopiedResume(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const getCompletionStats = () => {
    if (type.includes("Roadmap")) {
      return [
        {
          icon: BookOpen,
          value: course?.userRoadmap?.userTopics?.length ?? 0,
          label: "Milestones",
          color: "#13AECE",
        },
        { icon: Award, value: course?.level, label: "Level", color: "#F2C94C" },
        { icon: Zap, value: "100%", label: "Progress", color: "#27AE60" },
      ];
    } else if (type.includes("bootcamp")) {
      return [
        {
          icon: BookOpen,
          value: course?.userCohort?.totalLessonsCompleted ?? 0,
          label: "Lessons",
          color: "#13AECE",
        },
        {
          icon: Award,
          value: (course?.userCohort?.progress ?? 100) + "%",
          label: "Progress",
          color: "#F2C94C",
        },
        {
          icon: Star,
          value: course?.cohort?.duration
            ? course.cohort.duration + " weeks"
            : "Completed",
          label: "Duration",
          color: "#27AE60",
        },
      ];
    }
    return [
      {
        icon: BookOpen,
        value: course?.userCourse?.userChapters?.length ?? 0,
        label: "Chapters",
        color: "#13AECE",
      },
      { icon: Award, value: course?.level, label: "Level", color: "#F2C94C" },
      { icon: Zap, value: "100%", label: "Progress", color: "#27AE60" },
    ];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Certificate Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Course Completed!</h2>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShareDialogOpen(true)} variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Certificate
          </Button>
          <Button
            onClick={handleDownload}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Certificate Display */}
      <Card
        ref={certificateRef}
        className={
          isGeneratingPDF
            ? "w-[1100px] mx-auto relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-primary/30"
            : "relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-primary/30"
        }
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-background  to-primary"></div>

        <div
          className={
            isGeneratingPDF ? "flex justify-end p-5" : "absolute top-4 right-4"
          }
        >
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200 flex items-center"
          >
            <Award className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        </div>

        <CardContent className="p-12 text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="flex flex-col items-center justify-center h-xs w-md">
                <img src="/logo.png" alt="logo" />

                <h1 className="text-3xl font-bold text-gray-900">
                  Masteringbackend
                </h1>
              </div>
            </div>

            <p className="text-lg text-gray-600">Certificate of Completion</p>
          </div>

          {/* Certificate Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-lg text-gray-700">This is to certify that</p>
              <h2 className="text-4xl font-bold text-gray-900 border-b-2 border-gray-300 pb-2 inline-block">
                {studentName}
              </h2>
            </div>

            <div className="space-y-2">
              <p className="text-lg text-gray-700">
                has successfully completed the{" "}
                {type === "bootcamp"
                  ? "bootcamp"
                  : type === "roadmap"
                    ? "roadmap"
                    : "course"}{" "}
              </p>
              <h3 className="text-2xl font-semibold text-primary">
                {courseName}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  Completion Date
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <p className="font-semibold text-gray-900">
                    {completionDate}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  Instructor
                </p>
                <p className="font-semibold text-gray-900">{instructorName}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 uppercase tracking-wide">
                  Certificate ID
                </p>
                <p className="font-mono text-sm text-gray-600">
                  MB-{Date.now().toString().slice(-6)}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-left">
                <div className="w-32 h-px bg-gray-400 mb-2"></div>
                <p className="text-sm text-gray-600">Instructor Signature</p>
                <p className="text-sm font-medium text-gray-900">
                  {instructorName}
                </p>
              </div>

              <div className="text-center">
                <Award className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  Verified by Masteringbackend
                </p>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center gap-1">
                  <QRCodeCanvas
                    value={qrUrl}
                    size={100}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <p className="text-xs text-gray-500">Scan to verify</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details */}
      <Card className="w-full">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Certificate Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              {type.includes("Roadmap") ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Roadmap Duration:</span>
                  <span className="font-medium">{course?.timeframe}</span>
                </div>
              ) : type.includes("bootcamp") ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Bootcamp Duration:</span>
                  <span className="font-medium">
                    {course?.cohort?.duration} weeks
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Duration:</span>
                  <span className="font-medium">
                    {course?.totalDuration ?? course?.duration} hours
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Skill Level:</span>
                <span className="font-medium">{course?.level}</span>
              </div>
              {type.includes("Roadmap") ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Milestones Completed:</span>
                  <span className="font-medium">
                    {course?.userRoadmap?.userTopics?.length ?? 0}/
                    {course?.topics?.length}
                  </span>
                </div>
              ) : type.includes("bootcamp") ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">Lessons Completed:</span>
                  <span className="font-medium">
                    {course?.userCohort?.totalLessonsCompleted}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-600">Chapters Completed:</span>
                  <span className="font-medium">
                    {course?.userCourse?.userChapters?.length ?? 0}/
                    {course?.chapters?.length}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Final Score:</span>

                {type.includes("bootcamp") ? (
                  <span className="font-medium text-green-600">
                    {course?.userCohort?.progress}%
                  </span>
                ) : (
                  <span className="font-medium text-green-600">
                    {course?.progress}%
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Verification:</span>
                <span className="font-medium text-primary">
                  GloballyCheck Verified
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry:</span>
                <span className="font-medium">Never</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sharing Options */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Share Your Achievement</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={handleLinkedInShare}
              variant="outline"
              className="justify-start"
            >
              <Linkedin className="mr-2 h-4 w-4 text-primary" />
              Share on LinkedIn
            </Button>
            <Button
              onClick={handleTwitterShare}
              variant="outline"
              className="justify-start"
            >
              <Twitter className="mr-2 h-4 w-4 text-primary" />
              Share on Twitter
            </Button>
            <Button
              onClick={handleAddToResume}
              variant="outline"
              className="justify-start"
            >
              {copiedResume ? (
                <Check className="mr-2 h-4 w-4 text-green-600" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {copiedResume ? "Copied!" : "Add to Resume"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      <CompletionShare
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        heading="Certificate Earned!"
        title={courseName}
        subtitle={
          type.includes("bootcamp")
            ? "Bootcamp"
            : type.includes("Roadmap")
              ? "Roadmap"
              : "Course"
        }
        userName={studentName}
        stats={getCompletionStats()}
        shareText={`I just earned a certificate for completing ${courseName} on Mastering Backend! 🎓`}
      />
    </div>
  );
}
