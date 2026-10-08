import { useRef, useState } from "react";
import { useApp } from "../state/store";
import { useLive, useServices } from "../state/hooks";
import { ACCEPTED_EXTENSIONS, importFile, importPasted, type ImportOutcome } from "../importers/importer";
import { Button, ConfirmButton, Dialog, Empty, ErrorState, Field, Loading, Notice, Progress, SampleBadge, Tabs, fmtDate, pickFiles } from "../ui/components";
import { Icon } from "../ui/icons";
import { Page, RequireCert, ObjectivePicker, ObjectiveTags, useObjectives } from "./common";
import { parseTags } from "../domain/text";
import type { Id, Material } from "../domain/types";

interface Pending {
  file: { name: string; bytes: Uint8Array };
  outcome: Extract<ImportOutcome, { status: "duplicate" | "needs_ocr" }>;
}

export function ImportPanel({ certId, compact }: { certId: Id; compact?: boolean }) {
  const services = useServices();
  const toast = useApp((s) => s.toast);
  const navigate = useApp((s) => s.navigate);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [progress, setProgress] = useState<{ name: string; message: string; fraction: number | null } | null>(null);
  const [over, setOver] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [paste, setPaste] = useState({ title: "", text: "" });
  const [results, setResults] = useState<{ name: string; ok: boolean; text: string; materialId?: Id }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const runImport = async (file: { name: string; bytes: Uint8Array }, extra: { allowDuplicate?: boolean; keepImageOnly?: boolean } = {}) => {
    const ac = new AbortController();
    abortRef.current = ac;
    setProgress({ name: file.name, message: "Starting…", fraction: null });
    const r = await importFile(services.repo, certId, file, {
      pdfjs: services.pdfjs,
      signal: ac.signal,
      onProgress: (message, fraction) => setProgress({ name: file.name, message, fraction }),
      ...extra,
    });
    setProgress(null);
    abortRef.current = null;
    if (r.status === "imported") {
      setResults((x) => [{ name: file.name, ok: true, text: r.notice ?? `Imported ${r.material.sectionCount} section${r.material.sectionCount === 1 ? "" : "s"}.`, materialId: r.material.id }, ...x]);
      toast(`Imported “${r.material.title}”.`, "success");
    } else if (r.status === "duplicate" || r.status === "needs_ocr") {
      setPending({ file, outcome: r });
    } else {
      setResults((x) => [{ name: file.name, ok: false, text: r.message }, ...x]);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const f of files) {
      let bytes: Uint8Array;
      try {
        bytes = new Uint8Array(await f.arrayBuffer());
      } catch {
        setResults((x) => [{ name: f.name, ok: false, text: "The file could not be read." }, ...x]);
        continue;
      }
      await runImport({ name: f.name, bytes });
    }
  };

  return (
    <div className="stack">
      <Tabs
        label="Import method"
        value={mode}
        onChange={setMode}
        tabs={[
          { id: "file", label: "Import files" },
          { id: "paste", label: "Paste notes" },
        ]}
      />
      {mode === "file" ? (
        <div
          className={`dropzone ${over ? "over" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            void handleFiles([...e.dataTransfer.files]);
          }}
        >
          <Icon name="upload" style={{ width: 32, height: 32 }} />
          <p>Drop PDF, Markdown or text files here</p>
          <Button variant="primary" onClick={async () => handleFiles(await pickFiles(ACCEPTED_EXTENSIONS, true))} disabled={!!progress}>
            Choose files…
          </Button>
          {!compact && <p className="subtle" style={{ marginTop: 12 }}>Text-based PDFs only; scanned PDFs need OCR first. Up to 200 MB per file.</p>}
        </div>
      ) : (
        <div className="stack">
          <Field label="Title">
            <input className="input" value={paste.title} onChange={(e) => setPaste({ ...paste, title: e.target.value })} placeholder="Pasted notes" />
          </Field>
          <Field label="Text" hint="Markdown headings (#) split the text into sections.">
            <textarea className="textarea" rows={8} value={paste.text} onChange={(e) => setPaste({ ...paste, text: e.target.value })} />
          </Field>
          <div>
            <Button
              variant="primary"
              disabled={!paste.text.trim()}
              onClick={async () => {
                try {
                  const m = await importPasted(services.repo, certId, paste.title, paste.text);
                  setPaste({ title: "", text: "" });
                  setResults((x) => [{ name: m.title, ok: true, text: "Saved as notes.", materialId: m.id }, ...x]);
                  toast("Notes saved.", "success");
                } catch (e) {
                  toast((e as Error).message, "error");
                }
              }}
            >
              Save notes
            </Button>
          </div>
        </div>
      )}

      {progress && (
        <div className="card flat tight stack" role="status" aria-live="polite">
          <div className="row between">
            <strong>{progress.name}</strong>
            <Button size="sm" variant="ghost" onClick={() => abortRef.current?.abort()}>
              Cancel
            </Button>
          </div>
          <span className="subtle">{progress.message}</span>
          {progress.fraction != null ? <Progress value={progress.fraction} label="Import progress" /> : <span className="spinner" />}
        </div>
      )}

      {results.length > 0 && (
        <ul className="list" aria-label="Import results">
          {results.map((r, i) => (
            <li key={i} className="row">
              <Icon name={r.ok ? "check" : "alert"} style={{ width: 18, height: 18, color: r.ok ? "var(--success)" : "var(--danger)" }} />
              <div className="grow">
                <strong>{r.name}</strong>
                <div className="subtle">{r.text}</div>
              </div>
              {r.materialId && (
                <Button size="sm" onClick={() => navigate({ view: "reader", materialId: r.materialId! })}>
                  Open
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!pending}
        onClose={() => setPending(null)}
        title={pending?.outcome.status === "duplicate" ? "Already imported" : "OCR required"}
        footer={
          pending && (
            <>
              <Button onClick={() => setPending(null)}>Don't import</Button>
              {pending.outcome.status === "duplicate" ? (
                <>
                  <Button onClick={() => (navigate({ view: "reader", materialId: (pending.outcome as { existing: Material }).existing.id }), setPending(null))}>Open existing</Button>
                  <Button variant="primary" onClick={() => (setPending(null), void runImport(pending.file, { allowDuplicate: true }))}>
                    Import a second copy
                  </Button>
                </>
              ) : (
                <Button onClick={() => (setPending(null), void runImport(pending.file, { keepImageOnly: true }))}>Keep original without text</Button>
              )}
            </>
          )
        }
      >
        {pending?.outcome.status === "duplicate" ? (
          <p>
            “{pending.file.name}” has the same contents as “{pending.outcome.existing.title}”, imported {fmtDate(pending.outcome.existing.createdAt)}.
          </p>
        ) : (
          <p>{pending?.outcome.status === "needs_ocr" ? pending.outcome.message : null}</p>
        )}
      </Dialog>
    </div>
  );
}

function MaterialEditor({ material, certId, onClose }: { material: Material; certId: Id; onClose: () => void }) {
  const { repo } = useServices();
  const obj = useObjectives(certId);
  const links = useLive((r) => r.getLinks("material", [material.id]), [material.id]);
  const [title, setTitle] = useState(material.title);
  const [tags, setTags] = useState(material.tags.join(", "));
  const [objIds, setObjIds] = useState<Id[] | null>(null);
  const current = objIds ?? links.data?.get(material.id) ?? [];
  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit material"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={async () => {
              await repo.updateMaterial(material.id, { title, tags: parseTags(tags) });
              await repo.setLinks("material", material.id, current);
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
        <Field label="Tags" hint="Comma-separated">
          <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} />
        </Field>
        {obj.data && <ObjectivePicker domains={obj.data.domains} objectives={obj.data.objectives} value={current} onChange={setObjIds} />}
      </div>
    </Dialog>
  );
}

export function Library() {
  return <RequireCert title="Library">{(cert) => <LibraryInner certId={cert.id} />}</RequireCert>;
}

function LibraryInner({ certId }: { certId: Id }) {
  const navigate = useApp((s) => s.navigate);
  const { repo, speech } = useServices();
  const materials = useLive((r) => r.listMaterials(certId), [certId]);
  const links = useLive(async (r) => r.getLinks("material", (await r.listMaterials(certId)).map((m) => m.id)), [certId]);
  const obj = useObjectives(certId);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const hits = useLive((r) => r.search(certId, q), [certId, q]);
  const [showImport, setShowImport] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);

  const allTags = [...new Set((materials.data ?? []).flatMap((m) => m.tags))].sort();
  const list = (materials.data ?? []).filter((m) => !tag || m.tags.includes(tag));

  return (
    <Page
      title="Library"
      subtitle="Your imported study material"
      actions={
        <Button variant="primary" icon="plus" onClick={() => setShowImport(true)}>
          Add material
        </Button>
      }
    >
      <div className="stack lg">
        <div className="row">
          <div className="grow" style={{ position: "relative" }}>
            <label className="sr-only" htmlFor="lib-search">
              Search all material
            </label>
            <input id="lib-search" className="input" type="search" placeholder="Search all material…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {allTags.length > 0 && (
            <select className="select" style={{ width: "auto" }} value={tag} onChange={(e) => setTag(e.target.value)} aria-label="Filter by tag">
              <option value="">All tags</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </div>

        {q.trim() ? (
          <div className="card">
            <h2>Search results</h2>
            {hits.loading && !hits.data ? (
              <Loading />
            ) : hits.data?.length ? (
              <ul className="list">
                {hits.data.map((h, i) => (
                  <li key={i}>
                    <button className="btn ghost" style={{ height: "auto", padding: 8, textAlign: "left", whiteSpace: "normal", display: "block", width: "100%" }} onClick={() => navigate({ view: "reader", materialId: h.materialId, sectionIdx: h.sectionIdx })}>
                      <strong>{h.title}</strong> <span className="subtle">· {h.label}</span>
                      <div className="subtle">{h.snippet}</div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No matches for “{q}”.</p>
            )}
          </div>
        ) : null}

        {materials.error ? (
          <ErrorState error={materials.error} onRetry={materials.reload} />
        ) : !materials.data ? (
          <Loading />
        ) : list.length === 0 ? (
          <div className="card">
            <Empty icon="book" title={tag ? "No material with this tag" : "No material yet"}>
              Import PDFs, Markdown or text files, or paste your own notes.
            </Empty>
            {!tag && <ImportPanel certId={certId} />}
          </div>
        ) : (
          <div className="grid">
            {list.map((m) => {
              const pct = m.sectionCount ? Math.round(((Math.min(m.furthestSection + 1, m.sectionCount)) / m.sectionCount) * 100) : 0;
              return (
                <article key={m.id} className="card tight stack" style={{ gap: 8 }}>
                  <div className="row between" style={{ alignItems: "flex-start" }}>
                    <h3 style={{ margin: 0 }}>{m.title}</h3>
                    <span className="badge">{m.kind.toUpperCase()}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {m.isSample && <SampleBadge />}
                    {m.status === "needs_ocr" && <span className="badge amber">Needs OCR</span>}
                    {m.statusDetail && m.status === "ready" && <span className="badge amber" title={m.statusDetail}>Some pages lack text</span>}
                    {m.tags.map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>
                  {obj.data && <ObjectiveTags ids={links.data?.get(m.id) ?? []} objectives={obj.data.objectives} />}
                  <div className="subtle">
                    {m.sectionCount} section{m.sectionCount === 1 ? "" : "s"} · {Math.round(m.charCount / 1000)}k characters · added {fmtDate(m.createdAt)}
                  </div>
                  <Progress value={pct} max={100} label={`Read ${pct}%`} />
                  <div className="row" style={{ marginTop: 4 }}>
                    <Button size="sm" variant="primary" onClick={() => navigate({ view: "reader", materialId: m.id, sectionIdx: m.position?.sectionIdx })}>
                      {m.position ? "Continue" : "Open"}
                    </Button>
                    <Button size="sm" variant="ghost" icon="edit" onClick={() => setEditing(m)}>
                      Edit
                    </Button>
                    <ConfirmButton
                      size="sm"
                      label="Delete"
                      confirmLabel={`Delete “${m.title}” and its highlights and bookmarks (notes, cards and questions are kept)`}
                      onConfirm={async () => {
                        speech.documentChanged(m.id);
                        await repo.deleteMaterial(m.id);
                      }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <Dialog open={showImport} onClose={() => setShowImport(false)} title="Add material" wide>
        <ImportPanel certId={certId} />
      </Dialog>
      {editing && <MaterialEditor material={editing} certId={certId} onClose={() => setEditing(null)} />}
      {materials.data?.some((m) => m.status === "needs_ocr") && (
        <div style={{ marginTop: 16 }}>
          <Notice kind="warn">Some materials are scanned images without selectable text. Run them through an OCR tool and import the result to search, read aloud, or make cards from them.</Notice>
        </div>
      )}
    </Page>
  );
}
