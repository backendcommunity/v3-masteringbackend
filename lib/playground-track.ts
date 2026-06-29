/** Fires `track({ file_ext })` at most once per `windowMs` per file path. */
export function makeEditDebouncer(
  track: (extra: { file_ext: string }) => void,
  windowMs = 30_000,
) {
  const lastFired = new Map<string, number>();
  return (filePath: string) => {
    const now = Date.now();
    const last = lastFired.get(filePath) ?? 0;
    if (now - last < windowMs) return;
    lastFired.set(filePath, now);
    const file_ext = filePath.includes(".") ? filePath.split(".").pop()! : "";
    track({ file_ext });
  };
}
