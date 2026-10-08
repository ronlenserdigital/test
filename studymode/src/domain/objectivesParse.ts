/**
 * Parse an exam-objective outline the user pastes or imports. Nothing here
 * invents content: we only structure what the user provides, and keep the
 * user-specified source and version with every domain/objective.
 *
 * Accepted outline forms (one item per line):
 *   "1.0 Networking Concepts (23%)"   → domain with weight 23
 *   "Domain 2: Security — 18%"        → domain with weight 18
 *   "# Heading" / "## Heading"        → domain
 *   "1.1 Explain ..."                 → objective with code 1.1
 *   "- Explain ..." / "* ..."         → objective (no code)
 * Or CSV with headers: domain, weight, code, objective
 */
import { parseCsvObjects } from "./csv";

export interface ParsedObjective {
  code: string;
  title: string;
}
export interface ParsedDomain {
  name: string;
  weight: number | null;
  objectives: ParsedObjective[];
}
export interface ParsedOutline {
  domains: ParsedDomain[];
  warnings: string[];
}

const WEIGHT = /\(?\s*(\d{1,3}(?:\.\d+)?)\s*%\s*\)?/;

function takeWeight(s: string): { text: string; weight: number | null } {
  const m = s.match(WEIGHT);
  if (!m) return { text: s.trim(), weight: null };
  const w = Number(m[1]);
  return { text: s.replace(m[0], "").replace(/[\s—–:-]+$/, "").trim(), weight: w > 0 && w <= 100 ? w : null };
}

export function parseOutline(input: string): ParsedOutline {
  const warnings: string[] = [];
  const domains: ParsedDomain[] = [];
  let current: ParsedDomain | null = null;
  const ensure = () => {
    if (!current) {
      current = { name: "General", weight: null, objectives: [] };
      domains.push(current);
    }
    return current;
  };
  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^#{1,3}\s+(.+)$/)) || (m = line.match(/^domain\s*\d*\s*[:.\-–—]\s*(.+)$/i)) || (m = line.match(/^(\d+)\.0\s+(.+)$/))) {
      const raw = m.length === 3 && /^\d+$/.test(m[1]) ? `${m[2]}` : m[1];
      const { text, weight } = takeWeight(raw);
      current = { name: text, weight, objectives: [] };
      domains.push(current);
    } else if ((m = line.match(/^(\d+(?:\.\d+)+)\s+(.+)$/))) {
      ensure().objectives.push({ code: m[1], title: m[2].trim() });
    } else if ((m = line.match(/^[-*•]\s+(.+)$/))) {
      ensure().objectives.push({ code: "", title: m[1].trim() });
    } else if (current) {
      ensure().objectives.push({ code: "", title: line });
    } else {
      const { text, weight } = takeWeight(line);
      current = { name: text, weight, objectives: [] };
      domains.push(current);
    }
  }
  validateWeights(domains, warnings);
  return { domains, warnings };
}

export function parseObjectivesCsv(input: string): ParsedOutline {
  const rows = parseCsvObjects(input);
  const warnings: string[] = [];
  const byName = new Map<string, ParsedDomain>();
  rows.forEach((r, i) => {
    const name = r["domain"] || "General";
    const objective = r["objective"] || r["title"] || "";
    let d = byName.get(name);
    if (!d) {
      const w = r["weight"] ? Number(String(r["weight"]).replace("%", "")) : NaN;
      d = { name, weight: Number.isFinite(w) && w > 0 && w <= 100 ? w : null, objectives: [] };
      byName.set(name, d);
    }
    if (objective) d.objectives.push({ code: r["code"] ?? "", title: objective });
    else warnings.push(`Row ${i + 2}: no objective text; skipped.`);
  });
  const domains = [...byName.values()];
  validateWeights(domains, warnings);
  return { domains, warnings };
}

function validateWeights(domains: ParsedDomain[], warnings: string[]) {
  const withW = domains.filter((d) => d.weight != null);
  if (withW.length > 0 && withW.length < domains.length) {
    warnings.push("Some domains have weights and some do not; weighted exams will be unavailable until all domains have weights.");
  }
  if (withW.length === domains.length && domains.length > 0) {
    const sum = withW.reduce((a, d) => a + (d.weight ?? 0), 0);
    if (Math.abs(sum - 100) > 1) warnings.push(`Domain weights add up to ${sum}%, not 100%. They will be used as relative weights.`);
  }
}
