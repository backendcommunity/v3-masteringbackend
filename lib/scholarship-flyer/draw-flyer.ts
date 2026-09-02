/**
 * Draws the flyer straight onto a 2D canvas.
 *
 * This replaced an html2canvas capture of a DOM template. That approach works
 * by cloning the document into a hidden iframe and re-implementing CSS against
 * the clone, so every engine difference lands in the export: masks were
 * dropped, inline-flex children were never painted, SVG fill-opacity was lost,
 * and iOS WebKit failed outright. Canvas 2D has none of that surface — fills,
 * images and text render the same everywhere — so the flyer is drawn here.
 *
 * Two things are still device-dependent and both are handled: fonts must be
 * loaded before any text is drawn (the caller awaits document.fonts.ready),
 * and letter-spacing is applied by hand because ctx.letterSpacing only reached
 * Safari in 17.4.
 */

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1350;

const MARGIN = 96;
const CONTENT_WIDTH = FLYER_WIDTH - MARGIN * 2;

const PHOTO_SIZE = 236;
const SUPPORT_WIDTH = 352;
const LEAD_LINE_HEIGHT = 1.28;

export type FlyerGround = "navy" | "white";
export type PhotoShape = "square" | "circle";

export interface GroundTokens {
  bg: string;
  ink: string;
  lead: string;
  accent: string;
  soft: string;
  mute: string;
  slot: string;
  figure: string;
  plate: string;
  /** Linework stroke and node colours, already at their final opacity. */
  lineStroke: string;
  lineDot: string;
}

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
    lineStroke: "rgba(255,255,255,0.12)",
    lineDot: "rgba(255,255,255,0.20)",
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
    lineStroke: "rgba(15,27,42,0.12)",
    lineDot: "rgba(19,174,206,0.50)",
  },
};

export const PARTNER_LOGOS = [
  { src: "/partners/labspace.png", height: 40 },
  { src: "/partners/starnettech.png", height: 34 },
  { src: "/partners/techrity.png", height: 32 },
  { src: "/partners/droomwork.png", height: 26 },
];

export interface FlyerInput {
  ground: FlyerGround;
  photoShape: PhotoShape;
  /** Already capped and fitted by fit-name.ts. */
  name: string;
  leadFontSize: number;
  photo: HTMLImageElement | null;
  /** In PARTNER_LOGOS order; a logo that failed to load is skipped. */
  logos: (HTMLImageElement | null)[];
  /** The page's resolved font family — next/font generates its own name. */
  fontFamily: string;
}

/* ------------------------------------------------------------------ text -- */

interface Run {
  text: string;
  weight: number;
  color: string;
}

export interface PlacedWord {
  text: string;
  weight: number;
  color: string;
  x: number;
}

const font = (family: string, weight: number, size: number) =>
  `${weight} ${size}px ${family}`;

/** Width of a string including hand-applied tracking. */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, tracking: number) {
  return ctx.measureText(text).width + tracking * text.length;
}

/**
 * Draws text with per-character tracking, since ctx.letterSpacing is too new to
 * rely on. Advancing the pen by hand gives identical output on every engine.
 */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  tracking: number,
) {
  if (!tracking) {
    ctx.fillText(text, x, y);
    return;
  }
  let cursor = x;
  for (const char of text) {
    ctx.fillText(char, cursor, y);
    cursor += ctx.measureText(char).width + tracking;
  }
}

/** Greedy word wrap against a pixel width. */
export function wrapText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && measure(candidate) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Lays out a sentence built from differently-styled runs — the lead line is one
 * sentence with the learner's name set bolder inside it. Returns the placed
 * lines so a caller can count them before committing to a font size.
 */
export function layoutRuns(
  measure: (text: string, weight: number) => number,
  runs: Run[],
  maxWidth: number,
): PlacedWord[][] {
  const words: Run[] = [];
  runs.forEach((run) => {
    const parts = run.text.split(" ").filter((part) => part.length > 0);
    parts.forEach((part) => words.push({ ...run, text: part }));
  });

  const lines: PlacedWord[][] = [];
  let line: PlacedWord[] = [];
  let x = 0;

  words.forEach((word) => {
    // A run beginning with punctuation (", will be joining") hugs the previous
    // word rather than starting a new one.
    const joins = /^[,.!?;:]/.test(word.text);
    const needsSpace = line.length > 0 && !joins;
    const text = needsSpace ? ` ${word.text}` : word.text;
    const width = measure(text, word.weight);

    if (needsSpace && x + width > maxWidth) {
      lines.push(line);
      const bare = measure(word.text, word.weight);
      line = [{ ...word, x: 0 }];
      x = bare;
      return;
    }

    line.push({ ...word, text, x });
    x += width;
  });

  if (line.length) lines.push(line);
  return lines;
}

