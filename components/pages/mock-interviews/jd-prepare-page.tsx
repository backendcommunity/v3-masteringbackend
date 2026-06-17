"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ArrowLeft,
  Upload,
  FileText,
  Sparkles,
  Clock,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ChevronRight,
  Code2,
  Users,
  Network,
  Terminal,
  BookOpen,
  Layers,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import {
  InterviewBookingDialog,
  type BookingTemplate,
} from "./interview-booking-dialog";

interface ProgressEvent {
  stage: string;
  message: string;
  progress: number;
}

interface JDAnalysisResult {
  templateId: string;
  template: {
    name: string;
    company: string | null;
    position: string;
    seniority: string;
    domain: string;
    style: string;
    format: string;
    difficulty: string;
    duration: number;
    topics: string[];
    questions: number;
    summary: string;
  };
}

interface JDPreparePageProps {
  onNavigate: (path: string) => void;
}

const INTERVIEW_STYLES = [
  { key: "Mixed", label: "Mixed", desc: "Technical + behavioral blend", icon: Layers },
  { key: "Technical", label: "Technical", desc: "Architecture, debugging, CS depth", icon: Code2 },
  { key: "Behavioral", label: "Behavioral", desc: "STAR format, leadership, teamwork", icon: Users },
  { key: "System Design", label: "System Design", desc: "Scalability, architecture, trade-offs", icon: Network },
  { key: "Coding", label: "Coding", desc: "Algorithms, data structures, live code", icon: Terminal },
  { key: "Case Study", label: "Case Study", desc: "Real-world problem scenarios", icon: BookOpen },
] as const;

const QUESTION_COUNTS: Record<string, Record<string, number>> = {
  "15": { Technical: 4, Behavioral: 3, "System Design": 2, Coding: 2, Mixed: 3, "Case Study": 2 },
  "30": { Technical: 6, Behavioral: 5, "System Design": 3, Coding: 3, Mixed: 5, "Case Study": 3 },
  "45": { Technical: 9, Behavioral: 7, "System Design": 4, Coding: 4, Mixed: 7, "Case Study": 4 },
  "60": { Technical: 12, Behavioral: 10, "System Design": 5, Coding: 5, Mixed: 10, "Case Study": 5 },
};

function getQuestionCount(duration: string, style: string): number {
  return QUESTION_COUNTS[duration]?.[style] ?? 5;
}

const STAGE_LABELS: Record<string, string> = {
  parsing: "Parsing job description",
  researching: "Researching company",
  generating: "Generating questions",
  saving: "Saving template",
  done: "Done!",
};

function readSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onEvent: (data: Record<string, unknown>) => void,
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";

  const pump = async (): Promise<void> => {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(line.slice(6));
          onEvent(parsed);
        } catch {
          // skip malformed line
        }
      }
    }
    return pump();
  };

  return pump();
}

