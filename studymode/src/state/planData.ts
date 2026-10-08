import type { Repo } from "../data/repo";
import type { Certification } from "../domain/types";
import { accuracyBy, studyStreak, weakObjectives, dayKey } from "../domain/analytics";
import { buildPlan, localDateIso, type Plan, type PlanAdjustments } from "../domain/plan";
import { objectiveLabel } from "../views/common";

export function startOfToday(now: number) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function loadPlan(repo: Repo, cert: Certification, now: number) {
  const today = localDateIso(now);
  const dayStart = startOfToday(now);
  const [counts, mistakes, objectives, materials, questions, records, sessions, coverage, introducedToday, reviews] = await Promise.all([
    repo.cardCounts(cert.id, now),
    repo.reviewQueueEntries(cert.id),
    repo.listObjectives(cert.id),
    repo.listMaterials(cert.id),
    repo.listQuestions(cert.id),
    repo.answerRecords(cert.id),
    repo.listSessions(cert.id, 400),
    repo.objectiveCoverage(cert.id),
    repo.newCardsIntroducedToday(cert.id, dayStart),
    repo.reviewHistory(cert.id, now - 400 * 86_400_000),
  ]);
  const acc = accuracyBy(records, (r) => r.objectiveIds);
  const byId = new Map(objectives.map((o) => [o.id, o]));
  const weak = weakObjectives(acc).filter((w) => byId.has(w.id)).map((w) => ({ ...w, label: objectiveLabel(byId.get(w.id)!) }));
  const unfinished = materials
    .filter((m) => m.status === "ready" && m.sectionCount > 0 && m.furthestSection < m.sectionCount - 1)
    .sort((a, b) => (b.position ? 1 : 0) - (a.position ? 1 : 0))
    .map((m) => ({ id: m.id, title: m.title, remainingSections: m.sectionCount - 1 - m.furthestSection }));
  const unpracticed = objectives.filter((o) => !coverage.has(o.id)).map((o) => ({ id: o.id, label: objectiveLabel(o) }));
  const minutesToday = Math.round(sessions.filter((s) => s.startedAt >= dayStart).reduce((a, s) => a + s.focusSec, 0) / 60);
  const plan: Plan = buildPlan({
    dueCards: counts.due,
    newCardsAvailable: counts.fresh,
    dailyCards: Math.max(0, cert.dailyCards - introducedToday),
    mistakes: mistakes.length,
    weakObjectives: weak,
    unfinishedMaterials: unfinished,
    unpracticedObjectives: unpracticed,
    questionCount: questions.length,
    dailyMinutes: cert.dailyMinutes,
    minutesStudiedToday: minutesToday,
    examDate: cert.examDate,
    today,
  });
  const days = [...sessions.map((s) => dayKey(s.startedAt)), ...reviews.map((r) => dayKey(Number(r.reviewed_at))), ...records.map((r) => dayKey(r.at))];
  const streak = studyStreak(days, today);
  const adjustments = await repo.getSetting<PlanAdjustments | null>(`plan:${cert.id}:${today}`, null);
  return { plan, adjustments, counts, mistakes: mistakes.length, minutesToday, streak, materials: materials.length, questions: questions.length, objectives: objectives.length, today };
}
