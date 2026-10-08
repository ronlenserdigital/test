import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useApp, updatePrefs } from "../state/store";
import { useLive, useServices } from "../state/hooks";
import { paragraphs, excerpt, parseTags } from "../domain/text";
import type { Highlight, Id, Material, MaterialSection, Note } from "../domain/types";
import { AiBadge, Button, ConfirmButton, Dialog, Empty, ErrorState, Field, IconButton, Loading, Notice, Slider, Tabs, downloadFile } from "../ui/components";
import { Icon } from "../ui/icons";
import { ObjectivePicker, ObjectiveTags, useObjectives } from "./common";
import { useAi, AskPanel, ExplainDialog, DraftCardsDialog, DraftQuestionsDialog } from "./AiTools";
import { SpeechPlayer } from "../ui/Shell";

/** Display model: paragraphs joined by blank lines; offsets index into this text. */
export function layout(text: string) {
  const paras = paragraphs(text);
  let pos = 0;
  return paras.map((p) => {
    const start = pos;
    pos += p.length + 2;
    return { text: p, start, end: start + p.length };
  });
}

interface Sel {
  text: string;
  start: number;
  end: number;
  rect: DOMRect;
}

function offsetWithin(p: HTMLElement, node: Node, offset: number): number {
  let count = 0;
  const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n === node) return count + offset;
    count += n.textContent?.length ?? 0;
  }
  // node is an element boundary: count text before child at `offset`
  if (node.nodeType === Node.ELEMENT_NODE) {
    let c = 0;
    const w2 = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while ((n = w2.nextNode())) {
      if ((node as Element).childNodes[offset]?.contains(n) || (node as Element).childNodes[offset] === n) return c;
      c += n.textContent?.length ?? 0;
    }
    return c;
  }
  return count;
}

function globalOffset(node: Node, offset: number): number | null {
  const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element))?.closest<HTMLElement>("p[data-start]");
  if (!el) return null;
  return Number(el.dataset.start) + offsetWithin(el, node, offset);
}

function Paragraph({
  para,
  highlights,
  ttsChunk,
  search,
}: {
  para: { text: string; start: number; end: number };
  highlights: Highlight[];
  ttsChunk: string | null;
  search: string;
}) {
  const bounds = new Set([0, para.text.length]);
  const ranges: { s: number; e: number; cls: string; title?: string }[] = [];
  for (const h of highlights) {
    const s = Math.max(0, h.startOffset - para.start);
    const e = Math.min(para.text.length, h.endOffset - para.start);
    if (e > s) ranges.push({ s, e, cls: "hl" });
  }
  if (ttsChunk) {
    const at = para.text.indexOf(ttsChunk);
    if (at >= 0) ranges.push({ s: at, e: at + ttsChunk.length, cls: "tts" });
  }
  if (search.length >= 2) {
    const lower = para.text.toLowerCase();
    const q = search.toLowerCase();
    let i = lower.indexOf(q);
    while (i >= 0) {
      ranges.push({ s: i, e: i + q.length, cls: "search" });
      i = lower.indexOf(q, i + q.length);
    }
  }
  for (const r of ranges) {
    bounds.add(r.s);
    bounds.add(r.e);
  }
  const pts = [...bounds].sort((a, b) => a - b);
  const segs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const s = pts[i];
    const e = pts[i + 1];
    const cls = ranges.filter((r) => r.s <= s && r.e >= e).map((r) => r.cls);
    const text = para.text.slice(s, e);
    if (!cls.length) segs.push(text);
    else {
      // Highlight wins visually; TTS adds an underline; search adds a blue tint.
      const className = [cls.includes("tts") ? "tts-chunk" : "", cls.includes("search") && !cls.includes("hl") ? "search-hit" : ""].join(" ").trim();
      segs.push(
        <mark key={s} className={className || undefined} data-hl={cls.includes("hl") || undefined}>
          {text}
        </mark>,
      );
    }
  }
  return (
    <p data-start={para.start} className={ttsChunk && para.text.includes(ttsChunk) ? "tts-para" : undefined}>
      {segs}
    </p>
  );
}

