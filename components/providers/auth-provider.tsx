"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { fetchUser } from "@/lib/auth";
import { updateUser } from "@/lib/data";
import { getStoredUser } from "@/lib/user-store";
import { analytics } from "@/lib/analytics";
import { Loader } from "@/components/ui/loader";

const AUTH_PATHS = ["/auth/"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const initialized = useRef(false);

  const isAuthPath = AUTH_PATHS.some((p) => pathname?.startsWith(p) ?? false);

  useEffect(() => {
    // Auth pages don't need user data — skip initialization
    if (isAuthPath) {
      setReady(true);
      return;
    }

    // Already initialized this session (in-memory Zustand store has user)
    if (getStoredUser()) {
      setReady(true);
      return;
    }

    // Prevent double-invocation in React StrictMode
    if (initialized.current) return;
    initialized.current = true;

    fetchUser()
      .then((res) => {
        updateUser(res.data);
        analytics.identify(res.data.id, {
          email: res.data.email,
          name: res.data.name,
          isPremium: res.data.isPremium,
          country: res.data.country,
          role: res.data.role,
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
