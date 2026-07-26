"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pager } from "@/components/ui/pager";
import { JourneyGlyph } from "@/components/journey-glyph";
import { Project30Card } from "@/components/pages/project30/project30-card";
import { useAppStore } from "@/lib/store";
import { Project30, UserProject30 } from "@/lib/data";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface Project30ListingPageProps {
  onNavigate: (path: string) => void;
}

const PAGE_SIZE = 9;

const CATEGORIES = [
  "Backend",
  "Full-Stack",
  "Mobile",
  "DevOps",
  "AI/ML",
] as const;

const TABS = [
  { value: "all", label: "All" },
  { value: "my", label: "My" },
  { value: "popular", label: "Popular" },
  { value: "new", label: "New" },
] as const;

/** Map a UserProject30 (my-list shape) onto the Project30 shape the card needs. */
function toEnrolledProject30(up: UserProject30): Project30 {
  return {
    ...(up.offer as Project30),
    isEnrolled: true,
    progress: up.progress ?? 0,
  };
}

function categoryName(project30: Project30): string {
  return typeof project30.category === "string"
    ? project30.category
    : project30.category?.name ?? "";
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No challenges match your filters
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Try adjusting your search or filters to find what you&apos;re looking
          for.
        </p>
      </div>
    </div>
  );
}

export function Project30ListingPage({
  onNavigate,
}: Project30ListingPageProps) {
  const store = useAppStore();

  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);

  const [offers, setOffers] = useState<Project30[]>([]);
  const [enrolled, setEnrolled] = useState<UserProject30[]>([]);
  const [loading, setLoading] = useState(true);

  const handleNavigate = (slug: string) => onNavigate(`/project30/${slug}`);

  // ── Load all/popular/new source (getProject30s) ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await store.getProject30s();
        if (!cancelled) setOffers(data?.offers ?? []);
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [store]);

  // ── Load my list (loadMyProject30s) when My tab active ──
  useEffect(() => {
    if (tab !== "my") return;
    let cancelled = false;
    async function load() {
      try {
        const data = await store.loadMyProject30s();
        if (!cancelled) setEnrolled(data ?? []);
      } catch {
        if (!cancelled) setEnrolled([]);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tab, store]);

  // Reset page whenever a filter or tab changes
  useEffect(() => {
    setPage(0);
  }, [tab, search, level, category]);

  // ── Derive the active list per tab, then apply client-side filters ──
  const baseList: Project30[] = useMemo(() => {
    if (tab === "my") return enrolled.map(toEnrolledProject30);
    if (tab === "popular")
      return [...offers].sort((a, b) => (b.students ?? 0) - (a.students ?? 0));
    // "new" keeps API order (no date field on the list shape); "all" = API order
    return offers;
  }, [tab, offers, enrolled]);

  const filteredList = useMemo(() => {
    const term = search.trim().toLowerCase();
    return baseList.filter((p) => {
      const matchesSearch =
        !term ||
        p.title?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      const matchesLevel = level === "all" || p.level === level;
      const matchesCategory =
        category === "all" || categoryName(p) === category;
      return matchesSearch && matchesLevel && matchesCategory;
    });
  }, [baseList, search, level, category]);

  const pagedList = filteredList.slice(
    page * PAGE_SIZE,
    page * PAGE_SIZE + PAGE_SIZE,
  );

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* ── Build hero (navy anchor · build pillar) ── */}
      <div className="bg-[#0E1F33] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7 md:min-h-[174px] flex flex-col justify-center">
          <JourneyGlyph
            stage="build"
            className="absolute right-4 top-4 w-20 opacity-40 md:right-10 md:top-1/2 md:w-60 md:-translate-y-1/2 md:opacity-100"
          />
          <div className="max-w-2xl">
            <div className="eyebrow-mono text-[#4AC5E8]">build</div>
            <h1 className="text-2xl font-bold mt-1.5">Ship</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
              Build real-world backend projects in focused 30-day challenges.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter row (mirrors courses) ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search challenges…"
            className="pl-9 pr-4 py-2 w-full sm:w-72 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={
              tab === t.value
                ? "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors bg-primary text-primary-foreground"
                : "rounded-xl px-3.5 py-2 text-sm font-medium transition-colors border border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }
          >
            {t.label}
          </button>
        ))}

        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-2">
          <Select value={level} onValueChange={setLevel}>
            <SelectTrigger className="w-[130px] rounded-xl">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Category pills (All tab only) ── */}
      {tab === "all" && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? "all" : cat)}
              className={
                category === cat
                  ? "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap border-primary bg-primary/10 text-primary font-medium"
                  : "px-3.5 py-1.5 rounded-full border text-sm transition-all whitespace-nowrap border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* ── Grid ── */}
      {loading ? (
        <PageSkeleton />
      ) : filteredList.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedList.map((p) => (
              <Project30Card
                key={p.id}
                project30={p}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
          <Pager
            hasPrev={page > 0}
            hasNext={(page + 1) * PAGE_SIZE < filteredList.length}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}
