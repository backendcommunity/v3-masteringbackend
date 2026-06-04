"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  Users,
  Video,
  Star,
  Trophy,
  BookOpen,
  Plus,
  Building2,
  Briefcase,
  FileText,
  Sparkles,
  Layout,
  Play,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Crown,
  AlertTriangle,
  Lock,
  MessageSquare,
  Bookmark,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";

interface MockInterviewsPageProps {
  onNavigate: (path: string) => void;
}

interface InterviewTemplate {
  id: string;
  name: string | null;
  company: string;
  position: string;
  seniority: string | null;
  description: string | null;
  summary?: string;
  jobDescription: string;
  style: string;
  level: string | null;
  format: string;
  category: string | null;
  difficulty: string;
  addedBy: string | null;
  duration: number;
  questions: any[] | null;
  topics: string[] | null;
  isPublic: boolean;
  evaluationRubric: string | null;
  createdAt: string;
}

interface UserInterview {
  id: string;
  userId: string;
  interviewConfig: string | null;
  templateId: string;
  scheduledTime: string | null;
  status: string;
  createdAt: string;
  template: InterviewTemplate;
  completedSessionId?: string;
}

interface InterviewAccess {
  tier: "free" | "pro" | "enterprise";
  hasAccess: boolean;
  maxSessions: number;
  usedSessions: number;
  remainingSessions: number;
  allowedDurations: number[];
  message?: string;
}

interface CustomInterviewFormData {
  company: string;
  position: string;
  seniority: string;
  description: string;
  style: string;
  difficulty: string;
  duration: number;
  format: string;
}

interface TemplateFormData {
  name: string;
  summary: string;
  category: string;
  difficulty: string;
  duration: number;
  topics: string[];
  seniority: string;
  style: string;
}

