import { useEffect, useState } from "react";
import { useApp, updatePrefs } from "../state/store";
import { useLive, useServices, useAction } from "../state/hooks";
import { parseObjectivesCsv, parseOutline, type ParsedOutline } from "../domain/objectivesParse";
import { accuracyBy } from "../domain/analytics";
import type { Certification, Domain, Id, Objective } from "../domain/types";
import { Button, ConfirmButton, Dialog, Empty, Field, IconButton, Loading, Notice, SampleBadge, Tabs, pickFiles } from "../ui/components";
import { Page, RequireCert, objectiveLabel } from "./common";

export function Workspace() {
  return <RequireCert title="Certification">{(cert) => <WorkspaceInner cert={cert} />}</RequireCert>;
}

function DetailsForm({ cert }: { cert: Certification }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const [f, setF] = useState(cert);
  useEffect(() => setF(cert), [cert]);
  const dirty = JSON.stringify(f) !== JSON.stringify(cert);
  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => repo.updateCertification(cert.id, { ...f, dailyMinutes: Math.max(5, Math.min(600, f.dailyMinutes)), dailyCards: Math.max(0, Math.min(500, f.dailyCards)) }), "Saved.");
      }}
    >
      <div className="form-grid">
        <Field label="Certification name">
          <input className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Provider">
          <input className="input" value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value })} />
        </Field>
        <Field label="Exam code" hint="Exactly as the provider lists it">
          <input className="input" value={f.examCode} onChange={(e) => setF({ ...f, examCode: e.target.value })} />
        </Field>
        <Field label="Exam version">
          <input className="input" value={f.examVersion} onChange={(e) => setF({ ...f, examVersion: e.target.value })} />
        </Field>
        <Field label="Exam date">
          <input className="input" type="date" value={f.examDate ?? ""} onChange={(e) => setF({ ...f, examDate: e.target.value || null })} />
        </Field>
        <Field label="Daily study minutes">
          <input className="input" type="number" min={5} max={600} value={f.dailyMinutes} onChange={(e) => setF({ ...f, dailyMinutes: Number(e.target.value) })} />
        </Field>
        <Field label="New flashcards per day">
          <input className="input" type="number" min={0} max={500} value={f.dailyCards} onChange={(e) => setF({ ...f, dailyCards: Number(e.target.value) })} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className="textarea" rows={3} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="row">
        <Button type="submit" variant="primary" disabled={!dirty} busy={busy}>
          Save details
        </Button>
        {dirty && (
          <Button variant="ghost" onClick={() => setF(cert)}>
            Discard changes
          </Button>
        )}
      </div>
    </form>
  );
}

