/**
 * Minutes mentioned in an English step, for a one-tap timer.
 * "Boil 10 to 12 minutes" -> 12 (the longer end, so it's done). "Rest 2 hours" -> 120. None -> null.
 */
export function stepMinutes(step: string): number | null {
  const m = step.match(/(\d+)(?:\s*(?:to|-)\s*(\d+))?\s*(minutes?|mins?|hours?)\b/i);
  if (!m) return null;
  const n = Number(m[2] ?? m[1]);
  return /hour/i.test(m[3]) ? n * 60 : n;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
