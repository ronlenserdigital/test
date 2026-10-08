/** Progress analytics. Reports counts and sample sizes; never a pass probability. */
import { localDateIso } from "./plan";

/** Consecutive study days ending today (or yesterday if not yet studied today). */
export function studyStreak(dayIsos: Iterable<string>, todayIso: string): { current: number; longest: number } {
  const days = [...new Set(dayIsos)].sort();
  if (days.length === 0) return { current: 0, longest: 0 };
  const toNum = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000;
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = toNum(days[i]) - toNum(days[i - 1]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const set = new Set(days.map(toNum));
  let cursor = toNum(todayIso);
  if (!set.has(cursor)) cursor -= 1;
  let current = 0;
  while (set.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, longest };
}

export interface AnswerRecord {
  questionId: string;
  objectiveIds: string[];
  isCorrect: boolean;
  seenBefore: boolean;
}

export interface Accuracy {
  correct: number;
  total: number;
  newCorrect: number;
  newTotal: number;
}

export function accuracyBy(records: AnswerRecord[], keyOf: (r: AnswerRecord) => string[]): Map<string, Accuracy> {
  const m = new Map<string, Accuracy>();
  for (const r of records) {
    for (const k of keyOf(r)) {
      const a = m.get(k) ?? { correct: 0, total: 0, newCorrect: 0, newTotal: 0 };
      a.total++;
      if (r.isCorrect) a.correct++;
      if (!r.seenBefore) {
        a.newTotal++;
        if (r.isCorrect) a.newCorrect++;
      }
      m.set(k, a);
    }
  }
  return m;
}

/** Minimum answers before an objective can be labelled weak. */
export const MIN_SAMPLE = 3;

export function weakObjectives(acc: Map<string, Accuracy>, threshold = 0.7) {
  return [...acc.entries()]
    .filter(([, a]) => a.total >= MIN_SAMPLE && a.correct / a.total < threshold)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .map(([id, a]) => ({ id, accuracy: a.correct / a.total, answered: a.total }));
}

export function dayKey(ms: number) {
  return localDateIso(ms);
}

/** Sum seconds per local day over the last `days` days (oldest first). */
export function dailySeries(entries: { at: number; seconds: number }[], days: number, now: number) {
  const out: { day: string; seconds: number }[] = [];
  const idx = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = localDateIso(now - i * 86_400_000);
    idx.set(d, out.length);
    out.push({ day: d, seconds: 0 });
  }
  for (const e of entries) {
    const k = idx.get(localDateIso(e.at));
    if (k != null) out[k].seconds += e.seconds;
  }
  return out;
}
