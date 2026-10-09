import { describe, expect, it } from "vitest";
import { parseObjectivesCsv, parseOutline } from "../../src/domain/objectivesParse";
import { applyAdjustments, buildPlan, daysBetween } from "../../src/domain/plan";
import { accuracyBy, dailySeries, studyStreak, weakObjectives } from "../../src/domain/analytics";
import { parseCsv, toCsv } from "../../src/domain/csv";
import { exportCards, exportQuestions, parseCards, parseQuestions } from "../../src/domain/io";
import { paragraphs, speechChunks } from "../../src/domain/text";
import { inWindow, parseHm, sunTimes } from "../../src/domain/sunset";
import { markdownToSections, plainTextToSections, decodeText } from "../../src/importers/textFormats";
import { classifyPdf, pageItemsToText } from "../../src/importers/pdf";

describe("objective outline parsing", () => {
  it("parses domains, weights and codes without inventing anything", () => {
    const r = parseOutline("1.0 Networking (20%)\n1.1 Explain OSI\n1.2 Compare TCP and UDP\n2.0 Security (80%)\n- Configure firewalls");
    expect(r.domains).toEqual([
      { name: "Networking", weight: 20, objectives: [{ code: "1.1", title: "Explain OSI" }, { code: "1.2", title: "Compare TCP and UDP" }] },
      { name: "Security", weight: 80, objectives: [{ code: "", title: "Configure firewalls" }] },
    ]);
    expect(r.warnings).toEqual([]);
  });
  it("warns about partial or non-100 weights", () => {
    expect(parseOutline("# A (30%)\n- x\n# B\n- y").warnings[0]).toMatch(/Some domains have weights/);
    expect(parseOutline("# A (30%)\n- x\n# B (30%)\n- y").warnings[0]).toMatch(/60%/);
  });
  it("parses CSV outlines", () => {
    const r = parseObjectivesCsv("domain,weight,code,objective\nA,50%,1.1,Do a\nA,,1.2,Do b\nB,50,2.1,Do c\nB,,2.2,");
    expect(r.domains.map((d) => [d.name, d.weight, d.objectives.length])).toEqual([
      ["A", 50, 2],
      ["B", 50, 1],
    ]);
    expect(r.warnings).toHaveLength(1);
  });
});

describe("daily plan", () => {
  const base = {
    dueCards: 0,
    newCardsAvailable: 0,
    dailyCards: 20,
    mistakes: 0,
    weakObjectives: [],
    unfinishedMaterials: [],
    unpracticedObjectives: [],
    questionCount: 0,
    dailyMinutes: 30,
    minutesStudiedToday: 0,
    examDate: null,
    today: "2026-10-08",
  };
  it("is empty with no workload", () => {
    expect(buildPlan(base).items).toEqual([]);
  });
  it("prioritises due reviews, then mistakes, then weak objectives, then reading", () => {
    const p = buildPlan({
      ...base,
      dueCards: 12,
      mistakes: 3,
      weakObjectives: [{ id: "o1", label: "1.1 Subnetting", accuracy: 0.4, answered: 5 }],
      unfinishedMaterials: [{ id: "m1", title: "Guide", remainingSections: 4 }],
      questionCount: 30,
      dailyMinutes: 120,
      examDate: "2026-10-18",
    });
    expect(p.items.map((i) => i.kind)).toEqual(["review", "mistakes", "weak", "read", "practice"]);
    expect(p.daysToExam).toBe(10);
    expect(p.message).toMatch(/10 days until your exam/);
  });
  it("applies user adjustments", () => {
    const items = buildPlan({ ...base, dueCards: 1, mistakes: 1, questionCount: 1 }).items;
    const adj = applyAdjustments(items, { removed: ["practice"], order: ["mistakes", "review"], custom: [{ id: "c1", kind: "custom", title: "Mine", detail: "", minutes: 0 }], done: ["review"] });
    expect(adj.map((i) => i.id)).toEqual(["mistakes", "review", "c1"]);
    expect(adj.find((i) => i.id === "review")?.done).toBe(true);
  });
  it("counts days between ISO dates", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
  });
});

