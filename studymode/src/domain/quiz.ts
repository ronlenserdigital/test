/**
 * Quiz assembly and scoring.
 *
 * Choice shuffling never changes correctness: answers are stored and compared
 * by stable choice id, and the display order is a separate per-attempt array.
 *
 * Multiple-answer scoring (explicit):
 *  - "all_or_nothing" (default, mirrors most certification exams): 1 point only
 *    when the selected set equals the correct set exactly; otherwise 0.
 *  - "partial": (correct selected − incorrect selected) / number correct,
 *    clamped to [0, 1]. Selecting everything therefore earns nothing.
 * Single-answer questions are always 1 or 0.
 */
import type { Domain, Id, MultiScoring, Question, QuizConfig } from "./types";

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function choiceOrder(q: Pick<Question, "choices">, shuffleChoices: boolean, rng: () => number): string[] {
  const ids = q.choices.map((c) => c.id);
  return shuffleChoices ? shuffle(ids, rng) : ids;
}

export interface ItemScore {
  score: number;
  isCorrect: boolean;
  correctSelected: number;
  incorrectSelected: number;
  missed: number;
}

export function scoreAnswer(
  q: Pick<Question, "kind" | "correct" | "choices">,
  selected: readonly string[],
  scoring: MultiScoring = "all_or_nothing",
): ItemScore {
  const valid = new Set(q.choices.map((c) => c.id));
  const correct = new Set(q.correct);
  const sel = new Set(selected.filter((s) => valid.has(s)));
  let correctSelected = 0;
  let incorrectSelected = 0;
  for (const s of sel) (correct.has(s) ? correctSelected++ : incorrectSelected++);
  const missed = correct.size - correctSelected;
  const exact = incorrectSelected === 0 && missed === 0 && correct.size > 0;
  let score: number;
  if (q.kind === "single" || scoring === "all_or_nothing") {
    score = exact ? 1 : 0;
  } else {
    score = Math.max(0, Math.min(1, (correctSelected - incorrectSelected) / Math.max(1, correct.size)));
  }
  return { score, isCorrect: exact, correctSelected, incorrectSelected, missed };
}

export function validateQuestion(q: Pick<Question, "kind" | "stem" | "choices" | "correct">): string[] {
  const errors: string[] = [];
  if (!q.stem.trim()) errors.push("Question text is required.");
  if (q.choices.length < 2) errors.push("Add at least two choices.");
  if (q.choices.some((c) => !c.text.trim())) errors.push("Choices cannot be empty.");
  const ids = new Set(q.choices.map((c) => c.id));
  if (ids.size !== q.choices.length) errors.push("Choice ids must be unique.");
  if (q.correct.length === 0) errors.push("Mark at least one correct answer.");
  if (q.correct.some((c) => !ids.has(c))) errors.push("A correct answer refers to a missing choice.");
  if (q.kind === "single" && q.correct.length !== 1) errors.push("Single-answer questions need exactly one correct answer.");
  if (q.kind === "multiple" && q.correct.length < 2) errors.push("Multiple-answer questions need at least two correct answers.");
  return errors;
}

export interface QuestionStats {
  /** Times answered in previous attempts. */
  seen: number;
  /** Times answered correctly. */
  correct: number;
  inReviewQueue: boolean;
}

export interface AssemblyInput {
  pool: Question[];
  config: QuizConfig;
  domains: Domain[];
  /** Map objectiveId → domainId. */
  objectiveDomain: Map<Id, Id | null>;
  stats: Map<Id, QuestionStats>;
  /** Accuracy per objective (0..1) with sample size, for weak-topic quizzes. */
  objectiveAccuracy: Map<Id, { correct: number; total: number }>;
}

export interface AssemblyResult {
  questionIds: Id[];
  warnings: string[];
  seenBefore: Set<Id>;
  usedDomainWeights: boolean;
}

/**
 * Select questions for a quiz. Prefers unseen questions, and reports when the
 * pool is too small or questions must repeat. Domain weights are applied only
 * when every domain has a weight and each weighted domain has enough questions.
 */
