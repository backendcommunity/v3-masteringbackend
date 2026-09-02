/**
 * Share copy and composer URLs for the scholarship flyer.
 *
 * Neither platform accepts an image through a plain link, so these URLs carry
 * the caption only. The image reaches the post either through the native share
 * sheet (mobile) or by the learner pasting the PNG into the composer.
 *
 * On LinkedIn, `@Mastering Backend` posts as plain text. LinkedIn creates a
 * real mention only when one is chosen from its own composer dropdown — there
 * is no way to produce one from prefilled text, by any encoding. The page name
 * is written out in full so that a learner who wants a live tag can delete the
 * words and retype `@Mastering` to summon the picker. The scholarship link is
 * what actually carries traffic back, and that does work from prefilled text.
 */

export const SCHOLARSHIP_URL = "https://masteringai.dev/scholarship";

export const LINKEDIN_CAPTION = `I'm joining the AI Engineering Bootcamp Cohort 2 through the ₦27 Million AI Engineering Scholarship Initiative by @Mastering Backend.

Over the next six weeks, I'll be moving beyond simply using AI tools and learning how to build real AI systems.

Cohort 2 starts September 7. Apply here: ${SCHOLARSHIP_URL}

#AIEngineering #MasteringBackend`;

export const X_CAPTION = `I'm joining the AI Engineering Bootcamp Cohort 2 through the ₦27 Million AI Engineering Scholarship Initiative by @master_backend 🚀

Time to move beyond using AI tools and start building real AI systems.

${SCHOLARSHIP_URL}

#AIEngineering`;

export function linkedInShareUrl(caption: string = LINKEDIN_CAPTION): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
}

export function xShareUrl(caption: string = X_CAPTION): string {
  return `https://x.com/intent/post?text=${encodeURIComponent(caption)}`;
}

/** `solomon-ai-bootcamp-flyer.png` — first name only, safe for any filesystem. */
export function flyerFileName(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  const slug = first.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${slug || "my"}-ai-bootcamp-flyer.png`;
}

/**
 * True when the browser will hand the platform the actual file through the
 * native share sheet — the only route by which an image reaches a post without
 * the person attaching it themselves. Mobile Safari and Android Chrome support
 * it; desktop browsers do not.
 */
export function canShareImage(file: File): boolean {
  return typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
}

/**
 * Puts the PNG itself on the clipboard, so the next ⌘V inside the LinkedIn or X
 * composer attaches it. This is the closest thing to a direct attach on desktop,
 * where neither platform accepts an image through a share URL.
 */
export async function copyImage(blob: Blob): Promise<boolean> {
  try {
    if (typeof ClipboardItem === "undefined") return false;
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Copies to the clipboard, resolving false when the browser refuses. */
export async function copyCaption(caption: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(caption);
    return true;
  } catch {
    return false;
  }
}
