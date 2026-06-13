"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Share2,
  Trophy,
  Flame,
  BookOpen,
  Award,
  Twitter,
  Hash,
  Calendar,
  Crown,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import type { PortfolioUser, PortfolioStats } from "@/lib/portfolio-types";

interface PortfolioHeroProps {
  user: PortfolioUser;
  stats: PortfolioStats;
}

export function PortfolioHero({ user, stats }: PortfolioHeroProps) {
  // xpToNextLevel is the remaining XP needed. Progress within current level span:
  //   (xp / (xp + xpToNextLevel)) gives progress from 0 to the next threshold,
  //   which is the correct fraction when the previous threshold is treated as 0.
  //   Clamped to [0, 1] in case of stale data.
  const xpProgress =
    user.xpToNextLevel > 0
      ? Math.min(1, user.xp / (user.xp + user.xpToNextLevel))
      : user.level >= 10
        ? 1
        : 0;
  const circumference = 2 * Math.PI * 52; // radius=52 for the ring
  const strokeOffset = circumference * (1 - xpProgress);

  const handleShare = () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `Check out ${user.name}'s developer portfolio on MasteringBackend!`;

    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: `${user.name} — Portfolio`,
          text: shareText,
          url: shareUrl,
        })
        .catch(() => {});
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Portfolio link copied to clipboard!");
    }
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const statItems = [
    { icon: Trophy, value: stats.totalProjects, label: "Projects" },
    {
      icon: Award,
      value: stats.totalPoints.toLocaleString(),
      label: "MB Points",
    },
    { icon: BookOpen, value: stats.coursesCompleted, label: "Courses" },
    {
      icon: Hash,
      value: `#${stats.globalRank}`,
      label: `of ${stats.totalUsers.toLocaleString()}`,
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0c1222] p-6 md:p-8">
      {/* Decorative orbs */}
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[#9B59B6]/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar with XP ring */}
        <div className="relative shrink-0">
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            className="absolute -inset-[10px]"
          >
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#13AECE"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000"
            />
          </svg>
          <Avatar className="h-[100px] w-[100px] border-2 border-white/10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Level badge */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary hover:bg-primary text-white text-[10px] px-2 py-0.5 shadow-lg shadow-primary/25 whitespace-nowrap">
              Lv.{user.level} — {user.levelName}
            </Badge>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {user.name}
              </h1>
              <Tooltip>
                <TooltipTrigger asChild>
                  {user.isVerified && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </TooltipTrigger>
                <TooltipContent>
                  Verified Account by MasteringBackend
                </TooltipContent>
              </Tooltip>
              {user.isPremium && (
                <Badge className="bg-[#F2C94C]/15 text-[#F2C94C] border-[#F2C94C]/30 hover:bg-[#F2C94C]/20 text-[10px] px-1.5 py-0 gap-0.5">
                  <Crown className="h-2.5 w-2.5 fill-current" />
                  {user.isTrial ? "Trial" : "Pro"}
                </Badge>
              )}
              {user.isOpenToWork && (
                <span className="inline-flex items-center gap-1.5 bg-[#27AE60]/15 border border-[#27AE60]/25 rounded-full px-2.5 py-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#27AE60] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#27AE60]" />
                  </span>
                  <span className="text-[#27AE60] text-[10px] font-medium">
                    Open to Work
                  </span>
                </span>
              )}
            </div>
            <p className="text-white/60 text-sm mt-0.5">{user.title}</p>
            {user.location && (
              <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3" />
                {user.location}
              </p>
            )}
            <p className="text-white/40 text-xs flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Member since{" "}
              {new Date(user.joinedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <p className="text-white/50 text-sm max-w-lg leading-relaxed">
            {user.bio}
          </p>

          {/* Social links + share */}
          <div className="flex items-center gap-2 flex-wrap">
            {user.socialLinks.github && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                    asChild
                  >
                    <a
                      href={user.socialLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View GitHub Profile</TooltipContent>
              </Tooltip>
            )}
            {user.socialLinks.linkedin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                    asChild
                  >
                    <a
                      href={user.socialLinks.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View LinkedIn Profile</TooltipContent>
              </Tooltip>
            )}
            {user.socialLinks.twitter && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                    asChild
                  >
                    <a
                      href={user.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Follow on X (Twitter)</TooltipContent>
              </Tooltip>
            )}
            {user.socialLinks.website && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                    asChild
                  >
                    <a
                      href={user.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visit Website</TooltipContent>
              </Tooltip>
            )}
            {user.resume && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                    asChild
                  >
                    <a
                      href={user.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download Resume</TooltipContent>
              </Tooltip>
            )}
            <div className="w-px h-5 bg-white/10 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-xs gap-1.5"
                  onClick={handleShare}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share this portfolio</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0 w-full md:w-auto">
          {statItems?.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3"
            >
              <stat.icon className="h-4 w-4 text-primary shrink-0" />
              <div>
                <p className="text-white font-bold text-sm leading-none">
                  {stat.value}
                </p>
                <p className="text-white/40 text-[10px] mt-0.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak badge */}
      {user.streak > 0 && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
          <div className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/25 rounded-full px-2.5 py-1">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            <span className="text-orange-300 text-xs font-semibold">
              {user.streak}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
