"use client";

import React, { forwardRef, useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import jsPDF from "jspdf";

/**
 * The printable "Certificate of Completion" paper, shared by every certificate
 * type (course, bootcamp, project, project30, path). Wording is deliberately
 * generic: only the title changes between types.
 *
 * The paper is a fixed 1000x707 canvas (A5 landscape) in plain px so it
 * is easy to redraw to a canvas for the PDF. Use <ScaledCertificatePaper>
 * to fit it to its container.
 */

export const CERT_W = 1000;
export const CERT_H = 707;

const FONT = '"Satoshi", system-ui, sans-serif';
const NAVY = [31, 63, 120];
const BLUE = [74, 128, 220];

const PANEL_PATH =
  "M132.7 46.5 H864.6 V68.7 A69.8 93.6 0 0 0 937.1 162.3 H952.4 V543.1 H937.1 A69.8 93.6 0 0 0 864.6 637.3 V661 H132.7 V637.3 A69.8 93.6 0 0 0 62.9 543.1 H46.5 V162.3 H62.9 A69.8 93.6 0 0 0 132.7 68.7 Z";

// The gradient title is one solid-coloured span per letter (no
// background-clip:text), so the on-screen paper and the PDF match exactly.
function certGradientColor(t: number) {
  return NAVY.map((n, k) => Math.round(n + (BLUE[k] - n) * t));
}

function gradientLetters(text: string) {
  const chars = Array.from(text);
  return chars.map((ch, i) => {
    const [r, g, b] = certGradientColor(chars.length > 1 ? i / (chars.length - 1) : 0);
    return (
      <span key={i} style={{ color: `rgb(${r},${g},${b})` }}>
        {ch}
      </span>
    );
  });
}

export interface CertificatePaperProps {
  studentName: string;
  /** Course / bootcamp / project / path title. */
  title: string;
  /** Already formatted, e.g. "16 November 2026". */
  completionDate: string;
  certCode?: string;
  /** Verify URL encoded in the QR. */
  qrValue?: string;
}

const abs: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  textAlign: "center",
  margin: 0,
};

// Scalloped edge for the gold seal.
export const SEAL_EDGE = (() => {
  let d = "";
  const n = 18;
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI * i) / n;
    const r = i % 2 ? 66 : 72;
    d += `${i ? "L" : "M"}${(100 + r * Math.cos(a)).toFixed(1)} ${(100 + r * Math.sin(a)).toFixed(1)}`;
  }
  return d + "Z";
})();

export const CertificatePaper = forwardRef<
  HTMLDivElement,
  CertificatePaperProps
