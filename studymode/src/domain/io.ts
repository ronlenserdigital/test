/**
 * Flashcard and question import/export (CSV and JSON).
 *
 * Cards CSV headers: front, back, tags (semicolon-separated), source
 * Cards JSON: [{ "front": "...", "back": "...", "tags": ["..."], "source": "..." }]
 *
 * Questions CSV headers: stem, type (single|multiple), a, b, c, d, e, f,
 *   correct (letters, e.g. "A" or "A;C"), explanation, why_a … why_f, objective (code), source
 * Questions JSON: [{ "stem", "type", "choices": [{ "text", "correct", "explanation" }], "explanation", "objective", "source" }]
 */
import { parseCsvObjects, toCsv } from "./csv";
import { validateQuestion } from "./quiz";
import type { Choice, Flashcard, Question, QuestionKind } from "./types";

export interface CardDraft {
  front: string;
  back: string;
  tags: string[];
  sourceLabel: string;
}

export interface ImportResult<T> {
  items: T[];
  errors: string[];
}

const LETTERS = ["a", "b", "c", "d", "e", "f"];

export function parseCards(text: string, format: "csv" | "json"): ImportResult<CardDraft> {
  const errors: string[] = [];
  const items: CardDraft[] = [];
  let rows: Record<string, unknown>[];
  try {
    rows = format === "json" ? JSON.parse(text) : parseCsvObjects(text);
  } catch (e) {
    return { items, errors: [`Could not read file: ${(e as Error).message}`] };
  }
  if (!Array.isArray(rows)) return { items, errors: ["Expected a list of cards."] };
  rows.forEach((r, i) => {
    const front = String(r.front ?? "").trim();
    const back = String(r.back ?? "").trim();
    if (!front || !back) {
      errors.push(`Row ${i + (format === "csv" ? 2 : 1)}: front and back are required.`);
      return;
    }
    const tags = Array.isArray(r.tags) ? r.tags.map(String) : String(r.tags ?? "").split(";");
    items.push({ front, back, tags: tags.map((t) => t.trim().toLowerCase()).filter(Boolean), sourceLabel: String(r.source ?? "").trim() });
  });
  return { items, errors };
}

export function exportCards(cards: Flashcard[], format: "csv" | "json"): string {
  if (format === "json") {
    return JSON.stringify(
      cards.map((c) => ({ front: c.front, back: c.back, tags: c.tags, source: c.sourceLabel, origin: c.origin })),
      null,
      2,
    );
  }
  return toCsv([["front", "back", "tags", "source"], ...cards.map((c) => [c.front, c.back, c.tags.join(";"), c.sourceLabel])]);
}

export interface QuestionDraft {
  kind: QuestionKind;
  stem: string;
  choices: Choice[];
  correct: string[];
  explanation: string;
  objectiveCode: string;
  sourceLabel: string;
}

export function parseQuestions(text: string, format: "csv" | "json"): ImportResult<QuestionDraft> {
  const errors: string[] = [];
  const items: QuestionDraft[] = [];
  let rows: Record<string, unknown>[];
  try {
    rows = format === "json" ? JSON.parse(text) : parseCsvObjects(text);
  } catch (e) {
    return { items, errors: [`Could not read file: ${(e as Error).message}`] };
  }
  if (!Array.isArray(rows)) return { items, errors: ["Expected a list of questions."] };
  rows.forEach((r, i) => {
    const rowNo = i + (format === "csv" ? 2 : 1);
    let choices: Choice[] = [];
    let correct: string[] = [];
    if (format === "json") {
      const cs = Array.isArray(r.choices) ? (r.choices as Record<string, unknown>[]) : [];
      choices = cs.map((c, k) => ({ id: LETTERS[k] ?? `c${k}`, text: String(c.text ?? "").trim(), explanation: String(c.explanation ?? "").trim() }));
      correct = cs.flatMap((c, k) => (c.correct === true ? [LETTERS[k] ?? `c${k}`] : []));
    } else {
      choices = LETTERS.filter((l) => String(r[l] ?? "").trim()).map((l) => ({ id: l, text: String(r[l]).trim(), explanation: String(r[`why_${l}`] ?? "").trim() }));
      correct = String(r.correct ?? "")
        .toLowerCase()
        .split(/[;,\s]+/)
        .filter(Boolean);
    }
    const typeRaw = String(r.type ?? "").toLowerCase();
    const kind: QuestionKind = typeRaw === "multiple" || (typeRaw !== "single" && correct.length > 1) ? "multiple" : "single";
    const draft: QuestionDraft = {
      kind,
      stem: String(r.stem ?? "").trim(),
      choices,
      correct,
      explanation: String(r.explanation ?? "").trim(),
      objectiveCode: String(r.objective ?? "").trim(),
      sourceLabel: String(r.source ?? "").trim(),
    };
    const problems = validateQuestion(draft);
    if (problems.length) errors.push(`Row ${rowNo}: ${problems.join(" ")}`);
    else items.push(draft);
  });
  return { items, errors };
}

export function exportQuestions(qs: Question[], objectiveCode: (id: string) => string, format: "csv" | "json"): string {
  if (format === "json") {
    return JSON.stringify(
      qs.map((q) => ({
        stem: q.stem,
        type: q.kind,
        choices: q.choices.map((c) => ({ text: c.text, correct: q.correct.includes(c.id), explanation: c.explanation })),
        explanation: q.explanation,
        objective: q.objectiveIds.map(objectiveCode).filter(Boolean).join(";"),
        source: q.sourceLabel,
        origin: q.origin,
      })),
      null,
      2,
    );
  }
  const header = ["stem", "type", ...LETTERS, "correct", "explanation", ...LETTERS.map((l) => `why_${l}`), "objective", "source"];
  return toCsv([
    header,
    ...qs.map((q) => {
      const byIndex = q.choices.slice(0, 6);
      const letterFor = (id: string) => LETTERS[byIndex.findIndex((c) => c.id === id)]?.toUpperCase() ?? "";
      return [
        q.stem,
        q.kind,
        ...LETTERS.map((_, k) => byIndex[k]?.text ?? ""),
        q.correct.map(letterFor).filter(Boolean).join(";"),
        q.explanation,
        ...LETTERS.map((_, k) => byIndex[k]?.explanation ?? ""),
        q.objectiveIds.map(objectiveCode).filter(Boolean).join(";"),
        q.sourceLabel,
      ];
    }),
  ]);
}
