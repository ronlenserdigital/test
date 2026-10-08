import { describe, expect, it } from "vitest";
import { assembleQuiz, choiceOrder, largestRemainder, mulberry32, scoreAnswer, validateQuestion } from "../../src/domain/quiz";
import type { Domain, Question, QuizConfig } from "../../src/domain/types";

const q = (id: string, kind: "single" | "multiple", correct: string[], objectiveIds: string[] = []): Question => ({
  id,
  certId: "c",
  kind,
  stem: `Q ${id}`,
  choices: ["a", "b", "c", "d"].map((c) => ({ id: c, text: c.toUpperCase(), explanation: "" })),
  correct,
  explanation: "",
  materialId: null,
  sectionIdx: null,
  sourceLabel: "",
  sourceQuote: "",
  origin: "manual",
  isSample: false,
  createdAt: 0,
  updatedAt: 0,
  objectiveIds,
});

const cfg = (over: Partial<QuizConfig> = {}): QuizConfig => ({
  kind: "quick",
  mode: "study",
  count: 5,
  minutes: null,
  shuffleChoices: true,
  multiScoring: "all_or_nothing",
  useDomainWeights: false,
  ...over,
});

describe("scoring", () => {
  it("single answer is all or nothing", () => {
    expect(scoreAnswer(q("1", "single", ["b"]), ["b"]).score).toBe(1);
    expect(scoreAnswer(q("1", "single", ["b"]), ["a"]).score).toBe(0);
    expect(scoreAnswer(q("1", "single", ["b"]), []).isCorrect).toBe(false);
  });

  it("multiple answer all-or-nothing requires the exact set", () => {
    const m = q("1", "multiple", ["a", "c"]);
    expect(scoreAnswer(m, ["c", "a"]).score).toBe(1);
    expect(scoreAnswer(m, ["a"]).score).toBe(0);
    expect(scoreAnswer(m, ["a", "c", "d"]).score).toBe(0);
  });

  it("partial credit subtracts wrong picks and never goes negative", () => {
    const m = q("1", "multiple", ["a", "c"]);
    expect(scoreAnswer(m, ["a"], "partial").score).toBe(0.5);
    expect(scoreAnswer(m, ["a", "b"], "partial").score).toBe(0);
    expect(scoreAnswer(m, ["a", "b", "c", "d"], "partial").score).toBe(0);
    expect(scoreAnswer(m, ["a", "c"], "partial")).toMatchObject({ score: 1, isCorrect: true });
  });

  it("ignores selections that are not valid choices", () => {
    expect(scoreAnswer(q("1", "single", ["b"]), ["b", "zzz"]).score).toBe(1);
  });
});

describe("shuffling preserves answer mapping", () => {
  it("correct answer ids score correctly regardless of display order", () => {
    const rng = mulberry32(42);
    const question = q("1", "single", ["c"]);
    for (let i = 0; i < 50; i++) {
      const order = choiceOrder(question, true, rng);
      expect([...order].sort()).toEqual(["a", "b", "c", "d"]);
      // User clicks the displayed position that holds "c".
      const clicked = order[order.indexOf("c")];
      expect(scoreAnswer(question, [clicked]).isCorrect).toBe(true);
    }
  });
  it("keeps original order when shuffling is off", () => {
    expect(choiceOrder(q("1", "single", ["a"]), false, mulberry32(1))).toEqual(["a", "b", "c", "d"]);
  });
});

describe("validation", () => {
  it("catches structural problems", () => {
    expect(validateQuestion(q("1", "single", ["a", "b"]))).toContain("Single-answer questions need exactly one correct answer.");
    expect(validateQuestion(q("1", "multiple", ["a"]))).toContain("Multiple-answer questions need at least two correct answers.");
    expect(validateQuestion(q("1", "single", ["z"]))).toContain("A correct answer refers to a missing choice.");
    expect(validateQuestion(q("1", "single", ["a"]))).toEqual([]);
  });
});

