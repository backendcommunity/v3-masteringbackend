"use client";

/**
 * The flyer itself: a locked 1080×1350 template with exactly two live fields,
 * the photo and the name. Everything else is fixed copy.
 *
 * Two rules this file must keep, both verified against html2canvas 1.4.1
 * (the version this project ships) before it was written:
 *
 *   • no `inline-flex`   — its children are never painted into the export
 *   • no `mask-image`    — dropped entirely; the linework fade is a painted scrim
 *   • no `fill-opacity`  — inline SVG opacity is lost; use solid fills
 *   • every SVG data URI carries explicit width/height, or it rasterises to
 *     nothing inside an <img>
 *
 * Sizes are inline pixel values rather than utility classes because this
 * component is a fixed-size artwork, not a responsive layout: the preview is
 * the same node under a CSS transform, so what is approved is what downloads.
 */

import { useLayoutEffect, useRef, useState, forwardRef } from "react";
import {
  fitName,
  LEAD_MAX_PX,
  NAME_PLACEHOLDER,
  type NameFit,
} from "@/lib/scholarship-flyer/fit-name";
import { FLYER_WIDTH, FLYER_HEIGHT } from "@/lib/scholarship-flyer/render";

export type FlyerGround = "navy" | "white";
export type PhotoShape = "square" | "circle";

const LEAD_LINE_HEIGHT = 1.28;
const AMOUNT_PX = 142;

interface GroundTokens {
  bg: string;
  ink: string;
  lead: string;
  accent: string;
  soft: string;
  mute: string;
  slot: string;
  figure: string;
  plate: string;
  lines: string;
  scrim: string;
}

/** The 80px brand tile from public/hero-linework.svg, inlined per ground. */
const linework = (stroke: string, strokeOpacity: string, dot: string, dotOpacity: string) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cg stroke='${stroke}' stroke-opacity='${strokeOpacity}' fill='none'%3E%3Cpath d='M0 40 L40 0 L80 40 L40 80 Z' stroke-width='1'/%3E%3Cpath d='M20 40 L40 20 L60 40 L40 60 Z' stroke-width='1'/%3E%3C/g%3E%3Cg fill='${dot}' fill-opacity='${dotOpacity}' stroke='none'%3E%3Ccircle cx='40' cy='40' r='1.7'/%3E%3Ccircle cx='0' cy='0' r='1.5'/%3E%3Ccircle cx='80' cy='0' r='1.5'/%3E%3Ccircle cx='0' cy='80' r='1.5'/%3E%3Ccircle cx='80' cy='80' r='1.5'/%3E%3C/g%3E%3C/svg%3E")`;

export const GROUNDS: Record<FlyerGround, GroundTokens> = {
  navy: {
    bg: "#0F1B2A",
    ink: "#FFFFFF",
    lead: "#B9C8D6",
    accent: "#3FC4E0",
    soft: "#9DAEBD",
    mute: "#8FA2B3",
    slot: "#1A2A3D",
    figure: "#31506E",
    plate: "#FFFFFF",
    lines: linework("%23ffffff", "0.12", "%23ffffff", "0.2"),
    scrim:
      "linear-gradient(280deg, rgba(15,27,42,0) 0%, rgba(15,27,42,0.6) 56%, rgba(15,27,42,1) 100%)",
  },
  white: {
    bg: "#FFFFFF",
    ink: "#0F1B2A",
    lead: "#48596B",
    accent: "#0B7F97",
    soft: "#5E7186",
    mute: "#7C8DA0",
    slot: "#E9EEF3",
    figure: "#C4D2DF",
    plate: "#F1F5F8",
    lines: linework("%230F1B2A", "0.12", "%2313AECE", "0.5"),
    scrim:
      "linear-gradient(280deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 56%, rgba(255,255,255,1) 100%)",
  },
};

/**
 * Optical heights, not a single shared height: labspace is a square glyph while
 * the other three are wordmark lockups, so matching bounding boxes would make
 * the glyph read twice as large as the marks beside it.
 */
const PARTNERS = [
  { src: "/partners/labspace.png", alt: "Lab Space", height: 40 },
  { src: "/partners/starnettech.png", alt: "Starnet Tech", height: 34 },
  { src: "/partners/techrity.png", alt: "Techrity", height: 32 },
  { src: "/partners/droomwork.png", alt: "Droomwork", height: 26 },
];

/**
 * Solid fills only, and explicit width/height on the <svg>: `fill-opacity` does
 * not survive the html2canvas export, and an SVG data URI without intrinsic
 * dimensions rasterises to nothing.
 */
