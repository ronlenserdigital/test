/**
 * Optional AI study assistance UI. Every request shows exactly what will
 * leave the device, the destination, and an estimated cost, and only runs
 * after the user presses Send. Generated items are drafts the user reviews
 * and edits before saving; saved items are labelled AI-generated.
 */
import { useEffect, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useServices } from "../state/hooks";
import { AiError, estimateCost, type AiRequest } from "../ai/provider";
import { askRequest, cardsRequest, explainRequest, questionsRequest, validateCards, validateQuestions, type DraftCard, type DraftQuestion } from "../ai/tasks";
import { citations, retrieve, type Passage } from "../ai/retrieval";
import type { Id, Material, MaterialSection } from "../domain/types";
import { AiBadge, Button, Dialog, Field, Notice, Unavailable } from "../ui/components";
import { uid } from "../data/repo";
import { excerpt } from "../domain/text";
import { SourceLink } from "./common";

export function useAi() {
  const prefs = useApp((s) => s.prefs.ai);
  const { ai, native } = useServices();
  const [configured, setConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    void ai.isConfigured().then((v) => live && setConfigured(v));
    return () => {
      live = false;
    };
  }, [ai, prefs.enabled]);
  let reason = "";
  if (!native) reason = "AI assistance is available in the desktop app, which can store your API key securely.";
  else if (!prefs.enabled) reason = "AI assistance is turned off. Enable it in Settings → AI assistance.";
  else if (!prefs.consented) reason = "Review and accept the data notice in Settings → AI assistance first.";
  else if (configured === false) reason = "Add an API key in Settings → AI assistance.";
  return { ready: native && prefs.enabled && prefs.consented && configured === true, reason, model: prefs.model };
}

function errorText(e: unknown): string {
  if (e instanceof AiError) return e.message;
  return `The AI request failed: ${(e as Error)?.message ?? String(e)}`;
}

/** Consent + run + cancel wrapper around one AI request. */
function AiRun<T>({
  request,
  outgoing,
  onResult,
  parse,
  children,
}: {
  request: AiRequest;
  outgoing: { label: string; text: string }[];
  parse: (text: string) => T;
  onResult: (r: T, raw: string) => void;
  children?: React.ReactNode;
}) {
  const { ai } = useServices();
  const model = useApp((s) => s.prefs.ai.model);
  const m = ai.models.find((x) => x.id === model) ?? ai.models[0];
  const [state, setState] = useState<"preview" | "running" | "done" | "error">("preview");
  const [error, setError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);
  const chars = request.system.length + request.messages.reduce((a, x) => a + x.content.length, 0);
  const cost = estimateCost(chars, request.maxTokens, m);

  useEffect(() => () => ctrl.current?.abort(), []);

  const send = async () => {
    setState("running");
    setError(null);
    const ac = new AbortController();
    ctrl.current = ac;
    try {
      const r = await ai.complete(request, m.id, ac.signal);
      const parsed = parse(r.text);
      onResult(parsed, r.text);
      setState("done");
    } catch (e) {
      if (e instanceof AiError && e.kind === "cancelled") {
        setState("preview");
        return;
      }
      setError(errorText(e));
      setState("error");
    }
  };

  if (state === "done") return <>{children}</>;
  return (
    <div className="stack">
      <Notice kind="info" icon="shield">
        <strong>This will send study text to {ai.destination}.</strong>
        <div className="subtle">
          Model: {m.label}. About {cost.inputTokens.toLocaleString()} input tokens; estimated cost ${cost.lowUsd.toFixed(4)}–${cost.highUsd.toFixed(4)} billed to your API account. Nothing is sent until you press Send.
        </div>
      </Notice>
      <details>
        <summary>Show exactly what will be sent ({chars.toLocaleString()} characters)</summary>
        <div className="stack" style={{ marginTop: 8 }}>
          {outgoing.map((o, i) => (
            <div key={i}>
              <div className="subtle">{o.label}</div>
              <blockquote className="quote pre-wrap" style={{ maxHeight: 160, overflowY: "auto" }}>
                {o.text}
              </blockquote>
            </div>
          ))}
        </div>
      </details>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="row">
        {state === "running" ? (
          <>
            <span className="spinner" aria-hidden /> <span className="muted">Waiting for the AI provider…</span>
            <Button onClick={() => ctrl.current?.abort()}>Cancel</Button>
          </>
        ) : (
          <Button variant="primary" icon="sparkle" onClick={() => void send()}>
            {state === "error" ? "Try again" : "Send"}
          </Button>
        )}
      </div>
    </div>
  );
}

