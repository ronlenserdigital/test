import { useLive, useNow } from "../state/hooks";
import { accuracyBy, dailySeries, dayKey, studyStreak, MIN_SAMPLE } from "../domain/analytics";
import { localDateIso } from "../domain/plan";
import type { Certification } from "../domain/types";
import { Empty, Loading, Progress, fmtMinutes } from "../ui/components";
import { Page, RequireCert, objectiveLabel } from "./common";

export function AnalyticsView() {
  return <RequireCert title="Progress">{(cert) => <Inner cert={cert} />}</RequireCert>;
}

function Inner({ cert }: { cert: Certification }) {
  const now = useNow(300_000);
  const data = useLive(async (r) => {
    const [sessions, reviews, records, domains, objectives, coverage, forecast, counts, attempts] = await Promise.all([
      r.listSessions(cert.id, 2000),
      r.reviewHistory(cert.id, 0),
      r.answerRecords(cert.id),
      r.listDomains(cert.id),
      r.listObjectives(cert.id),
      r.objectiveCoverage(cert.id),
      r.dueForecast(cert.id, now, 14),
      r.cardCounts(cert.id, now),
      r.listAttempts(cert.id, 200),
    ]);
    return { sessions, reviews, records, domains, objectives, coverage, forecast, counts, attempts };
  }, [cert.id, now]);

  if (!data.data) return <Page title="Progress"><Loading /></Page>;
  const d = data.data;
  const series = dailySeries(d.sessions.map((s) => ({ at: s.startedAt, seconds: s.focusSec })), 14, now);
  const maxSec = Math.max(1, ...series.map((x) => x.seconds));
  const totalFocus = d.sessions.reduce((a, s) => a + s.focusSec, 0);
  const days = [...d.sessions.map((s) => dayKey(s.startedAt)), ...d.reviews.map((x) => dayKey(Number(x.reviewed_at))), ...d.records.map((x) => dayKey(x.at))];
  const streak = studyStreak(days, localDateIso(now));
  const objAcc = accuracyBy(d.records, (x) => x.objectiveIds);
  const domOf = new Map(d.objectives.map((o) => [o.id, o.domainId]));
  const domAcc = accuracyBy(d.records, (x) => [...new Set(x.objectiveIds.map((o) => domOf.get(o) ?? "none"))]);
  const covered = d.objectives.filter((o) => d.coverage.has(o.id)).length;
  const practiced = d.objectives.filter((o) => (objAcc.get(o.id)?.total ?? 0) > 0).length;
  const maxF = Math.max(1, ...d.forecast);
  const empty = d.sessions.length === 0 && d.reviews.length === 0 && d.records.length === 0;

  return (
    <Page title="Progress" subtitle="Study time and demonstrated knowledge are shown separately. Sample sizes are listed so small numbers aren't over-read.">
      {empty ? (
        <div className="card">
          <Empty icon="chart" title="No study activity yet">
            Complete a focus session, review flashcards, or take a quiz. Real progress appears here — nothing is estimated or invented.
          </Empty>
        </div>
      ) : null}
      <div className="stack lg">
        <section className="card" aria-labelledby="time-h">
          <h2 id="time-h">Study time</h2>
          <div className="row" style={{ gap: 32, marginBottom: 16 }}>
            <div className="stat">
              <b>{fmtMinutes(totalFocus)}</b>
              <span>focused in {d.sessions.length} sessions</span>
            </div>
            <div className="stat">
              <b>{streak.current}</b>
              <span>day streak (best {streak.longest})</span>
            </div>
          </div>
          <div className="bars" role="img" aria-label={`Focused minutes over the last 14 days: ${series.map((s) => `${s.day} ${Math.round(s.seconds / 60)} minutes`).join(", ")}`}>
            {series.map((s) => (
              <div key={s.day} className={s.seconds ? "" : "zero"} style={{ height: `${(s.seconds / maxSec) * 100}%` }} title={`${s.day}: ${Math.round(s.seconds / 60)} min`} />
            ))}
          </div>
          <div className="row between subtle">
            <span>{series[0].day}</span>
            <span>today</span>
          </div>
        </section>

        <section className="card" aria-labelledby="rev-h">
          <h2 id="rev-h">Review workload</h2>
          <div className="row" style={{ gap: 32, marginBottom: 16 }}>
            <div className="stat">
              <b>{d.counts.total}</b>
              <span>flashcards</span>
            </div>
            <div className="stat">
              <b>{d.counts.due}</b>
              <span>due now</span>
            </div>
            <div className="stat">
              <b>{d.reviews.length}</b>
              <span>reviews done</span>
            </div>
            <div className="stat">
              <b>{d.reviews.length ? Math.round((d.reviews.filter((r) => Number(r.rating) > 1).length / d.reviews.length) * 100) : 0}%</b>
              <span>recalled (not “Again”)</span>
            </div>
          </div>
          <div className="bars" style={{ height: 80 }} role="img" aria-label={`Cards due over the next 14 days: ${d.forecast.join(", ")}`}>
            {d.forecast.map((n, i) => (
              <div key={i} className={n ? "" : "zero"} style={{ height: `${(n / maxF) * 100}%`, background: "var(--accent)" }} title={`Day +${i}: ${n} due`} />
            ))}
          </div>
          <div className="subtle">Due cards over the next 14 days</div>
        </section>

        <section className="card" aria-labelledby="dom-h">
          <h2 id="dom-h">Quiz performance by domain</h2>
          {d.records.length === 0 ? (
            <p className="muted">No submitted quiz answers yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>All answers</th>
                  <th>First-time answers only</th>
                </tr>
              </thead>
              <tbody>
                {[...d.domains.map((x) => ({ id: x.id, name: x.name })), { id: "none", name: "Not tagged" }].map((dm) => {
                  const a = domAcc.get(dm.id);
                  if (!a) return null;
                  return (
                    <tr key={dm.id}>
                      <td>{dm.name}</td>
                      <td>
                        {Math.round((a.correct / a.total) * 100)}% <span className="subtle">({a.correct}/{a.total})</span>
                        {a.total < MIN_SAMPLE && <span className="badge" style={{ marginLeft: 6 }}>small sample</span>}
                      </td>
                      <td>{a.newTotal ? `${Math.round((a.newCorrect / a.newTotal) * 100)}% (${a.newCorrect}/${a.newTotal})` : <span className="subtle">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <p className="subtle">“First-time answers” excludes questions you had already seen, which tend to overstate readiness. {d.attempts.filter((a) => a.status === "submitted").length} quizzes submitted.</p>
        </section>

        <section className="card" aria-labelledby="cov-h">
          <h2 id="cov-h">Objective coverage</h2>
          {d.objectives.length === 0 ? (
            <p className="muted">Add exam objectives in Certification to track coverage.</p>
          ) : (
            <div className="stack">
              <div>
                {covered} of {d.objectives.length} objectives have linked material, notes, cards or questions.
                <Progress value={covered} max={d.objectives.length} label="Objectives with linked study items" />
              </div>
              <div>
                {practiced} of {d.objectives.length} objectives have quiz answers.
                <Progress value={practiced} max={d.objectives.length} label="Objectives practised" tone="amber" />
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Objective</th>
                    <th>Linked items</th>
                    <th>Quiz accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {d.objectives.map((o) => {
                    const c = d.coverage.get(o.id);
                    const a = objAcc.get(o.id);
                    return (
                      <tr key={o.id}>
                        <td>{objectiveLabel(o)}</td>
                        <td className="subtle">{c ? c.material + c.note + c.card + c.question : 0}</td>
                        <td>{a ? `${Math.round((a.correct / a.total) * 100)}% (${a.total})` : <span className="subtle">not practised</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
