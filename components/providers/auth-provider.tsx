"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { updateUser } from "@/lib/data";
import { getStoredUser } from "@/lib/user-store";
import { analytics } from "@/lib/analytics";
import { Loader } from "@/components/ui/loader";
import { markActivity, isIdle, getLastActivity, IDLE_TIMEOUT_MS } from "@/lib/activity";
import { refreshSession } from "@/lib/auth-refresh";
import { IdleLock } from "@/components/providers/idle-lock";

const AUTH_PATHS = ["/auth/"];
const IDLE_CHECK_INTERVAL_MS = 60 * 1000;
const PROACTIVE_REFRESH_INTERVAL_MS = 55 * 60 * 1000;
const TAB_REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const initialized = useRef(false);
  const tabHiddenAt = useRef<number | null>(null);
  const idleCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const proactiveRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAuthPath = AUTH_PATHS.some((p) => pathname?.startsWith(p) ?? false);

  // Track user activity — reset idle timer on any interaction
  useEffect(() => {
    if (isAuthPath) return;
    const onActivity = () => markActivity();
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, onActivity));
  }, [isAuthPath]);

  // Idle detection: show resume-in-place lock after IDLE_TIMEOUT_MS — no logout
  useEffect(() => {
    if (isAuthPath) return;
    idleCheckRef.current = setInterval(() => {
      if (isIdle()) setLocked(true);
    }, IDLE_CHECK_INTERVAL_MS);
    return () => {
      if (idleCheckRef.current) clearInterval(idleCheckRef.current);
    };
  }, [isAuthPath]);

  // Proactive token refresh — only fires when user is NOT idle and NOT locked
  useEffect(() => {
    if (isAuthPath) return;
    proactiveRefreshRef.current = setInterval(() => {
      if (locked || isIdle()) return;
      refreshSession().catch(() => {});
    }, PROACTIVE_REFRESH_INTERVAL_MS);
    return () => {
      if (proactiveRefreshRef.current) clearInterval(proactiveRefreshRef.current);
    };
  }, [isAuthPath, locked]);

  // Refresh on tab focus — but only if tab was hidden long enough to risk token expiry
  useEffect(() => {
    if (isAuthPath) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        tabHiddenAt.current = Date.now();
        return;
      }
      const hiddenFor = tabHiddenAt.current ? Date.now() - tabHiddenAt.current : 0;
      tabHiddenAt.current = null;
      if (hiddenFor < TAB_REFRESH_THRESHOLD_MS) return;
      if (Date.now() - getLastActivity() >= IDLE_TIMEOUT_MS) {
        setLocked(true);
        return;
      }
      refreshSession().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
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

  return (
    <>
      {children}
      {locked && !isAuthPath && (
        <IdleLock
          onResume={() => {
            markActivity();
            setLocked(false);
            refreshSession().catch(() => {});
          }}
        />
      )}
    </>
  );
}
