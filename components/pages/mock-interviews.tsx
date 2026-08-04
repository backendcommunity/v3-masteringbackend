"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Pager } from "@/components/ui/pager";
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
  Building2,
  Briefcase,
  FileText,
  Layout,
  Play,
  Search,
  Loader2,
  Crown,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { MockInterviewTemplateCard } from "./mock-interviews/mock-interview-template-card";
import { InterviewBookingDialog } from "./mock-interviews/interview-booking-dialog";
import { cn } from "@/lib/utils";
import { JourneyGlyph } from "@/components/journey-glyph";
import { TryMockInterviewButton } from "@/components/projects/try-mock-interview-button";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import { useUser } from "@/hooks/use-user";
import { analytics } from "@/lib/analytics";

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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  const [selectedTemplate, setSelectedTemplate] =
    useState<InterviewTemplate | null>(null);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] =
    useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const [interviewAccess, setInterviewAccess] =
    useState<InterviewAccess | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  const [pagination, setPagination] = useState({ size: 10, skip: 0 });
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const PAGE_SIZE = 12;
  const [bookedPage, setBookedPage] = useState(0);
  const [bookedTotal, setBookedTotal] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  const [completedTotal, setCompletedTotal] = useState(0);
  const [savedPage, setSavedPage] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);

  const [filters, setFilters] = useState({
    difficulty: "",
    style: "",
    format: "",
    search: "",
    category: "",
    company: "",
  });

  // Sort controls (backend supports createdAt | duration | difficulty)
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [templateFormData, setTemplateFormData] = useState<TemplateFormData>({
    name: "",
    summary: "",
    category: "",
    difficulty: "",
    duration: 15,
    topics: [],
    seniority: "junior",
    style: "Technical",
  });
  const [topicInput, setTopicInput] = useState("");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const deepLinkHandledRef = useRef<string | null>(null);

  const [myTemplates, setMyTemplates] = useState<InterviewTemplate[]>([]);
  const [myTemplatesLoading, setMyTemplatesLoading] = useState(false);
  const [myTemplatesPage, setMyTemplatesPage] = useState(0);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const MY_TEMPLATES_PAGE_SIZE = 12;

  // Load templates when pagination, filters, or sort change
  useEffect(() => {
    loadTemplates();
  }, [pagination, filters, sortBy, sortOrder]);

  // Load my templates when switching to that tab
  useEffect(() => {
    if (activeTab === "my-templates") {
      loadMyTemplates();
      setMyTemplatesPage(0);
    }
    if (activeTab === "completed") {
      setCompletedPage(0);
      loadCompletedInterviews(0);
    }
    if (activeTab === "booked") {
      setBookedPage(0);
      loadBookedInterviews(0);
    }
    if (activeTab === "saved") {
      setSavedPage(0);
      loadBookmarks(0);
    }
  }, [activeTab]);

  // Re-fetch when page changes
  useEffect(() => { loadBookedInterviews(bookedPage); }, [bookedPage]);
  useEffect(() => { loadCompletedInterviews(completedPage); }, [completedPage]);
  useEffect(() => { loadBookmarks(savedPage); }, [savedPage]);

  // Load stats, booked, completed interviews, and access on initial mount
  useEffect(() => {
    loadBookedInterviews();
    loadCompletedInterviews();
    loadInterviewAccess();
    loadCategories();
    loadCompanies();
    loadMyTemplates();
    analytics.page("Mock Interviews");
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // Handle interview booking from URL query parameter (deep link from
  // interviews.masteringbackend.com). The template may not be on the
  // current page/filter of `templates`, so fall back to fetching it
  // directly by id instead of silently doing nothing.
  useEffect(() => {
    const interviewId = searchParams?.get("id");
    if (!interviewId || interviewId === deepLinkHandledRef.current) return;

    const template = templates.find((t) => t.id === interviewId);
    if (template) {
      deepLinkHandledRef.current = interviewId;
      setTimeout(() => handleBookInterview(template), 100);
      return;
    }

    if (templates.length === 0) return;

    deepLinkHandledRef.current = interviewId;
    store
      .getMockInterviewTemplate(interviewId)
      .then((fetched: InterviewTemplate | null) => {
        if (fetched) setTimeout(() => handleBookInterview(fetched), 100);
        else toast.error("This interview template is no longer available");
      })
      .catch(() => toast.error("This interview template is no longer available"));
  }, [searchParams, templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params: any = {
        size: pagination.size,
        skip: pagination.skip,
        sortBy,
        sortOrder,
      };

      const filterObj: any = {};
      if (filters.difficulty) filterObj.difficulty = filters.difficulty;
      if (filters.style) filterObj.style = filters.style;
      if (filters.format) filterObj.format = filters.format;
      if (filters.search) filterObj.search = filters.search;
      if (filters.category) filterObj.category = filters.category;
      if (filters.company) filterObj.company = filters.company;

      // Send filters as an object
      params.filters = filterObj;

      const data = await store.getMockInterviewTemplates(params);

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

  const loadBookedInterviews = async (page = 0) => {
    try {
      setLoading(true);
      const res = await store.getUserBookedInterviews(PAGE_SIZE, page * PAGE_SIZE);
      setBookedInterviews(res.data || []);
      setBookedTotal(res.meta?.total ?? 0);
    } catch (error) {
      toast.error("Failed to load booked interviews");
    } finally {
      setLoading(false);
    }
  };

  const loadCompletedInterviews = async (page = 0) => {
    try {
      setLoading(true);
      const res = await store.getUserCompletedInterviews(PAGE_SIZE, page * PAGE_SIZE);
      setCompletedInterviews(res.data || []);
      setCompletedTotal(res.meta?.total ?? 0);
    } catch (error) {
      toast.error("Failed to load completed interviews");
    } finally {
      setLoading(false);
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

  const loadCompanies = async () => {
    try {
      const data = await store.getMockInterviewCompanies();
      setCompanies(data);
    } catch {
      // silently fail — company filter won't show
    }
  };

  const loadMyTemplates = async () => {
    try {
      setMyTemplatesLoading(true);
      const data = await store.getMyTemplates();
      setMyTemplates(data || []);
    } catch {
      toast.error("Failed to load your templates");
    } finally {
      setMyTemplatesLoading(false);
    }
  };

  const handleDeleteMyTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      setDeletingTemplate(true);
      await store.deleteMyTemplate(deleteTemplateId);
      analytics.track("my_template_deleted", { template_id: deleteTemplateId });
      setMyTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateId));
      toast.success("Template deleted");
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setDeletingTemplate(false);
      setDeleteTemplateId(null);
    }
  };

  const handleBookInterview = (template: InterviewTemplate) => {
    if (
      interviewAccess?.remainingSessions! >= 1 &&
      !interviewAccess?.hasAccess
    ) {
      analytics.track("mock_interview_upgrade_dialog_shown", {
        trigger: "template_click",
        tier: interviewAccess?.tier,
      });
      setShowUpgradeDialog(true);
      return;
    }
    analytics.track("mock_interview_booking_started", {
      template_id: template.id,
      template_name: template.name,
      company: template.company,
      position: template.position,
      category: template.category,
      difficulty: template.difficulty,
      duration: template.duration,
      is_custom: !!template.addedBy,
    });
    setSelectedTemplate(template);
    setIsBookingDialogOpen(true);
  };

  const handleJoinInterview = async (interview: UserInterview) => {
    if (!interviewAccess?.hasAccess) {
      analytics.track("mock_interview_upgrade_dialog_shown", {
        trigger: "join_attempt",
        tier: interviewAccess?.tier,
      });
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
          style: "Technical",
        });

        // Reload templates and stats
        await loadTemplates();

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
        if (value)
          analytics.track("mock_interview_filter_applied", {
            filter_type: "search",
            query_length: value.length,
          });
        setPagination({ size: 10, skip: 0 });
      }, 300);
    } else {
      // For other filters, update immediately
      if (value)
        analytics.track("mock_interview_filter_applied", {
          filter_type: key,
          value,
        });
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

  // ─── Saved interviews (bookmark) state — API-backed ─────────────────────
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [savedTemplates, setSavedTemplates] = useState<InterviewTemplate[]>([]);
  // templateId → bookmarkId (needed for delete)
  const bookmarkIdMapRef = useRef<Map<string, string>>(new Map());

  const loadBookmarks = (page = 0) => {
    store
      .getBookmarks(PAGE_SIZE, page * PAGE_SIZE)
      .then(({ bookmarks, meta }) => {
        const ids = new Set<string>();
        const tpls: InterviewTemplate[] = [];
        bookmarks.forEach((b: any) => {
          if (b.mockInterviewTemplateId && b.mockInterviewTemplate) {
            ids.add(b.mockInterviewTemplateId);
            bookmarkIdMapRef.current.set(b.mockInterviewTemplateId, b.id);
            tpls.push(b.mockInterviewTemplate as InterviewTemplate);
          }
        });
        setSavedIds(ids);
        setSavedTemplates(tpls);
        setSavedTotal(meta?.total ?? 0);
      })
      .catch(() => {});
  };

  // Load existing bookmarks once on mount
  useEffect(() => {
    loadBookmarks(0);
  }, []);

  // If the active tab gets hidden because its count dropped to 0 (e.g. the last
  // bookmark was removed or the last custom template deleted), fall back to the
  // always-visible "templates" tab so the user is never stranded on a tab whose
  // chip no longer renders.
  useEffect(() => {
    if (activeTab === "templates") return;
    const counts: Record<string, number> = {
      saved: savedIds.size,
      "my-templates": myTemplates.length,
      booked: bookedInterviews.length,
      completed: completedTotal,
    };
    if ((counts[activeTab] ?? 1) === 0) setActiveTab("templates");
  }, [activeTab, savedIds, myTemplates, bookedInterviews, completedTotal]);

  const handleToggleSave = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (savingIds.has(id)) return;
      setSavingIds((prev) => new Set(prev).add(id));

      const alreadySaved = savedIds.has(id);
      try {
        if (alreadySaved) {
          await store.deleteBookmark({ mockInterviewTemplateId: id });
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          setSavedTemplates((prev) => prev.filter((t) => t.id !== id));
          bookmarkIdMapRef.current.delete(id);
        } else {
          const created = await store.createBookmark({
            type: "MOCK_INTERVIEW",
            bookmarkType: "BOOKMARK",
            mockInterviewTemplateId: id,
          });
          setSavedIds((prev) => new Set(prev).add(id));
          if (created?.id) bookmarkIdMapRef.current.set(id, created.id);
          // Add the template to savedTemplates from the current paginated list
          const tpl = templates.find((t) => t.id === id);
          if (tpl) setSavedTemplates((prev) => [tpl, ...prev]);
        }
      } catch {
        toast.error(
          alreadySaved
            ? "Failed to remove bookmark."
            : "Failed to save bookmark.",
        );
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [savedIds, savingIds, store],
  );

  // Derived lists (savedTemplates is API-backed state, not derived from paginated templates)

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
    <div className="min-h-screen">
      {/* ── Blueprint hero (navy anchor · grow pillar) ── */}
      <div>
        <div className="overflow-hidden dark:ring-1 dark:ring-white/10">
          <div className="bg-[#0E1F33] dark:bg-[#080F1A] text-white relative">
            <div className="hero-grid absolute inset-0" aria-hidden="true" />
            <div className="relative px-5 py-6 sm:px-8 sm:py-7 md:min-h-[174px] flex flex-col justify-center">
              <JourneyGlyph
                stage="grow"
                className="absolute right-4 top-4 w-20 opacity-40 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-100"
              />
              <div className="max-w-2xl">
                <div className="eyebrow-mono text-[#4AC5E8]">grow</div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1.5">Mock Interviews</h1>
                <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
                  {(
                    {
                      Backend: "Land your next backend engineering role",
                      DevOps: "Nail your next DevOps interview",
                      Cybersecurity: "Sharpen your security engineering edge",
                      Fullstack: "Stand out as a fullstack engineer",
                    } as Record<string, string>
                  )[filters.category] ??
                    "Practice real interviews with an AI interviewer — get scored, debriefed, and job-ready."}
                </p>

                <div className="mt-4">
                  {interviewAccess?.tier === "free" ? (
                    <button
                      onClick={() => {
                        analytics.track("mock_interview_upgrade_cta_clicked", {
                          from: "practice_cta_header",
                          tier: "free",
                        });
                        onNavigate("/subscription/plans");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                    >
                      Practice for a real job
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        analytics.track(
                          "mock_interview_practice_for_job_clicked",
                          { tier: interviewAccess?.tier ?? "pro" },
                        );
                        onNavigate("/mock-interviews/prepare");
                      }}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold px-5 py-2.5 text-sm hover:bg-primary/90 transition"
                    >
                      Practice for a real job
                    </button>
                  )}
                </div>

                {/* Session access */}
                {interviewAccess &&
                  (interviewAccess.tier === "free" ||
                    interviewAccess.tier === "pro") && (
                    <p
                      className={cn(
                        "text-xs mt-2",
                        interviewAccess.remainingSessions === 0
                          ? "text-red-300"
                          : "text-white/[.55]",
                      )}
                    >
                      {interviewAccess.tier === "free"
                        ? interviewAccess.remainingSessions === 0
                          ? "Free trial used"
                          : "1 free trial interview available"
                        : `${interviewAccess.remainingSessions} of ${interviewAccess.maxSessions} sessions remaining this month`}
                    </p>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="pt-6">
        {/* Demo on-ramp — a conversion banner for the free guided walkthrough.
            Distinct from the hero's "Practice for a real job" (the real/paid
            path): this sells the zero-friction taste that ends in a real score. */}
        <div className="relative mb-6 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4 sm:items-center">
              {/* Score chip — the demo's real payoff, shown up front */}
              <div className="hidden h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-xl border-2 border-primary/30 bg-primary/10 sm:flex">
                <span className="text-lg font-bold leading-none text-primary">
                  82
                </span>
                <span className="text-[9px] font-medium text-primary/70">
                  / 100
                </span>
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary">
                  Free · 60 seconds · no setup
                </span>
                <h3 className="mt-1 text-base font-bold text-foreground sm:text-[17px]">
                  See if you&apos;re interview-ready
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Take a guided mock interview and get an instant score with a
                  personalized debrief — exactly what the real thing feels like.
                </p>
              </div>
            </div>
            <TryMockInterviewButton source="listing" className="shrink-0" />
          </div>
        </div>

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
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap mb-6">
          {/* Search input */}
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="pl-9 pr-4 py-2 w-full sm:w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                value: "my-templates",
                label: "My Templates",
                count: myTemplates.length,
              },
              {
                value: "booked",
                label: "Booked",
                count: bookedInterviews.length,
              },
              {
                value: "completed",
                label: "Completed",
                count: completedTotal,
              },
            ] as { value: string; label: string; count: number }[]
          )
            // Hide a tab until it has at least one item. The main "All
            // templates" tab always shows. Saved/My Templates/Booked/Completed
            // counts all load on mount, so this never deadlocks (no tab is
            // unreachable waiting for its own activation to populate a count).
            .filter((chip) => chip.value === "templates" || chip.count > 0)
            .map((chip) => (
            <button
              key={chip.value}
              onClick={() => {
                analytics.track("mock_interview_tab_changed", {
                  tab: chip.value,
                  from: activeTab,
                });
                setActiveTab(chip.value);
              }}
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
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="Coding">Coding</SelectItem>
                  <SelectItem value="System Design">System Design</SelectItem>
                  <SelectItem value="Case Study">Case Study</SelectItem>
                  <SelectItem value="Mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={`${sortBy}:${sortOrder}`}
                onValueChange={(v) => {
                  const [by, order] = v.split(":");
                  setSortBy(by);
                  setSortOrder(order as "asc" | "desc");
                }}
              >
                <SelectTrigger className="w-40 rounded-xl h-9 text-sm">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt:desc">Newest</SelectItem>
                  <SelectItem value="createdAt:asc">Oldest</SelectItem>
                  <SelectItem value="duration:asc">Shortest</SelectItem>
                  <SelectItem value="duration:desc">Longest</SelectItem>
                  <SelectItem value="difficulty:asc">Easiest first</SelectItem>
                  <SelectItem value="difficulty:desc">Hardest first</SelectItem>
                </SelectContent>
              </Select>

              {companies.length > 0 && (
                <Select
                  value={filters.company || "all"}
                  onValueChange={(v) =>
                    handleFilterChange("company", v === "all" ? "" : v)
                  }
                >
                  <SelectTrigger className="w-44 rounded-xl h-9 text-sm gap-1.5">
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder="Company" className="flex-1 text-left" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All companies</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>

        {/* ── Category pills ──────────────────────────────────────────────── */}
        {(activeTab === "templates" || activeTab === "saved") &&
          categories.length > 0 && (
            <div className="flex flex-wrap gap-2 py-2 mb-4">
              {/* Show the first 15 categories as quick-pick chips; every
                  category (including the overflow) stays reachable via the
                  "All categories" select beside them. */}
              {categories.slice(0, 15).map((cat) => (
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
                  <PageSkeleton rows={3} />
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
                        <MockInterviewTemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => handleBookInterview(template)}
                          isSaved={savedIds.has(template.id)}
                          isSaving={savingIds.has(template.id)}
                          onToggleSave={(e) => handleToggleSave(template.id, e)}
                        />
                      ))}
                    </div>

                    {/* Pagination — templates tab */}
                    {activeTab === "templates" && (
                      <Pager
                        hasPrev={pagination.skip > 0}
                        hasNext={hasMore}
                        onPrev={handlePrevPage}
                        onNext={handleNextPage}
                      />
                    )}

                    {/* Pagination — saved tab */}
                    {activeTab === "saved" && savedTotal > PAGE_SIZE && (
                      <Pager
                        hasPrev={savedPage > 0}
                        hasNext={(savedPage + 1) * PAGE_SIZE < savedTotal}
                        onPrev={() => setSavedPage((p) => p - 1)}
                        onNext={() => setSavedPage((p) => p + 1)}
                      />
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
              <PageSkeleton rows={3} />
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
                    <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mt-1">
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
            {bookedTotal > PAGE_SIZE && bookedInterviews.length > 0 && (
              <Pager
                hasPrev={bookedPage > 0}
                hasNext={(bookedPage + 1) * PAGE_SIZE < bookedTotal}
                onPrev={() => setBookedPage((p) => p - 1)}
                onNext={() => setBookedPage((p) => p + 1)}
              />
            )}
          </>
        )}

        {/* ── Completed tab ─────────────────────────────────────────────────── */}
        {activeTab === "completed" && (
          <>
            {loading ? (
              <PageSkeleton rows={3} />
            ) : completedInterviews.length === 0 ? (
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
                {completedInterviews.map((interview) => (
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
                      <h3 className="font-bold text-foreground text-base leading-snug line-clamp-2 mt-1">
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
            {completedTotal > PAGE_SIZE && completedInterviews.length > 0 && (
              <Pager
                hasPrev={completedPage > 0}
                hasNext={(completedPage + 1) * PAGE_SIZE < completedTotal}
                onPrev={() => setCompletedPage((p) => p - 1)}
                onNext={() => setCompletedPage((p) => p + 1)}
              />
            )}
          </>
        )}
        {/* ── My Templates tab ─────────────────────────────────────────────── */}
        {activeTab === "my-templates" && (
          <>
            {myTemplatesLoading ? (
              <PageSkeleton rows={3} />
            ) : myTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  No custom templates yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Analyze a job description to generate a personalized interview
                  template tailored to the role.
                </p>
                <Button
                  onClick={() => onNavigate("/mock-interviews/prepare")}
                  className="gap-2"
                >
                  Practice for a real job
                </Button>
              </div>
            ) : (
              (() => {
                const totalPages = Math.ceil(
                  myTemplates.length / MY_TEMPLATES_PAGE_SIZE,
                );
                const paged = myTemplates.slice(
                  myTemplatesPage * MY_TEMPLATES_PAGE_SIZE,
                  (myTemplatesPage + 1) * MY_TEMPLATES_PAGE_SIZE,
                );
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {paged.map((template) => (
                        <MockInterviewTemplateCard
                          key={template.id}
                          template={template}
                          onSelect={() => handleBookInterview(template)}
                          onDelete={(e) => {
                            e.stopPropagation();
                            analytics.track("my_template_delete_initiated", {
                              template_id: template.id,
                            });
                            setDeleteTemplateId(template.id);
                          }}
                          actionLabel="Practice"
                        />
                      ))}
                    </div>

                    {myTemplates.length > MY_TEMPLATES_PAGE_SIZE && (
                      <Pager
                        hasPrev={myTemplatesPage > 0}
                        hasNext={myTemplatesPage < totalPages - 1}
                        onPrev={() => setMyTemplatesPage((p) => p - 1)}
                        onNext={() => setMyTemplatesPage((p) => p + 1)}
                      />
                    )}
                  </>
                );
              })()
            )}
          </>
        )}
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────────────────── */}

      {/* Booking Dialog */}
      <InterviewBookingDialog
        open={isBookingDialogOpen}
        onOpenChange={(open) => {
          setIsBookingDialogOpen(open);
          if (!open) setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        onNavigate={onNavigate}
        onBooked={() => {
          setActiveTab("booked");
          loadBookedInterviews();
        }}
      />

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
            <Button
              onClick={() => {
                analytics.track("mock_interview_upgrade_cta_clicked", {
                  from: "upgrade_dialog",
                  tier: interviewAccess?.tier,
                });
                onNavigate("/subscription/plans");
              }}
            >
              <Crown className="h-4 w-4 mr-2" />
              View Plans
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete My Template Confirmation */}
      <Dialog
        open={!!deleteTemplateId}
        onOpenChange={(open) => {
          if (!open) setDeleteTemplateId(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Template
            </DialogTitle>
            <DialogDescription>
              This template will be permanently deleted. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTemplateId(null)}
              disabled={deletingTemplate}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMyTemplate}
              disabled={deletingTemplate}
            >
              {deletingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
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
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Behavioral">Behavioral</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                    <SelectItem value="System Design">System Design</SelectItem>
                    <SelectItem value="Case Study">Case Study</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
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
