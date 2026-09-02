"use client";

import { useState } from "react";
import { Check, Download, Linkedin } from "lucide-react";
import { authPrimaryBtnClass } from "@/components/auth/auth-ui";
import {
  LINKEDIN_CAPTION,
  X_CAPTION,
  linkedInShareUrl,
  xShareUrl,
  copyCaption,
  copyImage,
  canShareImage,
} from "@/lib/scholarship-flyer/share";

type Platform = "linkedin" | "x";

const PLATFORM = {
  linkedin: { label: "LinkedIn", caption: LINKEDIN_CAPTION, url: linkedInShareUrl },
  x: { label: "X", caption: X_CAPTION, url: xShareUrl },
} as const;

/**
 * Temporarily hidden, not deleted. The one-tap share path (native share sheet on
 * mobile, image-to-clipboard on desktop) is intact below; flip this back to true
 * to bring the two platform buttons back. While it is false, everyone gets the
 * copy-and-paste instructions instead.
 */
const SHOW_PLATFORM_SHARE_BUTTONS = false;

const secondaryBtn =
  "flex h-[48px] flex-1 items-center justify-center gap-2 rounded-lg text-[14.5px] font-medium transition hover:bg-[#F8FAFC]";
const secondaryStyle = { background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0E1F33" };

const copyBtn = "h-9 rounded-md px-3 text-[13px] font-medium transition hover:bg-[#F1F5F9]";
const copyBtnStyle = { background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#0E1F33" };

function XGlyph() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.6L5.8 22H2.7l7.6-8.7L1.2 2h6.7l4.6 6.1L18.9 2zm-1.1 18h1.7L7.3 3.7H5.5L17.8 20z" />
    </svg>
  );
}

interface FlyerResultProps {
  blob: Blob;
  fileName: string;
  onStartOver: () => void;
}

export function FlyerResult({ blob, fileName, onStartOver }: FlyerResultProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [handoff, setHandoff] = useState<Platform | null>(null);

  const download = () => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Saved to your downloads.");
  };

  const share = async (platform: Platform) => {
    const { caption } = PLATFORM[platform];
    const file = new File([blob], fileName, { type: "image/png" });

    // Phones hand the platform the file itself — one tap, image attached.
    if (canShareImage(file)) {
      try {
        await navigator.share({ files: [file], text: caption });
        setStatus("Shared.");
        return;
      } catch {
        // Cancelled or refused — fall through to the desktop route.
      }
    }

    // Desktop: no platform takes an image through a link, so put the flyer on
    // the clipboard and let a single paste attach it inside the composer.
    const imageCopied = await copyImage(blob);
    if (!imageCopied) download();
    setHandoff(platform);
    setStatus(
      imageCopied
        ? "Flyer copied. Paste it into the post that just opened."
        : "Flyer saved — attach it in the post that just opened.",
    );
    window.open(PLATFORM[platform].url(), "_blank", "noopener,noreferrer");
  };

  /** Copy path used while the platform buttons are hidden — no handoff state. */
  const copyOnly = async (what: "image" | "linkedin" | "x") => {
    if (what === "image") {
      setStatus(
        (await copyImage(blob))
          ? "Flyer copied — paste it into your post."
          : "Copying is blocked in this browser. Download the flyer and attach it instead.",
      );
      return;
    }
    const ok = await copyCaption(PLATFORM[what].caption);
    setStatus(
      ok
        ? `${PLATFORM[what].label} caption copied — paste it above the image.`
        : "Copying is blocked in this browser. Select the caption and copy it by hand.",
    );
  };

  const copy = async (what: "caption" | "image") => {
    if (!handoff) return;
    const ok =
      what === "caption" ? await copyCaption(PLATFORM[handoff].caption) : await copyImage(blob);
    setStatus(
      ok
        ? what === "caption"
          ? "Caption copied — paste it into the post."
          : "Flyer copied — paste it into the post."
        : "Copying is blocked in this browser. Use the download instead.",
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex flex-shrink-0 items-center justify-center rounded-full"
          style={{ width: 26, height: 26, background: "rgba(19,174,206,0.16)" }}
        >
          <Check className="h-3.5 w-3.5" style={{ color: "#0B7F97" }} />
        </span>
        <div>
          <h2
            className="font-bold"
            style={{ color: "#0E1F33", fontSize: 20, letterSpacing: "-0.01em" }}
          >
            Your flyer is ready
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: "#64748B" }}>
            1080 × 1350, sized for LinkedIn, X and Instagram.
          </p>
        </div>
      </div>

      <button type="button" onClick={download} className={authPrimaryBtnClass}>
        <Download className="h-4 w-4" />
        Download flyer
      </button>

      {SHOW_PLATFORM_SHARE_BUTTONS ? (
        <div className="flex gap-3">
          <button type="button" onClick={() => share("linkedin")} className={secondaryBtn} style={secondaryStyle}>
            <Linkedin className="h-4 w-4" />
            Share on LinkedIn
          </button>
          <button type="button" onClick={() => share("x")} className={secondaryBtn} style={secondaryStyle}>
            <XGlyph />
            Share on X
          </button>
        </div>
      ) : null}

      {status ? (
        <p className="text-[13px]" style={{ color: "#0B7F97" }} role="status">
          {status}
        </p>
      ) : null}

      {SHOW_PLATFORM_SHARE_BUTTONS && handoff ? (
        <div className="rounded-lg p-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <p className="text-[14px] font-semibold" style={{ color: "#0E1F33" }}>
            Finishing your post on {PLATFORM[handoff].label}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[13px]" style={{ color: "#64748B" }}>
            <li>Paste the flyer into your post.</li>
            <li>Paste the caption above it.</li>
          </ol>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => copy("image")} className={copyBtn} style={copyBtnStyle}>
              Copy flyer
            </button>
            <button type="button" onClick={() => copy("caption")} className={copyBtn} style={copyBtnStyle}>
              Copy caption
            </button>
          </div>
        </div>
      ) : null}

      {SHOW_PLATFORM_SHARE_BUTTONS ? null : (
        <div className="rounded-lg p-4" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <p className="text-[14px] font-semibold" style={{ color: "#0E1F33" }}>
            Sharing it on LinkedIn or X
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-4 text-[13px]" style={{ color: "#64748B" }}>
            <li>Start a new post on LinkedIn or X, then paste the flyer into it.</li>
            <li>Copy the caption for that platform and paste it above the flyer.</li>
          </ol>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => copyOnly("image")} className={copyBtn} style={copyBtnStyle}>
              Copy flyer
            </button>
            <button
              type="button"
              onClick={() => copyOnly("linkedin")}
              className={copyBtn}
              style={copyBtnStyle}
            >
              Copy LinkedIn caption
            </button>
            <button type="button" onClick={() => copyOnly("x")} className={copyBtn} style={copyBtnStyle}>
              Copy X caption
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onStartOver}
        className="self-start text-[14px] font-medium transition hover:underline"
        style={{ color: "#64748B" }}
      >
        Make another one
      </button>
    </div>
  );
}
