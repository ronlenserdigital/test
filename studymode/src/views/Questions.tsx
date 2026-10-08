import { useState } from "react";
import { useLive, useServices, useAction } from "../state/hooks";
import { exportQuestions, parseQuestions } from "../domain/io";
import { validateQuestion } from "../domain/quiz";
import { uid } from "../data/repo";
import type { Choice, Id, Objective, Question, QuestionKind } from "../domain/types";
import { AiBadge, Button, ConfirmButton, Dialog, Empty, ErrorState, Field, IconButton, Loading, Notice, SampleBadge, downloadFile, pickFiles } from "../ui/components";
import { Page, RequireCert, SourceLink, ObjectivePicker, ObjectiveTags, useObjectives } from "./common";

const LETTERS = "ABCDEFGH";

export function QuestionEditor({ certId, initial, onClose }: { certId: Id; initial: Question | null; onClose: () => void }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const obj = useObjectives(certId);
  const [kind, setKind] = useState<QuestionKind>(initial?.kind ?? "single");
  const [stem, setStem] = useState(initial?.stem ?? "");
  const [choices, setChoices] = useState<Choice[]>(initial?.choices ?? ["a", "b", "c", "d"].map((id) => ({ id, text: "", explanation: "" })));
  const [correct, setCorrect] = useState<string[]>(initial?.correct ?? []);
  const [explanation, setExplanation] = useState(initial?.explanation ?? "");
  const [objIds, setObjIds] = useState<Id[]>(initial?.objectiveIds ?? []);
  const [errors, setErrors] = useState<string[]>([]);

  const toggleCorrect = (id: string) => {
    if (kind === "single") setCorrect([id]);
    else setCorrect(correct.includes(id) ? correct.filter((c) => c !== id) : [...correct, id]);
  };

  const save = () => {
    const filled = choices.filter((c) => c.text.trim());
    const q = { kind, stem, choices: filled, correct: correct.filter((c) => filled.some((f) => f.id === c)) };
    const errs = validateQuestion(q);
    setErrors(errs);
    if (errs.length) return;
    void run(async () => {
      await repo.saveQuestion({
        id: initial?.id ?? uid(),
        certId,
        ...q,
        explanation,
        materialId: initial?.materialId ?? null,
        sectionIdx: initial?.sectionIdx ?? null,
        sourceLabel: initial?.sourceLabel ?? "",
        sourceQuote: initial?.sourceQuote ?? "",
        origin: initial?.origin ?? "manual",
        isSample: initial?.isSample ?? false,
        objectiveIds: objIds,
      });
      onClose();
    }, "Question saved.");
  };

  return (
    <Dialog
      open
      onClose={onClose}
      wide
      title={initial ? "Edit question" : "New question"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={save}>
            Save question
          </Button>
        </>
      }
    >
      <div className="stack">
        {errors.length > 0 && (
          <Notice kind="error">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Notice>
        )}
        <div className="row" role="radiogroup" aria-label="Question type">
          {(["single", "multiple"] as const).map((k) => (
            <button
              key={k}
              className="chip-toggle"
              role="radio"
              aria-checked={kind === k}
              aria-pressed={kind === k}
              onClick={() => {
                setKind(k);
                if (k === "single") setCorrect(correct.slice(0, 1));
              }}
            >
              {k === "single" ? "Single answer" : "Multiple answers"}
            </button>
          ))}
        </div>
        <Field label="Question">
          <textarea className="textarea" rows={3} value={stem} onChange={(e) => setStem(e.target.value)} />
        </Field>
        <fieldset className="stack" style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 550, marginBottom: 8 }}>Choices — mark the correct {kind === "single" ? "answer" : "answers"}</legend>
          {choices.map((c, i) => (
            <div key={c.id} className="card flat tight stack" style={{ gap: 6 }}>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <input
                  type={kind === "single" ? "radio" : "checkbox"}
                  name="correct"
                  aria-label={`Choice ${LETTERS[i]} is correct`}
                  checked={correct.includes(c.id)}
                  onChange={() => toggleCorrect(c.id)}
                />
                <strong>{LETTERS[i]}</strong>
                <input className="input grow" aria-label={`Choice ${LETTERS[i]} text`} value={c.text} onChange={(e) => setChoices(choices.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))} />
                <IconButton size="sm" variant="ghost" icon="x" label={`Remove choice ${LETTERS[i]}`} disabled={choices.length <= 2} onClick={() => (setChoices(choices.filter((x) => x.id !== c.id)), setCorrect(correct.filter((x) => x !== c.id)))} />
              </div>
              <input
                className="input"
                placeholder={`Why ${LETTERS[i]} is ${correct.includes(c.id) ? "correct" : "incorrect"} (optional)`}
                aria-label={`Explanation for choice ${LETTERS[i]}`}
                value={c.explanation}
                onChange={(e) => setChoices(choices.map((x) => (x.id === c.id ? { ...x, explanation: e.target.value } : x)))}
              />
            </div>
          ))}
          <div>
            <Button size="sm" icon="plus" disabled={choices.length >= 8} onClick={() => setChoices([...choices, { id: uid().slice(0, 8), text: "", explanation: "" }])}>
              Add choice
            </Button>
          </div>
        </fieldset>
        <Field label="Explanation">
          <textarea className="textarea" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </Field>
        {initial?.sourceLabel && <SourceLink materialId={initial.materialId} sectionIdx={initial.sectionIdx} label={initial.sourceLabel} />}
        {obj.data && <ObjectivePicker domains={obj.data.domains} objectives={obj.data.objectives} value={objIds} onChange={setObjIds} />}
      </div>
    </Dialog>
  );
}

