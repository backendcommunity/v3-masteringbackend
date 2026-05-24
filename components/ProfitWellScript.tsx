"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    profitwell: (action: string, options?: Record<string, unknown>) => void;
  }
}

interface ProfitWellScriptProps {
  userEmail: string;
}

export default function ProfitWellScript({ userEmail }: ProfitWellScriptProps) {
  useEffect(() => {
    // Check if script already exists
    if (document.getElementById("profitwell-js")) return;

    // Create script tag
    const script = document.createElement("script");
    script.id = "profitwell-js";
    script.setAttribute("data-pw-auth", "f42d5f063f6d9a094c9299943a33a0e5");
    script.async = true;
    script.src = `https://public.profitwell.com/js/profitwell.js?auth=f42d5f063f6d9a094c9299943a33a0e5`;

    script.onload = () => {
      if (typeof window !== "undefined" && window?.profitwell) {
        window.profitwell("start", {
          user_email: userEmail,
        });
      }
    };

    document.body.appendChild(script);
  }, [userEmail]);

  return null;
}