describe("assembly", () => {
  const domains: Domain[] = [
    { id: "d1", certId: "c", name: "One", weight: 75, position: 0, source: "", sourceVersion: "" },
    { id: "d2", certId: "c", name: "Two", weight: 25, position: 1, source: "", sourceVersion: "" },
  ];
  const objectiveDomain = new Map([
    ["o1", "d1"],
    ["o2", "d2"],
  ]);
  const pool = [
    ...Array.from({ length: 10 }, (_, i) => q(`a${i}`, "single", ["a"], ["o1"])),
    ...Array.from({ length: 4 }, (_, i) => q(`b${i}`, "single", ["a"], ["o2"])),
  ];
  const base = { pool, domains, objectiveDomain, stats: new Map(), objectiveAccuracy: new Map() };

  it("warns when the pool is smaller than requested", () => {
    const r = assembleQuiz({ ...base, config: cfg({ count: 50 }) }, mulberry32(1));
    expect(r.questionIds).toHaveLength(14);
    expect(r.warnings.join(" ")).toMatch(/Only 14 questions available/);
  });

  it("applies domain weights when supported", () => {
    const r = assembleQuiz({ ...base, config: cfg({ count: 8, useDomainWeights: true }) }, mulberry32(1));
    expect(r.usedDomainWeights).toBe(true);
    expect(r.questionIds.filter((id) => id.startsWith("a"))).toHaveLength(6);
    expect(r.questionIds.filter((id) => id.startsWith("b"))).toHaveLength(2);
  });

  it("refuses weights when a domain lacks enough questions", () => {
    const r = assembleQuiz({ ...base, config: cfg({ count: 12, useDomainWeights: true }) }, mulberry32(1));
    // 75% of 12 = 9 (10 available), 25% = 3 (4 available). Now ask for more of d2:
    const heavy = assembleQuiz(
      { ...base, domains: [{ ...domains[0], weight: 20 }, { ...domains[1], weight: 80 }], config: cfg({ count: 10, useDomainWeights: true }) },
      mulberry32(1),
    );
    expect(r.usedDomainWeights).toBe(true);
    expect(heavy.usedDomainWeights).toBe(false);
    expect(heavy.warnings.join(" ")).toMatch(/not enough tagged questions in Two/);
  });

  it("refuses weights when not every domain is weighted", () => {
    const r = assembleQuiz({ ...base, domains: [domains[0], { ...domains[1], weight: null }], config: cfg({ useDomainWeights: true }) }, mulberry32(1));
    expect(r.usedDomainWeights).toBe(false);
    expect(r.warnings.join(" ")).toMatch(/not every domain has a weight/);
  });

  it("prefers unseen questions and flags repeats", () => {
    const stats = new Map(pool.slice(0, 12).map((x) => [x.id, { seen: 1, correct: 1, inReviewQueue: false }]));
    const r = assembleQuiz({ ...base, stats, config: cfg({ count: 2 }) }, mulberry32(3));
    expect(r.questionIds.sort()).toEqual(["b2", "b3"]);
    expect(r.seenBefore.size).toBe(0);
    const r2 = assembleQuiz({ ...base, stats, config: cfg({ count: 4 }) }, mulberry32(3));
    expect(r2.seenBefore.size).toBe(2);
    expect(r2.warnings.join(" ")).toMatch(/answered before/);
  });

  it("review quizzes only use queued questions", () => {
    const stats = new Map([["a3", { seen: 1, correct: 0, inReviewQueue: true }]]);
    const r = assembleQuiz({ ...base, stats, config: cfg({ kind: "review" }) }, mulberry32(1));
    expect(r.questionIds).toEqual(["a3"]);
  });

  it("largest remainder sums correctly", () => {
    expect(largestRemainder([3.5, 3.5, 3])).toEqual([4, 3, 3]);
    expect(largestRemainder([7.5, 2.5]).reduce((a, b) => a + b)).toBe(10);
  });
});