>(function CertificatePaper(
  { studentName, title, completionDate, certCode, qrValue },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        width: CERT_W,
        height: CERT_H,
        overflow: "hidden",
        background:
          "linear-gradient(115deg,#f6f6f7 0%,#efeff0 35%,#f7f7f8 60%,#ededee 100%)",
        color: "#0b0f14",
        fontFamily: FONT,
      }}
    >
      <svg
        viewBox={`0 0 ${CERT_W} ${CERT_H}`}
        width={CERT_W}
        height={CERT_H}
        style={{ position: "absolute", left: 0, top: 0 }}
        aria-hidden="true"
      >
        <path
          d={PANEL_PATH}
          fill="#e9eef5"
          stroke="#c9dcea"
          strokeWidth="1.2"
        />
      </svg>

      <h2
        style={{
          ...abs,
          top: 86,
          fontSize: 64,
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: "-0.01em",
        }}
      >
        {gradientLetters("CERTIFICATE")}
      </h2>

      <div
        style={{
          ...abs,
          top: 150,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
        }}
      >
        <Rule side="l" />
        <span
          style={{
            fontSize: 29,
            lineHeight: 1,
            fontStyle: "italic",
            fontWeight: 400,
          }}
        >
          OF COMPLETION
        </span>
        <Rule side="r" />
      </div>

      <p style={{ ...abs, top: 202, fontSize: 16, lineHeight: 1.1 }}>
        This Certificate is proudly presented to
      </p>
      <p
        style={{
          ...abs,
          top: 252,
          fontSize: 33,
          lineHeight: 1.1,
          fontWeight: 900,
          padding: "0 120px",
        }}
      >
        {studentName}
      </p>
      <p
        style={{
          ...abs,
          top: 316,
          fontSize: 13.2,
          lineHeight: 1.2,
          padding: "0 120px",
        }}
      >
        In recognition of your successful completion of
      </p>
      <p
        style={{
          ...abs,
          top: 335,
          fontSize: 17.5,
          lineHeight: 1.2,
          fontWeight: 700,
          padding: "0 120px",
        }}
      >
        {title}
      </p>
      <p
        style={{
          ...abs,
          top: 371,
          fontSize: 13.7,
          lineHeight: 1.46,
          padding: "0 200px",
        }}
      >
        Your dedication and consistent effort show real commitment to learning.
        <br />
        Completed on <b>{completionDate.replace(/ /g, " ")}</b> on{" "}
        <b>Mastering&nbsp;Backend</b>.
      </p>

      {/* Signature */}
      <div style={{ position: "absolute", left: 151, top: 553, width: 212 }}>
        <div
          style={{
            fontSize: 24,
            lineHeight: 1,
            padding: "0 0 5px 23px",
            borderBottom: "0.8px solid #111",
            boxSizing: "border-box",
          }}
        >
          Solomon Eseme
        </div>
        <div style={{ marginTop: 10, fontSize: 13.2, lineHeight: 1.45 }}>
          <b style={{ display: "block", fontWeight: 700 }}>Solomon Eseme</b>
          Founder &amp; CEO Mastering Backend
        </div>
      </div>

      {/* Gold seal */}
      <svg
        viewBox="0 0 200 250"
        width={108}
        height={135}
        style={{ position: "absolute", left: 445, top: 469 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="cp-g1" cx="35%" cy="30%" r="80%">
            <stop offset="0" stopColor="#f3d98a" />
            <stop offset=".5" stopColor="#d3a548" />
            <stop offset="1" stopColor="#9a6b1c" />
          </radialGradient>
          <linearGradient id="cp-g2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3d98a" />
            <stop offset="1" stopColor="#a87a25" />
          </linearGradient>
          <linearGradient id="cp-g3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e8c36d" />
            <stop offset="1" stopColor="#b38326" />
          </linearGradient>
        </defs>
        <path d="M62 140 L28 238 L68 218 L88 246 L108 150Z" fill="url(#cp-g2)" />
        <path
          d="M138 140 L172 238 L132 218 L112 246 L92 150Z"
          fill="url(#cp-g3)"
        />
        <path d={SEAL_EDGE} fill="url(#cp-g1)" />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="#a87a25"
          strokeWidth="3"
          strokeDasharray="3 3"
        />
        <circle
          cx="100"
          cy="100"
          r="54"
          fill="url(#cp-g1)"
          stroke="#f3d98a"
          strokeWidth="2"
        />
        <circle cx="100" cy="100" r="40" fill="#d9ad52" opacity=".55" />
      </svg>

      {/* Verify + mark */}
      <div
        style={{
          position: "absolute",
          right: 240,
          top: 584,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            background: "#fff",
            padding: 3,
            boxSizing: "border-box",
          }}
        >
          {qrValue ? (
            <QRCodeCanvas
              value={qrValue}
              size={128}
              level="M"
              bgColor="#ffffff"
              fgColor="#000000"
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          ) : null}
        </div>
        <div style={{ fontSize: 8.5, lineHeight: 1.4, color: "#33414f" }}>
          Certificate ID
          <br />
          <b
            style={{
              fontFamily: "ui-monospace, Menlo, monospace",
              fontSize: 9,
              color: "#0b0f14",
            }}
          >
            {certCode ?? "—"}
          </b>
          <br />
          Scan to verify
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/certificate-mark.png"
        alt="Mastering Backend"
        width={69}
        height={43}
        style={{ position: "absolute", right: 148, top: 590 }}
      />
    </div>
  );
});

function Rule({ side }: { side: "l" | "r" }) {
  return (
    <span
      style={{
        position: "relative",
        display: "block",
        height: 1.7,
        width: 143,
        background: "#111",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: -4.4,
          [side === "l" ? "left" : "right"]: -5,
          width: 10.5,
          height: 10.5,
          background: "#111",
          transform: "rotate(45deg)",
        }}
      />
    </span>
  );
}

/**
 * Fits the paper to its container width. `captureRef` points at the wrapper so
 * the PDF export can reach the QR <canvas> inside it.
 */
