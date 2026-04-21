"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NavigationBar } from "@/components/navigation-bar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { useUserStore } from "@/lib/user-store";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
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

  // Onboarding guard — runs only after user is loaded from AuthProvider
  if (user?.hasFinishedOnboarding === false) {
    router.replace("/onboarding");
    return null;
  }

  return (
    <>
      <NavigationBar
        onNavigate={handleNavigate}
        onMenuToggle={toggleSidebar}
        isMobile={isMobile}
      />

      <div className="flex min-h-screen bg-background  overflow-hidden relative">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 top-0 left-0 z-50 md:translate-x-0 h-full transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${
            isMobile && !isCollapsed
              ? "w-72 z-40"
              : isCollapsed
                ? "w-20"
                : "w-72"
          }
          bg-backgroun border-r border-border`}
        >
          <DashboardSidebar
            onCollapsed={setIsCollapsed}
            currentPath={pathname ?? "/"}
            onNavigate={handleNavigate}
            isMobile={isMobile}
            isCollapsed={isCollapsed}
          />
        </div>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content area */}
        <div
          className={`flex-1 flex w-full flex-col transition-all duration-300
          ${
            !isMobile
              ? sidebarOpen
                ? isCollapsed
                  ? "md:ml-20"
                  : "md:ml-72"
                : "ml-0"
              : "ml-0"
          }
          `}
        >
          <main className="flex-1 overflow-y-auto w-full p-4 md:p-6">
            {children}
          </main>
          {/* <KapAIAssistant /> */}
        </div>
      </div>
    </>
  );
}
