"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogTrigger,
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
  Timer,
  Layout,
  Play,
  CalendarClock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  Crown,
  AlertTriangle,
  Lock,
  Wrench,
  X,
  MessageSquare,
} from "lucide-react";
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

  const [showDevBanner, setShowDevBanner] = useState(true);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [creating, setCreating] = useState(false);

  const [pagination, setPagination] = useState({ size: 10, skip: 0 });
  const [totalTemplates, setTotalTemplates] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: "",
    style: "",
    format: "",
    search: "",
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

      if (!result?.id) {
        toast.error("Failed to start chat interview");
        return;
      }

      toast.success("Chat interview started!");
      setIsBookingDialogOpen(false);
      onNavigate(`/mock-interviews/${result.id}/chat`);
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

    try {
      setCreating(true);

      // Start the interview by scheduling it with immediate time
      // This should create and return a session
      const result = await store.createMockInterviewRoom(interview.id);

      console.log("Join Interview - Room Creation Result:", result);

      if (result?.session?.id) {
        // Navigate to the session page
        onNavigate(`/mock-interviews/${result.session.id}`);
      } else {
        toast.error("Failed to start interview session. Please try again.");
        console.error("No session returned from API:", result);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex md:item-center md:flex-row flex-col gap-3 justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mock Interviews</h1>
          <p className="text-muted-foreground">
            Practice with AI-powered interviews to ace your next job interview
          </p>
          {interviewAccess &&
            (interviewAccess.tier === "free" ||
              interviewAccess.tier === "pro") && (
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={
                    interviewAccess.remainingSessions === 0
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {interviewAccess.tier === "free"
                    ? interviewAccess.remainingSessions === 0
                      ? "Free trial used"
                      : "1 free trial interview available"
                    : `${interviewAccess.remainingSessions} of ${interviewAccess.maxSessions} sessions remaining this month`}
                </Badge>
              </div>
            )}
          {interviewAccess?.tier === "enterprise" && (
            <Badge variant="secondary" className="mt-1 text-xs">
              <Crown className="h-3 w-3 mr-1" />
              Enterprise — Unlimited sessions
            </Badge>
          )}
        </div>
        <div className="flex md:items-center md:flex-row flex-col gap-3">
          <Dialog
            open={isCreateInterviewDialogOpen}
            onOpenChange={setIsCreateInterviewDialogOpen}
          >
            <DialogTrigger asChild>
              <Button disabled={true}>
                <Plus className="h-4 w-4 mr-2" />
                Create from Job Description
              </Button>
            </DialogTrigger>
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
                  <Label
                    htmlFor="seniority"
                    className="flex items-center gap-2"
                  >
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
                      <SelectItem value="system-design">
                        System Design
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="difficulty"
                    className="flex items-center gap-2"
                  >
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

                {/* <div className="grid gap-2">
                  <Label htmlFor="format" className="flex items-center gap-2">
                    <Layout className="h-4 w-4 text-muted-foreground" />
                    Format
                  </Label>
                  <Select
                    value={customInterviewData.format}
                    onValueChange={(value) =>
                      handleCustomInterviewChange("format", value)
                    }
                  >
                    <SelectTrigger id="format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div> */}

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
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-2"
                  >
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
                <Button
                  onClick={handleCreateCustomInterview}
                  disabled={creating}
                >
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

          <Dialog
            open={isCreateTemplateDialogOpen}
            onOpenChange={setIsCreateTemplateDialogOpen}
          >
            {user?.role === "ADMIN" && (
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
            )}
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
                    <Label
                      htmlFor="seniority"
                      className="flex items-center gap-2"
                    >
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
                        <SelectItem value="system-design">
                          System Design
                        </SelectItem>
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

          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">Powered by Kap AI</span>
          </div>
        </div>
      </div>

      {/* Under Development Banner */}
      {showDevBanner && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/8 px-4 py-3">
          <Wrench className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              Mock Interview is actively being improved
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Some features are still in development. You can browse templates
              and schedule interviews — full session support is coming very
              soon.
            </p>
          </div>
          <button
            onClick={() => setShowDevBanner(false)}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Session Limit Reached Banner */}
      {interviewAccess && !interviewAccess.hasAccess && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="flex flex-col sm:flex-row items-center gap-4 p-4">
            <AlertTriangle className="h-8 w-8 text-orange-500 shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">
                {interviewAccess.tier === "free"
                  ? interviewAccess.remainingSessions === 0
                    ? "Free Trial Used"
                    : "Access 1 Free Trial Interview"
                  : "Monthly Limit Reached"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {interviewAccess.tier === "free"
                  ? interviewAccess.remainingSessions === 0
                    ? "You've used your free trial interview. Upgrade to Pro for 4 sessions/month or Enterprise for unlimited access."
                    : "You've 1 free trial interview. Upgrade to Pro for 4 sessions/month or Enterprise for unlimited access."
                  : "You've used all your mock interviews this month. Upgrade to Enterprise for unlimited sessions."}
              </p>
            </div>
            <Button onClick={() => onNavigate("/subscription/plans")}>
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Interviews
            </CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalInterviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {bookedInterviews.length} booked
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.upcomingInterviews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled interviews
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Based on {completedInterviews.length} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Practice Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.practicedHours || 0}h
            </div>
            <p className="text-xs text-muted-foreground">Total practice time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        onValueChange={setActiveTab}
        value={activeTab}
        defaultValue="templates"
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="templates">
            Templates ({totalTemplates})
          </TabsTrigger>
          <TabsTrigger value="booked">
            Booked ({bookedInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-difficulty">
                    <Filter className="h-4 w-4 inline mr-2" />
                    Difficulty
                  </Label>
                  <Select
                    value={filters.difficulty || "all"}
                    onValueChange={(value) =>
                      handleFilterChange(
                        "difficulty",
                        value === "all" ? "" : value,
                      )
                    }
                  >
                    <SelectTrigger id="filter-difficulty">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-style">Style</Label>
                  <Select
                    value={filters.style || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("style", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger id="filter-style">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="coding">Coding</SelectItem>
                      <SelectItem value="system-design">
                        System Design
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filter-format">Format</Label>
                  <Select
                    value={filters.format || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("format", value === "all" ? "" : value)
                    }
                  >
                    <SelectTrigger id="filter-format">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search templates..."
                      className="pl-8"
                      value={filters.search}
                      onChange={(e) =>
                        handleFilterChange("search", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Try adjusting your filters or create a new template
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {template.name ||
                              `${template.position} at ${template.company}`}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">
                              {template.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {template.duration} min
                            </div>
                          </div>
                        </div>
                      </div>
                      {template.company && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3" />
                          {template.company}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-muted-foreground">
                          <p>{template?.summary?.substring(0, 180) + "..."}</p>
                        </div>
                        {template.topics && template.topics.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Topics:
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {template.topics.slice(0, 3).map((topic, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {topic}
                                </Badge>
                              ))}
                              {template.topics.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{template.topics.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full"
                          onClick={() => handleBookInterview(template)}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Book Interview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {pagination.skip + 1} to{" "}
                  {Math.min(pagination.skip + pagination.size, totalTemplates)}{" "}
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
            </>
          )}
        </TabsContent>

        <TabsContent value="booked" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : bookedInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Booked Interviews
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Book your first mock interview to start practicing
                </p>
                <Button onClick={() => setActiveTab("templates")}>
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookedInterviews.map((interview) => (
                <Card
                  key={interview.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center flex-col lg:flex-row gap-3 justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {interview.template.name ||
                            `${interview.template.position} at ${interview.template.company}`}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          {interview.scheduledTime && (
                            <>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  interview.scheduledTime,
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  interview.scheduledTime,
                                ).toLocaleTimeString()}
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {interview.template.duration} min
                          </div>
                          <Badge className="hidden lg:block" variant="outline">
                            {interview.status}
                          </Badge>
                        </div>
                      </div>

                      {!interview.scheduledTime ? (
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedTemplate(interview.template);
                            setIsBookingDialogOpen(true);
                          }}
                        >
                          <Video className="h-4 w-4 mr-2" />
                          Schedule Interview
                        </Button>
                      ) : new Date(interview.scheduledTime) > new Date() ? (
                        <Badge variant={"destructive"}>Upcoming</Badge>
                      ) : (
                        <Button onClick={() => handleJoinInterview(interview)}>
                          <Video className="h-4 w-4 mr-2" />
                          Join Interview
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : completedInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Completed Interviews
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Complete your first interview to see results here
                </p>
                <Button onClick={() => setActiveTab("templates")}>
                  Browse Templates
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedInterviews.map((interview) => (
                <Card
                  key={interview.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-center flex-col lg:flex-row gap-3 justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {interview.template.name ||
                            `${interview.template.position} at ${interview.template.company}`}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(interview.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3" />
                            {interview.template.duration} min
                          </div>
                          <Badge variant="outline">
                            {interview.template.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleViewResults(interview.completedSessionId!)
                        }
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}

      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Book{" "}
              {selectedTemplate?.name ||
                `${selectedTemplate?.position} Interview`}
            </DialogTitle>
            <DialogDescription>
              Choose how you want to start your mock interview.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Chat Interview Option */}
            <Card className="border-primary/30 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Start Chat Interview</h3>
                  <p className="text-sm text-muted-foreground">
                    Text-based AI interview with code editor and whiteboard
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() =>
                    selectedTemplate && handleStartChatNow(selectedTemplate.id)
                  }
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Start Now Option (Voice — coming soon) */}
            <Card className="opacity-50 cursor-not-allowed">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Play className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Start Now</h3>
                  <p className="text-sm text-muted-foreground">
                    Begin your mock interview immediately with our AI
                    interviewer
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={true}
                  // onClick={() =>
                  //   selectedTemplate && handleStartNow(selectedTemplate.id)
                  // }
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Start
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Schedule Option */}
            <Card className="border-dashed opacity-50">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                    <CalendarClock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Schedule for Later</h3>
                    <p className="text-sm text-muted-foreground">
                      Pick a date and time that works best for you
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  variant="outline"
                  disabled={true}
                  // onClick={() =>
                  //   selectedTemplate &&
                  //   handleScheduleInterview(selectedTemplate.id)
                  // }
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Interview
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Interview Details */}
          {selectedTemplate && (
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <h4 className="text-sm font-medium">Interview Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {selectedTemplate.duration} min</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Star className="h-4 w-4" />
                  <span>Difficulty: {selectedTemplate.difficulty}</span>
                </div>
              </div>
              {selectedTemplate.topics &&
                selectedTemplate.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedTemplate.topics.slice(0, 4).map((topic, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {topic}
                      </Badge>
                    ))}
                    {selectedTemplate.topics.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{selectedTemplate.topics.length - 4} more
                      </Badge>
                    )}
                  </div>
                )}
            </div>
          )}
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
    </div>
  );
}