/* --------------------------------------------------------------- drawing -- */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  // arcTo rather than ctx.roundRect, which Safari only gained in 16.4.
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The 80px brand tile from public/hero-linework.svg, drawn rather than fetched. */
function lineworkTile(tokens: GroundTokens): HTMLCanvasElement {
  const tile = document.createElement("canvas");
  tile.width = 80;
  tile.height = 80;
  const ctx = tile.getContext("2d");
  if (!ctx) return tile;

  ctx.strokeStyle = tokens.lineStroke;
  ctx.lineWidth = 1;
  const diamond = (inset: number) => {
    const mid = 40;
    const r = 40 - inset;
    ctx.beginPath();
    ctx.moveTo(mid - r, mid);
    ctx.lineTo(mid, mid - r);
    ctx.lineTo(mid + r, mid);
    ctx.lineTo(mid, mid + r);
    ctx.closePath();
    ctx.stroke();
  };
  diamond(0);
  diamond(20);

  ctx.fillStyle = tokens.lineDot;
  const dot = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  dot(40, 40, 1.7);
  [0, 80].forEach((x) => [0, 80].forEach((y) => dot(x, y, 1.5)));
  return tile;
}

/** Cover-fit source rect, so a photo of any aspect fills the slot. */
export function coverRect(
  sourceWidth: number,
  sourceHeight: number,
  boxWidth: number,
  boxHeight: number,
) {
  const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight);
  const width = boxWidth / scale;
  const height = boxHeight / scale;
  return {
    sx: (sourceWidth - width) / 2,
    sy: (sourceHeight - height) / 2,
    sw: width,
    sh: height,
  };
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  input: FlyerInput,
  tokens: GroundTokens,
  x: number,
  y: number,
) {
  ctx.save();
  ctx.beginPath();
  if (input.photoShape === "circle") {
    ctx.arc(x + PHOTO_SIZE / 2, y + PHOTO_SIZE / 2, PHOTO_SIZE / 2, 0, Math.PI * 2);
  } else {
    ctx.rect(x, y, PHOTO_SIZE, PHOTO_SIZE);
  }
  ctx.clip();

  ctx.fillStyle = tokens.slot;
  ctx.fillRect(x, y, PHOTO_SIZE, PHOTO_SIZE);

  if (input.photo) {
    const sw = input.photo.naturalWidth || PHOTO_SIZE;
    const sh = input.photo.naturalHeight || PHOTO_SIZE;
    const { sx, sy, sw: cw, sh: ch } = coverRect(sw, sh, PHOTO_SIZE, PHOTO_SIZE);
    ctx.drawImage(input.photo, sx, sy, cw, ch, x, y, PHOTO_SIZE, PHOTO_SIZE);
  } else {
    // Silhouette placeholder, to the proportions the old SVG used.
    ctx.fillStyle = tokens.figure;
    const cx = x + PHOTO_SIZE / 2;
    ctx.beginPath();
    ctx.arc(cx, y + PHOTO_SIZE * 0.4, PHOTO_SIZE * 0.155, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, y + PHOTO_SIZE * 1.06, PHOTO_SIZE * 0.34, Math.PI, 0);
    ctx.fill();
  }
  ctx.restore();
}

/** #RRGGBB → rgba(), so the scrim can fade the ground colour into itself. */
function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Paints the whole flyer. Synchronous by design: every image is loaded and the
 * fonts are ready before this is called, so there is no window in which a
 * half-drawn flyer could be exported.
 */
