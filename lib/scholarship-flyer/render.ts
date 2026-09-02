/**
 * Turning the flyer canvas into a PNG, and loading everything it needs first.
 *
 * The canvas is drawn directly (see draw-flyer.ts), so there is no DOM clone
 * and no engine-specific CSS to survive. What is left that can fail is narrow
 * and handled here: an image that will not load, fonts that have not settled,
 * and toBlob refusing to produce a blob — which iOS WebKit does under memory
 * pressure. Every one of those has a fallback rather than an exception.
 */

export { FLYER_WIDTH, FLYER_HEIGHT } from "./draw-flyer";
import { FLYER_WIDTH, FLYER_HEIGHT, PARTNER_LOGOS } from "./draw-flyer";

/** Loads an image, resolving null rather than rejecting: one missing partner
 * logo must never cost the learner their flyer. */
export function loadImage(src: string, timeoutMs = 10000): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);

    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    // Only same-origin assets and data URLs are ever passed here.
    image.src = src;
  });
}

export function loadPartnerLogos(): Promise<(HTMLImageElement | null)[]> {
  return Promise.all(PARTNER_LOGOS.map((logo) => loadImage(logo.src)));
}

/**
 * The font the page actually resolved. next/font/local generates its own family
 * name, so a literal "Satoshi" in a canvas font string silently measures and
 * draws a fallback face.
 */
export function resolvedFontFamily(): string {
  if (typeof window === "undefined") return "system-ui, sans-serif";
  const family = getComputedStyle(document.body).fontFamily;
  return family || "system-ui, sans-serif";
}

/** Fonts settle after first paint; text drawn before this lands in a fallback face. */
export async function waitForFonts(): Promise<void> {
  try {
    if (document.fonts?.ready) await document.fonts.ready;
  } catch {
    // A rejected font promise is not a reason to refuse to draw.
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Canvas → PNG blob, with a fallback for browsers where toBlob hands back
 * null. toDataURL is synchronous and allocates a base64 string rather than a
 * second buffer, so it succeeds in cases where toBlob does not.
 */
export async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const fromToBlob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob(resolve, "image/png");
    } catch {
      resolve(null);
    }
  });
  if (fromToBlob && fromToBlob.size > 0) return fromToBlob;

  const dataUrl = canvas.toDataURL("image/png");
  if (!dataUrl.startsWith("data:image/png")) {
    throw new Error("This browser could not encode the flyer as a PNG.");
  }
  return dataUrlToBlob(dataUrl);
}

/** Everything the flyer needs, loaded once and reused across redraws. */
export interface FlyerAssets {
  logos: (HTMLImageElement | null)[];
  fontFamily: string;
}

export async function loadFlyerAssets(): Promise<FlyerAssets> {
  const [logos] = await Promise.all([loadPartnerLogos(), waitForFonts()]);
  return { logos, fontFamily: resolvedFontFamily() };
}