function ImportQuestions({ certId, objectives, onClose }: { certId: Id; objectives: Objective[]; onClose: () => void }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const [res, setRes] = useState<ReturnType<typeof parseQuestions> | null>(null);
  const byCode = new Map(objectives.filter((o) => o.code).map((o) => [o.code, o.id]));
  return (
    <Dialog
      open
      onClose={onClose}
      title="Import questions"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            busy={busy}
            disabled={!res?.items.length}
            onClick={() =>
              void run(async () => {
                await repo.saveQuestions(
                  res!.items.map((d) => ({
                    id: uid(),
                    certId,
                    kind: d.kind,
                    stem: d.stem,
                    choices: d.choices,
                    correct: d.correct,
                    explanation: d.explanation,
                    materialId: null,
                    sectionIdx: null,
                    sourceLabel: d.sourceLabel,
                    sourceQuote: "",
                    origin: "import",
                    isSample: false,
                    objectiveIds: d.objectiveCode.split(";").map((c) => byCode.get(c.trim())).filter((x): x is string => !!x),
                  })),
                );
                onClose();
              }, `Imported ${res?.items.length} questions.`)
            }
          >
            Import {res?.items.length ?? 0}
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">
          CSV headers: <code>stem, type, a, b, c, d, e, f, correct, explanation, why_a … why_f, objective, source</code>. <code>correct</code> uses letters such as “B” or “A;C”. <code>objective</code> matches your objective codes. JSON uses <code>{"{"}stem, type, choices: [{"{"}text, correct, explanation{"}"}], explanation, objective, source{"}"}</code>.
        </p>
        <Button
          onClick={async () => {
            const [f] = await pickFiles(".csv,.json");
            if (f) setRes(parseQuestions(await f.text(), f.name.toLowerCase().endsWith(".json") ? "json" : "csv"));
          }}
        >
          Choose file…
        </Button>
        {res && <p>{res.items.length} valid question(s).</p>}
        {res?.errors.length ? (
          <Notice kind="warn">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {res.errors.slice(0, 10).map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Notice>
        ) : null}
      </div>
    </Dialog>
  );
}

export function QuestionsView() {
  return <RequireCert title="Question bank">{(cert) => <QuestionsInner certId={cert.id} />}</RequireCert>;
}

function QuestionsInner({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const qs = useLive((r) => r.listQuestions(certId), [certId]);
  const obj = useObjectives(certId);
  const [editing, setEditing] = useState<Question | "new" | null>(null);
  const [importing, setImporting] = useState(false);
  const [filter, setFilter] = useState("");
  const code = (id: string) => obj.data?.objectives.find((o) => o.id === id)?.code ?? "";
  const list = (qs.data ?? []).filter((q) => !filter || q.stem.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Page
      title="Question bank"
      subtitle="Your own practice questions. Imported or AI-drafted questions are never official exam content."
      actions={
        <>
          <Button variant="primary" icon="plus" onClick={() => setEditing("new")}>
            New question
          </Button>
          <Button icon="upload" onClick={() => setImporting(true)}>
            Import
          </Button>
          <Button icon="download" disabled={!qs.data?.length} onClick={() => downloadFile("questions.csv", exportQuestions(qs.data!, code, "csv"), "text/csv")}>
            CSV
          </Button>
          <Button icon="download" disabled={!qs.data?.length} onClick={() => downloadFile("questions.json", exportQuestions(qs.data!, code, "json"), "application/json")}>
            JSON
          </Button>
        </>
      }
    >
      <div className="stack">
        <input className="input" type="search" placeholder="Search questions" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Search questions" />
        {qs.error ? (
          <ErrorState error={qs.error} onRetry={qs.reload} />
        ) : !qs.data ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty icon="quiz" title="No questions yet">
            Write questions, import a CSV/JSON file, or draft them from selected text with optional AI assistance.
          </Empty>
        ) : (
          <ul className="list card" style={{ padding: "0 16px" }}>
            {list.map((q) => (
              <li key={q.id} className="row" style={{ alignItems: "flex-start" }}>
                <div className="grow stack" style={{ gap: 4 }}>
                  <strong>{q.stem}</strong>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="badge">{q.kind === "single" ? "Single" : `Multiple (${q.correct.length})`}</span>
                    {q.origin === "ai" && <AiBadge />}
                    {q.isSample && <SampleBadge />}
                    {obj.data && <ObjectiveTags ids={q.objectiveIds} objectives={obj.data.objectives} />}
                    {q.sourceLabel && <SourceLink materialId={q.materialId} sectionIdx={q.sectionIdx} label={q.sourceLabel} />}
                  </div>
                </div>
                <IconButton size="sm" variant="ghost" icon="edit" label="Edit question" onClick={() => setEditing(q)} />
                <ConfirmButton size="sm" variant="ghost" label="Delete" confirmLabel="Delete this question and its answer history" onConfirm={() => void repo.deleteQuestion(q.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && <QuestionEditor certId={certId} initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
      {importing && obj.data && <ImportQuestions certId={certId} objectives={obj.data.objectives} onClose={() => setImporting(false)} />}
    </Page>
  );
}
