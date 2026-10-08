import { useState } from "react";
import { useApp } from "../state/store";
import { useLive, useNow, useServices } from "../state/hooks";
import { loadPlan } from "../state/planData";
import { applyAdjustments, type PlanAdjustments, type PlanItem } from "../domain/plan";
import { startFocus } from "../state/focus";
import { Button, Empty, ErrorState, IconButton, Loading, Notice, Progress, SampleBadge } from "../ui/components";
import { Icon } from "../ui/icons";
import { Page, RequireCert } from "./common";
import { focusTaskDraft } from "./Focus";
import type { Certification } from "../domain/types";

export function Dashboard() {
  return <RequireCert title="Today">{(cert) => <DashboardInner cert={cert} />}</RequireCert>;
}

function DashboardInner({ cert }: { cert: Certification }) {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const timer = useApp((s) => s.timer);
  const now = useNow(60_000);
  const data = useLive((r) => loadPlan(r, cert, now), [cert, Math.floor(now / 300_000)]);
  const [adding, setAdding] = useState("");

  if (data.error) return <Page title="Today"><ErrorState error={data.error} onRetry={data.reload} /></Page>;
  if (!data.data) return <Page title="Today"><Loading /></Page>;
  const d = data.data;
  const key = `plan:${cert.id}:${d.today}`;
  const adj: PlanAdjustments = d.adjustments ?? { removed: [], order: [], custom: [], done: [] };
  const items = applyAdjustments(d.plan.items, adj);
  const save = (next: PlanAdjustments) => repo.setSetting(key, next);
  const firstOpen = items.find((i) => !i.done);

  const openItem = (item: PlanItem) => {
    switch (item.kind) {
      case "review":
        return navigate({ view: "review" });
      case "mistakes":
        return navigate({ view: "quiz", attemptId: undefined }), sessionStorage.setItem("quizPreset", "review");
      case "weak":
        return sessionStorage.setItem("quizPreset", "weak"), navigate({ view: "quiz" });
      case "practice":
        return sessionStorage.setItem("quizPreset", "quick"), navigate({ view: "quiz" });
      case "read":
        return item.targetId ? navigate({ view: "reader", materialId: item.targetId }) : navigate({ view: "library" });
      default:
        return navigate({ view: "focus" });
    }
  };

  const startStudying = () => {
    const item = firstOpen;
    if (!timer) {
      focusTaskDraft.value = item?.title ?? "Study";
      startFocus(item?.title ?? "Study");
    }
    if (item) openItem(item);
    else navigate({ view: "focus" });
  };

  const move = (id: string, dir: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void save({ ...adj, order: ids });
  };

  const pct = cert.dailyMinutes ? Math.min(100, Math.round((d.minutesToday / cert.dailyMinutes) * 100)) : 0;

  return (
    <Page title="Today" subtitle={new Date(now).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}>
      <div className="stack lg">
        <section className="card hero" aria-labelledby="hero-title">
          <div className="stack" style={{ gap: 6 }}>
            <h2 id="hero-title" style={{ margin: 0 }}>
              {cert.name} {cert.isSample && <SampleBadge />}
            </h2>
            <div className="muted">
              {[cert.provider, cert.examCode, cert.examVersion].filter(Boolean).join(" · ") || "Add exam details in Certification"}
            </div>
            <div>{d.plan.message}</div>
          </div>
          <Button variant="primary" size="lg" icon="play" onClick={startStudying}>
            {timer ? "Continue studying" : "Start studying"}
          </Button>
        </section>

        <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          <div className="card tight stat">
            <b>{d.counts.due}</b>
            <span>cards due now</span>
          </div>
          <div className="card tight stat">
            <b>{d.mistakes}</b>
            <span>questions to retry</span>
          </div>
          <div className="card tight stat">
            <b>
              {d.minutesToday}
              <small className="subtle"> / {cert.dailyMinutes} min</small>
            </b>
            <span>focused today</span>
            <Progress value={pct} max={100} label="Daily goal progress" />
          </div>
          <div className="card tight stat">
            <b>{d.streak.current}</b>
            <span>
              day streak · best {d.streak.longest}
            </span>
          </div>
        </div>

        <section className="card" aria-labelledby="plan-title">
          <div className="card-head">
            <h2 id="plan-title" style={{ margin: 0 }}>
              Your plan
            </h2>
            {d.adjustments && (
              <Button size="sm" variant="ghost" icon="refresh" onClick={() => void repo.deleteSetting(key)}>
                Reset plan
              </Button>
            )}
          </div>
          {items.length === 0 ? (
            <Empty icon="inbox" title="Nothing to plan yet" action={<Button variant="primary" onClick={() => navigate({ view: "library" })}>Add study material</Button>}>
              Import material, create flashcards, or add practice questions and your plan will build itself.
            </Empty>
          ) : (
            <ol className="list" style={{ listStyle: "none" }}>
              {items.map((item, i) => (
                <li key={item.id} className={`plan-item ${item.done ? "done" : ""}`}>
                  <input
                    type="checkbox"
                    aria-label={`Mark “${item.title}” done`}
                    checked={!!item.done}
                    onChange={(e) => void save({ ...adj, done: e.target.checked ? [...adj.done, item.id] : adj.done.filter((x) => x !== item.id) })}
                  />
                  <span className={`plan-dot ${item.kind}`} aria-hidden />
                  <div className="grow">
                    <strong>{item.title}</strong>
                    <div className="subtle">
                      {item.detail}
                      {item.minutes ? ` · ~${item.minutes} min` : ""}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openItem(item)}>
                    Open
                  </Button>
                  <IconButton size="sm" variant="ghost" icon="arrowLeft" label="Move up" style={{ transform: "rotate(90deg)" }} onClick={() => move(item.id, -1)} disabled={i === 0} />
                  <IconButton size="sm" variant="ghost" icon="arrowRight" label="Move down" style={{ transform: "rotate(90deg)" }} onClick={() => move(item.id, 1)} disabled={i === items.length - 1} />
                  <IconButton size="sm" variant="ghost" icon="x" label={`Remove “${item.title}” from today's plan`} onClick={() => void save({ ...adj, removed: [...adj.removed, item.id] })} />
                </li>
              ))}
            </ol>
          )}
          <form
            className="row"
            style={{ marginTop: 12 }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!adding.trim()) return;
              const item: PlanItem = { id: `custom:${Date.now()}`, kind: "custom", title: adding.trim(), detail: "Your task", minutes: 0 };
              void save({ ...adj, custom: [...adj.custom, item] });
              setAdding("");
            }}
          >
            <input className="input grow" placeholder="Add your own task for today" value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Add your own task" />
            <Button type="submit" icon="plus">
              Add
            </Button>
          </form>
        </section>

        {d.materials === 0 && (
          <Notice kind="info">
            <div className="row between">
              <span>Start by importing your study material.</span>
              <Button size="sm" variant="primary" onClick={() => navigate({ view: "library" })}>
                <Icon name="upload" /> Import
              </Button>
            </div>
          </Notice>
        )}
        {d.objectives === 0 && (
          <Notice kind="plain">
            <div className="row between">
              <span>Add your exam objectives to track coverage and find weak areas.</span>
              <Button size="sm" onClick={() => navigate({ view: "workspace" })}>
                Add objectives
              </Button>
            </div>
          </Notice>
        )}
      </div>
    </Page>
  );
}