function TypographyMenu() {
  const reader = useApp((s) => s.prefs.reader);
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<typeof reader>) => void updatePrefs((p) => ({ ...p, reader: { ...p.reader, ...patch } }));
  return (
    <div style={{ position: "relative" }}>
      <IconButton icon="type" label="Text settings" variant="ghost" aria-expanded={open} onClick={() => setOpen(!open)} />
      {open && (
        <div className="card stack" style={{ position: "absolute", right: 0, top: 44, width: 280, zIndex: 30 }} role="dialog" aria-label="Text settings">
          <Field label="Font">
            <select className="select" value={reader.font} onChange={(e) => set({ font: e.target.value as typeof reader.font })}>
              <option value="serif">Serif</option>
              <option value="sans">Sans-serif</option>
              <option value="mono">Monospace</option>
            </select>
          </Field>
          <Slider label="Text size" value={reader.size} min={14} max={30} onChange={(v) => set({ size: v })} format={(v) => `${v}px`} />
          <Slider label="Line spacing" value={reader.lineHeight} min={1.3} max={2.2} step={0.1} onChange={(v) => set({ lineHeight: v })} format={(v) => v.toFixed(1)} />
          <Field label="Line width">
            <select className="select" value={reader.width} onChange={(e) => set({ width: e.target.value as typeof reader.width })}>
              <option value="narrow">Narrow</option>
              <option value="medium">Medium</option>
              <option value="wide">Wide</option>
            </select>
          </Field>
          <Button size="sm" onClick={() => setOpen(false)}>
            Done
          </Button>
        </div>
      )}
    </div>
  );
}

function NoteDialog({
  certId,
  material,
  section,
  quote,
  existing,
  onClose,
}: {
  certId: Id;
  material: Material;
  section: MaterialSection | null;
  quote: string;
  existing?: Note;
  onClose: () => void;
}) {
  const { repo } = useServices();
  const obj = useObjectives(certId);
  const [body, setBody] = useState(existing?.body ?? "");
  const [tags, setTags] = useState(existing?.tags.join(", ") ?? "");
  const [objIds, setObjIds] = useState<Id[]>(existing?.objectiveIds ?? []);
  return (
    <Dialog
      open
      onClose={onClose}
      title={existing ? "Edit note" : "Add note"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!body.trim() && !quote}
            onClick={async () => {
              await repo.saveNote({
                id: existing?.id,
                certId,
                materialId: material.id,
                sectionIdx: section?.idx ?? null,
                sourceLabel: section ? `${material.title} · ${section.label}` : material.title,
                quote,
                body,
                tags: parseTags(tags),
                objectiveIds: objIds,
              });
              onClose();
            }}
          >
            Save note
          </Button>
        </>
      }
    >
      <div className="stack">
        {quote && <blockquote className="quote">{excerpt(quote, 400)}</blockquote>}
        <Field label="Note">
          <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} autoFocus />
        </Field>
        <Field label="Tags" hint="Comma-separated">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        {obj.data && <ObjectivePicker domains={obj.data.domains} objectives={obj.data.objectives} value={objIds} onChange={setObjIds} />}
      </div>
    </Dialog>
  );
}

export function CardDialog({
  certId,
  initial,
  source,
  onClose,
}: {
  certId: Id;
  initial: { front: string; back: string };
  source: { materialId: Id | null; sectionIdx: number | null; sourceLabel: string; sourceQuote: string } | null;
  onClose: () => void;
}) {
  const { repo } = useServices();
  const toast = useApp((s) => s.toast);
  const obj = useObjectives(certId);
  const [front, setFront] = useState(initial.front);
  const [back, setBack] = useState(initial.back);
  const [objIds, setObjIds] = useState<Id[]>([]);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Create flashcard"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={async () => {
              if (!front.trim() || !back.trim()) return setErr("Both sides are required.");
              await repo.createCard({ certId, front, back, ...(source ?? {}), origin: source ? "selection" : "manual", objectiveIds: objIds });
              toast("Flashcard created.", "success");
              onClose();
            }}
          >
            Create card
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Front (prompt)" error={err}>
          <textarea className="textarea" rows={3} value={front} onChange={(e) => setFront(e.target.value)} autoFocus placeholder="Write a question that the back answers" />
        </Field>
        <Field label="Back (answer)">
          <textarea className="textarea" rows={4} value={back} onChange={(e) => setBack(e.target.value)} />
        </Field>
        {source?.sourceLabel && <p className="subtle">Source: {source.sourceLabel}</p>}
        {obj.data && <ObjectivePicker domains={obj.data.domains} objectives={obj.data.objectives} value={objIds} onChange={setObjIds} />}
      </div>
    </Dialog>
  );
}

