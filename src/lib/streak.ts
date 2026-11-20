import { isoDate } from './planner.ts';

/** Days in a row ending today (or yesterday, so the streak survives until mom is thanked today). */
export function streak(days: string[], today: Date): number {
  const have = new Set(days);
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!have.has(isoDate(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (have.has(isoDate(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