function contextPassage(material: Material, section: MaterialSection, selection: string): Passage {
  // Send the selection plus nearby context (not the whole document).
  const at = section.text.indexOf(selection.slice(0, 40));
  const start = Math.max(0, (at < 0 ? 0 : at) - 1200);
  const text = section.text.slice(start, start + Math.max(2400, selection.length + 1200));
  return { ref: "S1", materialId: material.id, materialTitle: material.title, sectionIdx: section.idx, label: section.label, text };
}

export function ExplainDialog({ certId, selection, material, section, onClose }: { certId: Id; selection: string; material: Material; section: MaterialSection; onClose: () => void }) {
  const { repo } = useServices();
  const toast = useApp((s) => s.toast);
  const passage = contextPassage(material, section, selection);
  const [answer, setAnswer] = useState("");
  return (
    <Dialog open onClose={onClose} title="Explain in plain English" wide>
      <AiRun request={explainRequest(selection, passage)} outgoing={[{ label: `${material.title} · ${section.label} (context)`, text: passage.text }]} parse={(t) => t} onResult={(t) => setAnswer(t)}>
        <div className="stack">
          <AiBadge />
          <div className="pre-wrap">{answer}</div>
          <SourceLink materialId={material.id} sectionIdx={section.idx} label={`${material.title} · ${section.label}`} />
          <div className="row">
            <Button
              variant="primary"
              onClick={async () => {
                await repo.saveNote({ certId, materialId: material.id, sectionIdx: section.idx, sourceLabel: `${material.title} · ${section.label}`, quote: selection, body: answer, origin: "ai", objectiveIds: [] });
                toast("Saved as an AI-labelled note.", "success");
                onClose();
              }}
            >
              Save as note
            </Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </AiRun>
    </Dialog>
  );
}

export function DraftCardsDialog({ certId, selection, material, section, onClose }: { certId: Id; selection: string; material: Material; section: MaterialSection; onClose: () => void }) {
  const { repo } = useServices();
  const toast = useApp((s) => s.toast);
  const passage = contextPassage(material, section, selection);
  const [drafts, setDrafts] = useState<(DraftCard & { keep: boolean })[]>([]);
  const label = `${material.title} · ${section.label}`;
  return (
    <Dialog open onClose={onClose} title="Draft flashcards" wide>
      <AiRun request={cardsRequest(selection, passage, 5)} outgoing={[{ label: `${label} (context)`, text: passage.text }]} parse={validateCards} onResult={(r) => setDrafts(r.map((d) => ({ ...d, keep: true })))}>
        <div className="stack">
          <p className="muted">
            Review and edit these drafts. Only checked cards are saved, labelled <AiBadge /> with a link to {label}.
          </p>
          {drafts.map((d, i) => (
            <div key={i} className="card flat tight stack">
              <label className="row">
                <input type="checkbox" checked={d.keep} onChange={(e) => setDrafts(drafts.map((x, k) => (k === i ? { ...x, keep: e.target.checked } : x)))} /> Keep card {i + 1}
              </label>
              <Field label="Front">
                <textarea className="textarea" rows={2} value={d.front} onChange={(e) => setDrafts(drafts.map((x, k) => (k === i ? { ...x, front: e.target.value } : x)))} />
              </Field>
              <Field label="Back">
                <textarea className="textarea" rows={2} value={d.back} onChange={(e) => setDrafts(drafts.map((x, k) => (k === i ? { ...x, back: e.target.value } : x)))} />
              </Field>
            </div>
          ))}
          <div className="row">
            <Button
              variant="primary"
              disabled={!drafts.some((d) => d.keep && d.front.trim() && d.back.trim())}
              onClick={async () => {
                const keep = drafts.filter((d) => d.keep && d.front.trim() && d.back.trim());
                await repo.createCards(keep.map((d) => ({ certId, front: d.front, back: d.back, materialId: material.id, sectionIdx: section.idx, sourceLabel: label, sourceQuote: selection, origin: "ai" as const })));
                toast(`Saved ${keep.length} AI-drafted card${keep.length === 1 ? "" : "s"}.`, "success");
                onClose();
              }}
            >
              Save selected
            </Button>
            <Button onClick={onClose}>Discard</Button>
          </div>
        </div>
      </AiRun>
    </Dialog>
  );
}

