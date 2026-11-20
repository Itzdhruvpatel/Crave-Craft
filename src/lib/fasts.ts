// Hindu fast days from the sun and moon, so the calendar works offline for any year.
// Low-precision formulas (Meeus, "Astronomical Algorithms" ch. 47 main terms): about 0.3°
// for the moon, which puts tithi changes within roughly an hour. Panchangs for different
// cities can still differ by a day; the family can always flip a day by hand.

import type { Fast } from './types.ts';

const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
const sin = (deg: number) => Math.sin(deg * RAD);

/** Days since J2000.0 for a JS date. */
const daysJ2000 = (d: Date) => d.getTime() / 86400000 + 2440587.5 - 2451545.0;

function sunLon(t: number): number {
  const g = 357.528 + 0.9856003 * t;
  return norm(280.46 + 0.9856474 * t + 1.915 * sin(g) + 0.02 * sin(2 * g));
}

function moonLon(t: number): number {
  const L = 218.3164477 + 13.17639648 * t;
  const D = 297.8501921 + 12.19074912 * t; // elongation
  const S = 357.5291092 + 0.98560028 * t; // sun's anomaly
  const M = 134.9633964 + 13.06499295 * t; // moon's anomaly
  const F = 93.272095 + 13.22935024 * t;
  return norm(
    L +
      6.288774 * sin(M) +
      1.274027 * sin(2 * D - M) +
      0.658314 * sin(2 * D) +
      0.213618 * sin(2 * M) -
      0.185116 * sin(S) -
      0.114332 * sin(2 * F) +
      0.058793 * sin(2 * D - 2 * M) +
      0.057066 * sin(2 * D - S - M) +
      0.053322 * sin(2 * D + M) +
      0.045758 * sin(2 * D - S) -
      0.040923 * sin(S - M) -
      0.03472 * sin(D) -
      0.030383 * sin(S + M),
  );
}

/** Tithi 0-29 (0 = shukla pratipada, 10 = shukla ekadashi, 25 = krishna ekadashi). */
export function tithiAt(d: Date): number {
  const t = daysJ2000(d);
  return Math.floor(norm(moonLon(t) - sunLon(t)) / 12);
}

/** Around 6:30 am in India (01:00 UTC), when the day's tithi is reckoned. */
function sunrise(y: number, m: number, day: number): Date {
  return new Date(Date.UTC(y, m, day, 1, 0));
}

// Lahiri ayanamsa, close enough for picking the sun's sign.
const siderealSun = (d: Date) => norm(sunLon(daysJ2000(d)) - (23.85 + (d.getUTCFullYear() - 2000) * 0.01397));


/** Fasts on a calendar day (local date parts), for the observances the family keeps. */
export function fastsOn(date: Date, keep: Fast[]): Fast[] {
  const y = date.getFullYear();
  const m = date.getMonth();
  const day = date.getDate();
  const now = tithiAt(sunrise(y, m, day));
  const prev = tithiAt(sunrise(y, m, day - 1));
  const out: Fast[] = [];

  // Ekadashi at sunrise (only the first day if it spans two sunrises); if it started and ended
  // between two sunrises, fast on the day it ended.
  const ek = ((now === 10 || now === 25) && prev !== now) || (now === 11 && prev === 9) || (now === 26 && prev === 24);
  if (keep.includes('ekadashi') && ek) out.push('ekadashi');

  if (keep.includes('navratri') && inNavratri(y, m, day)) out.push('navratri');
  if (keep.includes('shravan') && date.getDay() === 1 && monthOf(lastNewMoon(sunrise(y, m, day))) === 'shravan') out.push('shravan');
  return out;
}

const MONTHS: Record<number, string> = { 11: 'chaitra', 3: 'shravan', 5: 'ashvin' };

const IST = 5.5 * 3600000;
const DAY = 86400000;
/** Day number in India time, for comparing calendar days. */
const istDay = (ms: number) => Math.floor((ms + IST) / DAY);

/**
 * Nine days from Ghatasthapana: the new moon's day when it falls before noon in India,
 * else the day after (2026: 19-27 March, 11-19 October).
 */
function inNavratri(y: number, m: number, day: number): boolean {
  const noon = Date.UTC(y, m, day, 6, 30);
  const nm = lastNewMoon(new Date(noon));
  const month = monthOf(nm);
  if (month !== 'chaitra' && month !== 'ashvin') return false;
  const nmDay = istDay(nm.getTime());
  const start = (nm.getTime() + IST) % DAY < DAY / 2 ? nmDay : nmDay + 1;
  const today = istDay(noon);
  return today >= start && today < start + 9;
}

/**
 * Amanta lunar month (Gujarat, Maharashtra): named by the sun's sign at the new moon that
 * starts it (Pisces = Chaitra ... Cancer = Shravan, Virgo = Ashvin). When two new moons fall
 * in one sign, the first month is adhik (extra) and gets no festivals.
 */
function monthOf(start: Date): string | undefined {
  const sign = Math.floor(siderealSun(start) / 30);
  const next = nextNewMoon(start);
  if (Math.floor(siderealSun(next) / 30) === sign) return undefined; // adhik maas
  return MONTHS[sign];
}

/** Steps back by hours until the moon-sun gap wraps past 0 (the new moon), then narrows to the minute. */
function lastNewMoon(d: Date): Date {
  let t = d.getTime();
  for (let h = 0; h < 24 * 31; h++) {
    if (tithiGap(t - 3600000) > tithiGap(t) + 180) return new Date(refine(t - 3600000, t));
    t -= 3600000;
  }
  return new Date(t);
}

/** The new moon lies between `a` (gap near 360) and `b` (gap near 0). */
function refine(a: number, b: number): number {
  while (b - a > 60000) {
    const mid = (a + b) / 2;
    if (tithiGap(mid) > 180) a = mid;
    else b = mid;
  }
  return b;
}

function nextNewMoon(start: Date): Date {
  let t = start.getTime() + 25 * 86400000;
  let gap = tithiGap(t);
  for (let h = 0; h < 24 * 8; h++) {
    const g = tithiGap(t + 3600000);
    if (g < gap - 180) return new Date(refine(t, t + 3600000));
    gap = g;
    t += 3600000;
  }
  return new Date(t);
}

function tithiGap(ms: number): number {
  const t = daysJ2000(new Date(ms));
  return norm(moonLon(t) - sunLon(t));
}