export function drawFlyer(ctx: CanvasRenderingContext2D, input: FlyerInput): void {
  const t = GROUNDS[input.ground];
  const family = input.fontFamily;

  ctx.clearRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);

  // Linework, then a scrim in the ground colour so it blooms right and stays
  // clear under the text — the read the CSS mask used to give.
  const pattern = ctx.createPattern(lineworkTile(t), "repeat");
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);
  }
  const scrim = ctx.createLinearGradient(FLYER_WIDTH, 0, 0, FLYER_HEIGHT * 0.14);
  scrim.addColorStop(0, hexToRgba(t.bg, 0));
  scrim.addColorStop(0.56, hexToRgba(t.bg, 0.6));
  scrim.addColorStop(1, hexToRgba(t.bg, 1));
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, FLYER_WIDTH, FLYER_HEIGHT);

  ctx.textBaseline = "top";

  // ── Top row: photo left, supporting line right ─────────────────────────
  drawPhoto(ctx, input, t, MARGIN, MARGIN);

  ctx.fillStyle = t.soft;
  ctx.font = font(family, 400, 29);
  const supportX = FLYER_WIDTH - MARGIN - SUPPORT_WIDTH;
  wrapText(
    (text) => ctx.measureText(text).width,
    "Moving beyond using AI tools to building real AI systems.",
    SUPPORT_WIDTH,
  ).forEach((line, index) => {
    ctx.fillText(line, supportX, MARGIN + 4 + index * 29 * 1.4);
  });

  // ── Lead sentence, the name set bolder inside it ───────────────────────
  let y = MARGIN + PHOTO_SIZE + 108;
  const leadLines = layoutRuns(
    (text, weight) => {
      ctx.font = font(family, weight, input.leadFontSize);
      return ctx.measureText(text).width;
    },
    [
      { text: "I,", weight: 400, color: t.lead },
      { text: input.name, weight: 700, color: t.ink },
      { text: ", will be joining the", weight: 400, color: t.lead },
    ],
    CONTENT_WIDTH,
  );
  leadLines.forEach((line, index) => {
    line.forEach((word) => {
      ctx.font = font(family, word.weight, input.leadFontSize);
      ctx.fillStyle = word.color;
      ctx.fillText(word.text, MARGIN + word.x, y + index * input.leadFontSize * LEAD_LINE_HEIGHT);
    });
  });
  y += leadLines.length * input.leadFontSize * LEAD_LINE_HEIGHT;

  // ── The campaign, at the top of the type scale ─────────────────────────
  y += 30;
  ctx.fillStyle = t.ink;
  ctx.font = font(family, 900, 142);
  drawTracked(ctx, "₦27 MILLION", MARGIN, y, 142 * -0.048);
  y += 142;

  y += 26;
  ctx.fillStyle = t.accent;
  ctx.font = font(family, 500, 46);
  drawTracked(ctx, "AI Engineering Scholarship Initiative", MARGIN, y, 46 * -0.018);
  y += 46 * 1.2 + 6;
  drawTracked(ctx, "Cohort 2", MARGIN, y, 46 * -0.018);

  // ── Bottom band, measured up from the base so it never drifts ──────────
  const plateHeight = 40 + 24;
  const labelHeight = 27;
  const bandTop = FLYER_HEIGHT - MARGIN - (labelHeight + 14 + plateHeight);

  ctx.fillStyle = t.ink;
  ctx.font = font(family, 400, 42);
  drawTracked(ctx, "Starts September 7, 2026", MARGIN, bandTop - 46 - 42, 42 * -0.015);

  ctx.fillStyle = t.mute;
  ctx.font = font(family, 500, 18);
  drawTracked(ctx, "IN PARTNERSHIP WITH", MARGIN, bandTop, 18 * 0.18);

  const logos = input.logos
    .map((image, index) => ({ image, height: PARTNER_LOGOS[index].height }))
    .filter((entry): entry is { image: HTMLImageElement; height: number } => !!entry.image);

  const gap = 26;
  const logoWidths = logos.map(
    ({ image, height }) => height * ((image.naturalWidth || 1) / (image.naturalHeight || 1)),
  );
  const plateWidth =
    logoWidths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, logos.length - 1) + 36;
  const plateTop = bandTop + labelHeight + 14;

  if (logos.length) {
    ctx.fillStyle = t.plate;
    roundRect(ctx, MARGIN, plateTop, plateWidth, plateHeight, 8);
    ctx.fill();

    let logoX = MARGIN + 18;
    logos.forEach(({ image, height }, index) => {
      const width = logoWidths[index];
      ctx.drawImage(image, logoX, plateTop + (plateHeight - height) / 2, width, height);
      logoX += width + gap;
    });
  }

  ctx.fillStyle = t.mute;
  ctx.font = font(family, 500, 26);
  const url = "masteringbackend.com";
  const urlWidth = trackedWidth(ctx, url, 26 * 0.02);
  drawTracked(ctx, url, FLYER_WIDTH - MARGIN - urlWidth, plateTop + plateHeight - 34, 26 * 0.02);
}
