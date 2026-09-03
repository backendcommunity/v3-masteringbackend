/**
 * The learner's name reads inside a running sentence on the flyer
 * ("I, <name>, will be joining the …"), not in a fixed box of its own. So the
 * fit rule protects the sentence block's HEIGHT: everything below it — the ₦27
 * MILLION headline included — must not move when a long name is typed.
 *
 * Two steps: cap the characters, then step the type size down until the
 * sentence holds two lines.
 */

export const MAX_NAME_CHARS = 28;
export const LEAD_MAX_PX = 44;
export const LEAD_MIN_PX = 34;
export const LEAD_MAX_LINES = 2;

/** Placeholder shown before the learner has typed anything. */
export const NAME_PLACEHOLDER = "Your Name";

export interface NameFit {
  /** The name as it should render — collapsed, capped, possibly ellipsised. */
  name: string;
  /** Font size for the whole sentence, in flyer pixels. */
  fontSize: number;
  /** True when the cap forced characters to be dropped. */
  truncated: boolean;
}

/**
 * @param raw          What the learner typed.
 * @param measureLines Returns how many lines the sentence occupies when set at
 *                     the given size. The caller supplies this so the rule
 *                     itself stays pure and testable without a DOM.
 */
export function fitName(
  raw: string,
  measureLines: (fontSize: number, name: string) => number,
): NameFit {
  const collapsed = raw.replace(/\s+/g, " ").trim();

  let name = collapsed;
  let truncated = false;
  if (name.length > MAX_NAME_CHARS) {
    name = `${name.slice(0, MAX_NAME_CHARS - 1).trim()}…`;
    truncated = true;
  }
  if (!name) name = NAME_PLACEHOLDER;

  let fontSize = LEAD_MAX_PX;
  while (fontSize > LEAD_MIN_PX && measureLines(fontSize, name) > LEAD_MAX_LINES) {
    fontSize -= 2;
  }

  return { name, fontSize, truncated };
}
