"use client";

import type { ReactNode } from "react";

/**
 * Shared form primitives for the /auth split-screen pages.
 * LEFT anchor stays Oxford Blue; the RIGHT form column is white (light),
 * matching the original Claude Design.
 */

export const authInputClass =
  "w-full px-4 py-3 rounded-lg text-[15px] text-[#0E1F33] placeholder-[#94A3B8] " +
  "bg-white border border-[#E2E8F0] outline-none transition " +
  "hover:border-[#CBD5E1] focus:border-[#13AECE] focus:ring-2 focus:ring-[#13AECE]/20";

export const authLabelClass = "block text-sm font-medium text-[#0E1F33] mb-2";

export const authPrimaryBtnClass =
  "w-full h-[52px] rounded-lg bg-[#13AECE] text-[#0E1F33] font-bold text-[15px] " +
  "flex items-center justify-center gap-2 transition-all duration-200 " +
  "hover:brightness-110 hover:-translate-y-[1px] active:translate-y-0 active:brightness-95 " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:brightness-100";

export const authSocialBtnClass =
  "w-full h-[48px] rounded-lg flex items-center justify-center gap-3 text-[15px] font-medium " +
  "text-[#0E1F33] bg-white border border-[#E2E8F0] transition " +
  "hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-50 disabled:cursor-not-allowed";

export const authGhostBtnClass =
  "w-full h-[48px] rounded-lg flex items-center justify-center gap-2 text-[15px] font-medium " +
  "text-[#0E1F33] bg-white border border-[#E2E8F0] transition " +
  "hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed";

export function AuthHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <div className="mb-7">
      <h1 className="text-[32px] leading-[1.1] font-bold text-[#0E1F33] tracking-[-0.02em]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[15px] leading-[1.5] text-[#64748B]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[#E2E8F0]" />
      </div>
      <div className="relative flex justify-center">
        <span className="px-3 text-[13px] text-[#64748B] bg-white">
          {label}
        </span>
      </div>
    </div>
  );
}

/** GitHub + Google brand icons. */
export function GithubGlyph() {
  return (
    <svg
      className="w-5 h-5"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-1.72c-2.78.62-3.37-1.34-3.37-1.34-.46-1.18-1.11-1.49-1.11-1.49-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.55-1.14-4.55-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05A9.4 9.4 0 0 1 12 6.86c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.95.68 1.91v2.83c0 .27.18.59.69.49C20.71 21.39 24 17.08 24 12 24 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export function GoogleGlyph() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
