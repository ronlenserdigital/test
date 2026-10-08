import { useState } from "react";
import { useApp, updatePrefs } from "../state/store";
import { useServices } from "../state/hooks";
import { Button, Field, Notice } from "../ui/components";
import { Logo } from "../ui/icons";
import { createSampleWorkspace } from "../data/sample";
import { ImportPanel } from "./Library";
import type { Certification } from "../domain/types";

export function Onboarding() {
  const { repo } = useServices();
  const navigate = useApp((s) => s.navigate);
  const toast = useApp((s) => s.toast);
  const [step, setStep] = useState(0);
  const [cert, setCert] = useState<Certification | null>(null);
  const [form, setForm] = useState({ name: "", provider: "", examCode: "", examVersion: "", examDate: "" });
  const [goal, setGoal] = useState({ dailyMinutes: 30, dailyCards: 20, examDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await updatePrefs((p) => ({ ...p, onboarded: true, currentCertId: cert?.id ?? p.currentCertId }));
    navigate({ view: "dashboard" });
  };

  const createCert = async (skip: boolean) => {
    setError(null);
    if (!skip && !form.name.trim()) {
      setError("Enter a certification name, or skip to use a placeholder you can rename later.");
      return;
    }
    setBusy(true);
    try {
      const c = await repo.createCertification({
        name: skip ? "My certification" : form.name,
        provider: form.provider,
        examCode: form.examCode,
        examVersion: form.examVersion,
        examDate: form.examDate || null,
      });
      setCert(c);
      setGoal((g) => ({ ...g, examDate: form.examDate }));
      await updatePrefs((p) => ({ ...p, currentCertId: c.id }));
      setStep(1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const useSample = async () => {
    setBusy(true);
    try {
      const c = await createSampleWorkspace(repo);
      await updatePrefs((p) => ({ ...p, currentCertId: c.id, onboarded: true }));
      toast("Sample workspace created. Remove it any time in Settings → Data.", "success");
      navigate({ view: "dashboard" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="row" style={{ marginBottom: 24 }}>
        <div style={{ width: 40 }}>
          <Logo />
        </div>
        <strong style={{ fontSize: "1.2rem" }}>StudyMode</strong>
      </div>
      <div className="steps" aria-label={`Step ${step + 1} of 3`}>
        {[0, 1, 2].map((i) => (
          <div key={i} className={i <= step ? "on" : ""} />
        ))}
      </div>

      {step === 0 && (
        <div className="card stack">
          <h1>Which certification are you studying for?</h1>
          <p className="muted">Enter the details exactly as your exam provider lists them. You can change everything later.</p>
          <Field label="Certification name" error={error}>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. the full certification title" autoFocus />
          </Field>
          <div className="form-grid">
            <Field label="Provider">
              <input className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </Field>
            <Field label="Exam code" hint="As printed by the provider">
              <input className="input" value={form.examCode} onChange={(e) => setForm({ ...form, examCode: e.target.value })} />
            </Field>
            <Field label="Exam version">
              <input className="input" value={form.examVersion} onChange={(e) => setForm({ ...form, examVersion: e.target.value })} />
            </Field>
            <Field label="Exam date (optional)">
              <input className="input" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
            </Field>
          </div>
          <div className="row between">
            <Button variant="ghost" onClick={() => void createCert(true)} disabled={busy}>
              Skip for now
            </Button>
            <Button variant="primary" onClick={() => void createCert(false)} busy={busy}>
              Continue
            </Button>
          </div>
          <Notice kind="plain">
            Just exploring?{" "}
            <Button size="sm" variant="ghost" onClick={() => void useSample()} disabled={busy}>
              Open a labelled sample workspace
            </Button>
          </Notice>
        </div>
      )}

      {step === 1 && cert && (
        <div className="card stack">
          <h1>Set a daily study goal</h1>
          <p className="muted">Your daily plan is sized to this goal. Nothing is judged; adjust it whenever you like.</p>
          <div className="form-grid">
            <Field label="Minutes per day">
              <input className="input" type="number" min={5} max={600} value={goal.dailyMinutes} onChange={(e) => setGoal({ ...goal, dailyMinutes: Number(e.target.value) })} />
            </Field>
            <Field label="New flashcards per day">
              <input className="input" type="number" min={0} max={500} value={goal.dailyCards} onChange={(e) => setGoal({ ...goal, dailyCards: Number(e.target.value) })} />
            </Field>
            <Field label="Exam date (optional)">
              <input className="input" type="date" value={goal.examDate} onChange={(e) => setGoal({ ...goal, examDate: e.target.value })} />
            </Field>
          </div>
          <div className="row between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              Skip
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await repo.updateCertification(cert.id, {
                  dailyMinutes: Math.max(5, Math.min(600, goal.dailyMinutes || 30)),
                  dailyCards: Math.max(0, Math.min(500, goal.dailyCards || 0)),
                  examDate: goal.examDate || null,
                });
                setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && cert && (
        <div className="card stack">
          <h1>Add your study material</h1>
          <p className="muted">Import PDFs, Markdown or text files, or paste notes. Files are copied into StudyMode's own storage on this device.</p>
          <ImportPanel certId={cert.id} compact />
          <div className="row between">
            <Button variant="ghost" onClick={() => void finish()}>
              Skip
            </Button>
            <Button variant="primary" onClick={() => void finish()}>
              Go to today's plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
