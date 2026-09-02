"use client";

/**
 * Public, no-login flyer generator for the ₦27 Million AI Engineering
 * Scholarship Initiative — and, for everyone who lands here from a shared
 * flyer, an advert for the bootcamp itself. The split-screen scaffold is the
 * one the /auth pages use: brand anchor left, working column right.
 *
 * Everything runs in the browser: the photo is read with FileReader, the flyer
 * is rasterised with html2canvas, and nothing is uploaded or stored. The route
 * is listed in lib/public-paths.ts so the middleware, the AuthProvider and the
 * api 401 interceptor all leave it alone.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlyerCanvas,
  type FlyerGround,
  type PhotoShape,
} from "@/components/pages/scholarship-flyer/flyer-canvas";
import { FlyerForm } from "@/components/pages/scholarship-flyer/flyer-form";
import { FlyerResult } from "@/components/pages/scholarship-flyer/flyer-result";
import { FlyerShell } from "@/components/pages/scholarship-flyer/flyer-shell";
import { renderFlyer, FLYER_WIDTH, FLYER_HEIGHT } from "@/lib/scholarship-flyer/render";
import { flyerFileName } from "@/lib/scholarship-flyer/share";
import { analytics } from "@/lib/analytics";
import * as Sentry from "@sentry/nextjs";

/** The wider working column lets the preview and the controls sit side by side,
 * so the artwork reads large and Generate still lands above the fold. */
const PREVIEW_WIDTH = 340;

export default function ScholarshipFlyerPage() {
  const [name, setName] = useState("");
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [ground, setGround] = useState<FlyerGround>("navy");
  const [photoShape, setPhotoShape] = useState<PhotoShape>("square");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

  const flyerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(PREVIEW_WIDTH / FLYER_WIDTH);

  // The preview is the export node under a transform, so one layout serves both.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setScale(stage.clientWidth / FLYER_WIDTH);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  const generate = useCallback(async () => {
    const node = flyerRef.current;
    if (!node) return;

    setIsGenerating(true);
    setError(null);
    try {
      const blob = await renderFlyer(node);
      setResult({ blob, fileName: flyerFileName(name) });
      analytics.track("scholarship_flyer_generated", { ground, photoShape });
    } catch (err) {
      // The render fails for device-specific reasons — canvas memory on iOS
      // above all — that are invisible unless the real error is carried out of
      // the catch. Report it, and show it, so a failure on someone else's phone
      // is diagnosable without their devtools.
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[scholarship-flyer] render failed", err);
      Sentry.captureException(err, {
        tags: { feature: "scholarship-flyer" },
        extra: {
          ground,
          photoShape,
          hasPhoto: !!photoSrc,
          photoBytes: photoSrc?.length ?? 0,
          userAgent: navigator.userAgent,
          deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
        },
      });
      setError(
        `That didn't generate — your photo and name are still here, so try again. (${reason})`,
      );
    } finally {
      setIsGenerating(false);
    }
  }, [ground, name, photoShape, photoSrc]);

  return (
    <FlyerShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1
            className="font-bold"
            style={{ color: "#0E1F33", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.02em" }}
          >
            Tell the world you&apos;re joining Cohort 2
          </h1>
          <p className="mt-1.5 text-[14.5px] leading-relaxed" style={{ color: "#64748B" }}>
            Add your photo and name, and get a flyer built for LinkedIn and X.
          </p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-9">
          <div className="mx-auto w-full sm:mx-0 sm:flex-none" style={{ maxWidth: PREVIEW_WIDTH }}>
            <div
              ref={stageRef}
              className="relative w-full overflow-hidden rounded-xl"
              style={{
                height: FLYER_HEIGHT * scale,
                border: "1px solid #E2E8F0",
                boxShadow: "0 16px 40px -24px rgba(14,31,51,0.5)",
              }}
            >
              <FlyerCanvas
                ref={flyerRef}
                ground={ground}
                name={name}
                photoSrc={photoSrc}
                photoShape={photoShape}
                scale={scale}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {result ? (
              <FlyerResult
                blob={result.blob}
                fileName={result.fileName}
                onStartOver={() => setResult(null)}
              />
            ) : (
              <>
                <FlyerForm
                  name={name}
                  onNameChange={setName}
                  photoSrc={photoSrc}
                  onPhotoChange={setPhotoSrc}
                  ground={ground}
                  onGroundChange={setGround}
                  photoShape={photoShape}
                  onPhotoShapeChange={setPhotoShape}
                  onGenerate={generate}
                  isGenerating={isGenerating}
                />
                {error ? (
                  <p className="mt-4 text-[13px]" style={{ color: "#DC2626" }} role="alert">
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </FlyerShell>
  );
}