export function assembleQuiz(input: AssemblyInput, rng: () => number): AssemblyResult {
  const { config, stats } = input;
  const warnings: string[] = [];
  let pool = input.pool.slice();

  if (config.objectiveIds?.length) {
    const want = new Set(config.objectiveIds);
    pool = pool.filter((q) => q.objectiveIds.some((o) => want.has(o)));
  }

  if (config.kind === "review") {
    pool = pool.filter((q) => stats.get(q.id)?.inReviewQueue);
    if (pool.length === 0) warnings.push("Your mistake review queue is empty.");
  }

  const requested = Math.max(1, Math.floor(config.count));
  if (pool.length === 0) {
    return { questionIds: [], warnings: [...warnings, "No questions match this quiz. Add or import questions first."], seenBefore: new Set(), usedDomainWeights: false };
  }
  if (pool.length < requested) {
    warnings.push(`Only ${pool.length} question${pool.length === 1 ? "" : "s"} available; quiz shortened from ${requested}.`);
  }
  const n = Math.min(requested, pool.length);

  const priority = (q: Question): number => {
    const s = stats.get(q.id);
    let p = rng() * 0.5; // tie-breaking randomness
    if (!s || s.seen === 0) p += 2; // prefer new questions
    if (config.kind === "weak") {
      p += weaknessScore(q, input.objectiveAccuracy) * 3;
      if (s?.inReviewQueue) p += 2;
      if (s && s.seen > 0) p += (1 - s.correct / s.seen) * 2;
    }
    return p;
  };

  let selected: Question[] = [];
  let usedDomainWeights = false;

  if (config.useDomainWeights && config.kind !== "review") {
    const weighted = input.domains.filter((d) => d.weight != null && d.weight > 0);
    if (input.domains.length === 0 || weighted.length !== input.domains.length) {
      warnings.push("Domain weights were not applied: not every domain has a weight.");
    } else {
      const byDomain = new Map<Id, Question[]>();
      for (const q of pool) {
        const dom = q.objectiveIds.map((o) => input.objectiveDomain.get(o)).find((d) => d != null);
        if (!dom) continue;
        const list = byDomain.get(dom) ?? [];
        list.push(q);
        byDomain.set(dom, list);
      }
      const total = weighted.reduce((a, d) => a + (d.weight ?? 0), 0);
      const quotas = largestRemainder(weighted.map((d) => ((d.weight ?? 0) / total) * n));
      const short = weighted.filter((d, i) => (byDomain.get(d.id)?.length ?? 0) < quotas[i]);
      if (short.length) {
        warnings.push(
          `Domain weights were not applied: not enough tagged questions in ${short.map((d) => d.name).join(", ")}.`,
        );
      } else {
        weighted.forEach((d, i) => {
          const list = (byDomain.get(d.id) ?? []).sort((a, b) => priority(b) - priority(a));
          selected.push(...list.slice(0, quotas[i]));
        });
        usedDomainWeights = true;
      }
    }
  }

  if (!usedDomainWeights) {
    selected = pool
      .map((q) => ({ q, p: priority(q) }))
      .sort((a, b) => b.p - a.p)
      .slice(0, n)
      .map((x) => x.q);
  }

  selected = shuffle(selected, rng);
  const seenBefore = new Set(selected.filter((q) => (stats.get(q.id)?.seen ?? 0) > 0).map((q) => q.id));
  if (seenBefore.size > 0 && config.kind !== "review") {
    warnings.push(
      `${seenBefore.size} of ${selected.length} question${selected.length === 1 ? " has" : "s have"} been answered before; scores on repeated questions may overstate readiness.`,
    );
  }
  return { questionIds: selected.map((q) => q.id), warnings, seenBefore, usedDomainWeights };
}

function weaknessScore(q: Question, acc: Map<Id, { correct: number; total: number }>): number {
  let worst = 0;
  for (const o of q.objectiveIds) {
    const a = acc.get(o);
    // Unpracticed objectives count as moderately weak.
    const w = !a || a.total === 0 ? 0.5 : 1 - a.correct / a.total;
    worst = Math.max(worst, w);
  }
  return worst;
}

/** Integer apportionment that sums to round(sum(values)). */
export function largestRemainder(values: number[]): number[] {
  const target = Math.round(values.reduce((a, b) => a + b, 0));
  const floors = values.map(Math.floor);
  let rem = target - floors.reduce((a, b) => a + b, 0);
  const order = values.map((v, i) => ({ i, r: v - Math.floor(v) })).sort((a, b) => b.r - a.r);
  for (const { i } of order) {
    if (rem <= 0) break;
    floors[i]++;
    rem--;
  }
  return floors;
}

export function percent(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}
