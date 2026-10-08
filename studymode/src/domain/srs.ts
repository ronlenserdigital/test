/**
 * Spaced repetition using FSRS via the maintained `ts-fsrs` package
 * (open-spaced-repetition/ts-fsrs). FSRS models memory with stability and
 * difficulty and schedules the next review for a target retention (default
 * 0.9). We persist every scheduling field and a full review log so history is
 * auditable and the algorithm can be re-run or re-tuned later.
 */
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type FSRS, type Grade as FsrsGrade } from "ts-fsrs";
import type { CardSchedule, Grade } from "./types";

export const GRADE_LABELS: Record<Grade, string> = { 1: "Again", 2: "Hard", 3: "Good", 4: "Easy" };

export interface SrsOptions {
  requestRetention?: number;
  maximumIntervalDays?: number;
  /** Fuzz spreads due dates slightly; disabled in tests for determinism. */
  enableFuzz?: boolean;
}

export function makeScheduler(opts: SrsOptions = {}): FSRS {
  return fsrs(
    generatorParameters({
      request_retention: opts.requestRetention ?? 0.9,
      maximum_interval: opts.maximumIntervalDays ?? 36500,
      enable_fuzz: opts.enableFuzz ?? true,
      enable_short_term: true,
    }),
  );
}

export function newSchedule(now: number): CardSchedule {
  return fromFsrs(createEmptyCard(new Date(now)));
}

export function toFsrs(s: CardSchedule): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsedDays,
    scheduled_days: s.scheduledDays,
    learning_steps: s.learningSteps,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.lastReview == null ? undefined : new Date(s.lastReview),
  };
}

export function fromFsrs(c: Card): CardSchedule {
  return {
    due: c.due.getTime(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsedDays: c.elapsed_days,
    scheduledDays: c.scheduled_days,
    learningSteps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    lastReview: c.last_review ? c.last_review.getTime() : null,
  };
}

export interface ReviewResult {
  schedule: CardSchedule;
  log: {
    rating: Grade;
    state: number;
    due: number;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    lastElapsedDays: number;
    scheduledDays: number;
    learningSteps: number;
    reviewedAt: number;
  };
}

export function review(scheduler: FSRS, s: CardSchedule, grade: Grade, now: number): ReviewResult {
  if (![1, 2, 3, 4].includes(grade)) throw new Error(`Invalid grade ${grade}`);
  const { card, log } = scheduler.next(toFsrs(s), new Date(now), grade as unknown as FsrsGrade);
  return {
    schedule: fromFsrs(card),
    log: {
      rating: grade,
      state: log.state,
      due: log.due.getTime(),
      stability: log.stability,
      difficulty: log.difficulty,
      elapsedDays: log.elapsed_days,
      lastElapsedDays: log.last_elapsed_days,
      scheduledDays: log.scheduled_days,
      learningSteps: log.learning_steps,
      reviewedAt: now,
    },
  };
}

/** Next due time for each grade, used to label the rating buttons. */
export function preview(scheduler: FSRS, s: CardSchedule, now: number): Record<Grade, number> {
  const p = scheduler.repeat(toFsrs(s), new Date(now));
  return {
    1: p[Rating.Again].card.due.getTime(),
    2: p[Rating.Hard].card.due.getTime(),
    3: p[Rating.Good].card.due.getTime(),
    4: p[Rating.Easy].card.due.getTime(),
  };
}

export function formatInterval(ms: number): string {
  const min = Math.max(1, Math.round(ms / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d}d`;
  const mo = Math.round(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${(d / 365).toFixed(1)}y`;
}

/** Cards are due when their due time is at or before the end of "today". */
export function isDue(s: CardSchedule, now: number): boolean {
  return s.due <= now;
}