export function Reader({ materialId, sectionIdx: initialSection, offset }: { materialId: Id; sectionIdx?: number; offset?: number }) {
  const services = useServices();
  const { repo, speech } = services;
  const navigate = useApp((s) => s.navigate);
  const toast = useApp((s) => s.toast);
  const readerPrefs = useApp((s) => s.prefs.reader);
  const data = useLive(async (r) => {
    const material = await r.getMaterial(materialId);
    if (!material) return null;
    return { material, sections: await r.listSections(materialId) };
  }, [materialId]);
  const material = data.data?.material ?? null;
  const sections = data.data?.sections ?? [];
  const [idx, setIdx] = useState<number | null>(initialSection ?? null);
  const highlights = useLive((r) => r.listHighlights(materialId), [materialId]);
  const bookmarks = useLive((r) => r.listBookmarks(materialId), [materialId]);
  const notes = useLive((r) => (material ? r.listNotes(material.certId, materialId) : Promise.resolve([])), [materialId, material?.certId]);
  const obj = useObjectives(material?.certId ?? "");
  const [sel, setSel] = useState<Sel | null>(null);
  const [dialog, setDialog] = useState<null | { kind: "note"; note?: Note; quote: string } | { kind: "card"; text: string } | { kind: "explain" | "draft-cards" | "draft-questions"; text: string } | { kind: "edit" }>(null);
  const [tab, setTab] = useState<"contents" | "notes" | "marks" | "ask">("contents");
  const [find, setFind] = useState("");
  const textRef = useRef<HTMLDivElement>(null);
  const ai = useAi();
  const speechState = useSyncExternalStore(
    (cb) => speech.subscribe(cb),
    () => speech.state,
  );

  // Choose initial section: route → saved position → 0
  useEffect(() => {
    if (idx == null && material) setIdx(Math.min(material.position?.sectionIdx ?? 0, Math.max(0, sections.length - 1)));
  }, [material, sections.length, idx]);

  const section = idx != null ? sections[idx] ?? null : null;
  const paras = useMemo(() => (section ? layout(section.text) : []), [section]);

  // Restore scroll for saved position / jump to offset
  useEffect(() => {
    if (!section || !material) return;
    const main = document.getElementById("main");
    if (!main) return;
    requestAnimationFrame(() => {
      if (offset != null) {
        const p = [...(textRef.current?.querySelectorAll<HTMLElement>("p[data-start]") ?? [])].reverse().find((el) => Number(el.dataset.start) <= offset);
        p?.scrollIntoView({ block: "center" });
      } else if (material.position && material.position.sectionIdx === section.idx) {
        main.scrollTop = material.position.scrollRatio * (main.scrollHeight - main.clientHeight);
      } else main.scrollTop = 0;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section?.id]);

  // Persist reading position (section + scroll)
  useEffect(() => {
    if (!section) return;
    const main = document.getElementById("main");
    let t: ReturnType<typeof setTimeout> | null = null;
    const save = () => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        const ratio = main && main.scrollHeight > main.clientHeight ? main.scrollTop / (main.scrollHeight - main.clientHeight) : 0;
        void repo.savePosition(materialId, { sectionIdx: section.idx, scrollRatio: Math.round(ratio * 1000) / 1000 });
      }, 400);
    };
    save();
    main?.addEventListener("scroll", save, { passive: true });
    return () => {
      main?.removeEventListener("scroll", save);
      if (t) clearTimeout(t);
    };
  }, [section, materialId, repo]);

  // Follow read-aloud into the next section
  useEffect(() => {
    const c = speechState.cursor;
    if (c && c.materialId === materialId && c.sectionIdx !== idx) setIdx(c.sectionIdx);
  }, [speechState.cursor, materialId, idx]);

  // Scroll the paragraph being read into view
  useEffect(() => {
    if (speechState.cursor?.materialId !== materialId) return;
    textRef.current?.querySelector(".tts-para")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [speechState.chunk, speechState.cursor?.materialId, materialId]);

  const readDocument = useCallback(() => {
    if (!material || section == null) return;
    const cursor = material.position?.sectionIdx === section.idx ? material.position?.ttsChunk ?? 0 : 0;
    void speech.playDocument(
      material.id,
      section.idx,
      cursor,
      async (i) => {
        const s = await repo.getSection(material.id, i);
        return s ? { text: s.text, label: `${material.title} · ${s.label}` } : null;
      },
      material.sectionCount,
    );
  }, [material, section, speech, repo]);

  useEffect(() => {
    const on = () => readDocument();
    document.addEventListener("studymode:read-document", on);
    return () => document.removeEventListener("studymode:read-document", on);
  }, [readDocument]);

  // Selection tracking (mouse, keyboard and touch selection all end in selectionchange)
  useEffect(() => {
    const update = () => {
      const s = window.getSelection();
      if (!s || s.isCollapsed || !s.rangeCount || !textRef.current) return setSel(null);
      const range = s.getRangeAt(0);
      if (!textRef.current.contains(range.commonAncestorContainer)) return setSel(null);
      const start = globalOffset(range.startContainer, range.startOffset);
      const end = globalOffset(range.endContainer, range.endOffset);
      const text = s.toString().trim();
      if (start == null || end == null || !text) return setSel(null);
      setSel({ text, start: Math.min(start, end), end: Math.max(start, end), rect: range.getBoundingClientRect() });
    };
    let t: ReturnType<typeof setTimeout>;
    const deb = () => {
      clearTimeout(t);
      t = setTimeout(update, 120);
    };
    document.addEventListener("selectionchange", deb);
    return () => {
      document.removeEventListener("selectionchange", deb);
      clearTimeout(t);
    };
  }, []);

  if (data.error) return <div className="page"><ErrorState error={data.error} onRetry={data.reload} /></div>;
  if (data.data === undefined) return <div className="page"><Loading /></div>;
  if (!material) {
    return (
      <div className="page">
        <Empty icon="book" title="Material not found" action={<Button onClick={() => navigate({ view: "library" })}>Back to library</Button>}>
          It may have been deleted.
        </Empty>
      </div>
    );
  }

  const sectionHighlights = (highlights.data ?? []).filter((h) => h.sectionIdx === section?.idx);
  const ttsHere = speechState.cursor?.materialId === materialId && speechState.cursor.sectionIdx === section?.idx ? speechState.chunk?.text ?? null : null;
  const sourceFor = (text: string) => ({ materialId: material.id, sectionIdx: section?.idx ?? null, sourceLabel: `${material.title} · ${section?.label ?? ""}`, sourceQuote: text });
  const clearSel = () => {
    window.getSelection()?.removeAllRanges();
    setSel(null);
  };
  const isBookmarked = (bookmarks.data ?? []).find((b) => b.sectionIdx === section?.idx);
  const go = (i: number) => {
    if (i < 0 || i >= sections.length) return;
    setIdx(i);
    clearSel();
  };

  return (
    <div className="page" style={{ maxWidth: 1280 }}>
      <div className="page-head">
        <div className="grow">
          <button className="btn ghost sm" onClick={() => navigate({ view: "library" })}>
            <Icon name="arrowLeft" /> Library
          </button>
          <h1 style={{ marginTop: 8 }}>{material.title}</h1>
          <div className="subtle">
            {section?.label} · section {(idx ?? 0) + 1} of {sections.length}
          </div>
        </div>
        <div className="row">
          <Button icon="play" onClick={readDocument} disabled={!section || material.status === "needs_ocr"} title="Read from the current position (Alt+R)">
            Listen
          </Button>
          <SpeechPlayer compact />
          <IconButton
            icon="bookmark"
            label={isBookmarked ? "Remove bookmark" : "Bookmark this section"}
            variant={isBookmarked ? "accent" : "ghost"}
            aria-pressed={!!isBookmarked}
            onClick={() => (isBookmarked ? repo.deleteBookmark(isBookmarked.id) : section && repo.addBookmark(material.id, section.idx, section.label))}
          />
          <TypographyMenu />
          {material.kind === "note" && <IconButton icon="edit" label="Edit notes text" variant="ghost" onClick={() => setDialog({ kind: "edit" })} />}
          {material.fileKey && (
            <IconButton
              icon="download"
              label="Export original file"
              variant="ghost"
              onClick={async () => {
                try {
                  downloadFile(material.originalName || `${material.title}.txt`, await repo.files.get(material.fileKey!), material.mime || "application/octet-stream");
                } catch (e) {
                  toast((e as Error).message, "error");
                }
              }}
            />
          )}
        </div>
      </div>

      {material.status === "needs_ocr" && <Notice kind="warn">{material.statusDetail}</Notice>}
      {material.status === "ready" && material.statusDetail && <Notice kind="plain">{material.statusDetail}</Notice>}

      <div className="reader-layout">
        <div>
          <div className="row" style={{ marginBottom: 12 }}>
            <label className="sr-only" htmlFor="find-in-section">
              Find in this section
            </label>
            <input id="find-in-section" className="input" type="search" placeholder="Find in this section" value={find} onChange={(e) => setFind(e.target.value)} style={{ maxWidth: 280 }} />
          </div>
          {!section ? (
            <Empty title="No readable text">This material has no extracted text.</Empty>
          ) : (
            <article
              ref={textRef}
              className={`reader-text font-${readerPrefs.font} w-${readerPrefs.width}`}
              style={{ fontSize: readerPrefs.size, lineHeight: readerPrefs.lineHeight }}
              aria-label={`${material.title}, ${section.label}`}
            >
              <div className="section-head">
                <span>{section.label}</span>
              </div>
              {paras.map((p) => (
                <Paragraph key={p.start} para={p} highlights={sectionHighlights} ttsChunk={ttsHere} search={find} />
              ))}
            </article>
          )}
          <div className="row between" style={{ maxWidth: "70ch", margin: "24px auto 0" }}>
            <Button icon="arrowLeft" onClick={() => go((idx ?? 0) - 1)} disabled={!idx}>
              Previous
            </Button>
            <span className="subtle">
              {(idx ?? 0) + 1} / {sections.length}
            </span>
            <Button onClick={() => go((idx ?? 0) + 1)} disabled={idx == null || idx >= sections.length - 1}>
              Next <Icon name="arrowRight" />
            </Button>
          </div>
        </div>

        <aside className="reader-side card tight" aria-label="Reader tools">
          <Tabs
            label="Reader panels"
            value={tab}
            onChange={setTab}
            tabs={[
              { id: "contents", label: "Contents" },
              { id: "notes", label: `Notes${notes.data?.length ? ` (${notes.data.length})` : ""}` },
              { id: "marks", label: "Marks" },
              { id: "ask", label: "Ask" },
            ]}
          />
          {tab === "contents" && (
            <ol className="list" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              {sections.map((s) => (
                <li key={s.id} style={{ padding: 0 }}>
                  <button className="nav-item" aria-current={s.idx === idx ? "page" : undefined} onClick={() => go(s.idx)}>
                    <span className="grow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.label}</span>
                    {(bookmarks.data ?? []).some((b) => b.sectionIdx === s.idx) && <Icon name="bookmark" style={{ width: 14, height: 14, color: "var(--accent)" }} />}
                  </button>
                </li>
              ))}
            </ol>
          )}
          {tab === "notes" && (
            <div className="stack">
              <Button size="sm" icon="plus" onClick={() => setDialog({ kind: "note", quote: "" })}>
                Add note
              </Button>
              {(notes.data ?? []).length === 0 && <p className="subtle">Select text and choose “Add note”, or add a note for this section.</p>}
              {(notes.data ?? []).map((n) => (
                <div key={n.id} className="card flat tight stack" style={{ gap: 6 }}>
                  <div className="row between">
                    <button className="btn ghost sm" onClick={() => n.sectionIdx != null && go(n.sectionIdx)}>
                      {n.sourceLabel.split(" · ").pop() || "Note"}
                    </button>
                    {n.origin === "ai" && <AiBadge />}
                  </div>
                  {n.quote && <blockquote className="quote">{excerpt(n.quote, 200)}</blockquote>}
                  {n.body && <div className="pre-wrap">{n.body}</div>}
                  {obj.data && <ObjectiveTags ids={n.objectiveIds} objectives={obj.data.objectives} />}
                  <div className="row">
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setDialog({ kind: "note", note: n, quote: n.quote })}>
                      Edit
                    </Button>
                    <ConfirmButton size="sm" variant="ghost" label="Delete" confirmLabel="Delete this note" onConfirm={() => void repo.deleteNote(n.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === "marks" && (
            <div className="stack">
              <h3>Bookmarks</h3>
              {(bookmarks.data ?? []).length === 0 && <p className="subtle">No bookmarks.</p>}
              {(bookmarks.data ?? []).map((b) => (
                <div key={b.id} className="row between">
                  <button className="btn ghost sm" onClick={() => go(b.sectionIdx)}>
                    {b.label}
                  </button>
                  <IconButton size="sm" variant="ghost" icon="x" label={`Remove bookmark ${b.label}`} onClick={() => void repo.deleteBookmark(b.id)} />
                </div>
              ))}
              <h3>Highlights</h3>
              {(highlights.data ?? []).length === 0 && <p className="subtle">Select text and choose “Highlight”.</p>}
              {(highlights.data ?? []).map((h) => (
                <div key={h.id} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <button className="btn ghost sm grow" style={{ height: "auto", whiteSpace: "normal", textAlign: "left", padding: 6 }} onClick={() => go(h.sectionIdx)}>
                    <mark style={{ background: "var(--mark)" }}>{excerpt(h.text, 90)}</mark>
                    <span className="subtle"> · {sections[h.sectionIdx]?.label}</span>
                  </button>
                  <IconButton size="sm" variant="ghost" icon="x" label="Remove highlight" onClick={() => void repo.deleteHighlight(h.id)} />
                </div>
              ))}
            </div>
          )}
          {tab === "ask" && <AskPanel certId={material.certId} />}
        </aside>
      </div>

      {sel && (
        <div
          className="selection-bar"
          role="toolbar"
          aria-label="Selection actions"
          style={{
            top: Math.max(8, sel.rect.top - 52),
            left: Math.min(Math.max(8, sel.rect.left + sel.rect.width / 2 - 200), window.innerWidth - 420),
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button size="sm" icon="volume" onClick={() => speech.speakText(sel.text)}>
            Read aloud
          </Button>
          <Button
            size="sm"
            icon="highlight"
            onClick={async () => {
              if (!section) return;
              await repo.addHighlight({ materialId, sectionIdx: section.idx, startOffset: sel.start, endOffset: sel.end, text: sel.text, color: "amber" });
              clearSel();
            }}
          >
            Highlight
          </Button>
          <Button size="sm" icon="note" onClick={() => setDialog({ kind: "note", quote: sel.text })}>
            Add note
          </Button>
          <Button size="sm" icon="cards" onClick={() => setDialog({ kind: "card", text: sel.text })}>
            Create flashcard
          </Button>
          {ai.ready && (
            <>
              <Button size="sm" icon="sparkle" onClick={() => setDialog({ kind: "explain", text: sel.text })}>
                Explain
              </Button>
              <Button size="sm" icon="sparkle" onClick={() => setDialog({ kind: "draft-cards", text: sel.text })}>
                Draft cards
              </Button>
              <Button size="sm" icon="sparkle" onClick={() => setDialog({ kind: "draft-questions", text: sel.text })}>
                Draft questions
              </Button>
            </>
          )}
        </div>
      )}

      {dialog?.kind === "note" && <NoteDialog certId={material.certId} material={material} section={dialog.note?.sectionIdx != null ? sections[dialog.note.sectionIdx] ?? section : section} quote={dialog.quote} existing={dialog.note} onClose={() => (setDialog(null), clearSel())} />}
      {dialog?.kind === "card" && <CardDialog certId={material.certId} initial={{ front: "", back: dialog.text }} source={sourceFor(dialog.text)} onClose={() => (setDialog(null), clearSel())} />}
      {dialog?.kind === "explain" && section && <ExplainDialog certId={material.certId} selection={dialog.text} material={material} section={section} onClose={() => setDialog(null)} />}
      {dialog?.kind === "draft-cards" && section && <DraftCardsDialog certId={material.certId} selection={dialog.text} material={material} section={section} onClose={() => setDialog(null)} />}
      {dialog?.kind === "draft-questions" && section && <DraftQuestionsDialog certId={material.certId} selection={dialog.text} material={material} section={section} onClose={() => setDialog(null)} />}
      {dialog?.kind === "edit" && section && <EditNoteMaterial material={material} section={section} onClose={() => setDialog(null)} />}
    </div>
  );
}

function EditNoteMaterial({ material, section, onClose }: { material: Material; section: MaterialSection; onClose: () => void }) {
  const { repo, speech } = useServices();
  const [title, setTitle] = useState(material.title);
  const [text, setText] = useState(section.text);
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit notes"
      wide
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={async () => {
              speech.documentChanged(material.id);
              await repo.updateNoteMaterialText(material.id, title.trim() || material.title, section.idx, text);
              onClose();
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Title">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label="Text" hint="Highlights in this section may shift if you change text before them.">
          <textarea className="textarea" rows={14} value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}
