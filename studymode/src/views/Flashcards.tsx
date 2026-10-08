import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../state/store";
import { useLive, useServices, useAction } from "../state/hooks";
import { formatInterval, makeScheduler, preview, GRADE_LABELS } from "../domain/srs";
import { exportCards, parseCards } from "../domain/io";
import { parseTags } from "../domain/text";
import { startOfToday } from "../state/planData";
import type { Flashcard, Grade, Id } from "../domain/types";
import { AiBadge, Button, ConfirmButton, Dialog, Empty, ErrorState, Field, IconButton, Loading, Notice, Progress, SampleBadge, downloadFile, fmtDate, pickFiles } from "../ui/components";
import { Page, RequireCert, SourceLink, ObjectivePicker, ObjectiveTags, useObjectives } from "./common";
import { CardDialog } from "./Reader";

const STATE_LABEL = ["New", "Learning", "Review", "Relearning"];

function EditCard({ card, onClose }: { card: Flashcard; onClose: () => void }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const obj = useObjectives(card.certId);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [tags, setTags] = useState(card.tags.join(", "));
  const [objIds, setObjIds] = useState(card.objectiveIds);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit flashcard"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" busy={busy} onClick={() => void run(async () => (await repo.updateCard(card.id, { front, back, tags: parseTags(tags), objectiveIds: objIds }), onClose()))}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Front">
          <textarea className="textarea" rows={3} value={front} onChange={(e) => setFront(e.target.value)} />
        </Field>
        <Field label="Back">
          <textarea className="textarea" rows={4} value={back} onChange={(e) => setBack(e.target.value)} />
        </Field>
        <Field label="Tags">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        {card.sourceLabel && <SourceLink materialId={card.materialId} sectionIdx={card.sectionIdx} label={card.sourceLabel} />}
        {obj.data && <ObjectivePicker domains={obj.data.domains} objectives={obj.data.objectives} value={objIds} onChange={setObjIds} />}
      </div>
    </Dialog>
  );
}

