/**
 * Rasterises the flyer node to a PNG, in the browser, at true size.
 *
 * Two things are load-bearing and were verified headlessly against
 * html2canvas 1.4.1 before this was written:
 *
 *   1. Fonts must have settled, or the PNG ships in a fallback face.
 *   2. Every <img> must be decoded, or the partner marks and the photo export
 *      as blank space.
 *
 * See the spec for the two layout rules the flyer itself must obey
 * (no `inline-flex`, no `mask-image`) — html2canvas silently drops both.
 */

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1350;

export async function renderFlyer(node: HTMLElement): Promise<Blob> {
  const { default: html2canvas } = await import("html2canvas");

  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(
    Array.from(node.querySelectorAll("img")).map((img) =>
      img.decode().catch(() => undefined),
    ),
  );

  // The node is displayed through a CSS transform; capture it unscaled so the
  // export is exactly 1080×1350 with no scale arithmetic.
  const displayTransform = node.style.transform;
  node.style.transform = "none";
  try {
    const canvas = await html2canvas(node, {
      scale: 1,
      useCORS: true,
      backgroundColor: null,
      width: FLYER_WIDTH,
      height: FLYER_HEIGHT,
      windowWidth: FLYER_WIDTH,
      windowHeight: FLYER_HEIGHT,
    });

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("The flyer couldn't be saved as an image.");
    return blob;
  } finally {
    node.style.transform = displayTransform;
  }
}