export function DraftQuestionsDialog({ certId, selection, material, section, onClose }: { certId: Id; selection: string; material: Material; section: MaterialSection; onClose: () => void }) {
  const { repo } = useServices();
  const toast = useApp((s) => s.toast);
  const passage = contextPassage(material, section, selection);
  const [drafts, setDrafts] = useState<(DraftQuestion & { keep: boolean })[]>([]);
  const label = `${material.title} · ${section.label}`;
  const upd = (i: number, patch: Partial<DraftQuestion & { keep: boolean }>) => setDrafts(drafts.map((x, k) => (k === i ? { ...x, ...patch } : x)));
  return (
    <Dialog open onClose={onClose} title="Draft practice questions" wide>
      <AiRun request={questionsRequest(selection, passage, 3)} outgoing={[{ label: `${label} (context)`, text: passage.text }]} parse={validateQuestions} onResult={(r) => setDrafts(r.map((d) => ({ ...d, keep: true })))}>
        <div className="stack">
          <Notice kind="plain">These are AI-drafted practice questions, not official exam content. Check every answer against your source before saving.</Notice>
          {drafts.map((d, i) => (
            <div key={i} className="card flat tight stack">
              <label className="row">
                <input type="checkbox" checked={d.keep} onChange={(e) => upd(i, { keep: e.target.checked })} /> Keep question {i + 1}
              </label>
              <Field label="Question">
                <textarea className="textarea" rows={2} value={d.stem} onChange={(e) => upd(i, { stem: e.target.value })} />
              </Field>
              {d.choices.map((c, j) => (
                <div key={j} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <input
                    type="checkbox"
                    aria-label={`Choice ${j + 1} is correct`}
                    checked={c.correct}
                    onChange={(e) => upd(i, { choices: d.choices.map((x, k) => (k === j ? { ...x, correct: e.target.checked } : x)) })}
                    style={{ marginTop: 12 }}
                  />
                  <div className="grow stack" style={{ gap: 4 }}>
                    <input className="input" value={c.text} aria-label={`Choice ${j + 1}`} onChange={(e) => upd(i, { choices: d.choices.map((x, k) => (k === j ? { ...x, text: e.target.value } : x)) })} />
                    <input className="input" value={c.why} aria-label={`Why choice ${j + 1}`} placeholder="Why" onChange={(e) => upd(i, { choices: d.choices.map((x, k) => (k === j ? { ...x, why: e.target.value } : x)) })} />
                  </div>
                </div>
              ))}
              <Field label="Explanation">
                <textarea className="textarea" rows={2} value={d.explanation} onChange={(e) => upd(i, { explanation: e.target.value })} />
              </Field>
            </div>
          ))}
          <div className="row">
            <Button
              variant="primary"
              disabled={!drafts.some((d) => d.keep)}
              onClick={async () => {
                const keep = drafts.filter((d) => d.keep && d.stem.trim() && d.choices.some((c) => c.correct) && d.choices.some((c) => !c.correct));
                await repo.saveQuestions(
                  keep.map((d) => {
                    const choices = d.choices.map((c, j) => ({ id: "abcdefgh"[j], text: c.text, explanation: c.why }));
                    const correct = d.choices.flatMap((c, j) => (c.correct ? ["abcdefgh"[j]] : []));
                    return {
                      id: uid(),
                      certId,
                      kind: correct.length > 1 ? ("multiple" as const) : ("single" as const),
                      stem: d.stem,
                      choices,
                      correct,
                      explanation: d.explanation,
                      materialId: material.id,
                      sectionIdx: section.idx,
                      sourceLabel: label,
                      sourceQuote: selection,
                      origin: "ai" as const,
                      isSample: false,
                      objectiveIds: [],
                    };
                  }),
                );
                toast(`Saved ${keep.length} AI-drafted question${keep.length === 1 ? "" : "s"}.`, "success");
                onClose();
              }}
            >
              Save selected
            </Button>
            <Button onClick={onClose}>Discard</Button>
          </div>
        </div>
      </AiRun>
    </Dialog>
  );
}

