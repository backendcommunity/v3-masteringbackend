"use client";

import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader } from "@/components/ui/loader";
import { useAppStore } from "@/lib/store";
import type {
  PathCertificate as PathCertificateData,
  PathStepType,
} from "@/lib/path-types";
import { cn } from "@/lib/utils";
import {
  Award,
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  Download,
  GraduationCap,
  Linkedin,
  Lock,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Trophy,
  Twitter,
  AlertCircle,
} from "lucide-react";

const BRAND = "#13AECE";
const BRAND_2 = "#2BB8D8";
const GOLD = "#F2C94C";

const STEP_TYPE_LABELS: Record<PathStepType, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  QUIZ: "Quiz",
  EXERCISE: "Exercise",
  PROJECT: "Project",
  MOCK_INTERVIEW: "Mock Interview",
  BOOTCAMP: "Bootcamp",
  RESOURCE: "Resource",
};

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function formatIssuedAt(iso: string) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

interface PathCertificateProps {
  slug: string;
  pathTitle: string;
}

export function PathCertificate({ slug, pathTitle }: PathCertificateProps) {
  const store = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<PathCertificateData | null>(null);

  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const celebratedRef = useRef(false);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      setError(false);
      const result = await store.getPathCertificate(slug);
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Silent, reduced-motion-safe confetti once on first unlocked load.
  useEffect(() => {
    if (!data || !data.unlocked || celebratedRef.current) return;
    celebratedRef.current = true;
    if (prefersReducedMotion()) return;

    const colors = [BRAND, BRAND_2, GOLD];
    const burst = (originX: number, angle: number) =>
      confetti({
        particleCount: 70,
        spread: 75,
        startVelocity: 48,
        ticks: 140,
        angle,
        origin: { x: originX, y: 0.55 },
        colors,
        disableForReducedMotion: true,
        zIndex: 100,
      });
    burst(0.15, 60);
    burst(0.85, 120);
  }, [data]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    try {
      setIsGeneratingPDF(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const scale = Math.min(
        pdfWidth / imgProps.width,
        pdfHeight / imgProps.height,
      );
      const scaledWidth = imgProps.width * scale;
      const scaledHeight = imgProps.height * scale;
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);
      const name = data?.unlocked ? data.recipientName : "certificate";
      pdf.save(`${name}-${pathTitle}-certificate.pdf`);
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleLinkedInShare = () => {
    if (!data?.unlocked) return;
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
      data.shareUrl,
    )}&title=${encodeURIComponent(
      `I completed the ${pathTitle} learning path`,
    )}&summary=${encodeURIComponent(
      `I just earned my certificate for the ${pathTitle} learning path on Mastering Backend!`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const handleTwitterShare = () => {
    if (!data?.unlocked) return;
    const text = `I just earned my certificate for the ${pathTitle} learning path on @Master_Backend! 🎓\n\nLevelling up my backend engineering skills.`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(data.shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleAddToResume = async () => {
    if (!data?.unlocked) return;
    try {
      const resumeText = `Certificate of Completion\nLearning Path: ${data.pathTitle}\nFinal Score: ${data.finalScore}%\nIssued: ${formatIssuedAt(
        data.issuedAt,
      )}\nCertificate ID: ${data.certId}\nVerify: ${data.shareUrl}\nIssued by: Mastering Backend`;
      await navigator.clipboard.writeText(resumeText);
      setCopiedResume(true);
      toast.success("Certificate details copied to clipboard!");
      setTimeout(() => setCopiedResume(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader isFull={false} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md py-16 px-4">
        <Card className="border-destructive/30">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Couldn&apos;t load your certificate
              </h3>
              <p className="text-sm text-muted-foreground">
                Something went wrong while fetching your certificate. Please try
                again.
              </p>
            </div>
            <Button onClick={fetchCertificate} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── UNLOCKED ──────────────────────────────────────────────────────────────
  if (data.unlocked) {
    const issued = formatIssuedAt(data.issuedAt);
    return (
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_2} 100%)`,
            }}
          >
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <Badge
              className="border-0 font-semibold text-[#1a1305]"
              style={{
                background: `linear-gradient(135deg, ${GOLD} 0%, #d9a93b 100%)`,
              }}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Path Completed
            </Badge>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Congratulations, {data.recipientName.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              You&apos;ve earned your certificate for the{" "}
              <span className="font-semibold text-foreground">
                {data.pathTitle}
              </span>{" "}
              learning path.
            </p>
          </div>
        </div>

        {/* Certificate card (printable) */}
        <div
          ref={certificateRef}
          className={cn(
            "relative mx-auto overflow-hidden rounded-lg border-2 bg-white p-8 text-center sm:p-12",
            isGeneratingPDF ? "w-[1100px]" : "w-full",
          )}
          style={{ borderColor: BRAND }}
        >
          {/* Top accent bar */}
          <div
            className="absolute left-0 top-0 h-2 w-full"
            style={{
              background: `linear-gradient(90deg, ${BRAND} 0%, ${BRAND_2} 50%, ${GOLD} 100%)`,
            }}
          />

          {/* Verified badge */}
          <div className="absolute right-4 top-6">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: "#e6f9fd", color: "#0a7d93" }}
            >
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </span>
          </div>

          <div className="space-y-6 pt-2">
            {/* Brand header */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_2} 100%)`,
                }}
              >
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Masteringbackend
              </h2>
              <p className="text-sm uppercase tracking-[0.2em] text-gray-500">
                Certificate of Completion
              </p>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">This is to certify that</p>
              <h3
                className="inline-block border-b-2 pb-1 text-3xl font-bold text-gray-900 sm:text-4xl"
                style={{ borderColor: GOLD }}
              >
                {data.recipientName}
              </h3>
              <p className="pt-2 text-sm text-gray-600">
                has successfully completed the learning path
              </p>
              <p className="text-xl font-semibold" style={{ color: BRAND }}>
                {data.pathTitle}
              </p>
            </div>

            {/* Meta grid */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Final Score
                </p>
                <p
                  className="mt-1 text-lg font-bold"
                  style={{ color: "#27AE60" }}
                >
                  {data.finalScore}%
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Issued On
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="font-semibold text-gray-900">{issued}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Certificate ID
                </p>
                <p className="mt-1 font-mono text-sm text-gray-700">
                  {data.certId}
                </p>
              </div>
            </div>

            {/* Footer: signature + seal */}
            <div className="mt-6 flex items-end justify-between border-t border-gray-200 pt-6">
              <div className="text-left">
                <div
                  className="mb-1.5 h-px w-28"
                  style={{ backgroundColor: "#9ca3af" }}
                />
                <p className="text-xs text-gray-500">Platform Authority</p>
                <p className="text-sm font-medium text-gray-900">
                  Masteringbackend.com
                </p>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2"
                  style={{ borderColor: GOLD }}
                >
                  <Award className="h-6 w-6" style={{ color: GOLD }} />
                </div>
                <p className="mt-1 text-[10px] text-gray-500">Official Seal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <StatTile
            icon={Sparkles}
            label="Points"
            value={String(data.stats.points)}
            color={BRAND}
          />
          <StatTile
            icon={CheckCircle2}
            label="Items Completed"
            value={`${data.stats.itemsCompleted}/${data.stats.totalItems}`}
            color="#27AE60"
          />
          <StatTile
            icon={Star}
            label="Final Score"
            value={`${data.finalScore}%`}
            color={GOLD}
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            onClick={handleDownload}
            disabled={isGeneratingPDF}
            className="w-full"
            style={{ backgroundColor: BRAND }}
          >
            <Download className="mr-2 h-4 w-4" />
            {isGeneratingPDF ? "Generating…" : "Download PDF"}
          </Button>
          <Button
            onClick={handleLinkedInShare}
            variant="outline"
            className="w-full"
          >
            <Linkedin className="mr-2 h-4 w-4 text-[#0a66c2]" />
            LinkedIn
          </Button>
          <Button
            onClick={handleTwitterShare}
            variant="outline"
            className="w-full"
          >
            <Twitter className="mr-2 h-4 w-4 text-[#1da1f2]" />
            Share on X
          </Button>
          <Button
            onClick={handleAddToResume}
            variant="outline"
            className="w-full"
          >
            {copiedResume ? (
              <Check className="mr-2 h-4 w-4 text-green-600" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copiedResume ? "Copied!" : "Add to Resume"}
          </Button>
        </div>
      </div>
    );
  }

  // ─── LOCKED ────────────────────────────────────────────────────────────────
  const pct = Math.min(100, Math.max(0, Math.round(data.masteryPct)));
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {/* Hero */}
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Your certificate is within reach
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep earning points across the {pathTitle} path to unlock your
          official certificate.
        </p>
      </div>

      {/* Locked certificate preview */}
      <div className="relative mx-auto overflow-hidden rounded-lg border border-border">
        <div
          className="select-none p-8 text-center opacity-60 blur-[2px] sm:p-10"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Certificate of Completion
            </p>
            <div className="mt-4 h-7 w-48 rounded bg-muted" />
            <div className="mt-2 h-4 w-32 rounded bg-muted" />
            <div className="mt-6 flex w-full justify-between">
              <div className="h-8 w-24 rounded bg-muted" />
              <div className="h-8 w-24 rounded bg-muted" />
            </div>
          </div>
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card shadow-sm ring-1 ring-border">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <span className="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
            Locked
          </span>
        </div>
      </div>

      {/* Progress meter */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Progress to certificate
              </p>
              <p className="text-xs text-muted-foreground">
                {data.earnedPoints} / {data.certThreshold} points earned
              </p>
            </div>
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2.5" />
          <p className="text-sm font-medium text-foreground">
            <span className="text-primary">{data.pointsToGo} points</span> to go
          </p>
        </CardContent>
      </Card>

      {/* What's left */}
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            What&apos;s left
          </h2>
          {data.remaining.length > 0 ? (
            <ul className="space-y-2">
              {data.remaining.map((item, index) => (
                <li
                  key={`${item.type}-${item.title}-${index}`}
                  className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2.5"
                >
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[10px] font-medium uppercase tracking-wide"
                  >
                    {STEP_TYPE_LABELS[item.type] ?? item.type}
                  </Badge>
                  <span className="truncate text-sm text-foreground">
                    {item.title}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <Trophy className="h-8 w-8 text-primary" />
              <p className="text-sm font-medium text-foreground">
                You&apos;re almost there — keep going!
              </p>
              <p className="text-xs text-muted-foreground">
                Earn a few more points to unlock your certificate.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
        <Icon className="h-5 w-5" style={{ color }} />
        <span className="text-lg font-bold text-foreground">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </CardContent>
    </Card>
  );
}