const photoPlaceholder = (slot: string, figure: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="${slot}"/><g fill="${figure}"><circle cx="200" cy="162" r="62"/><path d="M64 400c0-76 61-128 136-128s136 52 136 128z"/></g></svg>`,
  )}`;

export interface FlyerCanvasProps {
  ground: FlyerGround;
  /** Raw text from the name field; fitting happens here. */
  name: string;
  /** Data URL from readPhoto, or null for the placeholder silhouette. */
  photoSrc: string | null;
  photoShape: PhotoShape;
  /** Preview scale. 1 renders at true size; the export always captures at 1. */
  scale?: number;
  onFit?: (fit: NameFit) => void;
}

export const FlyerCanvas = forwardRef<HTMLDivElement, FlyerCanvasProps>(
  function FlyerCanvas({ ground, name, photoSrc, photoShape, scale = 1, onFit }, ref) {
    const t = GROUNDS[ground];
    const leadRef = useRef<HTMLDivElement>(null);
    const nameRef = useRef<HTMLSpanElement>(null);
    const [fit, setFit] = useState<NameFit>({
      name: NAME_PLACEHOLDER,
      fontSize: LEAD_MAX_PX,
      truncated: false,
    });

    useLayoutEffect(() => {
      const lead = leadRef.current;
      const nameEl = nameRef.current;
      if (!lead || !nameEl) return;

      const next = fitName(name, (fontSize, candidate) => {
        nameEl.textContent = candidate;
        lead.style.fontSize = `${fontSize}px`;
        return Math.max(1, Math.round(lead.scrollHeight / (fontSize * LEAD_LINE_HEIGHT)));
      });

      lead.style.fontSize = `${next.fontSize}px`;
      setFit(next);
      onFit?.(next);
    }, [name, ground, onFit]);

    return (
      <div
        ref={ref}
        style={{
          width: FLYER_WIDTH,
          height: FLYER_HEIGHT,
          position: "absolute",
          top: 0,
          left: 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: t.bg,
          color: t.ink,
          padding: 96,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: t.lines,
            backgroundSize: "80px 80px",
            backgroundRepeat: "repeat",
          }}
        />
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: t.scrim }} />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 56 }}>
            <div
              style={{
                width: 236,
                height: 236,
                flex: "none",
                overflow: "hidden",
                background: t.slot,
                borderRadius: photoShape === "circle" ? "50%" : 0,
              }}
            >
              <img
                src={photoSrc ?? photoPlaceholder(t.slot, t.figure)}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  // Rounded on the image too: html2canvas clips a child against
                  // its own radius more reliably than against an ancestor's.
                  borderRadius: photoShape === "circle" ? "50%" : 0,
                }}
              />
            </div>
            <div style={{ fontSize: 29, fontWeight: 400, lineHeight: 1.4, color: t.soft, maxWidth: 352, paddingTop: 4 }}>
              Moving beyond using AI tools to building real AI systems.
            </div>
          </div>

          <div
            ref={leadRef}
            style={{
              marginTop: 108,
              fontSize: fit.fontSize,
              fontWeight: 400,
              lineHeight: LEAD_LINE_HEIGHT,
              color: t.lead,
              letterSpacing: "-0.012em",
              maxWidth: 900,
            }}
          >
            I, <span ref={nameRef} style={{ fontWeight: 700, color: t.ink }}>{fit.name}</span>, will be joining the
          </div>

          <div
            style={{
              marginTop: 30,
              fontSize: AMOUNT_PX,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.048em",
              color: t.ink,
            }}
          >
            ₦27 MILLION
          </div>
          <div style={{ marginTop: 26, fontSize: 46, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.018em", color: t.accent }}>
            AI Engineering Scholarship Initiative
          </div>
          <div style={{ marginTop: 6, fontSize: 46, fontWeight: 500, lineHeight: 1.2, letterSpacing: "-0.018em", color: t.accent }}>
            Cohort 2
          </div>

          <div style={{ marginTop: "auto", fontSize: 42, fontWeight: 400, letterSpacing: "-0.015em", color: t.ink }}>
            Starts September 7, 2026
          </div>

          <div style={{ marginTop: 46, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: t.mute }}>
                In partnership with
              </div>
              <div
                style={{
                  display: "flex",
                  width: "fit-content",
                  alignItems: "center",
                  gap: 26,
                  marginTop: 14,
                  background: t.plate,
                  borderRadius: 8,
                  padding: "12px 18px",
                }}
              >
                {PARTNERS.map((p) => (
                  <img key={p.src} src={p.src} alt={p.alt} style={{ height: p.height, width: "auto", display: "block" }} />
                ))}
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "0.02em", color: t.mute, whiteSpace: "nowrap" }}>
              masteringbackend.com
            </div>
          </div>
        </div>
      </div>
    );
  },
);