describe("analytics", () => {
  it("computes current and longest streaks", () => {
    expect(studyStreak(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-06", "2026-10-07"], "2026-10-08")).toEqual({ current: 2, longest: 3 });
    expect(studyStreak(["2026-10-08"], "2026-10-08")).toEqual({ current: 1, longest: 1 });
    expect(studyStreak([], "2026-10-08")).toEqual({ current: 0, longest: 0 });
  });
  it("separates new from repeated answers and requires a minimum sample for weakness", () => {
    const recs = [
      { questionId: "a", objectiveIds: ["o1"], isCorrect: false, seenBefore: false },
      { questionId: "a", objectiveIds: ["o1"], isCorrect: true, seenBefore: true },
      { questionId: "b", objectiveIds: ["o1"], isCorrect: false, seenBefore: false },
      { questionId: "c", objectiveIds: ["o2"], isCorrect: false, seenBefore: false },
    ];
    const acc = accuracyBy(recs, (r) => r.objectiveIds);
    expect(acc.get("o1")).toEqual({ correct: 1, total: 3, newCorrect: 0, newTotal: 2 });
    expect(weakObjectives(acc).map((w) => w.id)).toEqual(["o1"]); // o2 has only 1 answer
  });
  it("buckets seconds per day", () => {
    const now = new Date(2026, 9, 8, 12).getTime();
    const s = dailySeries([{ at: now, seconds: 60 }, { at: now - 86_400_000, seconds: 30 }, { at: now - 30 * 86_400_000, seconds: 999 }], 7, now);
    expect(s.at(-1)!.seconds).toBe(60);
    expect(s.at(-2)!.seconds).toBe(30);
    expect(s.reduce((a, x) => a + x.seconds, 0)).toBe(90);
  });
});

describe("CSV and card/question import-export", () => {
  it("round-trips quoted fields", () => {
    const rows = [["a,b", 'say "hi"', "multi\nline"], ["", "x", " lead"]];
    expect(parseCsv(toCsv(rows))).toEqual([["a,b", 'say "hi"', "multi\nline"], ["", "x", " lead"]]);
    expect(() => parseCsv('"unterminated')).toThrow();
  });
  it("imports cards from CSV and JSON with row errors", () => {
    const r = parseCards("front,back,tags\nQ1,A1,net;ip\n,missing\n", "csv");
    expect(r.items).toEqual([{ front: "Q1", back: "A1", tags: ["net", "ip"], sourceLabel: "" }]);
    expect(r.errors).toHaveLength(1);
    expect(parseCards('[{"front":"a","back":"b","tags":["X"]}]', "json").items[0].tags).toEqual(["x"]);
    expect(parseCards("{bad", "json").errors[0]).toMatch(/Could not read/);
  });
  it("imports questions and preserves correct mapping on export", () => {
    const r = parseQuestions("stem,a,b,c,correct,explanation,why_a\nPick B,x,y,z,B,because,no\nMulti,x,y,z,A;C,,\nBad,x,,,D,,\n", "csv");
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({ kind: "single", correct: ["b"] });
    expect(r.items[0].choices[0].explanation).toBe("no");
    expect(r.items[1]).toMatchObject({ kind: "multiple", correct: ["a", "c"] });
    expect(r.errors[0]).toMatch(/Row 4/);
    const q = { ...r.items[1], id: "1", certId: "c", materialId: null, sectionIdx: null, sourceQuote: "", origin: "import" as const, isSample: false, createdAt: 0, updatedAt: 0, objectiveIds: [] };
    const back = parseQuestions(exportQuestions([q], () => "", "csv"), "csv");
    expect(back.items[0].correct).toEqual(["a", "c"]);
    const json = parseQuestions(exportQuestions([q], () => "", "json"), "json");
    expect(json.items[0].correct).toEqual(["a", "c"]);
    expect(exportCards([], "csv")).toBe("front,back,tags,source");
  });
});

describe("text processing", () => {
  it("chunks speech by sentence within paragraphs and never exceeds the limit", () => {
    const text = "Short one. " + "word ".repeat(120) + "end.\n\nNext para.";
    const chunks = speechChunks(text, 100);
    expect(chunks.every((c) => c.text.length <= 100)).toBe(true);
    expect(chunks.at(-1)).toEqual({ para: 1, text: "Next para." });
    expect(speechChunks(text, 100)).toEqual(chunks); // stable for persisted cursors
  });
  it("joins soft line breaks in paragraphs", () => {
    expect(paragraphs("a\nb\n\nc")).toEqual(["a b", "c"]);
  });
  it("splits markdown sections and plain text parts", () => {
    expect(markdownToSections("intro\n# A\ntext a\n## B\n---\ntext b", "Doc").map((s) => s.label)).toEqual(["Doc", "A", "B"]);
    const big = Array.from({ length: 30 }, (_, i) => `Paragraph ${i} ${"x".repeat(400)}`).join("\n\n");
    const parts = plainTextToSections(big);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts[0].label).toBe("Part 1");
  });
  it("decodes legacy encodings", () => {
    expect(decodeText(new Uint8Array([0x63, 0x61, 0x66, 0xe9]))).toBe("café");
    expect(decodeText(new TextEncoder().encode("﻿hello"))).toBe("hello");
  });
  it("reconstructs PDF lines/paragraphs and classifies scanned PDFs", () => {
    const items = [
      { str: "Hello", transform: [1, 0, 0, 1, 0, 700], height: 10 },
      { str: "world exam-", transform: [1, 0, 0, 1, 0, 688], height: 10 },
      { str: "ple text", transform: [1, 0, 0, 1, 0, 676], height: 10 },
      { str: "New paragraph", transform: [1, 0, 0, 1, 0, 640], height: 10 },
    ];
    expect(paragraphs(pageItemsToText(items))).toEqual(["Hello world example text", "New paragraph"]);
    expect(classifyPdf({ pages: [], pageCount: 3, pagesWithoutText: [1, 2, 3] })).toBe("image_only");
    expect(classifyPdf({ pages: [], pageCount: 3, pagesWithoutText: [2] })).toBe("partial");
    expect(classifyPdf({ pages: [], pageCount: 3, pagesWithoutText: [] })).toBe("text");
  });
});

describe("evening schedule", () => {
  it("computes plausible sunset times", () => {
    // Fredericksburg, VA on the June solstice: sunset ≈ 20:38 EDT = 00:38 UTC next day
    const t = sunTimes(Date.UTC(2026, 5, 21, 12), 38.3, -77.46)!;
    const sunsetUtcHours = ((t.sunset / 3_600_000) % 24 + 24) % 24;
    expect(sunsetUtcHours).toBeGreaterThan(0.3);
    expect(sunsetUtcHours).toBeLessThan(1.0);
    expect(sunTimes(Date.UTC(2026, 5, 21), 80, 0)).toBeNull(); // polar day
  });
  it("handles windows that wrap past midnight", () => {
    expect(inWindow(parseHm("23:30")!, parseHm("20:00")!, parseHm("07:00")!)).toBe(true);
    expect(inWindow(parseHm("12:00")!, parseHm("20:00")!, parseHm("07:00")!)).toBe(false);
    expect(parseHm("25:00")).toBeNull();
  });
});
