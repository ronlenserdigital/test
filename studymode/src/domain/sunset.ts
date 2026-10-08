/**
 * Sunrise/sunset from the NOAA solar position approximation. Accurate to a
 * few minutes for non-polar latitudes, which is ample for an evening tint.
 * Returns null during polar day/night.
 */
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export function sunTimes(dateMs: number, lat: number, lon: number): { sunrise: number; sunset: number } | null {
  const d = new Date(dateMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86_400_000);
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqtime =
    229.18 *
    (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
  const decl =
    0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl);
  if (cosHa < -1 || cosHa > 1) return null;
  const ha = deg(Math.acos(cosHa));
  const midnightUtc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const sunriseMin = 720 - 4 * (lon + ha) - eqtime;
  const sunsetMin = 720 - 4 * (lon - ha) - eqtime;
  return { sunrise: midnightUtc + sunriseMin * 60_000, sunset: midnightUtc + sunsetMin * 60_000 };
}

/** Minutes since local midnight for "HH:MM". */
export function parseHm(hm: string): number | null {
  const m = hm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const mi = +m[2];
  return h < 24 && mi < 60 ? h * 60 + mi : null;
}

/** Is `nowMin` within [start, end) on a 24h clock, handling wrap past midnight. */
export function inWindow(nowMin: number, startMin: number, endMin: number): boolean {
  if (startMin === endMin) return false;
  return startMin < endMin ? nowMin >= startMin && nowMin < endMin : nowMin >= startMin || nowMin < endMin;
}