function ImportCards({ certId, onClose }: { certId: Id; onClose: () => void }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const [result, setResult] = useState<ReturnType<typeof parseCards> | null>(null);
  const [name, setName] = useState("");
  return (
    <Dialog
      open
      onClose={onClose}
      title="Import flashcards"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            busy={busy}
            disabled={!result?.items.length}
            onClick={() =>
              void run(async () => {
                await repo.createCards(result!.items.map((c) => ({ certId, front: c.front, back: c.back, tags: c.tags, sourceLabel: c.sourceLabel, origin: "import" as const })));
                onClose();
              }, `Imported ${result?.items.length} cards.`)
            }
          >
            Import {result?.items.length ?? 0} cards
          </Button>
        </>
      }
    >
      <div className="stack">
        <p className="muted">
          CSV with headers <code>front, back, tags, source</code> (tags separated by “;”), or JSON: <code>[{"{"}"front": "…", "back": "…"{"}"}]</code>.
        </p>
        <Button
          onClick={async () => {
            const [f] = await pickFiles(".csv,.json");
            if (!f) return;
            setName(f.name);
            setResult(parseCards(await f.text(), f.name.toLowerCase().endsWith(".json") ? "json" : "csv"));
          }}
        >
          Choose file…
        </Button>
        {result && (
          <>
            <p>
              <strong>{name}</strong>: {result.items.length} valid card{result.items.length === 1 ? "" : "s"}.
            </p>
            {result.errors.length > 0 && (
              <Notice kind="warn">
                {result.errors.length} row{result.errors.length === 1 ? "" : "s"} skipped:
                <ul>
                  {result.errors.slice(0, 8).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Notice>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}

export function CardsView() {
  return <RequireCert title="Flashcards">{(cert) => <CardsInner certId={cert.id} />}</RequireCert>;
}

function CardsInner({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const cards = useLive((r) => r.listCards(certId), [certId]);
  const obj = useObjectives(certId);
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Flashcard | null>(null);
  const [importing, setImporting] = useState(false);
  const list = (cards.data ?? []).filter((c) => !q || `${c.front} ${c.back} ${c.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <Page
      title="Flashcards"
      subtitle={cards.data ? `${cards.data.length} cards` : undefined}
      actions={
        <>
          <Button variant="primary" icon="plus" onClick={() => setCreating(true)}>
            New card
          </Button>
          <Button icon="upload" onClick={() => setImporting(true)}>
            Import
          </Button>
          <Button icon="download" disabled={!cards.data?.length} onClick={() => downloadFile("flashcards.csv", exportCards(cards.data!, "csv"), "text/csv")}>
            CSV
          </Button>
          <Button icon="download" disabled={!cards.data?.length} onClick={() => downloadFile("flashcards.json", exportCards(cards.data!, "json"), "application/json")}>
            JSON
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="row">
          <input className="input grow" type="search" placeholder="Search cards" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search cards" />
          <Button variant="accent" onClick={() => navigate({ view: "review" })}>
            Review now
          </Button>
        </div>
        {cards.error ? (
          <ErrorState error={cards.error} onRetry={cards.reload} />
        ) : !cards.data ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty icon="cards" title={q ? "No matching cards" : "No flashcards yet"}>
            Create cards here, select text in the reader and choose “Create flashcard”, or import a CSV/JSON file.
          </Empty>
        ) : (
          <div className="card" style={{ padding: 0, overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Front</th>
                  <th>Back</th>
                  <th>State</th>
                  <th>Due</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} style={{ opacity: c.suspended ? 0.55 : 1 }}>
                    <td style={{ maxWidth: 320 }}>
                      <div>{c.front}</div>
                      <div className="row" style={{ gap: 4, marginTop: 4 }}>
                        {c.origin === "ai" && <AiBadge />}
                        {c.isSample && <SampleBadge />}
                        {obj.data && <ObjectiveTags ids={c.objectiveIds} objectives={obj.data.objectives} />}
                        {c.sourceLabel && <SourceLink materialId={c.materialId} sectionIdx={c.sectionIdx} label={c.sourceLabel} />}
                      </div>
                    </td>
                    <td style={{ maxWidth: 320 }} className="muted">
                      {c.back}
                    </td>
                    <td>{c.suspended ? "Suspended" : STATE_LABEL[c.state]}</td>
                    <td className="subtle">{c.state === 0 ? "New" : fmtDate(c.due)}</td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap" }}>
                        <IconButton size="sm" variant="ghost" icon="edit" label="Edit card" onClick={() => setEditing(c)} />
                        <Button size="sm" variant="ghost" onClick={() => void repo.updateCard(c.id, { suspended: !c.suspended })}>
                          {c.suspended ? "Unsuspend" : "Suspend"}
                        </Button>
                        <ConfirmButton size="sm" variant="ghost" label="Delete" confirmLabel="Delete this card and its review history" onConfirm={() => void repo.deleteCard(c.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {creating && <CardDialog certId={certId} initial={{ front: "", back: "" }} source={null} onClose={() => setCreating(false)} />}
      {editing && <EditCard card={editing} onClose={() => setEditing(null)} />}
      {importing && <ImportCards certId={certId} onClose={() => setImporting(false)} />}
    </Page>
  );
}

export function ReviewView() {
  return <RequireCert title="Review">{(cert) => <ReviewInner certId={cert.id} dailyCards={cert.dailyCards} />}</RequireCert>;
}

function ReviewInner({ certId, dailyCards }: { certId: Id; dailyCards: number }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const obj = useObjectives(certId);
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState<Record<Grade, number>>({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [error, setError] = useState<Error | null>(null);
  const shownAt = useRef(Date.now());
  const scheduler = useMemo(() => makeScheduler(), []);
  const next = useLive(async (r) => {
    const rows = await r.db.all<{ due: number }>("SELECT MIN(due) AS due FROM cards WHERE cert_id = ? AND suspended = 0 AND state != 0", [certId]);
    return rows[0]?.due ? Number(rows[0].due) : null;
  }, [certId, queue?.length, i]);

  const load = async () => {
    try {
      const now = Date.now();
      const introduced = await repo.newCardsIntroducedToday(certId, startOfToday(now));
      setQueue(await repo.reviewQueue(certId, now, Math.max(0, dailyCards - introduced)));
      setI(0);
      setShown(false);
      shownAt.current = Date.now();
    } catch (e) {
      setError(e as Error);
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [certId]);

  const card = queue?.[i];
  const intervals = card ? preview(scheduler, card, Date.now()) : null;

  const rate = async (g: Grade) => {
    if (!card) return;
    const now = Date.now();
    const sched = await repo.reviewCard(card.id, g, now, now - shownAt.current);
    setDone((d) => ({ ...d, [g]: d[g] + 1 }));
    // Cards due again within this session (Again/Hard in learning) return to the end of the queue.
    const again = sched.due - now < 20 * 60_000 ? [{ ...card, ...sched }] : [];
    setQueue((q) => (q ? [...q.slice(0, i + 1), ...q.slice(i + 1), ...again] : q));
    setI((x) => x + 1);
    setShown(false);
    shownAt.current = Date.now();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (!card) return;
      if (!shown && (e.code === "Space" || e.key === "Enter")) {
        e.preventDefault();
        setShown(true);
      } else if (shown && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        void rate(Number(e.key) as Grade);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (error) return <Page title="Review"><ErrorState error={error} onRetry={() => void load()} /></Page>;
  if (!queue) return <Page title="Review"><Loading /></Page>;
  const total = queue.length;
  const reviewed = done[1] + done[2] + done[3] + done[4];

  if (!card) {
    return (
      <Page title="Review">
        <div className="card">
          {reviewed > 0 ? (
            <Empty icon="check" title="Review complete" action={<Button variant="primary" onClick={() => navigate({ view: "dashboard" })}>Back to today</Button>}>
              {reviewed} reviews: {done[1]} Again · {done[2]} Hard · {done[3]} Good · {done[4]} Easy.
              {next.data ? ` Next card due ${new Date(next.data).toLocaleString()}.` : ""}
            </Empty>
          ) : (
            <Empty icon="cards" title="Nothing due right now" action={<Button onClick={() => navigate({ view: "cards" })}>Manage flashcards</Button>}>
              {next.data ? `Your next card is due ${new Date(next.data).toLocaleString()}.` : "Create flashcards to start reviewing."}
            </Empty>
          )}
        </div>
      </Page>
    );
  }

  return (
    <Page title="Review" subtitle={`${Math.min(i + 1, total)} of ${total} · ${STATE_LABEL[card.state]}`}>
      <div className="stack lg" style={{ maxWidth: 760, margin: "0 auto" }}>
        <Progress value={i} max={total} label="Review progress" />
        <div className="card flashcard" aria-live="polite">
          <div className="pre-wrap">{card.front}</div>
          {shown && <div className="back pre-wrap">{card.back}</div>}
        </div>
        <div className="row" style={{ justifyContent: "center", gap: 6 }}>
          {card.origin === "ai" && <AiBadge />}
          {card.isSample && <SampleBadge />}
          {obj.data && <ObjectiveTags ids={card.objectiveIds} objectives={obj.data.objectives} />}
          {card.sourceLabel && <SourceLink materialId={card.materialId} sectionIdx={card.sectionIdx} label={card.sourceLabel} />}
        </div>
        {!shown ? (
          <Button variant="primary" size="lg" onClick={() => setShown(true)}>
            Show answer <kbd>Space</kbd>
          </Button>
        ) : (
          <div className="rating-row" role="group" aria-label="Rate your recall">
            {([1, 2, 3, 4] as Grade[]).map((g) => (
              <Button key={g} variant={g === 3 ? "primary" : g === 1 ? "danger" : "default"} onClick={() => void rate(g)}>
                {GRADE_LABELS[g]} <small>{intervals ? formatInterval(intervals[g] - Date.now()) : ""} · {g}</small>
              </Button>
            ))}
          </div>
        )}
        <p className="subtle" style={{ textAlign: "center" }}>
          Scheduling uses FSRS (Free Spaced Repetition Scheduler) targeting 90% recall.
        </p>
      </div>
    </Page>
  );
}
