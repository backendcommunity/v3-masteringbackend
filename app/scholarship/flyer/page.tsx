"use client";

/**
 * Public, no-login flyer generator for the ₦27 Million AI Engineering
 * Scholarship Initiative — and, for anyone who lands here from a shared flyer,
 * an advert for the membership. The split-screen scaffold is the one the /auth
 * pages use: brand anchor left, working column right.
 *
 * Everything runs in the browser. The photo is read with FileReader, the flyer
 * is drawn on a canvas, and nothing is uploaded or stored. The route is listed
 * in lib/public-paths.ts so the middleware, the AuthProvider and the api 401
 * interceptor all leave it alone.
 */

import { useCallback, useRef, useState } from "react";
import {
  FlyerCanvas,
  type FlyerCanvasHandle,
  type FlyerGround,
  type PhotoShape,
} from "@/components/pages/scholarship-flyer/flyer-canvas";
import { FlyerForm } from "@/components/pages/scholarship-flyer/flyer-form";
import { FlyerResult } from "@/components/pages/scholarship-flyer/flyer-result";
import { FlyerShell } from "@/components/pages/scholarship-flyer/flyer-shell";
import { canvasToPng } from "@/lib/scholarship-flyer/render";
import { flyerFileName } from "@/lib/scholarship-flyer/share";
import { analytics } from "@/lib/analytics";
import * as Sentry from "@sentry/nextjs";

/** The preview sits beside the controls; wide enough to read the artwork. */
const PREVIEW_WIDTH = 340;

export default function ScholarshipFlyerPage() {
  const [name, setName] = useState("");
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [ground, setGround] = useState<FlyerGround>("navy");
  const [photoShape, setPhotoShape] = useState<PhotoShape>("square");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

  const flyerRef = useRef<FlyerCanvasHandle>(null);

  const generate = useCallback(async () => {
    const canvas = flyerRef.current?.canvas();
    if (!canvas) return;

    setIsGenerating(true);
    setError(null);
    try {
      // The canvas on screen is already the finished 1080×1350 artwork, so
      // generating is only an encode — nothing is re-rendered or re-captured.
      const blob = await canvasToPng(canvas);
      setResult({ blob, fileName: flyerFileName(name) });
      analytics.track("scholarship_flyer_generated", { ground, photoShape });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[scholarship-flyer] encode failed", err);
      Sentry.captureException(err, {
        tags: { feature: "scholarship-flyer" },
        extra: {
          ground,
          photoShape,
          hasPhoto: !!photoSrc,
          userAgent: navigator.userAgent,
        },
      });
      setError(`That didn't save — your photo and name are still here, so try again. (${reason})`);
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
              className="w-full overflow-hidden rounded-xl"
              style={{
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