export function ScaledCertificatePaper({
  captureRef,
  ...paper
}: CertificatePaperProps & {
  captureRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1, el.clientWidth / CERT_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={(node) => {
        boxRef.current = node;
        if (captureRef) captureRef.current = node;
      }}
      style={{
        width: "100%",
        maxWidth: CERT_W,
        marginInline: "auto",
        height: CERT_H * scale,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 10px 40px rgba(10,20,30,.18)",
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: CERT_W,
          height: CERT_H,
        }}
      >
        <CertificatePaper {...paper} />
      </div>
    </div>
  );
}

const SANS = '"Satoshi", system-ui, sans-serif';

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Draws the certificate straight onto a canvas using the same coordinates as
 * <CertificatePaper>. html2canvas was dropped for export: it offset text by a
 * font-dependent amount and lost the SVG seal.
 */
async function drawCertificate(
  paper: CertificatePaperProps,
  qrCanvas: HTMLCanvasElement | null,
) {
  const K = 2;
  await Promise.all(
    ["400 16px", "700 16px", "900 16px", "italic 400 16px"].map((f) =>
      document.fonts.load(`${f} Satoshi`),
    ),
  );
  const mark = await loadImage("/certificate-mark.png");

  const canvas = document.createElement("canvas");
  canvas.width = CERT_W * K;
  canvas.height = CERT_H * K;
  const c = canvas.getContext("2d")!;
  c.scale(K, K);
  c.textBaseline = "middle";
  c.textAlign = "left";

  const font = (w: string, px: number, italic = false) =>
    (c.font = `${italic ? "italic " : ""}${w} ${px}px ${SANS}`);
  const width = (t: string) => c.measureText(t).width;
  const center = (t: string, y: number, fill = "#0b0f14") => {
    c.fillStyle = fill;
    c.fillText(t, (CERT_W - width(t)) / 2, y);
  };

  // paper
  const bg = c.createLinearGradient(0, 0, CERT_W, CERT_H);
  bg.addColorStop(0, "#f6f6f7");
  bg.addColorStop(0.35, "#efeff0");
  bg.addColorStop(0.6, "#f7f7f8");
  bg.addColorStop(1, "#ededee");
  c.fillStyle = bg;
  c.fillRect(0, 0, CERT_W, CERT_H);
  const panel = new Path2D(PANEL_PATH);
  c.fillStyle = "#e9eef5";
  c.fill(panel);
  c.strokeStyle = "#c9dcea";
  c.lineWidth = 1.2;
  c.stroke(panel);

  // title, one colour per letter (same as the on-screen paper)
  font("900", 64);
  const letters = Array.from("CERTIFICATE");
  const ls = -0.64;
  const adv = letters.map((ch) => width(ch) + ls);
  let x = (CERT_W - adv.reduce((a, b) => a + b, 0) + ls * -1) / 2;
  letters.forEach((ch, i) => {
    const [r, g, b] = certGradientColor(i / (letters.length - 1));
    c.fillStyle = `rgb(${r},${g},${b})`;
    c.fillText(ch, x, 86 + 32);
    x += adv[i];
  });

  // "OF COMPLETION" between two rules
  font("400", 29, true);
  const sub = "OF COMPLETION";
  const subW = width(sub);
  const total = 143 + 14 + subW + 14 + 143;
  const sx = (CERT_W - total) / 2;
  const sy = 150 + 14.5;
  c.fillStyle = "#111";
  c.fillText(sub, sx + 143 + 14, sy);
  c.fillRect(sx, sy - 0.85, 143, 1.7);
  c.fillRect(sx + total - 143, sy - 0.85, 143, 1.7);
  for (const dx of [sx, sx + total]) {
    c.save();
    c.translate(dx, sy);
    c.rotate(Math.PI / 4);
    c.fillRect(-5.25, -5.25, 10.5, 10.5);
    c.restore();
  }

  font("400", 16);
  center("This Certificate is proudly presented to", 202 + 8.8);
  font("900", 33);
  center(paper.studentName, 252 + 18.15);
  font("400", 13.2);
  center("In recognition of your successful completion of", 316 + 7.92);
  font("700", 17.5);
  center(paper.title, 335 + 10.5);
  font("400", 13.7);
  center(
    "Your dedication and consistent effort show real commitment to learning.",
    371 + 10,
  );
  // line 2 mixes weights
  const segs: [string, string][] = [
    ["400", "Completed on "],
    ["700", paper.completionDate],
    ["400", " on "],
    ["700", "Mastering Backend"],
    ["400", "."],
  ];
  let lineW = 0;
  for (const [w, t] of segs) {
    font(w, 13.7);
    lineW += width(t);
  }
  let lx = (CERT_W - lineW) / 2;
  c.fillStyle = "#0b0f14";
  for (const [w, t] of segs) {
    font(w, 13.7);
    c.fillText(t, lx, 371 + 30);
    lx += width(t);
  }

  // signature
  font("400", 24);
  c.fillStyle = "#0b0f14";
  c.fillText("Solomon Eseme", 151 + 23, 553 + 12);
  c.fillStyle = "#111";
  c.fillRect(151, 553 + 29, 212, 0.8);
  font("700", 13.2);
  c.fillStyle = "#0b0f14";
  c.fillText("Solomon Eseme", 151, 592.8 + 9.6);
  font("400", 13.2);
  c.fillText("Founder & CEO Mastering Backend", 151, 592.8 + 28.7);

  drawSeal(c, 445, 469, 0.54);

  // verify block
  const idText = paper.certCode ?? "—";
  font("400", 8.5);
  const w1 = Math.max(width("Certificate ID"), width("Scan to verify"));
  c.font = `700 9px ui-monospace, Menlo, monospace`;
  const w2 = width(idText);
  const blockW = 46 + 8 + Math.max(w1, w2);
  const bx = CERT_W - 240 - blockW;
  c.fillStyle = "#fff";
  c.fillRect(bx, 584, 46, 46);
  if (qrCanvas) c.drawImage(qrCanvas, bx + 3, 584 + 3, 40, 40);
  c.fillStyle = "#33414f";
  font("400", 8.5);
  c.fillText("Certificate ID", bx + 54, 595.2);
  c.fillText("Scan to verify", bx + 54, 619);
  c.font = `700 9px ui-monospace, Menlo, monospace`;
  c.fillStyle = "#0b0f14";
  c.fillText(idText, bx + 54, 607.1);

  c.drawImage(mark, CERT_W - 148 - 69, 590, 69, 43);
  return canvas;
}

