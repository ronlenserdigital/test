import { useState, type ReactNode } from "react";
import { useApp } from "../state/store";
import { useCert, useLive } from "../state/hooks";
import type { Certification, Domain, Id, Objective } from "../domain/types";
import { Button, Empty, ErrorState, Loading } from "../ui/components";
import { Icon } from "../ui/icons";

export function Page({ title, actions, children, subtitle }: { title: string; actions?: ReactNode; children: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div>}
        </div>
        {actions && <div className="row">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/** Renders children only when a certification is selected. */
export function RequireCert({ title, children }: { title: string; children: (cert: Certification) => ReactNode }) {
  const cert = useCert();
  const navigate = useApp((s) => s.navigate);
  if (cert.error) return <Page title={title}><ErrorState error={cert.error} onRetry={cert.reload} /></Page>;
  if (cert.data === undefined) return <Page title={title}><Loading /></Page>;
  if (!cert.data) {
    return (
      <Page title={title}>
        <Empty icon="target" title="No certification yet" action={<Button variant="primary" onClick={() => navigate({ view: "onboarding" })}>Set up a certification</Button>}>
          Create a certification workspace to start studying.
        </Empty>
      </Page>
    );
  }
  return <>{children(cert.data)}</>;
}

export function SourceLink({ materialId, sectionIdx, label }: { materialId: Id | null; sectionIdx: number | null; label: string }) {
  const navigate = useApp((s) => s.navigate);
  if (!label && !materialId) return null;
  return (
    <span className="source-ref">
      <Icon name="link" style={{ width: 13, height: 13 }} />
      {materialId ? (
        <button onClick={() => navigate({ view: "reader", materialId, sectionIdx: sectionIdx ?? undefined })} title="Open source in reader">
          {label || "Open source"}
        </button>
      ) : (
        <span>{label}</span>
      )}
    </span>
  );
}

export function useObjectives(certId: Id) {
  return useLive(async (r) => ({ domains: await r.listDomains(certId), objectives: await r.listObjectives(certId) }), [certId]);
}

export function objectiveLabel(o: Objective) {
  return o.code ? `${o.code} ${o.title}` : o.title;
}

export function ObjectiveTags({ ids, objectives }: { ids: Id[]; objectives: Objective[] }) {
  if (!ids.length) return null;
  const byId = new Map(objectives.map((o) => [o.id, o]));
  return (
    <span className="row" style={{ gap: 4 }}>
      {ids.map((id) => byId.get(id)).filter(Boolean).map((o) => (
        <span key={o!.id} className="badge blue" title={o!.title}>
          {o!.code || o!.title.slice(0, 24)}
        </span>
      ))}
    </span>
  );
}

/** Checkbox list of objectives grouped by domain. */
export function ObjectivePicker({ domains, objectives, value, onChange }: { domains: Domain[]; objectives: Objective[]; value: Id[]; onChange: (ids: Id[]) => void }) {
  const [filter, setFilter] = useState("");
  if (!objectives.length) return <p className="subtle">No exam objectives yet. Add them in Certification → Objectives.</p>;
  const toggle = (id: Id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const f = filter.toLowerCase();
  const groups = [...domains.map((d) => ({ id: d.id as Id | null, name: d.name })), { id: null, name: "Unassigned" }];
  return (
    <fieldset style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, maxHeight: 240, overflowY: "auto" }}>
      <legend className="subtle">Exam objectives</legend>
      {objectives.length > 8 && <input className="input" placeholder="Filter objectives" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter objectives" style={{ marginBottom: 8 }} />}
      {groups.map((g) => {
        const os = objectives.filter((o) => o.domainId === g.id && objectiveLabel(o).toLowerCase().includes(f));
        if (!os.length) return null;
        return (
          <div key={g.id ?? "none"} style={{ marginBottom: 8 }}>
            <div className="subtle" style={{ fontWeight: 600 }}>{g.name}</div>
            {os.map((o) => (
              <label key={o.id} className="row" style={{ gap: 8, flexWrap: "nowrap", alignItems: "flex-start", padding: "2px 0" }}>
                <input type="checkbox" checked={value.includes(o.id)} onChange={() => toggle(o.id)} style={{ marginTop: 4 }} />
                <span>{objectiveLabel(o)}</span>
              </label>
            ))}
          </div>
        );
      })}
    </fieldset>
  );
}