export function AskPanel({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const ai = useAi();
  const toast = useApp((s) => s.toast);
  const [question, setQuestion] = useState("");
  const [passages, setPassages] = useState<Passage[] | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [asked, setAsked] = useState("");

  if (!ai.ready) return <Unavailable>{ai.reason}</Unavailable>;

  const prepare = async () => {
    const q = question.trim();
    if (!q) return;
    const sections = await repo.allSectionsForCert(certId);
    const found = retrieve(q, sections, 6);
    setAsked(q);
    setAnswer(null);
    setPassages(found);
  };

  return (
    <div className="stack">
      <Field label="Ask about your imported material">
        <textarea className="textarea" rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} />
      </Field>
      <Button variant="primary" icon="search" onClick={() => void prepare()} disabled={!question.trim()}>
        Find relevant passages
      </Button>
      {passages && passages.length === 0 && <Notice kind="plain">No passage in your materials matches this question, so there is nothing to ground an answer on.</Notice>}
      {passages && passages.length > 0 && answer == null && (
        <AiRun
          request={askRequest(asked, passages)}
          outgoing={passages.map((p) => ({ label: `[${p.ref}] ${p.materialTitle} · ${p.label}`, text: p.text }))}
          parse={(t) => t}
          onResult={(t) => setAnswer(t)}
        />
      )}
      {answer != null && passages && (
        <div className="stack">
          <AiBadge />
          <div className="pre-wrap">{answer}</div>
          <div className="stack" style={{ gap: 4 }}>
            <strong className="subtle">Sources cited</strong>
            {citations(answer, passages).length === 0 ? (
              <span className="subtle">No citations — treat this answer with caution.</span>
            ) : (
              citations(answer, passages).map((p) => (
                <div key={p.ref}>
                  [{p.ref}] <SourceLink materialId={p.materialId} sectionIdx={p.sectionIdx} label={`${p.materialTitle} · ${p.label}`} />
                  <div className="subtle">{excerpt(p.text, 140)}</div>
                </div>
              ))
            )}
          </div>
          <Button
            size="sm"
            onClick={async () => {
              const first = citations(answer, passages)[0];
              await repo.saveNote({ certId, materialId: first?.materialId ?? null, sectionIdx: first?.sectionIdx ?? null, sourceLabel: first ? `${first.materialTitle} · ${first.label}` : "", quote: asked, body: answer, origin: "ai", objectiveIds: [] });
              toast("Saved as an AI-labelled note.", "success");
            }}
          >
            Save as note
          </Button>
        </div>
      )}
    </div>
  );
}
