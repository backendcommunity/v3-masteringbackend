"use client";

import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/loader";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { PortfolioData, PortfolioResponse } from "@/lib/portfolio-types";
import { transformPortfolioResponse } from "@/lib/portfolio-transformer";
import { useUser } from "@/hooks/use-user";
import { useAppStore } from "@/lib/store";
import { PortfolioHero } from "@/components/portfolio/portfolio-hero";
import { PortfolioTechStack } from "@/components/portfolio/portfolio-tech-stack";
import { PortfolioProjects } from "@/components/portfolio/portfolio-projects";
import { PortfolioHeatmap } from "@/components/portfolio/portfolio-heatmap";
import { PortfolioInterviews } from "@/components/portfolio/portfolio-interviews";
import { PortfolioAchievements } from "@/components/portfolio/portfolio-achievements";
import { PortfolioCertifications } from "@/components/portfolio/portfolio-certifications";
import { PortfolioQuickStats } from "@/components/portfolio/portfolio-quick-stats";
import { PortfolioBootcamps } from "@/components/portfolio/portfolio-bootcamps";

interface DeveloperPortfolioPageProps {
  userId: string;
  onNavigate?: (path: string) => void;
}

export function DeveloperPortfolioPage({
  userId,
}: DeveloperPortfolioPageProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const store = useAppStore();
  const currentUser = useUser();
  const isOwner = Boolean(currentUser?.id && currentUser.id === userId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        // Fetch real portfolio data from API
        const data = await store.getDeveloperPortfolio(userId);
        if (!cancelled) {
          if (data) {
            // Transform PortfolioResponse to PortfolioData for component compatibility
            const portfolioData = transformPortfolioResponse(data);
            setPortfolio(portfolioData);
          } else {
            setPortfolio(null);
          }
        }
      } catch (error) {
        console.error("Failed to load portfolio:", error);
        if (!cancelled) setPortfolio(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId, store]);

  if (loading) {
    return <Loader isLoader={false} />;
  }

  if (!portfolio) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Portfolio not found</h1>
          <p className="text-muted-foreground text-sm">
            This developer portfolio could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex-1 space-y-6">
        {/* Hero */}
        <PortfolioHero
          user={portfolio.user}
          stats={portfolio.stats}
          isOwner={isOwner}
        />

        {/* Projects — promoted: full-width, directly under the hero */}
        <PortfolioProjects projects={portfolio.projects} />

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column — 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioTechStack skills={portfolio.skills} />
            {isOwner && <PortfolioHeatmap activity={portfolio.activity} />}
            {isOwner && (
              <PortfolioInterviews mockInterviews={portfolio.mockInterviews} />
            )}
          </div>

          {/* Right column — 1/3 */}
          <div className="space-y-6">
            <PortfolioCertifications
              certificates={portfolio.certificates}
              roadmaps={portfolio.roadmaps}
            />
            <PortfolioBootcamps bootcamps={portfolio.bootcamps} />
            {isOwner && (
              <PortfolioQuickStats
                quizExerciseSummary={portfolio.quizExerciseSummary}
                bootcamps={portfolio.bootcamps}
              />
            )}
            {isOwner && (
              <PortfolioAchievements achievements={portfolio.achievements} />
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