function drawSeal(
  c: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  k: number,
) {
  c.save();
  c.translate(ox, oy);
  c.scale(k, k);
  const lin = (x0: number, y0: number, x1: number, y1: number, a: string, b: string) => {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, a);
    g.addColorStop(1, b);
    return g;
  };
  const poly = (pts: number[][], fill: CanvasGradient) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  poly(
    [[62, 140], [28, 238], [68, 218], [88, 246], [108, 150]],
    lin(28, 140, 108, 246, "#f3d98a", "#a87a25"),
  );
  poly(
    [[138, 140], [172, 238], [132, 218], [112, 246], [92, 150]],
    lin(92, 140, 172, 246, "#e8c36d", "#b38326"),
  );
  const rad = (bx: number, by: number, size: number) => {
    const g = c.createRadialGradient(
      bx + size * 0.35, by + size * 0.3, 0,
      bx + size * 0.35, by + size * 0.3, size * 0.8,
    );
    g.addColorStop(0, "#f3d98a");
    g.addColorStop(0.5, "#d3a548");
    g.addColorStop(1, "#9a6b1c");
    return g;
  };
  c.fillStyle = rad(28, 28, 144);
  c.fill(new Path2D(SEAL_EDGE));
  c.beginPath();
  c.arc(100, 100, 62, 0, Math.PI * 2);
  c.setLineDash([3, 3]);
  c.strokeStyle = "#a87a25";
  c.lineWidth = 3;
  c.stroke();
  c.setLineDash([]);
  c.beginPath();
  c.arc(100, 100, 54, 0, Math.PI * 2);
  c.fillStyle = rad(46, 46, 108);
  c.fill();
  c.strokeStyle = "#f3d98a";
  c.lineWidth = 2;
  c.stroke();
  c.beginPath();
  c.arc(100, 100, 40, 0, Math.PI * 2);
  c.globalAlpha = 0.55;
  c.fillStyle = "#d9ad52";
  c.fill();
  c.restore();
}

/** Save the certificate as a landscape A4 PDF. `el` is the ScaledCertificatePaper wrapper. */
export async function downloadCertificatePdf(
  paper: CertificatePaperProps,
  el: HTMLElement | null,
  filename: string,
) {
  const canvas = await drawCertificate(paper, el?.querySelector("canvas") ?? null);
  const img = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const k = Math.min(pw / canvas.width, ph / canvas.height);
  const w = canvas.width * k;
  const h = canvas.height * k;
  pdf.addImage(img, "PNG", (pw - w) / 2, (ph - h) / 2, w, h);
  pdf.save(filename);
}