function OutlineImport({ certId, onClose }: { certId: Id; onClose: () => void }) {
  const { repo } = useServices();
  const { run, busy } = useAction();
  const [text, setText] = useState("");
  const [csv, setCsv] = useState(false);
  const [source, setSource] = useState("");
  const [version, setVersion] = useState("");
  const parsed: ParsedOutline | null = text.trim() ? (csv ? parseObjectivesCsv(text) : parseOutline(text)) : null;
  return (
    <Dialog
      open
      onClose={onClose}
      wide
      title="Import exam objectives"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            busy={busy}
            disabled={!parsed?.domains.length || !source.trim()}
            onClick={() =>
              void run(async () => {
                await repo.importOutline(certId, parsed!, source.trim(), version.trim());
                onClose();
              }, "Objectives imported.")
            }
          >
            Import {parsed ? `${parsed.domains.length} domains, ${parsed.domains.reduce((a, d) => a + d.objectives.length, 0)} objectives` : ""}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Notice kind="plain">Copy the objectives from your provider's official exam guide. StudyMode never fills in a syllabus, weights or passing score for you.</Notice>
        <div className="form-grid">
          <Field label="Source (required)" hint="e.g. the exam guide's title or URL">
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Source version" hint="e.g. guide version or date">
            <input className="input" value={version} onChange={(e) => setVersion(e.target.value)} />
          </Field>
        </div>
        <div className="row">
          <Button size="sm" onClick={async () => {
            const [f] = await pickFiles(".csv,.txt,.md");
            if (!f) return;
            const t = await f.text();
            setCsv(f.name.toLowerCase().endsWith(".csv"));
            setText(t);
          }}>
            Load from file…
          </Button>
          <label className="row subtle">
            <input type="checkbox" checked={csv} onChange={(e) => setCsv(e.target.checked)} /> CSV (domain, weight, code, objective)
          </label>
        </div>
        <Field
          label="Outline"
          hint={
            <>
              One item per line. “1.0 Domain name (20%)” starts a domain with an optional weight; “1.1 Objective” adds an objective; “- item” also works.
            </>
          }
        >
          <textarea className="textarea" rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder={"1.0 First domain (30%)\n1.1 First objective\n1.2 Second objective\n2.0 Second domain (70%)\n2.1 ..."} />
        </Field>
        {parsed && (
          <div className="card flat tight">
            <strong>Preview</strong>
            {parsed.warnings.map((w) => (
              <p key={w} className="subtle" style={{ color: "var(--accent-text)" }}>
                {w}
              </p>
            ))}
            <ul>
              {parsed.domains.map((d, i) => (
                <li key={i}>
                  {d.name} {d.weight != null && <span className="badge">{d.weight}%</span>} — {d.objectives.length} objective{d.objectives.length === 1 ? "" : "s"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function ObjectivesEditor({ certId }: { certId: Id }) {
  const { repo } = useServices();
  const data = useLive(async (r) => {
    const [domains, objectives, coverage, records] = await Promise.all([r.listDomains(certId), r.listObjectives(certId), r.objectiveCoverage(certId), r.answerRecords(certId)]);
    return { domains, objectives, coverage, acc: accuracyBy(records, (x) => x.objectiveIds) };
  }, [certId]);
  const [importing, setImporting] = useState(false);
  const [editDomain, setEditDomain] = useState<Partial<Domain> | null>(null);
  const [editObj, setEditObj] = useState<Partial<Objective> | null>(null);

  if (!data.data) return <Loading />;
  const { domains, objectives, coverage, acc } = data.data;
  const weights = domains.filter((d) => d.weight != null);
  const sum = weights.reduce((a, d) => a + (d.weight ?? 0), 0);

  return (
    <div className="stack">
      <div className="row">
        <Button variant="primary" icon="upload" onClick={() => setImporting(true)}>
          Import outline
        </Button>
        <Button icon="plus" onClick={() => setEditDomain({ name: "", weight: null })}>
          Add domain
        </Button>
        <Button icon="plus" onClick={() => setEditObj({ title: "", code: "", domainId: domains[0]?.id ?? null })}>
          Add objective
        </Button>
      </div>
      {weights.length > 0 && weights.length < domains.length && <Notice kind="warn">Some domains have no weight. Weighted practice exams are disabled until every domain has one.</Notice>}
      {weights.length === domains.length && domains.length > 0 && Math.abs(sum - 100) > 1 && <Notice kind="warn">Domain weights add up to {sum}%. They are used as relative weights.</Notice>}
      {domains.length === 0 && objectives.length === 0 ? (
        <Empty icon="target" title="No objectives yet">
          Paste the exam objectives from your provider's exam guide to track coverage and weak areas.
        </Empty>
      ) : (
        [...domains, null].map((d) => {
          const os = objectives.filter((o) => o.domainId === (d?.id ?? null));
          if (!d && os.length === 0) return null;
          return (
            <section key={d?.id ?? "none"} className="card tight">
              <div className="card-head">
                <div>
                  <h3 style={{ margin: 0 }}>
                    {d?.name ?? "Unassigned"} {d?.weight != null && <span className="badge">{d.weight}%</span>}
                  </h3>
                  {d?.source && (
                    <div className="subtle">
                      Source: {d.source}
                      {d.sourceVersion ? ` (${d.sourceVersion})` : ""}
                    </div>
                  )}
                </div>
                {d && (
                  <div className="row">
                    <IconButton size="sm" variant="ghost" icon="edit" label={`Edit domain ${d.name}`} onClick={() => setEditDomain(d)} />
                    <ConfirmButton size="sm" variant="ghost" label="Delete" confirmLabel={`Delete domain “${d.name}” and its objectives`} onConfirm={() => void repo.deleteDomain(d.id)} />
                  </div>
                )}
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Objective</th>
                    <th>Linked</th>
                    <th>Practice</th>
                    <th>
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {os.map((o) => {
                    const c = coverage.get(o.id);
                    const a = acc.get(o.id);
                    return (
                      <tr key={o.id}>
                        <td>{objectiveLabel(o)}</td>
                        <td className="subtle">{c ? `${c.material} material · ${c.note} notes · ${c.card} cards · ${c.question} questions` : "Nothing linked"}</td>
                        <td className="subtle">{a ? `${Math.round((a.correct / a.total) * 100)}% of ${a.total}` : "—"}</td>
                        <td>
                          <div className="row" style={{ flexWrap: "nowrap" }}>
                            <IconButton size="sm" variant="ghost" icon="edit" label={`Edit ${o.title}`} onClick={() => setEditObj(o)} />
                            <IconButton size="sm" variant="ghost" icon="trash" label={`Delete ${o.title}`} onClick={() => void repo.deleteObjective(o.id)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })
      )}
      {importing && <OutlineImport certId={certId} onClose={() => setImporting(false)} />}
      {editDomain && (
        <DomainDialog
          initial={editDomain}
          onClose={() => setEditDomain(null)}
          onSave={async (v) => {
            await repo.saveDomain({ ...editDomain, ...v, certId, position: editDomain.position ?? domains.length });
            setEditDomain(null);
          }}
        />
      )}
      {editObj && (
        <ObjectiveDialog
          initial={editObj}
          domains={domains}
          onClose={() => setEditObj(null)}
          onSave={async (v) => {
            await repo.saveObjective({ ...editObj, ...v, certId, position: editObj.position ?? objectives.filter((o) => o.domainId === v.domainId).length });
            setEditObj(null);
          }}
        />
      )}
    </div>
  );
}

function DomainDialog({ initial, onClose, onSave }: { initial: Partial<Domain>; onClose: () => void; onSave: (v: { name: string; weight: number | null; source: string; sourceVersion: string }) => Promise<void> }) {
  const [name, setName] = useState(initial.name ?? "");
  const [weight, setWeight] = useState(initial.weight != null ? String(initial.weight) : "");
  const [source, setSource] = useState(initial.source ?? "");
  const [ver, setVer] = useState(initial.sourceVersion ?? "");
  const w = weight.trim() === "" ? null : Number(weight);
  const bad = w != null && (!Number.isFinite(w) || w <= 0 || w > 100);
  return (
    <Dialog
      open
      onClose={onClose}
      title={initial.id ? "Edit domain" : "Add domain"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!name.trim() || bad} onClick={() => void onSave({ name, weight: w, source, sourceVersion: ver })}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Weight (%)" hint="Leave blank unless your official source states it." error={bad ? "Enter a number between 0 and 100." : null}>
          <input className="input" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </Field>
        <div className="form-grid">
          <Field label="Source">
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Source version">
            <input className="input" value={ver} onChange={(e) => setVer(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function ObjectiveDialog({ initial, domains, onClose, onSave }: { initial: Partial<Objective>; domains: Domain[]; onClose: () => void; onSave: (v: { code: string; title: string; domainId: Id | null; source: string; sourceVersion: string }) => Promise<void> }) {
  const [code, setCode] = useState(initial.code ?? "");
  const [title, setTitle] = useState(initial.title ?? "");
  const [domainId, setDomainId] = useState<Id | null>(initial.domainId ?? null);
  const [source, setSource] = useState(initial.source ?? "");
  const [ver, setVer] = useState(initial.sourceVersion ?? "");
  return (
    <Dialog
      open
      onClose={onClose}
      title={initial.id ? "Edit objective" : "Add objective"}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!title.trim()} onClick={() => void onSave({ code, title, domainId, source, sourceVersion: ver })}>
            Save
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="form-grid">
          <Field label="Code">
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 1.2" />
          </Field>
          <Field label="Domain">
            <select className="select" value={domainId ?? ""} onChange={(e) => setDomainId(e.target.value || null)}>
              <option value="">Unassigned</option>
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Objective">
          <textarea className="textarea" rows={2} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </Field>
        <div className="form-grid">
          <Field label="Source">
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Source version">
            <input className="input" value={ver} onChange={(e) => setVer(e.target.value)} />
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

function WorkspaceInner({ cert }: { cert: Certification }) {
  const { repo, speech } = useServices();
  const navigate = useApp((s) => s.navigate);
  const [tab, setTab] = useState<"details" | "objectives">("objectives");
  return (
    <Page
      title={cert.name}
      subtitle={
        <>
          {[cert.provider, cert.examCode, cert.examVersion].filter(Boolean).join(" · ") || "No exam details yet"} {cert.isSample && <SampleBadge />}
        </>
      }
      actions={
        <ConfirmButton
          label="Delete certification"
          confirmLabel={`Permanently delete “${cert.name}” with all its materials, notes, cards, questions and history`}
          onConfirm={async () => {
            speech.stop();
            await repo.deleteCertification(cert.id);
            const rest = await repo.listCertifications();
            await updatePrefs((p) => ({ ...p, currentCertId: rest[0]?.id ?? null }));
            navigate(rest.length ? { view: "dashboard" } : { view: "onboarding" });
          }}
        />
      }
    >
      <Tabs
        label="Certification sections"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "objectives", label: "Domains & objectives" },
          { id: "details", label: "Exam details & goals" },
        ]}
      />
      {tab === "details" ? <DetailsForm cert={cert} /> : <ObjectivesEditor certId={cert.id} />}
    </Page>
  );
}
