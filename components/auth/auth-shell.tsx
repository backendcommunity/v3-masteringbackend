"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * AuthShell — dark split-screen scaffold for all /auth pages.
 *
 * Left  (lg+): Oxford Blue brand anchor with a testimonial box + linework watermark.
 * Right (all): the form column (children), on a white surface.
 *
 * All colour comes from literal brand hexes so it renders identically
 * regardless of the `.dark` class.
 */

interface AuthShellProps {
  children: ReactNode;
  /** Optional "back" link shown top-left of the form column. */
  backHref?: string;
  backLabel?: string;
}

const OX = "#0E1F33";
const CANVAS = "#0c1222";
const CYAN = "#13AECE";
const LIGHT_BLUE = "#97C3CC";

export function AuthShell({
  children,
  backHref,
  backLabel = "Back to Login",
}: AuthShellProps) {
  return (
    <div
      className="min-h-screen w-full grid lg:grid-cols-2"
      style={{
        background: CANVAS,
        fontFamily: "Satoshi, system-ui, sans-serif",
      }}
    >
      {/* ── LEFT · Brand anchor + testimonial ───────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16"
        style={{ background: OX }}
      >
        <LineworkWatermark />

        {/* Wordmark — white wordmark, trimmed of its baked-in padding so it
            sizes crisp on the Oxford-blue panel. Intrinsic 431×50; explicit
            dims lock the aspect ratio (no CLS). */}
        <div className="relative z-10">
          <img
            src="/White-trimed.png"
            alt="masteringbackend."
            width={431}
            height={50}
            className="block h-7 w-auto select-none"
            draggable={false}
          />
        </div>

        {/* Testimonial */}
        <div className="relative z-10 max-w-[460px]">
          <QuoteMark />
          <blockquote
            className="mt-5 font-bold leading-[1.3]"
            style={{ color: "#FFFFFF", fontSize: 26, letterSpacing: "-0.01em" }}
          >
            I went from stuck mid-level to a remote senior role in 7 months. The
            labs feel like real production work — not toy tutorials.
          </blockquote>

          <div className="mt-7 flex items-center gap-4">
            <div
              className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
              style={{
                width: 52,
                height: 52,
                background: "rgba(19,174,206,0.18)",
                border: `2px solid ${CYAN}`,
                color: CYAN,
                fontSize: 17,
              }}
            >
              AO
            </div>
            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 600, fontSize: 16 }}>
                Adaeze Okafor
              </div>
              <div style={{ color: LIGHT_BLUE, fontSize: 13.5 }}>
                Senior Backend Engineer · remote
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10" style={{ height: 8 }} />
      </aside>

      {/* ── RIGHT · Form column (white) ─────────────────────────────── */}
      <main
        className="relative flex flex-col min-h-screen lg:min-h-0"
        style={{ background: "#FFFFFF" }}
      >
        {backHref && (
          <div className="absolute top-6 left-6 z-10">
            <Link
              href={backHref}
              className="flex items-center gap-2 transition-colors"
              style={{ color: "#64748B", fontSize: 14 }}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backLabel}</span>
            </Link>
          </div>
        )}

        {/* Mobile wordmark (left panel hidden on small screens) — tight dark
            wordmark, centered, on the white surface. Intrinsic 424×50. */}
        <div className="lg:hidden flex justify-center pt-10">
          <img
            src="/blue-logo-trimed.png"
            alt="masteringbackend."
            width={424}
            height={50}
            className="block h-6 w-auto select-none"
            draggable={false}
          />
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full" style={{ maxWidth: 440 }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function QuoteMark() {
  return (
    <svg
      width="44"
      height="36"
      viewBox="0 0 44 36"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 36V20C0 9 6.5 1.8 18 0L20 6C13.5 7.6 10 11.4 10 17H18V36H0ZM24 36V20C24 9 30.5 1.8 42 0L44 6C37.5 7.6 34 11.4 34 17H42V36H24Z"
        fill="#13AECE"
        fillOpacity="0.55"
      />
    </svg>
  );
}

function LineworkWatermark() {
  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.06 }}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="auth-linework"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 40 L40 0 L80 40 L40 80 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <path
            d="M20 40 L40 20 L60 40 L40 60 Z"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          <circle cx="40" cy="40" r="1.6" fill="#FFFFFF" />
          <circle cx="0" cy="0" r="1.4" fill="#FFFFFF" />
          <circle cx="80" cy="0" r="1.4" fill="#FFFFFF" />
          <circle cx="0" cy="80" r="1.4" fill="#FFFFFF" />
          <circle cx="80" cy="80" r="1.4" fill="#FFFFFF" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#auth-linework)" />
    </svg>
  );
}
