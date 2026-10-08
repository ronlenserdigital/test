import { useEffect, useId, useRef, type ReactNode, type ButtonHTMLAttributes } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Icon, type IconName } from "./icons";
import { isNative } from "../platform/env";

type BtnVariant = "primary" | "accent" | "ghost" | "danger" | "default";

export function Button({
  variant = "default",
  size,
  icon,
  children,
  className = "",
  busy,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "lg"; icon?: IconName; busy?: boolean }) {
  return (
    <button
      type="button"
      className={`btn ${variant !== "default" ? variant : ""} ${size ?? ""} ${!children ? "icon" : ""} ${className}`}
      aria-busy={busy || undefined}
      {...rest}
      disabled={rest.disabled || busy}
    >
      {busy ? <span className="spinner" aria-hidden /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

/** Icon-only button; label is required for accessibility. */
export function IconButton({ icon, label, ...rest }: Omit<Parameters<typeof Button>[0], "children"> & { icon: IconName; label: string }) {
  return <Button icon={icon} aria-label={label} title={label} {...rest} />;
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="hint">{hint}</small>}
      {error && (
        <small className="error-text" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}

export function Toggle({ checked, onChange, label, disabled, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; description?: ReactNode }) {
  const id = useId();
  return (
    <div className="switch">
      <button type="button" role="switch" aria-checked={checked} aria-labelledby={id} disabled={disabled} onClick={() => onChange(!checked)} />
      <span id={id} onClick={() => !disabled && onChange(!checked)}>
        {label}
        {description && (
          <>
            <br />
            <small className="subtle">{description}</small>
          </>
        )}
      </span>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <span id={id}>{label}</span>
      <div className="slider">
        <input type="range" aria-labelledby={id} min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={format(value)} />
        <output aria-hidden>{format(value)}</output>
      </div>
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className={`dialog ${wide ? "wide" : ""}`} onClose={onClose} onCancel={(e) => (e.preventDefault(), onClose())} aria-labelledby={headingId}>
      {open && (
        <>
          <div className="dialog-head">
            <h2 id={headingId}>{title}</h2>
            <IconButton icon="x" label="Close" variant="ghost" onClick={onClose} />
          </div>
          <div className="dialog-body">{children}</div>
          {footer && <div className="dialog-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

export function Empty({ icon = "inbox", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <Icon name={icon} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ kind = "info", children, icon }: { kind?: "info" | "warn" | "error" | "plain"; children: ReactNode; icon?: IconName }) {
  return (
    <div className={`notice ${kind}`} role={kind === "error" ? "alert" : undefined}>
      <Icon name={icon ?? (kind === "error" ? "alert" : kind === "warn" ? "alert" : "info")} />
      <div className="grow">{children}</div>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="row" role="status" style={{ padding: 24, justifyContent: "center" }}>
      <span className="spinner" aria-hidden />
      <span className="muted">{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <Notice kind="error">
      <p style={{ margin: 0 }}>{error.message || "Something went wrong."}</p>
      {onRetry && (
        <Button size="sm" onClick={onRetry} style={{ marginTop: 8 }}>
          Try again
        </Button>
      )}
    </Notice>
  );
}

export function Progress({ value, max = 1, label, tone }: { value: number; max?: number; label: string; tone?: "amber" }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`progress ${tone ?? ""}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => {
            const i = tabs.findIndex((x) => x.id === value);
            if (e.key === "ArrowRight") onChange(tabs[(i + 1) % tabs.length].id);
            if (e.key === "ArrowLeft") onChange(tabs[(i - 1 + tabs.length) % tabs.length].id);
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Explains why a control is unavailable instead of silently hiding it. */
export function Unavailable({ children }: { children: ReactNode }) {
  return (
    <p className="subtle" style={{ margin: 0 }}>
      <Icon name="lock" style={{ width: 14, height: 14, verticalAlign: "-2px" }} /> {children}
    </p>
  );
}

export function AiBadge() {
  return (
    <span className="ai-label" title="Generated by AI — review before relying on it">
      <Icon name="sparkle" style={{ width: 12, height: 12 }} /> AI-generated
    </span>
  );
}

export function SampleBadge() {
  return <span className="badge amber">Sample data</span>;
}

export function ConfirmButton({ label, confirmLabel = "Confirm", onConfirm, variant = "danger", ...rest }: { label: string; confirmLabel?: string; onConfirm: () => void } & Omit<Parameters<typeof Button>[0], "onClick">) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button variant={variant} {...rest} onClick={() => ref.current?.showModal()}>
        {label}
      </Button>
      <dialog ref={ref} className="dialog" aria-label={confirmLabel}>
        <div className="dialog-body">
          <p>{confirmLabel}?</p>
        </div>
        <div className="dialog-foot">
          <Button onClick={() => ref.current?.close()}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => {
              ref.current?.close();
              onConfirm();
            }}
          >
            {label}
          </Button>
        </div>
      </dialog>
    </>
  );
}

export function fmtMinutes(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min`;
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Save exported data. The desktop app shows the native Save dialog (via Rust);
 * the browser build downloads the file. Resolves false if the user cancelled.
 */
export async function downloadFile(name: string, data: Uint8Array | string, mime: string): Promise<boolean> {
  if (isNative()) {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    return invoke<boolean>("export_file", bytes, { headers: { "x-file-name": name } });
  }
  const blob = new Blob([typeof data === "string" ? data : (data as BlobPart)], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return true;
}

/** Open a native file picker and read the selection. */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve(input.files ? [...input.files] : []);
    input.click();
  });
}