export function MockInterviewsPage({ onNavigate }: MockInterviewsPageProps) {
  const store = useAppStore();
  const user = useUser();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [bookedInterviews, setBookedInterviews] = useState<UserInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<
    UserInterview[]
  >([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  const [selectedTemplate, setSelectedTemplate] =
    useState<InterviewTemplate | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] =
    useState(false);
  const [isCreateInterviewDialogOpen, setIsCreateInterviewDialogOpen] =
    useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const [interviewAccess, setInterviewAccess] =
    useState<InterviewAccess | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<"chat" | "video" | "audio">(
    "chat",
  );
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [pagination, setPagination] = useState({ size: 10, skip: 0 });
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: "",
    style: "",
    format: "",
    search: "",
    category: "",
  });

  const [customInterviewData, setCustomInterviewData] =
    useState<CustomInterviewFormData>({
      company: "",
      position: "",
      seniority: "",
      description: "",
      style: "",
      difficulty: "",
      duration: 15,
      format: "audio",
    });

  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    name: "",
    summary: "",
    category: "",
    difficulty: "",
    duration: 15,
    topics: [],
    seniority: "junior",
    style: "technical",
  });
  const [topicInput, setTopicInput] = useState("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load templates when pagination or filters change
  useEffect(() => {
    loadTemplates();
  }, [pagination, filters]);

  // Load stats, booked, completed interviews, and access on initial mount
  useEffect(() => {
    loadStats();
    loadBookedInterviews();
    loadCompletedInterviews();
    loadInterviewAccess();
    loadCategories();
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Handle interview booking from URL query parameter
  useEffect(() => {
    const interviewId = searchParams?.get("id");
    if (!interviewId || templates.length === 0) return;

    // Find template with matching ID
    const template = templates.find((t) => t.id === interviewId);
    if (template) {
      // Call handleBookInterview with the found template
      // Use setTimeout to ensure dialog is properly rendered
      setTimeout(() => handleBookInterview(template), 100);
    }
  }, [searchParams, templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        size: pagination.size,
        skip: pagination.skip,
      };

      const filterObj: any = {};
      if (filters.difficulty) filterObj.difficulty = filters.difficulty;
      if (filters.style) filterObj.style = filters.style;
      if (filters.format) filterObj.format = filters.format;
      if (filters.search) filterObj.search = filters.search;
      if (filters.category) filterObj.category = filters.category;

      // Send filters as an object
      params.filters = filterObj;

      console.log("Fetching templates with params:", params);
      const data = await store.getMockInterviewTemplates(params);
      console.log("Templates API Response:", data);

      // Handle both response structures
      if (data?.interviews) {
        setTemplates(data.interviews);
        setTotalTemplates(data.meta?.total || 0);
        setHasMore(data.meta?.hasMore || false);
      } else if (Array.isArray(data)) {
        // If data is directly an array
        setTemplates(data);
        setTotalTemplates(data.length);
        setHasMore(false);
      } else {
        console.warn("Unexpected data structure:", data);
        setTemplates([]);
        setTotalTemplates(0);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const loadBookedInterviews = async () => {
    try {
      setLoading(true);
      const data = await store.getUserBookedInterviews();
      setBookedInterviews(data || []);
    } catch (error) {
      toast.error("Failed to load booked interviews");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedInterviews = async () => {
    try {
      setLoading(true);
      const data = await store.getUserCompletedInterviews();
      setCompletedInterviews(data || []);

      console.log("Completed Interviews:", data);
    } catch (error) {
      toast.error("Failed to load completed interviews");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await store.getUserInterviewStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats");
    }
  };

  const loadInterviewAccess = async () => {
    try {
      const data = await store.getInterviewAccess();
      setInterviewAccess(data);
    } catch (error) {
      console.error("Failed to load interview access");
    }
  };

  const loadCategories = async () => {
    try {
      const data = await store.getMockInterviewCategories();
      setCategories(data);
    } catch {
      // silently fail — pills won't show
    }
  };

  const handleBookInterview = (template: InterviewTemplate) => {
    if (
      interviewAccess?.remainingSessions! >= 1 &&
      !interviewAccess?.hasAccess
    ) {
      setShowUpgradeDialog(true);
      return;
    }
    setSelectedTemplate(template);
    setIsBookingDialogOpen(true);
  };

  const handleStartNow = async (templateId: string) => {
    if (!templateId) return;

    try {
      setCreating(true);
      const result = await store.scheduleInterviewFromTemplate(templateId, {});

      if (!result || !result.session?.id) {
        toast.error("Failed to start interview");
        return;
      }

      toast.success("Interview started successfully!");
      setIsBookingDialogOpen(false);

      onNavigate(`/mock-interviews/${result.session.id}`);
    } catch (error: any) {
      if (error?.response?.status === 402) {
        setIsBookingDialogOpen(false);
        setShowUpgradeDialog(true);
      } else {
        toast.error("Failed to start interview");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStartChatNow = async (templateId: string) => {
    if (!templateId) return;

    try {
      setCreating(true);
      const result = await store.scheduleInterviewFromTemplate(templateId, {});

      if (!result?.interview?.id) {
        toast.error("Failed to start chat interview");
        return;
      }

      toast.success("Chat interview started!");
      setIsBookingDialogOpen(false);
      onNavigate(`/mock-interviews/${result.interview.id}/chat`);
    } catch (error: any) {
      if (error?.response?.status === 402) {
        setIsBookingDialogOpen(false);
        setShowUpgradeDialog(true);
      } else {
        toast.error("Failed to start chat interview");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleScheduleInterview = async (templateId: string) => {
    try {
      if (!scheduledDate || !scheduledTime) {
        toast.error("Please select date and time");
        return;
      }

      setCreating(true);
      const isoDate = new Date(
        `${scheduledDate}T${scheduledTime}:00`,
      ).toISOString();

      const result = await store.scheduleInterviewFromTemplate(templateId, {
        scheduledTime: isoDate,
      });

      if (result) {
        toast.success("Interview scheduled successfully!");
        setIsBookingDialogOpen(false);
        setScheduledDate("");
        setScheduledTime("");
        setShowScheduleForm(false);
        setSelectedTemplate(null);
        setActiveTab("booked");
        loadBookedInterviews();
      }
    } catch (error) {
      toast.error("Failed to schedule interview");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinInterview = async (interview: UserInterview) => {
    if (!interviewAccess?.hasAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    const isChatInterview =
      !interview.template.format ||
      interview.template.format.toLowerCase() === "chat" ||
      interview.template.format.toLowerCase() === "text";

    try {
      setCreating(true);

      if (isChatInterview) {
        // Chat interview — navigate directly to chat room
        onNavigate(`/mock-interviews/${interview.id}/chat`);
      } else {
        // Video/audio interview — create a LiveKit room then navigate to session
        const result = await store.createMockInterviewRoom(interview.id);
        if (result?.session?.id) {
          onNavigate(`/mock-interviews/${result.session.id}`);
        } else {
          toast.error("Failed to start interview session. Please try again.");
        }
      }
    } catch (error) {
      console.error("Failed to join interview:", error);
      toast.error("Failed to join interview");
    } finally {
      setCreating(false);
    }
  };

  const handleViewResults = (sessionId: string) => {
    onNavigate(`/mock-interviews/${sessionId}/results`);
  };

  const handleCustomInterviewChange = (
    field: keyof CustomInterviewFormData,
    value: string | number,
  ) => {
    setCustomInterviewData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateFormChange = (
    field: keyof TemplateFormData,
    value: string | number | string[],
  ) => {
    setTemplateFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTopic = () => {
    if (topicInput.trim()) {
      setTemplateFormData((prev) => ({
        ...prev,
        topics: [...prev.topics, topicInput.trim()],
      }));
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (index: number) => {
    setTemplateFormData((prev) => ({
      ...prev,
      topics: prev.topics.filter((_, i) => i !== index),
    }));
  };

  const handleCreateCustomInterview = async () => {
    if (!interviewAccess?.hasAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    try {
      if (
        !customInterviewData.company ||
        !customInterviewData.position ||
        !customInterviewData.description
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      setCreating(true);
      const result = await store.scheduleInterviewFromJD({
        ...customInterviewData,
        scheduledTime: new Date().toISOString(),
      });

      if (!result) {
        toast.error("Failed to create interview");
        return;
      }
      toast.success("Interview created and scheduled!");
      setIsCreateInterviewDialogOpen(false);
      setCustomInterviewData({
        company: "",
        position: "",
        seniority: "",
        description: "",
        style: "",
        difficulty: "",
        duration: 15,
        format: "",
      });

      // Reload data
      await loadTemplates();
      await loadBookedInterviews();
      await loadStats();

      // Switch to booked tab to show the new interview
      setActiveTab("booked");

      // onNavigate(`/mock-interviews/${result.interview.id}`);
      setSelectedTemplate(result.template);
      setIsBookingDialogOpen(true);
    } catch (error) {
      toast.error("Failed to create interview");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      if (!templateFormData.name || !templateFormData.summary) {
        toast.error("Please fill in all required fields");
        return;
      }

      setCreating(true);
      const result = await store.createCustomMockInterview(templateFormData);

      if (result) {
        toast.success("Template created successfully!");
        setIsCreateTemplateDialogOpen(false);
        setTemplateFormData({
          name: "",
          summary: "",
          category: "",
          difficulty: "",
          duration: 15,
          topics: [],
          seniority: "junior",
          style: "technical",
        });

        // Reload templates and stats
        await loadTemplates();
        await loadStats();

        // Stay on templates tab to show the new template
        setActiveTab("templates");
      }
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const handleFilterChange = useCallback((key: string, value: string) => {
    // For search, use debouncing to avoid too many API calls
    if (key === "search") {
      setFilters((prev) => ({ ...prev, [key]: value }));

      // Clear any existing timeout
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }

      // Debounce the API call
      searchDebounceRef.current = setTimeout(() => {
        setPagination({ size: 10, skip: 0 });
      }, 300);
    } else {
      // For other filters, update immediately
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPagination({ size: 10, skip: 0 });
    }
  }, []);

  const handleNextPage = () => {
    if (hasMore) {
      setPagination((prev) => ({ ...prev, skip: prev.skip + prev.size }));
    }
  };

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      skip: Math.max(0, prev.skip - prev.size),
    }));
  };

  // ─── Saved interviews (bookmark) state ───────────────────────────────────
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("mb_saved_interviews");
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  const toggleSaved = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem("mb_saved_interviews", JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Derived lists
  const savedTemplates = templates.filter((t) => savedIds.has(t.id));

  // ─── Difficulty badge helper ──────────────────────────────────────────────
  const difficultyBadge = (difficulty: string) => {
    const map: Record<string, { pill: string; dot: string }> = {
      Easy: {
        pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        dot: "bg-emerald-500",
      },
      Medium: {
        pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        dot: "bg-amber-500",
      },
      Hard: {
        pill: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dot: "bg-red-500",
      },
    };
    const style = map[difficulty] ?? {
      pill: "bg-muted text-muted-foreground",
      dot: "bg-muted-foreground",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full",
          style.pill,
        )}
      >
        <span
          className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", style.dot)}
        />
        {difficulty}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Sticky Header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b bg-background">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Mock Interviews
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Practice with Kap AI · Land your next backend role
            </p>
            {/* Inline stats row */}
            <p className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">
                {stats?.totalInterviews ?? 0}
              </span>{" "}
              completed ·{" "}
              <span className="font-semibold text-foreground">
                {stats?.averageScore ?? 0}%
              </span>{" "}
              avg score ·{" "}
              <span className="font-semibold text-foreground">
                {stats?.practicedHours ?? 0}h
              </span>{" "}
              practiced
            </p>
            {/* Session access badge */}
            {interviewAccess &&
              (interviewAccess.tier === "free" ||
                interviewAccess.tier === "pro") && (
                <Badge
                  variant={
                    interviewAccess.remainingSessions === 0
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs mt-1.5"
                >
                  {interviewAccess.tier === "free"
                    ? interviewAccess.remainingSessions === 0
                      ? "Free trial used"
                      : "1 free trial interview available"
                    : `${interviewAccess.remainingSessions} of ${interviewAccess.maxSessions} sessions remaining this month`}
                </Badge>
              )}
            {/* {interviewAccess?.tier === "enterprise" && (
              <Badge variant="secondary" className="mt-1.5 text-xs">
                <Crown className="h-3 w-3 mr-1" />
                Enterprise — Unlimited sessions
              </Badge>
            )} */}
          </div>

          {/* Right: Create Custom button */}
          <Button disabled={true} className="shrink-0">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Session limit banner */}
        {interviewAccess && !interviewAccess.hasAccess && (
          <div className="flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-orange-500/40 bg-orange-500/5 px-4 py-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-500 shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-sm">
                {interviewAccess.tier === "free"
                  ? interviewAccess.remainingSessions === 0
                    ? "Free Trial Used"
                    : "Access 1 Free Trial Interview"
                  : "Monthly Limit Reached"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {interviewAccess.tier === "free"
                  ? interviewAccess.remainingSessions === 0
                    ? "You've used your free trial interview. Upgrade to Pro for 4 sessions/month or Enterprise for unlimited access."
                    : "You have 1 free trial interview. Upgrade to Pro for 4 sessions/month or Enterprise for unlimited access."
                  : "You've used all your mock interviews this month. Upgrade to Enterprise for unlimited sessions."}
              </p>
            </div>
            <Button size="sm" onClick={() => onNavigate("/subscription/plans")}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        )}

        {/* ── Filter row ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 items-center flex-wrap mb-6">
          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="pl-9 pr-4 py-2 w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Search templates…"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>

          {/* Tab chips */}
          {(
            [
              {
                value: "templates",
                label: "All templates",
                count: totalTemplates,
              },
              { value: "saved", label: "Saved", count: savedIds.size },
              {
                value: "booked",
                label: "Booked",
                count: bookedInterviews.length,
              },
              {
                value: "completed",
                label: "Completed",
                count: completedInterviews.filter((i) => i.completedSessionId)
                  .length,
              },
            ] as { value: string; label: string; count: number }[]
          ).map((chip) => (
            <button
              key={chip.value}
              onClick={() => setActiveTab(chip.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm transition-colors",
                activeTab === chip.value
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {chip.label} <span className="opacity-50">{chip.count}</span>
            </button>
          ))}

          {/* Difficulty + Style dropdowns — only for templates/saved */}
          {(activeTab === "templates" || activeTab === "saved") && (
            <>
              <Select
                value={filters.difficulty || "all"}
                onValueChange={(v) =>
                  handleFilterChange("difficulty", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-36 rounded-xl h-9 text-sm">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.style || "all"}
                onValueChange={(v) =>
                  handleFilterChange("style", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-40 rounded-xl h-9 text-sm">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All styles</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="system-design">System Design</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {/* ── Category pills ──────────────────────────────────────────────── */}
        {(activeTab === "templates" || activeTab === "saved") &&
          categories.length > 0 && (
            <div className="flex flex-wrap gap-2 py-2 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() =>
                    handleFilterChange(
                      "category",
                      filters.category === cat ? "" : cat,
                    )
                  }
                  className={cn(
                    "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap",
                    filters.category === cat
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {cat}
                </button>
              ))}

              <Select
                value={filters.category || "all"}
                onValueChange={(v) =>
                  handleFilterChange("category", v === "all" ? "" : v)
                }
              >
                <SelectTrigger className="w-40 rounded-xl h-9 text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        {/* ── Templates / Saved tab ─────────────────────────────────────────── */}
        {(activeTab === "templates" || activeTab === "saved") &&
          (() => {
            const list = activeTab === "saved" ? savedTemplates : templates;
            return (
              <>
                {loading ? (
                  <div className="flex items-center justify-center py-24">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : list.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-1">
                      {activeTab === "saved"
                        ? "No saved interviews yet"
                        : "No Templates Found"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {activeTab === "saved"
                        ? "Bookmark templates by clicking the bookmark icon on any card."
                        : "Try adjusting your filters or check back later."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Card grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {list.map((template) => (
                        <div
                          key={template.id}
                          onClick={() => handleBookInterview(template)}
                          className="group bg-card rounded-2xl border border-border p-5 flex flex-col cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
                        >
                          {/* Top row: category + bookmark */}
                          <div className="flex items-start justify-between">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {template.category ||
                                template.style ||
                                "Interview"}
                            </span>
                            <button
                              onClick={(e) => toggleSaved(template.id, e)}
                              className="p-0.5 -mt-0.5 rounded transition-colors hover:text-primary"
                              aria-label="Bookmark"
                            >
                              <Bookmark
                                className={cn(
                                  "w-4 h-4",
                                  savedIds.has(template.id)
                                    ? "fill-primary text-primary"
                                    : "text-muted-foreground/40",
                                )}
                              />
                            </button>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 mt-1">
                            {template.name ||
                              `${template.position} at ${template.company}`}
                          </h3>

                          {/* Description */}
                          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-4 flex-1 mt-2">
                            {template.description || template.summary || ""}
                          </p>

                          {/* Footer */}
                          <div className="border-t border-border/50 pt-3 mt-3 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {template.duration} min
                            </span>
                            {difficultyBadge(template.difficulty)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination — only for templates tab */}
                    {activeTab === "templates" && (
                      <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-muted-foreground">
                          Showing {pagination.skip + 1}–
                          {Math.min(
                            pagination.skip + pagination.size,
                            totalTemplates,
                          )}{" "}
                          of {totalTemplates} templates
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={pagination.skip === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={!hasMore}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            );
          })()}

        {/* ── Booked tab ───────────────────────────────────────────────────── */}
        {activeTab === "booked" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookedInterviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  No Booked Interviews
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Book your first mock interview to start practicing
                </p>
                <Button onClick={() => setActiveTab("templates")}>
                  Browse Templates
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bookedInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="bg-card rounded-2xl border border-border p-5 flex flex-col"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Booked
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {interview.status}
                      </Badge>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 mt-1">
                      {interview.template.name ||
                        `${interview.template.position} at ${interview.template.company}`}
                    </h3>

                    {/* Meta */}
                    <div className="flex-1 mt-2 space-y-1">
                      {interview.scheduledTime && (
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(
                            interview.scheduledTime,
                          ).toLocaleDateString()}{" "}
                          {new Date(interview.scheduledTime).toLocaleTimeString(
                            [],
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      )}
                      <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {interview.template.duration} min
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border/50 pt-3 mt-3">
                      {!interview.scheduledTime ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          onClick={() => {
                            setSelectedTemplate(interview.template);
                            setIsBookingDialogOpen(true);
                          }}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Schedule Interview
                        </Button>
                      ) : new Date(interview.scheduledTime) > new Date() ? (
                        <div className="flex justify-center">
                          <Badge variant="destructive">Upcoming</Badge>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleJoinInterview(interview)}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Join Interview
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Completed tab ─────────────────────────────────────────────────── */}
        {activeTab === "completed" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : completedInterviews.filter((i) => i.completedSessionId)
                .length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  No Completed Interviews
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Complete your first interview to see results here
                </p>
                <Button onClick={() => setActiveTab("templates")}>
                  Browse Templates
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {completedInterviews
                  .filter((i) => i.completedSessionId)
                  .map((interview) => (
                    <div
                      key={interview.id}
                      className="bg-card rounded-2xl border border-border p-5 flex flex-col"
                    >
                      {/* Top row */}
                      <div className="flex items-start justify-between">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {interview.template.category ||
                            interview.template.style ||
                            "Interview"}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-foreground text-[15px] leading-snug line-clamp-2 mt-1">
                        {interview.template.name ||
                          `${interview.template.position} at ${interview.template.company}`}
                      </h3>

                      {/* Meta */}
                      <div className="flex-1 mt-2 space-y-1">
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(interview.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {interview.template.duration} min
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="border-t border-border/50 pt-3 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            handleViewResults(interview.completedSessionId!)
                          }
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden gap-0">
          {/* Template overview */}

          <div className="px-6 pt-6 pb-5 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              {selectedTemplate?.category && (
                <span className="text-[11px] text-muted-foreground font-medium">
                  {selectedTemplate.category}
                </span>
              )}
              {selectedTemplate?.difficulty && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {difficultyBadge(selectedTemplate.difficulty)}
                </span>
              )}
            </div>
            <DialogTitle>
              <h2 className="text-base font-bold text-foreground leading-tight">
                {selectedTemplate?.name ||
                  `${selectedTemplate?.position} Interview`}
              </h2>
            </DialogTitle>
            {selectedTemplate?.company && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {selectedTemplate.company}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {selectedTemplate?.duration} min
              </span>
              {selectedTemplate?.topics &&
                selectedTemplate.topics.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Layout className="w-3.5 h-3.5" />
                    {selectedTemplate.topics.length} topics
                  </span>
                )}
            </div>
            {selectedTemplate?.topics && selectedTemplate.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selectedTemplate.topics.slice(0, 5).map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {t}
                  </span>
                ))}
                {selectedTemplate.topics.length > 5 && (
                  <span className="text-[11px] text-muted-foreground">
                    +{selectedTemplate.topics.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Mode + action */}
          <div className="px-6 py-5 space-y-5">
            {/* Interview type selector */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Interview type
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      key: "chat",
                      icon: MessageSquare,
                      label: "Text",
                      available: true,
                    },
                    {
                      key: "video",
                      icon: Video,
                      label: "Video",
                      available: false,
                    },
                    {
                      key: "audio",
                      icon: Play,
                      label: "Audio",
                      available: false,
                    },
                  ] as const
                ).map(({ key, icon: Icon, label, available }) => (
                  <button
                    key={key}
                    type="button"
                    disabled={!available}
                    onClick={() => setSelectedMode(key)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                      !available && "opacity-40 cursor-not-allowed",
                      available && selectedMode === key
                        ? "border-primary bg-primary/8 text-primary"
                        : available
                          ? "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                          : "border-border/50 text-muted-foreground",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {label}
                    {!available && (
                      <span className="text-[9px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full -mt-1">
                        Soon
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                When
              </p>

              {/* Start now */}
              <button
                type="button"
                onClick={() => {
                  setShowScheduleForm(false);
                  selectedTemplate && handleStartChatNow(selectedTemplate.id);
                }}
                disabled={creating || selectedMode !== "chat"}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed",
                  !showScheduleForm && selectedMode === "chat"
                    ? "border-primary bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-muted/20 hover:border-primary/40",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    !showScheduleForm && selectedMode === "chat"
                      ? "bg-primary/15"
                      : "bg-muted",
                  )}
                >
                  <Play
                    className={cn(
                      "w-4 h-4",
                      !showScheduleForm && selectedMode === "chat"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Start Now
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Jump in immediately
                  </p>
                </div>
                {creating ? (
                  <Loader2
                    className={cn(
                      "w-4 h-4 animate-spin flex-shrink-0",
                      !showScheduleForm && selectedMode === "chat"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                ) : (
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      !showScheduleForm && selectedMode === "chat"
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                )}
              </button>

              {/* Schedule for later */}
              {selectedMode === "chat" ? (
                <div
                  className={cn(
                    "rounded-xl border-2 transition-all overflow-hidden",
                    showScheduleForm
                      ? "border-primary bg-primary/5"
                      : "border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm((v) => !v)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-primary/5 transition-colors"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        showScheduleForm ? "bg-primary/15" : "bg-muted",
                      )}
                    >
                      <CalendarClock
                        className={cn(
                          "w-4 h-4",
                          showScheduleForm
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Book for Later
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Pick a date and time that works for you
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 flex-shrink-0 transition-transform",
                        showScheduleForm
                          ? "text-primary rotate-90"
                          : "text-muted-foreground",
                      )}
                    />
                  </button>

                  {showScheduleForm && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="schedule-date"
                            className="text-xs font-medium"
                          >
                            Date
                          </Label>
                          <Input
                            id="schedule-date"
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="schedule-time"
                            className="text-xs font-medium"
                          >
                            Time
                          </Label>
                          <Input
                            id="schedule-time"
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-9 text-sm"
                        onClick={() =>
                          selectedTemplate &&
                          handleScheduleInterview(selectedTemplate.id)
                        }
                        disabled={creating || !scheduledDate || !scheduledTime}
                      >
                        {creating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                            Scheduling…
                          </>
                        ) : (
                          <>
                            <Calendar className="w-3.5 h-3.5 mr-2" />
                            Schedule Interview
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border/60 bg-muted/20 opacity-40 cursor-not-allowed select-none">
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        Schedule for Later
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Select Text mode to schedule
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cancel */}
          <div className="px-6 pb-5"></div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              Upgrade Required
            </DialogTitle>
            <DialogDescription>
              {interviewAccess?.tier === "free"
                ? "You've used your free trial interview. Upgrade to unlock more sessions."
                : "You've reached your monthly session limit. Upgrade for more access."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="border-primary">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold">Pro Plan</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>4 mock interviews per month</li>
                  <li>15 & 30 minute sessions</li>
                  <li>AI-powered feedback & reports</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-purple-500" />
                  <h3 className="font-semibold">Enterprise Plan</h3>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Unlimited mock interviews</li>
                  <li>15, 30, 45 & 60 minute sessions</li>
                  <li>Full access to all features</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => onNavigate("/subscription/plans")}>
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from JD Dialog */}
      <Dialog
        open={isCreateInterviewDialogOpen}
        onOpenChange={setIsCreateInterviewDialogOpen}
      >
        <DialogContent className="w-[75vw] max-w-[80vw] h-[90vh] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Mock Interview</DialogTitle>
            <DialogDescription>
              Customize your mock interview experience by providing details
              about the role you're preparing for.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Company *
              </Label>
              <Input
                id="company"
                placeholder="e.g., Google, Amazon, Stripe"
                value={customInterviewData.company}
                onChange={(e) =>
                  handleCustomInterviewChange("company", e.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Position *
              </Label>
              <Input
                id="position"
                placeholder="e.g., Senior Backend Engineer"
                value={customInterviewData.position}
                onChange={(e) =>
                  handleCustomInterviewChange("position", e.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seniority" className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Seniority Level
              </Label>
              <Select
                value={customInterviewData.seniority}
                onValueChange={(value) =>
                  handleCustomInterviewChange("seniority", value)
                }
              >
                <SelectTrigger id="seniority">
                  <SelectValue placeholder="Select seniority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Mid-Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="style" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
                Interview Style
              </Label>
              <Select
                value={customInterviewData.style}
                onValueChange={(value) =>
                  handleCustomInterviewChange("style", value)
                }
              >
                <SelectTrigger id="style">
                  <SelectValue placeholder="Select interview style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="system-design">System Design</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="difficulty" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-muted-foreground" />
                Difficulty
              </Label>
              <Select
                value={customInterviewData.difficulty}
                onValueChange={(value) =>
                  handleCustomInterviewChange("difficulty", value)
                }
              >
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                <Layout className="h-4 w-4 text-muted-foreground" />
                Duration
              </Label>
              <Select
                value={customInterviewData.duration + ""}
                onValueChange={(value) =>
                  handleCustomInterviewChange("duration", value)
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60].map((d) => (
                    <SelectItem
                      key={d}
                      value={d + ""}
                      disabled={
                        interviewAccess?.hasAccess === true &&
                        !interviewAccess.allowedDurations.includes(d)
                      }
                    >
                      {d} min
                      {interviewAccess?.hasAccess &&
                        !interviewAccess.allowedDurations.includes(d) &&
                        " (Enterprise)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="description" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Job Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Paste the job description here..."
                rows={8}
                value={customInterviewData.description}
                onChange={(e) =>
                  handleCustomInterviewChange("description", e.target.value)
                }
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCreateInterviewDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomInterview} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Create & Start
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog
        open={isCreateTemplateDialogOpen}
        onOpenChange={setIsCreateTemplateDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Interview Template</DialogTitle>
            <DialogDescription>
              Create a reusable interview template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Backend Developer Interview"
                value={templateFormData.name}
                onChange={(e) =>
                  handleTemplateFormChange("name", e.target.value)
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="summary">Summary *</Label>
              <Textarea
                id="summary"
                placeholder="Brief description of the template"
                rows={3}
                value={templateFormData.summary}
                onChange={(e) =>
                  handleTemplateFormChange("summary", e.target.value)
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Backend Development"
                  value={templateFormData.category}
                  onChange={(e) =>
                    handleTemplateFormChange("category", e.target.value)
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="template-difficulty">Difficulty</Label>
                <Select
                  value={templateFormData.difficulty}
                  onValueChange={(value) =>
                    handleTemplateFormChange("difficulty", value)
                  }
                >
                  <SelectTrigger id="template-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="seniority" className="flex items-center gap-2">
                  Seniority Level
                </Label>
                <Select
                  value={templateFormData.seniority}
                  onValueChange={(value) =>
                    handleTemplateFormChange("seniority", value)
                  }
                >
                  <SelectTrigger id="seniority">
                    <SelectValue placeholder="Select seniority level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="style" className="flex items-center gap-2">
                  Interview Style
                </Label>
                <Select
                  value={templateFormData.style}
                  onValueChange={(value) =>
                    handleTemplateFormChange("style", value)
                  }
                >
                  <SelectTrigger id="style">
                    <SelectValue placeholder="Select interview style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="system-design">System Design</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration" className="flex items-center gap-2">
                Duration
              </Label>
              <Select
                value={templateFormData.duration + ""}
                onValueChange={(value) =>
                  handleTemplateFormChange("duration", value)
                }
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60].map((d) => (
                    <SelectItem
                      key={d}
                      value={d + ""}
                      disabled={
                        interviewAccess?.hasAccess === true &&
                        !interviewAccess.allowedDurations.includes(d)
                      }
                    >
                      {d} min
                      {interviewAccess?.hasAccess &&
                        !interviewAccess.allowedDurations.includes(d) &&
                        " (Enterprise)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="topics">Topics</Label>
              <div className="flex gap-2">
                <Input
                  id="topics"
                  placeholder="Add a topic"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTopic()}
                />
                <Button type="button" onClick={handleAddTopic}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {templateFormData.topics.map((topic, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTopic(index)}
                  >
                    {topic} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
