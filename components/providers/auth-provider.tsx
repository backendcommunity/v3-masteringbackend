"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { updateUser } from "@/lib/data";
import { getStoredUser } from "@/lib/user-store";
import { analytics } from "@/lib/analytics";
import { Loader } from "@/components/ui/loader";
import { api, handleAuthFailure } from "@/lib/api";

const AUTH_PATHS = ["/auth/"];

// Force relogin after 30 minutes of no user activity
const IDLE_TIMEOUT_MS = 30 * 60 * 1000;
// Check idle state every 60 seconds
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;
// Proactively refresh access token every 55 minutes (token TTL is 1h)
const PROACTIVE_REFRESH_INTERVAL_MS = 55 * 60 * 1000;
// Only refresh on tab focus if hidden for more than 5 minutes
const TAB_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);
  const lastActivity = useRef<number>(Date.now());
  const tabHiddenAt = useRef<number | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const proactiveRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAuthPath = AUTH_PATHS.some((p) => pathname?.startsWith(p) ?? false);

  // Track user activity — reset idle timer on any interaction
  useEffect(() => {
    if (isAuthPath) return;

    const resetActivity = () => {
      lastActivity.current = Date.now();
    };

    const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetActivity, { passive: true })
    );

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetActivity)
      );
    };
  }, [isAuthPath]);

  // Idle detection: force logout after IDLE_TIMEOUT_MS of no activity
  useEffect(() => {
    if (isAuthPath) return;

    idleCheckRef.current = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_TIMEOUT_MS) {
        clearInterval(idleCheckRef.current!);
        clearInterval(proactiveRefreshRef.current!);
        handleAuthFailure();
      }
    }, IDLE_CHECK_INTERVAL_MS);

    return () => {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, [isAuthPath]);

  // Proactive token refresh — only fires when user is NOT idle
  useEffect(() => {
    if (isAuthPath) return;

    proactiveRefreshRef.current = setInterval(async () => {
      const idle = Date.now() - lastActivity.current;
      // Skip refresh if user has been idle — idle check will handle forced logout
      if (idle >= IDLE_TIMEOUT_MS) return;

      try {
        await api.post("/auth/refresh");
      } catch {
        // api.ts interceptor handles redirect on auth failure
      }
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => {
      if (proactiveRefreshRef.current) clearInterval(proactiveRefreshRef.current);
    };
  }, [isAuthPath]);

  // Refresh on tab focus — but only if tab was hidden long enough to risk token expiry
  useEffect(() => {
    if (isAuthPath) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        tabHiddenAt.current = Date.now();
        return;
      }

      // Tab became visible
      const hiddenDuration = tabHiddenAt.current
        ? Date.now() - tabHiddenAt.current
        : 0;
      tabHiddenAt.current = null;

      // Not hidden long enough to risk token expiry — skip refresh call
      if (hiddenDuration < TAB_REFRESH_THRESHOLD_MS) return;

      // Check idle state first — if user was idle before hiding, force logout
      const idle = Date.now() - lastActivity.current;
      if (idle >= IDLE_TIMEOUT_MS) {
        handleAuthFailure();
        return;
      }

      try {
        await api.post("/auth/refresh");
      } catch {
        // api.ts interceptor handles redirect
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAuthPath]);

  useEffect(() => {
    if (isAuthPath) {
      setReady(true);
      return;
    }

    if (getStoredUser()) {
      setReady(true);
      return;
    }

    if (initialized.current) return;
    initialized.current = true;

    fetchUser()
      .then((res) => {
        updateUser(res.data);
        analytics.identify(res.data.id, {
          email: res.data.email,
          name: res.data.name,
          username: res.data.username,
          isPremium: res.data.isPremium,
          hasFinishedOnboarding: res.data.hasFinishedOnboarding,
          signedUpThrough: res.data.signedUpThrough,
          createdAt: res.data.createdAt,
          country: res.data.country,
          role: res.data.role,
          plan: res.data.plan ?? null,
          subscriptionStatus: res.data.subscriptionStatus ?? null,
          experienceLevel: res.data.experienceLevel ?? null,
          preferredLanguage: res.data.preferredLanguage ?? null,
        });
      })
      .catch(() => {
        // api.ts interceptor handles token refresh + redirect to /auth/login on failure
      })
      .finally(() => {
        setReady(true);
      });
  }, [isAuthPath]);

  if (!ready && !isAuthPath) return <Loader />;

  return <>{children}</>;
}