export function JDPreparePage({ onNavigate }: JDPreparePageProps) {
  const router = useRouter();
  const store = useAppStore();

  const [tab, setTab] = useState<"paste" | "upload">("paste");
  const [jdText, setJdText] = useState("");
  const [duration, setDuration] = useState("30");
  const [interviewStyle, setInterviewStyle] = useState("Mixed");
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [isRunning, setIsRunning] = useState(false);
  const [progressEvents, setProgressEvents] = useState<ProgressEvent[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [result, setResult] = useState<JDAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    analytics.page("JD Prepare");
  }, []);

  const handleFile = useCallback((file: File) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Upload a PDF or DOCX file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10 MB.");
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
    analytics.track("jd_file_uploaded", { file_type: file.type, file_size_kb: Math.round(file.size / 1024) });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleAnalyze = async () => {
    setErrorMsg(null);
    setProgressEvents([]);
    setCurrentProgress(0);
    setResult(null);

    const dur = Number(duration);
    if (dur < 15 || dur > 90) {
      toast.error("Duration must be 15–90 minutes.");
      return;
    }

    if (tab === "paste" && jdText.trim().length < 50) {
      toast.error("Paste the full job description (at least 50 characters).");
      return;
    }
    if (tab === "upload" && !selectedFile) {
      toast.error("Select a PDF or DOCX file first.");
      return;
    }

    analytics.track("jd_analysis_started", {
      tab,
      duration: dur,
      style: interviewStyle,
      ...(tab === "paste" ? { jd_length: jdText.trim().length } : { file_type: selectedFile?.type }),
    });

    setIsRunning(true);

    try {
      let reader: ReadableStreamDefaultReader<Uint8Array>;

      if (tab === "paste") {
        reader = await store.analyzeJD(jdText.trim(), dur, interviewStyle);
      } else {
        reader = await store.analyzeJDFile(selectedFile!, dur, interviewStyle);
      }

      await readSSEStream(reader, (event) => {
        if (event.stage === "complete" && event.success) {
          const analysisResult = event.data as JDAnalysisResult;
          setResult(analysisResult);
          setCurrentProgress(100);
          analytics.track("jd_analysis_completed", {
            template_id: analysisResult.templateId,
            company: analysisResult.template.company,
            position: analysisResult.template.position,
            seniority: analysisResult.template.seniority,
            format: analysisResult.template.format,
            difficulty: analysisResult.template.difficulty,
            duration: analysisResult.template.duration,
            style: interviewStyle,
            question_count: analysisResult.template.questions,
            tab,
          });
          setBookingOpen(true);
        } else if (event.stage === "error") {
          const errMsg = (event.message as string) || "Something went wrong.";
          analytics.track("jd_analysis_failed", {
            error_message: errMsg,
            tab,
            duration: dur,
            style: interviewStyle,
          });
          setErrorMsg(errMsg);
        } else if (event.stage && event.message) {
          const progressEvent: ProgressEvent = {
            stage: event.stage as string,
            message: event.message as string,
            progress: typeof event.progress === "number" ? event.progress : 0,
          };
          setProgressEvents((prev) => [...prev, progressEvent]);
          setCurrentProgress(progressEvent.progress);
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to analyze JD.";
      analytics.track("jd_analysis_failed", {
        error_message: msg,
        tab,
        duration: dur,
        style: interviewStyle,
        error_source: "network",
      });
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleStartInterview = () => {
    if (!result) return;
    setBookingOpen(true);
  };

  const handleReset = () => {
    analytics.track("jd_analysis_reset");
    setResult(null);
    setProgressEvents([]);
    setCurrentProgress(0);
    setErrorMsg(null);
    setJdText("");
    setSelectedFile(null);
    setInterviewStyle("Mixed");
  };

  const canSubmit =
    !isRunning &&
    !result &&
    (tab === "paste" ? jdText.trim().length >= 50 : !!selectedFile);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate("/mock-interviews")}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold text-lg">Practice for a Real Job</h1>
            <p className="text-xs text-muted-foreground">
              Upload a job description → get tailored interview questions in seconds
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Result card */}
        {result && (
          <ResultCard result={result} onStart={handleStartInterview} onReset={handleReset} />
        )}

        {/* Error state */}
        {!result && errorMsg && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">Analysis failed</p>
              <p className="text-sm text-muted-foreground mt-0.5">{errorMsg}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setErrorMsg(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <AnalysisProgress events={progressEvents} currentProgress={currentProgress} />
        )}

        {/* Input form — hidden once result is available */}
        {!result && (
          <div className="grid gap-6">
            {/* Input card */}
            <Card className="border-border/60">
              <CardContent className="pt-6 space-y-5">
                <Tabs
                  value={tab}
                  onValueChange={(v) => {
                    setTab(v as "paste" | "upload");
                    analytics.track("jd_input_tab_changed", { tab: v });
                  }}
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="paste" className="flex-1 gap-2">
                      <FileText className="h-4 w-4" />
                      Paste JD
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex-1 gap-2">
                      <Upload className="h-4 w-4" />
                      Upload File
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="mt-4 space-y-2">
                    <Label htmlFor="jd-text" className="text-sm font-medium">
                      Job Description
                    </Label>
                    <Textarea
                      id="jd-text"
                      placeholder="Paste the full job description here — requirements, responsibilities, tech stack, everything. The more detail, the better the questions."
                      value={jdText}
                      onChange={(e) => setJdText(e.target.value)}
                      rows={14}
                      disabled={isRunning}
                      className="resize-none font-mono text-sm leading-relaxed"
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {jdText.length} chars{jdText.length < 50 && jdText.length > 0 ? " (min 50)" : ""}
                    </p>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <DropZone
                      file={selectedFile}
                      dragOver={dragOver}
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      onClear={() => setSelectedFile(null)}
                      disabled={isRunning}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFile(f);
                      }}
                    />
                  </TabsContent>
                </Tabs>

                {/* Duration + question count preview */}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-2 flex-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium whitespace-nowrap">
                      Interview Duration
                    </Label>
                  </div>
                  <Select
                    value={duration}
                    onValueChange={(v) => {
                      setDuration(v);
                      analytics.track("interview_duration_changed", { duration: Number(v), style: interviewStyle });
                    }}
                    disabled={isRunning}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Interview Style */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Interview Style</Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {getQuestionCount(duration, interviewStyle)} questions · {duration} min
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {INTERVIEW_STYLES.map(({ key, label, desc, icon: Icon }) => {
                      const count = getQuestionCount(duration, key);
                      const selected = interviewStyle === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setInterviewStyle(key);
                            analytics.track("interview_style_selected", { style: key, duration: Number(duration) });
                          }}
                          disabled={isRunning}
                          className={cn(
                            "flex flex-col gap-1 p-3 rounded-xl border-2 text-left transition-all",
                            selected
                              ? "border-primary bg-primary/8"
                              : "border-border hover:border-primary/40 hover:bg-muted/20",
                            isRunning && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <Icon
                              className={cn(
                                "h-3.5 w-3.5",
                                selected ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                            <span
                              className={cn(
                                "text-[10px] font-mono tabular-nums font-semibold",
                                selected ? "text-primary" : "text-muted-foreground",
                              )}
                            >
                              {count}q
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-xs font-semibold leading-none mt-1",
                              selected ? "text-foreground" : "text-foreground/80",
                            )}
                          >
                            {label}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                            {desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={!canSubmit}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze & Generate Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* How it works */}
            <HowItWorks />
          </div>
        )}
      </div>

      <InterviewBookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        template={
          result
            ? ({
                id: result.templateId,
                name: result.template.name,
                company: result.template.company,
                position: result.template.position,
                seniority: result.template.seniority,
                category: result.template.domain,
                difficulty: result.template.difficulty,
                duration: result.template.duration,
                topics: result.template.topics,
                style: result.template.style,
                format: result.template.format,
              } satisfies BookingTemplate)
            : null
        }
        onNavigate={onNavigate}
        onBooked={() => onNavigate("/mock-interviews?tab=booked")}
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DropZone({
  file,
  dragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onClick,
  onClear,
  disabled,
}: {
  file: File | null;
  dragOver: boolean;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onClick: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  if (file) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(0)} KB · {file.type.includes("pdf") ? "PDF" : "DOCX"}
          </p>
        </div>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
        "flex flex-col items-center justify-center gap-3 py-12 px-6 text-center",
        dragOver
          ? "border-primary bg-primary/5"
          : "border-border/60 hover:border-border hover:bg-muted/20",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Upload className="h-6 w-6 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">Drop your JD file here</p>
        <p className="text-xs text-muted-foreground mt-1">PDF or DOCX · Max 10 MB</p>
      </div>
      <Button variant="outline" size="sm" className="pointer-events-none">
        Browse files
      </Button>
    </div>
  );
}

function AnalysisProgress({
  events,
  currentProgress,
}: {
  events: ProgressEvent[];
  currentProgress: number;
}) {
  const latestEvent = events[events.length - 1];

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {latestEvent
                ? STAGE_LABELS[latestEvent.stage] || latestEvent.message
                : "Initializing…"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {latestEvent?.message || ""}
            </p>
          </div>
          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {currentProgress}%
          </span>
        </div>

        <Progress value={currentProgress} className="h-1.5" />

        {/* Stage steps */}
        <div className="grid grid-cols-4 gap-1 pt-1">
          {(["parsing", "researching", "generating", "saving"] as const).map(
            (stage) => {
              const done = events.some((e) => e.stage === stage);
              const active = latestEvent?.stage === stage;
              return (
                <div
                  key={stage}
                  className={cn(
                    "text-center text-xs py-1 rounded-md transition-colors",
                    done
                      ? "text-primary font-medium"
                      : active
                        ? "text-foreground font-medium"
                        : "text-muted-foreground",
                  )}
                >
                  {done && !active ? (
                    <CheckCircle2 className="h-3 w-3 mx-auto mb-0.5 text-primary" />
                  ) : active ? (
                    <Loader2 className="h-3 w-3 mx-auto mb-0.5 animate-spin" />
                  ) : (
                    <div className="h-3 w-3 mx-auto mb-0.5 rounded-full border border-muted-foreground/30" />
                  )}
                  {STAGE_LABELS[stage]}
                </div>
              );
            },
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ResultCard({
  result,
  onStart,
  onReset,
}: {
  result: JDAnalysisResult;
  onStart: () => void;
  onReset: () => void;
}) {
  const t = result.template;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="pt-6 space-y-5">
        {/* Success header */}
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-primary font-medium uppercase tracking-wider mb-0.5">
              Interview Ready
            </p>
            <h2 className="text-xl font-bold leading-tight">{t.name}</h2>
            {t.summary && (
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {t.summary}
              </p>
            )}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-2">
          {t.company && (
            <Badge variant="outline" className="gap-1.5">
              <Building2 className="h-3 w-3" />
              {t.company}
            </Badge>
          )}
          <Badge variant="outline" className="gap-1.5">
            <Briefcase className="h-3 w-3" />
            {t.seniority} · {t.position}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <Clock className="h-3 w-3" />
            {t.duration} min
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5",
              t.difficulty === "Hard"
                ? "text-red-500 border-red-500/30"
                : t.difficulty === "Medium"
                  ? "text-amber-500 border-amber-500/30"
                  : "text-green-500 border-green-500/30",
            )}
          >
            {t.difficulty}
          </Badge>
          <Badge variant="outline">{t.style}</Badge>
          <Badge variant="outline">{t.questions} questions</Badge>
        </div>

        {/* Topics */}
        {t.topics.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">Topics covered</p>
            <div className="flex flex-wrap gap-1.5">
              {t.topics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs bg-muted/60 rounded-md px-2 py-0.5 text-muted-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-1">
          <Button onClick={onStart} className="flex-1 gap-2" size="lg">
            Start Interview
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onReset} className="gap-2">
            <X className="h-4 w-4" />
            Analyze Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: "Paste or upload the JD",
      desc: "Copy the full job posting — requirements, stack, responsibilities.",
    },
    {
      icon: Sparkles,
      title: "AI researches the role",
      desc: "We extract the company, seniority, tech stack, and hiring bar.",
    },
    {
      icon: Building2,
      title: "Company intelligence",
      desc: "We research the engineering culture and interview style.",
    },
    {
      icon: CheckCircle2,
      title: "Jump straight in",
      desc: "Questions are tailored to the real role. Start immediately.",
    },
  ];

  return (
    <div className="rounded-xl border border-border/40 bg-card/30 p-5">
      <p className="text-sm font-medium mb-4 text-muted-foreground">How it works</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
              <step.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs font-medium leading-snug">{step.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
