/**
 * Daily plan: answers "what should I study next?" from real workload only.
 * Priority: due flashcards → missed/flagged questions → weak objectives →
 * unfinished reading → objectives with no practice. The plan is sized to the
 * daily minute target; the exam date raises the pace message, nothing else.
 */
export type PlanItemKind = "review" | "mistakes" | "weak" | "read" | "practice" | "custom";

export interface PlanItem {
  id: string;
  kind: PlanItemKind;
  title: string;
  detail: string;
  minutes: number;
  /** Navigation target (e.g. material id or objective id). */
  targetId?: string;
  done?: boolean;
}

export interface PlanInput {
  dueCards: number;
  newCardsAvailable: number;
  dailyCards: number;
  mistakes: number;
  weakObjectives: { id: string; label: string; accuracy: number; answered: number }[];
  unfinishedMaterials: { id: string; title: string; remainingSections: number }[];
  unpracticedObjectives: { id: string; label: string }[];
  questionCount: number;
  dailyMinutes: number;
  minutesStudiedToday: number;
  examDate: string | null;
  today: string; // YYYY-MM-DD
}

export interface Plan {
  items: PlanItem[];
  daysToExam: number | null;
  remainingMinutes: number;
  message: string;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86_400_000);
}

export function localDateIso(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function buildPlan(p: PlanInput): Plan {
  const items: PlanItem[] = [];
  const budget = Math.max(0, p.dailyMinutes - p.minutesStudiedToday);
  let used = 0;
  const add = (item: PlanItem) => {
    if (items.length >= 5) return;
    items.push(item);
    used += item.minutes;
  };

  const reviewCount = p.dueCards + Math.min(p.newCardsAvailable, Math.max(0, p.dailyCards - p.dueCards));
  if (reviewCount > 0) {
    add({
      id: "review",
      kind: "review",
      title: `Review ${reviewCount} flashcard${reviewCount === 1 ? "" : "s"}`,
      detail: p.dueCards > 0 ? `${p.dueCards} due now` : `${reviewCount} new`,
      minutes: Math.max(5, Math.ceil(reviewCount * 0.4)),
    });
  }
  if (p.mistakes > 0) {
    const n = Math.min(p.mistakes, 10);
    add({ id: "mistakes", kind: "mistakes", title: `Retry ${n} missed or flagged question${n === 1 ? "" : "s"}`, detail: `${p.mistakes} in review queue`, minutes: Math.max(5, n) });
  }
  for (const w of p.weakObjectives.slice(0, 2)) {
    if (used >= budget && items.length > 0) break;
    add({
      id: `weak:${w.id}`,
      kind: "weak",
      title: `Strengthen: ${w.label}`,
      detail: `${Math.round(w.accuracy * 100)}% correct over ${w.answered} answer${w.answered === 1 ? "" : "s"}`,
      minutes: 10,
      targetId: w.id,
    });
  }
  for (const m of p.unfinishedMaterials.slice(0, 1)) {
    if (used >= budget && items.length > 0) break;
    add({ id: `read:${m.id}`, kind: "read", title: `Continue reading: ${m.title}`, detail: `${m.remainingSections} section${m.remainingSections === 1 ? "" : "s"} left`, minutes: Math.max(10, Math.min(25, budget - used)), targetId: m.id });
  }
  if (p.questionCount > 0 && items.length < 5 && used < budget) {
    add({ id: "practice", kind: "practice", title: "Quick practice quiz", detail: "10 questions, instant feedback", minutes: 10 });
  }
  if (p.unpracticedObjectives.length > 0 && items.length < 5 && used < budget) {
    const o = p.unpracticedObjectives[0];
    add({ id: `cover:${o.id}`, kind: "weak", title: `Cover new objective: ${o.label}`, detail: "No notes, cards or questions yet", minutes: 15, targetId: o.id });
  }

  const daysToExam = p.examDate ? daysBetween(p.today, p.examDate) : null;
  let message: string;
  if (items.length === 0) message = "Nothing scheduled. Import material or add cards to build a plan.";
  else if (budget === 0) message = "Daily goal reached. Anything more is a bonus.";
  else message = `About ${Math.min(budget, used)} of your ${budget} remaining minutes today.`;
  if (daysToExam != null) {
    if (daysToExam < 0) message += " Your exam date has passed — update it in the workspace.";
    else if (daysToExam === 0) message += " Exam day: favour light review over new material.";
    else message += ` ${daysToExam} day${daysToExam === 1 ? "" : "s"} until your exam.`;
  }
  return { items, daysToExam, remainingMinutes: budget, message };
}

/** Apply saved user adjustments (removed ids, order, custom items, done flags). */
export interface PlanAdjustments {
  removed: string[];
  order: string[];
  custom: PlanItem[];
  done: string[];
}

export function applyAdjustments(items: PlanItem[], adj: PlanAdjustments | null): PlanItem[] {
  if (!adj) return items;
  const all = [...items, ...adj.custom].filter((i) => !adj.removed.includes(i.id));
  const pos = (id: string) => {
    const k = adj.order.indexOf(id);
    return k === -1 ? 1000 + all.findIndex((i) => i.id === id) : k;
  };
  return all.sort((a, b) => pos(a.id) - pos(b.id)).map((i) => ({ ...i, done: adj.done.includes(i.id) }));
}
