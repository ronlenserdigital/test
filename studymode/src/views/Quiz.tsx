import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useLive, useNow, useServices, useAction } from "../state/hooks";
import { accuracyBy } from "../domain/analytics";
import { percent, scoreAnswer } from "../domain/quiz";
import { formatClock } from "../domain/timer";
import type { AttemptItem, Id, MultiScoring, Question, QuizAttempt, QuizConfig, QuizKind, QuizMode } from "../domain/types";
import { AiBadge, Button, ConfirmButton, Dialog, Empty, ErrorState, Field, Loading, Notice, Progress, SampleBadge, Toggle, fmtDateTime } from "../ui/components";
import { Icon } from "../ui/icons";
import { Page, RequireCert, SourceLink, objectiveLabel, useObjectives } from "./common";

const LETTERS = "ABCDEFGH";

export function QuizView({ attemptId }: { attemptId?: string }) {
  return <RequireCert title="Practice">{(cert) => (attemptId ? <Runner attemptId={attemptId} /> : <Setup certId={cert.id} />)}</RequireCert>;
}

const KIND_INFO: Record<QuizKind, { title: string; detail: string }> = {
  quick: { title: "Quick quiz", detail: "A short mixed set, new questions first." },
  weak: { title: "Weak topics", detail: "Targets objectives where you score lowest and questions you missed." },
  exam: { title: "Practice exam", detail: "Timed, feedback after you submit." },
  review: { title: "Mistake review", detail: "Retry missed and flagged questions." },
};

