"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pager } from "@/components/ui/pager";
import { JourneyGlyph } from "@/components/journey-glyph";
import { BootcampCard } from "@/components/pages/bootcamps/bootcamp-card";
import { useAppStore } from "@/lib/store";
import { useDebounce } from "@/hooks/use-debounce";
import { Bootcamp } from "@/lib/data";
import { Loader } from "../ui/loader";
import { routes } from "@/lib/routes";
import { Search } from "lucide-react";

interface BootcampsPageProps {
  onNavigate?: (url: string) => void;
}

const PAGE_SIZE = 9;

const TABS = [
  { value: "all", label: "All" },
  { value: "my", label: "My" },
  { value: "soon", label: "Soon" },
  { value: "popular", label: "Popular" },
] as const;

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col items-center justify-center py-12 px-6">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          No bootcamps match your filters
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Try adjusting your search or filters to find what you&apos;re looking
          for.
        </p>
      </div>
    </div>
  );
}

export function BootcampsPage({ onNavigate }: BootcampsPageProps) {
  const store = useAppStore();

  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [duration, setDuration] = useState("all");
  const [page, setPage] = useState(0);

  const [bootcamps, setBootcamps] = useState<Bootcamp[]>([]);
  const [loading, setLoading] = useState(true);

  const terms = useDebounce(search, 500);

  // ── Load bootcamps (server-side type/level/duration/terms filtering) ──
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await store.getBootcamps({
          skip: 0,
          size: 200,
          filters: {
            type: tab,
            level,
            duration,
            terms,
          },
        });
        if (!cancelled) setBootcamps(data?.bootcamps ?? []);
      } catch {
        if (!cancelled) setBootcamps([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [store, tab, level, duration, terms]);

  // Reset page whenever a filter or tab changes
  useEffect(() => {
    setPage(0);
  }, [tab, search, level, duration]);

  const list = bootcamps ?? [];
  const pagedList = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* ── Grow hero (navy anchor · grow pillar) ── */}
      <div className="bg-[#0E1F33] text-white relative overflow-hidden dark:ring-1 dark:ring-white/10">
        <div className="hero-grid absolute inset-0" aria-hidden="true" />
        <div className="relative px-5 py-6 sm:px-8 sm:py-7 md:min-h-[174px] flex flex-col justify-center">
          <JourneyGlyph
            stage="learn"
            className="absolute right-10 top-1/2 -translate-y-1/2 hidden md:block"
          />
          <div className="max-w-2xl">
            <div className="eyebrow-mono text-[#4AC5E8]">learn</div>
            <h1 className="text-2xl font-bold mt-1.5">Bootcamps</h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/[.78]">
              Join a cohort, learn live, and ship alongside peers.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter row (mirrors courses / project30) ── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bootcamps…"
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
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Durations</SelectItem>
              <SelectItem value="short">4-8 weeks</SelectItem>
              <SelectItem value="medium">8-12 weeks</SelectItem>
              <SelectItem value="long">12+ weeks</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <Loader isLoader={false} />
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pagedList.map((b) => (
              <BootcampCard
                key={b.id}
                bootcamp={b}
                onNavigate={(id) => onNavigate?.(routes.bootcampDetail(id))}
              />
            ))}
          </div>
          <Pager
            hasPrev={page > 0}
            hasNext={(page + 1) * PAGE_SIZE < list.length}
            onPrev={() => setPage((p) => p - 1)}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}
