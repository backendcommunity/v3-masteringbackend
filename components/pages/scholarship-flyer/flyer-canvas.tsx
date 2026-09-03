"use client";

/**
 * The flyer, as a real 1080×1350 canvas.
 *
 * The same canvas is both the preview and the export: it is drawn at true size
 * and displayed at whatever width the column gives it, so what a learner
 * approves is the bitmap that downloads — there is no second rendering path to
 * drift, and nothing to re-capture at export time.
 */

import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import {
  drawFlyer,
  FLYER_WIDTH,
  FLYER_HEIGHT,
  type FlyerGround,
  type PhotoShape,
} from "@/lib/scholarship-flyer/draw-flyer";
import { fitName } from "@/lib/scholarship-flyer/fit-name";
import { layoutRuns } from "@/lib/scholarship-flyer/draw-flyer";
import { loadFlyerAssets, loadImage, type FlyerAssets } from "@/lib/scholarship-flyer/render";

export type { FlyerGround, PhotoShape };

const MARGIN = 96;
const CONTENT_WIDTH = FLYER_WIDTH - MARGIN * 2;

export interface FlyerCanvasHandle {
  /** The live canvas, ready to encode. */
  canvas: () => HTMLCanvasElement | null;
}

export interface FlyerCanvasProps {
  ground: FlyerGround;
  /** Raw text from the name field; capping and fitting happen here. */
  name: string;
  /** Data URL from readPhoto, or null for the placeholder silhouette. */
  photoSrc: string | null;
  photoShape: PhotoShape;
}

export const FlyerCanvas = forwardRef<FlyerCanvasHandle, FlyerCanvasProps>(
  function FlyerCanvas({ ground, name, photoSrc, photoShape }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [assets, setAssets] = useState<FlyerAssets | null>(null);
    const [photo, setPhoto] = useState<HTMLImageElement | null>(null);

    useImperativeHandle(ref, () => ({ canvas: () => canvasRef.current }), []);

    // Logos and fonts load once; a failed logo resolves null and is skipped.
    useEffect(() => {
      let cancelled = false;
      loadFlyerAssets().then((loaded) => {
        if (!cancelled) setAssets(loaded);
      });
      return () => {
        cancelled = true;
      };
    }, []);

    useEffect(() => {
      let cancelled = false;
      if (!photoSrc) {
        setPhoto(null);
        return;
      }
      loadImage(photoSrc).then((image) => {
        if (!cancelled) setPhoto(image);
      });
      return () => {
        cancelled = true;
      };
    }, [photoSrc]);

    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !assets) return;

      // The name sits inside a running sentence, so the fit rule protects the
      // block's height: cap the characters, then step the sentence down until
      // it holds two lines. Measuring happens on the canvas itself.
      const fit = fitName(name, (fontSize, candidate) =>
        layoutRuns(
          (text, weight) => {
            ctx.font = `${weight} ${fontSize}px ${assets.fontFamily}`;
            return ctx.measureText(text).width;
          },
          [
            { text: "I,", weight: 400, color: "#000" },
            { text: candidate, weight: 700, color: "#000" },
            { text: ", will be joining the", weight: 400, color: "#000" },
          ],
          CONTENT_WIDTH,
        ).length,
      );

      drawFlyer(ctx, {
        ground,
        photoShape,
        name: fit.name,
        leadFontSize: fit.fontSize,
        photo,
        logos: assets.logos,
        fontFamily: assets.fontFamily,
      });
    }, [assets, ground, name, photo, photoShape]);

    return (
      <canvas
        ref={canvasRef}
        width={FLYER_WIDTH}
        height={FLYER_HEIGHT}
        aria-label="Your flyer"
        role="img"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    );
  },
);