function Setup({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const { run, busy } = useAction();
  const preset = (sessionStorage.getItem("quizPreset") as QuizKind | null) ?? "quick";
  const [kind, setKind] = useState<QuizKind>(preset);
  const [mode, setMode] = useState<QuizMode>(preset === "exam" ? "exam" : "study");
  const [count, setCount] = useState(preset === "exam" ? 40 : 10);
  const [minutes, setMinutes] = useState(60);
  const [timed, setTimed] = useState(true);
  const [shuffle, setShuffle] = useState(true);
  const [scoring, setScoring] = useState<MultiScoring>("all_or_nothing");
  const [weights, setWeights] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const info = useLive(async (r) => {
    const [qs, domains, queue, inProgress, attempts] = await Promise.all([r.listQuestions(certId), r.listDomains(certId), r.reviewQueueEntries(certId), r.inProgressAttempt(certId), r.listAttempts(certId, 10)]);
    return { total: qs.length, domains, queue: queue.length, inProgress, attempts };
  }, [certId]);
  useEffect(() => sessionStorage.removeItem("quizPreset"), []);

  if (!info.data) return <Page title="Practice"><Loading /></Page>;
  const d = info.data;
  const weightsOk = d.domains.length > 0 && d.domains.every((x) => x.weight != null && x.weight > 0);

  const start = () =>
    void run(async () => {
      const config: QuizConfig = {
        kind,
        mode: kind === "exam" ? "exam" : mode,
        count,
        minutes: kind === "exam" && timed ? minutes : null,
        shuffleChoices: shuffle,
        multiScoring: scoring,
        useDomainWeights: weights && weightsOk,
      };
      const records = await repo.answerRecords(certId);
      const acc = accuracyBy(records, (x) => x.objectiveIds);
      const res = await repo.createAttempt(certId, config, Date.now(), acc);
      setWarnings(res.warnings);
      if (res.attemptId) navigate({ view: "quiz", attemptId: res.attemptId });
    });

  return (
    <Page title="Practice" subtitle={`${d.total} question${d.total === 1 ? "" : "s"} in your bank · practice only, not official exam content`}>
      <div className="stack lg" style={{ maxWidth: 820 }}>
        {d.inProgress && (
          <Notice kind="info">
            <div className="row between">
              <span>
                You have an unfinished {KIND_INFO[d.inProgress.kind].title.toLowerCase()} from {fmtDateTime(d.inProgress.startedAt)}.
              </span>
              <div className="row">
                <Button size="sm" variant="primary" onClick={() => navigate({ view: "quiz", attemptId: d.inProgress!.id })}>
                  Resume
                </Button>
                <Button size="sm" onClick={() => void repo.abandonAttempt(d.inProgress!.id)}>
                  Discard
                </Button>
              </div>
            </div>
          </Notice>
        )}
        {d.total === 0 ? (
          <Empty icon="quiz" title="No practice questions yet" action={<Button variant="primary" onClick={() => navigate({ view: "questions" })}>Add questions</Button>}>
            Add your own questions or import a question file to start practising.
          </Empty>
        ) : (
          <div className="card stack">
            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }} role="radiogroup" aria-label="Quiz type">
              {(Object.keys(KIND_INFO) as QuizKind[]).map((k) => (
                <button
                  key={k}
                  role="radio"
                  aria-checked={kind === k}
                  className="choice"
                  style={{ flexDirection: "column", gap: 4 }}
                  onClick={() => {
                    setKind(k);
                    if (k === "exam") {
                      setMode("exam");
                      setCount(Math.min(40, Math.max(10, d.total)));
                    } else if (mode === "exam") setMode("study");
                  }}
                  disabled={k === "review" && d.queue === 0}
                >
                  <strong>{KIND_INFO[k].title}</strong>
                  <span className="subtle">{k === "review" ? `${d.queue} in queue` : KIND_INFO[k].detail}</span>
                </button>
              ))}
            </div>
            <div className="form-grid">
              <Field label="Number of questions" hint={count > d.total ? `Only ${d.total} available.` : undefined}>
                <input className="input" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              {kind !== "exam" ? (
                <Field label="Feedback">
                  <select className="select" value={mode} onChange={(e) => setMode(e.target.value as QuizMode)}>
                    <option value="study">Study mode — explain each answer immediately</option>
                    <option value="exam">Exam mode — feedback after submitting</option>
                  </select>
                </Field>
              ) : (
                <Field label="Time limit (minutes)">
                  <input className="input" type="number" min={1} max={600} value={minutes} disabled={!timed} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value) || 1))} />
                </Field>
              )}
              <Field label="Multiple-answer scoring" hint={scoring === "all_or_nothing" ? "Full credit only when every correct choice and no wrong choice is selected." : "(correct picks − wrong picks) ÷ correct choices, never below 0."}>
                <select className="select" value={scoring} onChange={(e) => setScoring(e.target.value as MultiScoring)}>
                  <option value="all_or_nothing">All or nothing</option>
                  <option value="partial">Partial credit</option>
                </select>
              </Field>
            </div>
            <div className="stack" style={{ gap: 10 }}>
              {kind === "exam" && <Toggle label="Timed" checked={timed} onChange={setTimed} />}
              <Toggle label="Shuffle answer choices" checked={shuffle} onChange={setShuffle} />
              <Toggle
                label="Follow domain weights"
                checked={weights && weightsOk}
                disabled={!weightsOk || kind === "review"}
                onChange={setWeights}
                description={weightsOk ? "Uses the weights you entered; falls back with a warning if a domain lacks tagged questions." : "Unavailable until every domain has a weight from your source."}
              />
            </div>
            {warnings.length > 0 && <Notice kind="warn">{warnings.join(" ")}</Notice>}
            <Button variant="primary" size="lg" busy={busy} onClick={start}>
              Start {KIND_INFO[kind].title.toLowerCase()}
            </Button>
          </div>
        )}
        {d.attempts.filter((a) => a.status === "submitted").length > 0 && (
          <div className="card">
            <h2>Recent results</h2>
            <ul className="list">
              {d.attempts
                .filter((a) => a.status === "submitted")
                .map((a) => (
                  <li key={a.id} className="row">
                    <div className="grow">
                      <strong>{KIND_INFO[a.kind].title}</strong> <span className="subtle">· {fmtDateTime(a.startedAt)} · {a.mode} mode</span>
                    </div>
                    <span className="badge">
                      {percent(a.score ?? 0, a.maxScore ?? 0)}% ({(a.score ?? 0).toFixed(a.score && a.score % 1 ? 1 : 0)}/{a.maxScore})
                    </span>
                    <Button size="sm" onClick={() => navigate({ view: "results", attemptId: a.id })}>
                      Review
                    </Button>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </Page>
  );
}

function ChoiceList({ q, item, mode, onChange, reveal, locked }: { q: Question; item: AttemptItem; mode: QuizMode; onChange: (sel: string[]) => void; reveal: boolean; locked: boolean }) {
  const byId = new Map(q.choices.map((c) => [c.id, c]));
  const order = item.choiceOrder.filter((id) => byId.has(id));
  const multi = q.kind === "multiple";
  const toggle = (id: string) => {
    if (locked) return;
    if (!multi) onChange([id]);
    else onChange(item.selected.includes(id) ? item.selected.filter((x) => x !== id) : [...item.selected, id]);
  };
  return (
    <div className="stack" role={multi ? "group" : "radiogroup"} aria-label="Answer choices">
      {order.map((id, i) => {
        const c = byId.get(id)!;
        const sel = item.selected.includes(id);
        const isCorrect = q.correct.includes(id);
        const cls = reveal ? (isCorrect ? "correct" : sel ? "wrong" : "") : "";
        return (
          <div key={id}>
            <button className={`choice ${cls}`} role={multi ? "checkbox" : "radio"} aria-checked={sel} data-multi={multi} disabled={locked} onClick={() => toggle(id)}>
              <span className="letter" aria-hidden>
                {LETTERS[i]}
              </span>
              <span className="grow">{c.text}</span>
              {reveal && isCorrect && <span className="badge green">Correct</span>}
              {reveal && sel && !isCorrect && <span className="badge red">Your answer</span>}
            </button>
            {reveal && c.explanation && (sel || isCorrect) && (
              <p className="subtle" style={{ margin: "4px 0 0 42px" }}>
                {isCorrect ? "Why it's correct: " : "Why it's wrong: "}
                {c.explanation}
              </p>
            )}
          </div>
        );
      })}
      {reveal && mode === "study" && null}
    </div>
  );
}

function Explanation({ q }: { q: Question }) {
  const others = q.choices.filter((c) => !q.correct.includes(c.id) && c.explanation);
  return (
    <div className="card flat tight stack" style={{ gap: 6 }}>
      {q.explanation ? <div className="pre-wrap">{q.explanation}</div> : <span className="subtle">No explanation was written for this question.</span>}
      {others.length > 0 && (
        <details>
          <summary>Why the other choices are wrong</summary>
          <ul>
            {others.map((c) => (
              <li key={c.id}>
                <strong>{c.text}</strong> — {c.explanation}
              </li>
            ))}
          </ul>
        </details>
      )}
      <div className="row" style={{ gap: 6 }}>
        {q.origin === "ai" && <AiBadge />}
        {q.isSample && <SampleBadge />}
        {q.sourceLabel && <SourceLink materialId={q.materialId} sectionIdx={q.sectionIdx} label={q.sourceLabel} />}
      </div>
    </div>
  );
}

function Runner({ attemptId }: { attemptId: Id }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const toast = useApp((s) => s.toast);
  const data = useLive((r) => r.getAttempt(attemptId), [attemptId]);
  const [pos, setPos] = useState(0);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [confirm, setConfirm] = useState(false);
  const now = useNow(1000);
  const submitting = useRef(false);

  const attempt = data.data?.attempt;
  const items = data.data?.items ?? [];
  const item = items[pos];
  const q = item ? data.data!.questions.get(item.questionId) : undefined;

  const submit = async () => {
    if (submitting.current) return;
    submitting.current = true;
    await repo.submitAttempt(attemptId, Date.now());
    navigate({ view: "results", attemptId });
  };

  // Auto-submit at the deadline (deadline-based, so it survives restarts).
  useEffect(() => {
    if (attempt?.status === "in_progress" && attempt.deadlineAt && now >= attempt.deadlineAt) {
      toast("Time is up — your exam was submitted.", "info", true);
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, attempt?.deadlineAt, attempt?.status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!item || !q || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const n = Number(e.key);
      if (n >= 1 && n <= item.choiceOrder.length) {
        const id = item.choiceOrder[n - 1];
        const cur = draft[item.id] ?? item.selected;
        select(q.kind === "single" ? [id] : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
      } else if (e.key === "ArrowRight") setPos((p) => Math.min(items.length - 1, p + 1));
      else if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 1));
      else if (e.key.toLowerCase() === "f") void repo.flagItem(item.id, !item.flagged);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (data.error) return <Page title="Practice"><ErrorState error={data.error} /></Page>;
  if (!data.data) return <Page title="Practice"><Loading /></Page>;
  if (!attempt) return <Page title="Practice"><Empty title="Quiz not found" /></Page>;
  if (attempt.status !== "in_progress") {
    return (
      <Page title="Practice">
        <Empty title="This quiz is finished" action={<Button variant="primary" onClick={() => navigate({ view: "results", attemptId })}>See results</Button>} />
      </Page>
    );
  }
  if (!item || !q) return <Page title="Practice"><Empty title="Question missing">It may have been deleted from your bank.</Empty></Page>;

  const study = attempt.mode === "study";
  const answered = item.answeredAt != null;
  const reveal = study && answered;
  const current: AttemptItem = { ...item, selected: draft[item.id] ?? item.selected };
  function select(sel: string[]) {
    if (study && answered) return;
    setDraft((d) => ({ ...d, [item.id]: sel }));
    if (!study) void repo.answerItem(attemptId, item.id, sel, Date.now()); // exam mode: autosave
  }
  const remainingMs = attempt.deadlineAt ? attempt.deadlineAt - now : null;
  const unanswered = items.filter((i) => (draft[i.id] ?? i.selected).length === 0).length;
  const result = reveal ? scoreAnswer(q, item.selected, attempt.config.multiScoring) : null;

  return (
    <Page
      title={`${KIND_INFO[attempt.kind].title}`}
      subtitle={`${study ? "Study mode" : "Exam mode"} · practice questions, not official exam content`}
      actions={
        <>
          {remainingMs != null && (
            <span className={`badge ${remainingMs < 5 * 60_000 ? "red" : "blue"}`} role="timer" aria-label={`${formatClock(Math.max(0, remainingMs))} remaining`} style={{ fontSize: "1rem", padding: "4px 12px" }}>
              <Icon name="timer" style={{ width: 16, height: 16 }} /> {formatClock(Math.max(0, remainingMs))}
            </span>
          )}
          <Button variant="primary" onClick={() => setConfirm(true)}>
            Submit
          </Button>
        </>
      }
    >
      <div className="stack lg" style={{ maxWidth: 860 }}>
        {attempt.warnings.length > 0 && pos === 0 && <Notice kind="warn">{attempt.warnings.join(" ")}</Notice>}
        <Progress value={items.filter((i) => (draft[i.id] ?? i.selected).length).length} max={items.length} label="Answered" />
        <nav className="qnav" aria-label="Questions">
          {items.map((it, i) => {
            const sel = draft[it.id] ?? it.selected;
            const cls = [i === pos ? "current" : "", sel.length ? "answered" : "", it.flagged ? "flagged" : "", study && it.isCorrect === true ? "correct" : "", study && it.isCorrect === false ? "wrong" : ""].join(" ");
            return (
              <button key={it.id} className={cls} onClick={() => setPos(i)} aria-label={`Question ${i + 1}${sel.length ? ", answered" : ""}${it.flagged ? ", flagged" : ""}`} aria-current={i === pos ? "step" : undefined}>
                {i + 1}
              </button>
            );
          })}
        </nav>
        <article className="card stack" aria-labelledby="q-stem">
          <div className="row between">
            <span className="subtle">
              Question {pos + 1} of {items.length}
              {q.kind === "multiple" ? ` · choose ${q.correct.length}` : ""}
              {item.seenBefore ? " · seen before" : ""}
            </span>
            <Button size="sm" variant={item.flagged ? "accent" : "ghost"} icon="flag" aria-pressed={item.flagged} onClick={() => void repo.flagItem(item.id, !item.flagged)}>
              {item.flagged ? "Flagged" : "Flag for review"}
            </Button>
          </div>
          <h2 id="q-stem" className="pre-wrap" style={{ fontWeight: 550 }}>
            {q.stem}
          </h2>
          <ChoiceList q={q} item={reveal ? item : current} mode={attempt.mode} onChange={select} reveal={reveal} locked={study && answered} />
          {study && !answered && (
            <div>
              <Button variant="primary" disabled={!current.selected.length} onClick={async () => void (await repo.answerItem(attemptId, item.id, current.selected, Date.now()))}>
                Check answer
              </Button>
            </div>
          )}
          {reveal && result && (
            <div className="stack" aria-live="polite">
              <Notice kind={result.isCorrect ? "info" : "warn"} icon={result.isCorrect ? "check" : "alert"}>
                <strong>{result.isCorrect ? "Correct." : q.kind === "multiple" && result.score > 0 ? `Partly correct (${Math.round(result.score * 100)}% credit).` : "Not quite."}</strong>
                {q.kind === "multiple" && !result.isCorrect && ` You chose ${result.correctSelected} of ${q.correct.length} correct answers${result.incorrectSelected ? ` and ${result.incorrectSelected} incorrect` : ""}.`}
              </Notice>
              <Explanation q={q} />
            </div>
          )}
        </article>
        <div className="row between">
          <Button icon="arrowLeft" disabled={pos === 0} onClick={() => setPos(pos - 1)}>
            Previous
          </Button>
          {pos < items.length - 1 ? (
            <Button variant={reveal ? "primary" : "default"} onClick={() => setPos(pos + 1)}>
              Next <Icon name="arrowRight" />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setConfirm(true)}>
              Finish
            </Button>
          )}
        </div>
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Submit quiz?"
        footer={
          <>
            <Button onClick={() => setConfirm(false)}>Keep working</Button>
            <Button variant="primary" onClick={() => void submit()}>
              Submit
            </Button>
          </>
        }
      >
        <p>{unanswered ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered and will be scored as incorrect.` : "All questions answered."}</p>
        {items.some((i) => i.flagged) && <p className="subtle">Flagged questions will be added to your mistake review queue.</p>}
      </Dialog>
    </Page>
  );
}

export function ResultsView({ attemptId }: { attemptId: Id }) {
  return <RequireCert title="Results">{(cert) => <ResultsInner attemptId={attemptId} certId={cert.id} />}</RequireCert>;
}

function ResultsInner({ attemptId, certId }: { attemptId: Id; certId: Id }) {
  const navigate = useApp((s) => s.navigate);
  const data = useLive((r) => r.getAttempt(attemptId), [attemptId]);
  const obj = useObjectives(certId);
  const [onlyWrong, setOnlyWrong] = useState(false);
  if (!data.data || !obj.data) return <Page title="Results"><Loading /></Page>;
  const { attempt, items, questions } = data.data;
  if (attempt.status !== "submitted") return <Page title="Results"><Empty title="Not submitted yet" action={<Button onClick={() => navigate({ view: "quiz", attemptId })}>Back to quiz</Button>} /></Page>;
  const pct = percent(attempt.score ?? 0, attempt.maxScore ?? 0);
  // Breakdown by domain with sample sizes and new vs repeated.
  const objToDomain = new Map(obj.data.objectives.map((o) => [o.id, o.domainId]));
  const domName = new Map(obj.data.domains.map((d) => [d.id, d.name]));
  const rows = new Map<string, { correct: number; total: number; repeated: number }>();
  for (const it of items) {
    const q = questions.get(it.questionId);
    if (!q) continue;
    const doms = [...new Set(q.objectiveIds.map((o) => objToDomain.get(o) ?? null))];
    for (const d of doms.length ? doms : [null]) {
      const k = d ? domName.get(d) ?? "Unassigned" : "Not tagged";
      const r = rows.get(k) ?? { correct: 0, total: 0, repeated: 0 };
      r.total++;
      if (it.isCorrect) r.correct++;
      if (it.seenBefore) r.repeated++;
      rows.set(k, r);
    }
  }
  const repeated = items.filter((i) => i.seenBefore).length;
  return (
    <Page
      title="Results"
      subtitle={`${KIND_INFO[attempt.kind].title} · ${fmtDateTime(attempt.startedAt)}`}
      actions={
        <>
          <Button onClick={() => navigate({ view: "mistakes" })}>Mistake queue</Button>
          <Button variant="primary" onClick={() => navigate({ view: "quiz" })}>
            New quiz
          </Button>
        </>
      }
    >
      <div className="stack lg" style={{ maxWidth: 900 }}>
        <div className="card row" style={{ gap: 32 }}>
          <div className="stat">
            <b style={{ fontSize: "2.4rem" }}>{pct}%</b>
            <span>
              {(attempt.score ?? 0).toFixed(attempt.score && attempt.score % 1 ? 1 : 0)} of {attempt.maxScore} points
            </span>
          </div>
          <div className="stat">
            <b>{items.length - repeated}</b>
            <span>new questions</span>
          </div>
          <div className="stat">
            <b>{repeated}</b>
            <span>repeated questions</span>
          </div>
          <p className="subtle grow" style={{ margin: 0 }}>
            Practice scores show how you did on these questions. They are not a prediction of your exam result.
          </p>
        </div>
        {attempt.warnings.length > 0 && <Notice kind="warn">{attempt.warnings.join(" ")}</Notice>}
        <div className="card">
          <h2>By domain</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Score</th>
                <th>Sample</th>
              </tr>
            </thead>
            <tbody>
              {[...rows.entries()].map(([k, r]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{percent(r.correct, r.total)}%</td>
                  <td className="subtle">
                    {r.correct}/{r.total} correct{r.repeated ? ` · ${r.repeated} repeated` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="row between">
          <h2 style={{ margin: 0 }}>Questions</h2>
          <Toggle label="Only show mistakes" checked={onlyWrong} onChange={setOnlyWrong} />
        </div>
        {items
          .filter((i) => !onlyWrong || !i.isCorrect)
          .map((it) => {
            const q = questions.get(it.questionId);
            if (!q) return null;
            return (
              <article key={it.id} className="card stack">
                <div className="row between">
                  <span className="subtle">
                    Question {it.position + 1}
                    {it.flagged ? " · flagged" : ""}
                    {it.seenBefore ? " · repeated" : ""}
                  </span>
                  <span className={`badge ${it.isCorrect ? "green" : "red"}`}>{it.isCorrect ? "Correct" : it.score && it.score > 0 ? `Partial (${Math.round(it.score * 100)}%)` : "Incorrect"}</span>
                </div>
                <h3 className="pre-wrap">{q.stem}</h3>
                <ChoiceList q={q} item={it} mode="exam" onChange={() => undefined} reveal locked />
                {q.objectiveIds.length > 0 && <div className="subtle">Objectives: {q.objectiveIds.map((id) => obj.data!.objectives.find((o) => o.id === id)).filter(Boolean).map((o) => objectiveLabel(o!)).join("; ")}</div>}
                <Explanation q={q} />
              </article>
            );
          })}
      </div>
    </Page>
  );
}

export function MistakesView() {
  return <RequireCert title="Mistakes">{(cert) => <MistakesInner certId={cert.id} />}</RequireCert>;
}

function MistakesInner({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const data = useLive(async (r) => {
    const entries = await r.reviewQueueEntries(certId);
    const qs = await r.getQuestions(entries.map((e) => e.questionId));
    return entries.map((e) => ({ e, q: qs.get(e.questionId) })).filter((x) => x.q) as { e: (typeof entries)[number]; q: Question }[];
  }, [certId]);
  return (
    <Page
      title="Mistake review"
      subtitle="Missed and flagged questions. Answer them correctly in a mistake review quiz to clear them."
      actions={
        <Button variant="primary" disabled={!data.data?.length} onClick={() => (sessionStorage.setItem("quizPreset", "review"), navigate({ view: "quiz" }))}>
          Retry mistakes
        </Button>
      }
    >
      {!data.data ? (
        <Loading />
      ) : data.data.length === 0 ? (
        <Empty icon="check" title="No mistakes waiting">
          Questions you miss or flag in quizzes will appear here.
        </Empty>
      ) : (
        <ul className="list card" style={{ padding: "0 16px" }}>
          {data.data.map(({ e, q }) => (
            <li key={e.questionId} className="row" style={{ alignItems: "flex-start" }}>
              <span className={`badge ${e.reason === "missed" ? "red" : "amber"}`}>{e.reason === "missed" ? "Missed" : "Flagged"}</span>
              <div className="grow stack" style={{ gap: 4 }}>
                <strong>{q.stem}</strong>
                <span className="subtle">Added {fmtDateTime(e.addedAt)}</span>
                <details>
                  <summary>Show answer</summary>
                  <p>
                    <strong>Correct:</strong> {q.choices.filter((c) => q.correct.includes(c.id)).map((c) => c.text).join("; ")}
                  </p>
                  <Explanation q={q} />
                </details>
              </div>
              {e.lastAttemptId && (
                <Button size="sm" variant="ghost" onClick={() => navigate({ view: "results", attemptId: e.lastAttemptId! })}>
                  Attempt
                </Button>
              )}
              <ConfirmButton size="sm" variant="ghost" label="Remove" confirmLabel="Remove this question from the mistake queue" onConfirm={() => void repo.resolveMistake(q.id)} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}

export type { QuizAttempt };
