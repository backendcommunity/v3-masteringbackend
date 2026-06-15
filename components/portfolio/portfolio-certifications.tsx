"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { routes } from "@/lib/routes";
import type {
  PortfolioCertificate,
  PortfolioRoadmap,
} from "@/lib/portfolio-types";
import {
  Award,
  BadgeCheck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PortfolioCertificationsProps {
  certificates: PortfolioCertificate[];
  roadmaps: PortfolioRoadmap[];
}

const INITIAL_VISIBLE = 3;

function ShowMoreButton({
  expanded,
  remaining,
  onClick,
}: {
  expanded: boolean;
  remaining: number;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full text-muted-foreground"
      onClick={onClick}
    >
      {expanded ? (
        <>
          <ChevronUp className="mr-1 h-4 w-4" />
          Show less
        </>
      ) : (
        <>
          <ChevronDown className="mr-1 h-4 w-4" />
          Show {remaining} more
        </>
      )}
    </Button>
  );
}

export function PortfolioCertifications({
  certificates,
  roadmaps,
}: PortfolioCertificationsProps) {
  const [certsExpanded, setCertsExpanded] = useState(false);
  const [pathsExpanded, setPathsExpanded] = useState(false);

  if (!certificates.length && !roadmaps.length) return null;

  const visibleCerts = certsExpanded
    ? certificates
    : certificates.slice(0, INITIAL_VISIBLE);
  const visiblePaths = pathsExpanded
    ? roadmaps
    : roadmaps.slice(0, INITIAL_VISIBLE);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Certifications & Paths</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Certificates */}
        {certificates.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Certificates
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                <ShieldCheck className="h-3 w-3" />
                Verifiable credentials
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Every certificate is an independently verifiable MasteringBackend
              credential.
            </p>
            <div className="space-y-2.5">
              {visibleCerts.map((cert) => (
                <div
                  key={cert.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Award className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {cert.courseName}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Score: {cert.finalScore}%{" "}
                        <span className="mx-1">&middot;</span>
                        {new Date(cert.date).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  {cert.code && (
                    <Link
                      href={routes.verifyCertificate(cert.code)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#27AE60]/30 bg-[#27AE60]/10 px-2 py-1 text-[10px] font-medium text-[#27AE60] shrink-0 transition-colors hover:bg-[#27AE60]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                      aria-label={`Verify certificate for ${cert.courseName}`}
                    >
                      <BadgeCheck className="h-3 w-3" />
                      Verifiable
                    </Link>
                  )}
                </div>
              ))}
            </div>
            {certificates.length > INITIAL_VISIBLE && (
              <ShowMoreButton
                expanded={certsExpanded}
                remaining={certificates.length - INITIAL_VISIBLE}
                onClick={() => setCertsExpanded((v) => !v)}
              />
            )}
          </div>
        )}

        {/* Learning Paths */}
        {roadmaps.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Learning Paths
            </h4>
            <div className="space-y-4">
              {visiblePaths.map((roadmap) => (
                <div key={roadmap.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate">{roadmap.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums shrink-0 ml-2">
                      {roadmap.topicsCompleted}/{roadmap.topicsTotal}
                    </span>
                  </div>
                  <Progress value={roadmap.progress} className="h-1.5" />
                </div>
              ))}
            </div>
            {roadmaps.length > INITIAL_VISIBLE && (
              <ShowMoreButton
                expanded={pathsExpanded}
                remaining={roadmaps.length - INITIAL_VISIBLE}
                onClick={() => setPathsExpanded((v) => !v)}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
