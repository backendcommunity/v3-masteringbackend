"use client";

/**
 * Split-screen scaffold for the scholarship flyer generator, built on the same
 * bones as AuthShell: Oxford Blue anchor on the left, white working column on
 * the right. The left panel advertises the bootcamp to everyone who lands here
 * from a shared flyer; the right runs the generator.
 *
 * Colour is literal brand hex rather than theme tokens, exactly as the auth
 * pages do it, so the white column cannot invert under a dark OS setting.
 */

import type { ReactNode } from "react";
import { LineworkWatermark } from "@/components/auth/auth-shell";

const OX = "#0E1F33";
const CANVAS = "#0c1222";
const CYAN = "#13AECE";
const LIGHT_BLUE = "#97C3CC";

const PARTNERS = [
  { src: "/partners/labspace.png", alt: "Lab Space", height: 26 },
  { src: "/partners/starnettech.png", alt: "Starnet Tech", height: 22 },
  { src: "/partners/techrity.png", alt: "Techrity", height: 20 },
  { src: "/partners/droomwork.png", alt: "Droomwork", height: 17 },
];

const PROOF = [
  "Structured learning paths from fundamentals to production",
  "Real-world projects and coding exercises, not just videos",
  "Mock interviews and a portfolio that makes you job-ready",
];

/** Where both CTAs send people. The ref tags the traffic this tool sends. */
const MEMBERSHIP_URL = "https://app.masteringbackend.com?ref=photo-generator";

export function FlyerShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen w-full grid lg:grid-cols-[minmax(0,41fr)_minmax(0,59fr)]"
      style={{ background: CANVAS, fontFamily: "Satoshi, system-ui, sans-serif" }}
    >
      {/* ── LEFT · The advert ───────────────────────────────────────── */}
      <aside
        className="relative hidden lg:flex flex-col justify-between overflow-hidden p-10 xl:p-14"
        style={{ background: OX }}
      >
        <LineworkWatermark />

        <div className="relative z-10">
          <a href="https://masteringbackend.com" aria-label="MasteringBackend">
            <img
              src="/White-trimed.png"
              alt="masteringbackend."
              width={431}
              height={50}
              className="block h-7 w-auto select-none"
              draggable={false}
            />
          </a>
        </div>

        <div className="relative z-10 max-w-[480px]">
          <p
            className="font-bold uppercase"
            style={{ color: CYAN, fontSize: 12.5, letterSpacing: "0.18em" }}
          >
            MasteringBackend Membership
          </p>
          <h2
            className="mt-5 font-bold"
            style={{ color: "#FFFFFF", fontSize: 34, lineHeight: 1.14, letterSpacing: "-0.02em" }}
          >
            Learn Backend and AI skills for as low as{" "}
            <span style={{ color: CYAN }}>₦9,999 a month</span>
          </h2>
          <p className="mt-4" style={{ color: LIGHT_BLUE, fontSize: 15.5, lineHeight: 1.6 }}>
            One subscription, the whole platform — the same way we train the AI
            Engineering Bootcamp cohorts.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {PROOF.map((line) => (
              <li key={line} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[9px] flex-shrink-0 rounded-full"
                  style={{ width: 6, height: 6, background: CYAN }}
                />
                <span style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 1.5 }}>{line}</span>
              </li>
            ))}
          </ul>

          <a
            href={MEMBERSHIP_URL}
            target="_blank"
            className="mt-7 inline-flex items-center gap-2 rounded-lg px-5 font-bold transition-all duration-200 hover:brightness-110 hover:-translate-y-[1px]"
            style={{ height: 48, background: CYAN, color: OX, fontSize: 15 }}
          >
            Start Your Journey Now
            <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="relative z-10">
          <p
            className="font-medium uppercase"
            style={{ color: LIGHT_BLUE, fontSize: 11, letterSpacing: "0.18em" }}
          >
            In partnership with
          </p>
          <div
            className="mt-3 flex w-fit items-center gap-5 rounded-lg px-3.5 py-2"
            style={{ background: "#FFFFFF" }}
          >
            {PARTNERS.map((p) => (
              <img
                key={p.src}
                src={p.src}
                alt={p.alt}
                style={{ height: p.height, width: "auto" }}
                className="block select-none"
                draggable={false}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── RIGHT · The generator ───────────────────────────────────── */}
      <main
        className="relative flex flex-col min-h-screen lg:min-h-0"
        style={{ background: "#FFFFFF" }}
      >
        <div className="lg:hidden flex flex-col items-center gap-3 pt-10">
          <a href="https://masteringbackend.com" aria-label="MasteringBackend">
            <img
              src="/blue-logo-trimed.png"
              alt="masteringbackend."
              width={424}
              height={50}
              className="block h-6 w-auto select-none"
              draggable={false}
            />
          </a>
          <p
            className="font-bold uppercase"
            style={{ color: "#0B7F97", fontSize: 11, letterSpacing: "0.18em" }}
          >
            ₦27 Million Scholarship Initiative
          </p>
        </div>

        {/* `my-auto` rather than `justify-center`: auto margins centre the column
            when it fits and collapse to a normal top-aligned scroll when it does
            not, so a short window never clips the heading. */}
        <div className="flex flex-1 flex-col items-center px-6 py-10 sm:px-10 lg:py-12">
          <div className="w-full lg:my-auto" style={{ maxWidth: 700 }}>
            {children}
          </div>
        </div>

        {/* The advert again for phones, where the left panel is hidden. */}
        <div className="lg:hidden px-6 pb-12 sm:px-10">
          <div
            className="relative mx-auto w-full overflow-hidden rounded-xl p-7"
            style={{ maxWidth: 700, background: OX }}
          >
            <LineworkWatermark />
            <div className="relative z-10">
              <p
                className="font-bold uppercase"
                style={{ color: CYAN, fontSize: 11, letterSpacing: "0.18em" }}
              >
                MasteringBackend Membership
              </p>
              <h2
                className="mt-3 font-bold"
                style={{ color: "#FFFFFF", fontSize: 24, lineHeight: 1.2, letterSpacing: "-0.02em" }}
              >
                Learn Backend and AI skills for as low as{" "}
                <span style={{ color: CYAN }}>₦9,999 a month</span>
              </h2>
              <p className="mt-3" style={{ color: LIGHT_BLUE, fontSize: 14.5, lineHeight: 1.6 }}>
                One subscription, the whole platform — guided paths, real projects,
                mock interviews.
              </p>
              <a
                href={MEMBERSHIP_URL}
                target="_blank"
                className="mt-6 inline-flex items-center gap-2 rounded-lg px-5 font-bold"
                style={{ height: 46, background: CYAN, color: OX, fontSize: 14.5 }}
              >
                Start Your Journey Now
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
