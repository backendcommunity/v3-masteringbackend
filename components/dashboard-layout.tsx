"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavigationBar } from "@/components/navigation-bar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/lib/user-store";
import { ForcePasswordChangeModal } from "@/components/force-password-change-modal";
import { completeOnboarding } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /**
   * Full-bleed mode: skip the centered `max-w-7xl` content container.
   * Use for immersive pages (course/path watch, playground) that need full width.
   */
  fluid?: boolean;
}

export function DashboardLayout({ children, fluid = false }: DashboardLayoutProps) {
  const isMobile = useMobile();
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // User is guaranteed to be loaded by AuthProvider before this renders
  const user = useUserStore((s) => s.user);

  const handleNavigate = (path: string) => router.push(path);

  // Auto-close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);

    if (pathname?.includes("playground")) setIsCollapsed(true);
    if (pathname?.includes("videos")) setIsCollapsed(true);
    if (pathname?.includes("watch")) setIsCollapsed(true);
  }, [pathname, isMobile]);

  // Update sidebar when screen size changes
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isMobile, sidebarOpen]);

  // Handle ?redirect= for OAuth existing users and post-onboarding navigation
  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    const search = window.location.search;
    const redirect = new URLSearchParams(search).get("redirect");

    if (user.hasFinishedOnboarding === false) {
      const skip = new URLSearchParams(search).get("skip") === "true";
      if (skip) {
        // Workshop certificate flow: skip onboarding, land directly on destination
        completeOnboarding({ skipped: true }).catch(() => {});
        if (redirect) router.replace(redirect);
        return;
      }
      // Preserve redirect through onboarding for new users
      const existingRedirect = redirect || pathname || "/";
      router.replace(`/onboarding?redirect=${encodeURIComponent(existingRedirect)}`);
      return;
    }

    // Existing onboarded user arriving via OAuth callback (/?redirect=X)
    if (redirect) {
      router.replace(redirect);
    }
  }, [user, pathname, router]);

  // Prevent flash of dashboard content for new users before redirect fires.
  // Exception: skip=true (workshop cert flow) — let them through immediately.
  const skipOnboarding =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("skip") === "true";
  if (user?.hasFinishedOnboarding === false && !skipOnboarding) return null;

  return (
    <>
      {user?.mustResetPassword && <ForcePasswordChangeModal />}
      <NavigationBar
        onNavigate={handleNavigate}
        onMenuToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex min-h-screen bg-background overflow-hidden relative">
        {/* Sidebar — fixed drawer on mobile, persistent rail on desktop.
            Mobile is ALWAYS the full-width drawer (w-72); the collapsed rail is
            a desktop-only concept, so width/margin switch at the md breakpoint
            via CSS, not the JS isMobile flag (avoids hydration flash). */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 h-full bg-[#0E1F33] transition-transform duration-300 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          w-72 ${isCollapsed ? "md:w-20" : "md:w-72"}`}
        >
          <DashboardSidebar
            onCollapsed={setIsCollapsed}
            currentPath={pathname ?? "/"}
            onNavigate={handleNavigate}
            isMobile={isMobile}
            // Never render the narrow collapsed UI inside the mobile drawer.
            isCollapsed={isMobile ? false : isCollapsed}
          />
        </aside>

        {/* Mobile overlay — below the drawer (z-40), above content. */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area — drawer overlays on mobile (no margin), rail
            offsets on desktop via CSS breakpoints. */}
        <div
          className={`flex-1 flex w-full min-w-0 flex-col transition-all duration-300 ${
            isCollapsed ? "md:ml-20" : "md:ml-72"
          }`}
        >
          {/* Centralized content container — every page aligns to the same
              `max-w-7xl` width + `px-6 py-6` padding (matches mock-interviews).
              Full-bleed pages opt out via `fluid`. */}
          <main className="flex-1 overflow-y-auto w-full">
            {fluid ? (
              <div className="p-4 md:p-6">{children}</div>
            ) : (
              <div className="mx-auto w-full max-w-7xl px-6 py-6">{children}</div>
            )}
          </main>
          {/* <KapAIAssistant /> */}
        </div>
      </div>
    </>
  );
}
