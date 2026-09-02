"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { TextField, TextArea, SelectField } from "@/components/ui/form-field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/icons/icon";
import { CONTACT_INTENTS, CONTACT_NEEDS, FREE_MAIL, intentLabels, type ContactIntent } from "@/lib/validation/contact";
import { track } from "@/lib/analytics/events";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

const needLabels: Record<(typeof CONTACT_NEEDS)[number], string> = {
  "managed-it": "Managed IT Services",
  "co-managed-it": "Co-Managed IT",
  cybersecurity: "Cybersecurity Services",
  "security-risk-advisory": "Security & Risk Advisory",
  "cloud-infrastructure": "Cloud & Infrastructure",
  "network-management": "Network Management",
  "backup-disaster-recovery": "Backup & Disaster Recovery",
  "software-development": "Software Development",
  "web-application-engineering": "Web & Ecommerce Engineering",
  "ai-automation": "AI & Automation",
  "not-sure": "Not sure yet",
};

interface Props {
  initialIntent: ContactIntent;
  initialNeed?: string;
}

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void };
  }
}

export function ContactForm({ initialIntent, initialNeed }: Props) {
  const router = useRouter();
  const [intent, setIntent] = useState<ContactIntent>(initialIntent);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<string | undefined>();
  const startedAt = useRef<number>(0);
  const started = useRef(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileToken = useRef<string>("");

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const [seenIntent, setSeenIntent] = useState(initialIntent);
  if (seenIntent !== initialIntent) {
    setSeenIntent(initialIntent);
    setIntent(initialIntent);
  }

  const needOptions = useMemo(() => CONTACT_NEEDS.map((n) => ({ value: n, label: needLabels[n] })), []);
  const intentOptions = useMemo(() => CONTACT_INTENTS.map((i) => ({ value: i, label: intentLabels[i] })), []);

  const onFirstInteraction = () => {
    if (started.current) return;
    started.current = true;
    track(intent === "assessment" ? "assessment_start" : "contact_start", { intent });
  };

  const renderTurnstile = () => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current || !window.turnstile) return;
    window.turnstile.render(turnstileRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "light",
      callback: (token: string) => {
        turnstileToken.current = token;
      },
      "expired-callback": () => {
        turnstileToken.current = "";
      },
    });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      company: fd.get("company"),
      phone: fd.get("phone"),
      intent: fd.get("intent"),
      need: fd.get("need"),
      message: fd.get("message"),
      consent: fd.get("consent") === "on",
      website: fd.get("website"),
      startedAt: startedAt.current,
      turnstileToken: turnstileToken.current || undefined,
      page: window.location.pathname + window.location.search,
    };
    setStatus("submitting");
    setFormError(null);
    setErrors({});
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const data = (await res.json()) as { ok: boolean; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setFormError(data.error ?? "Something went wrong. Please try again.");
        if (data.fieldErrors) setErrors(data.fieldErrors);
        window.turnstile?.reset();
        return;
      }
      track(payload.intent === "assessment" ? "assessment_submit" : "contact_submit", { intent: String(payload.intent), need: String(payload.need ?? "") });
      router.push(`/contact/thanks?intent=${encodeURIComponent(String(payload.intent))}`);
    } catch {
      setStatus("error");
      setFormError("Network error. Please check your connection and try again.");
    }
  }

  const isSecurity = intent === "security";
  const isSupport = intent === "support";

  return (
    <form onSubmit={onSubmit} onFocusCapture={onFirstInteraction} noValidate className="flex flex-col gap-5" aria-describedby={formError ? "form-error" : undefined}>
      {TURNSTILE_SITE_KEY ? <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="lazyOnload" onLoad={renderTurnstile} /> : null}

      <SelectField id="intent" label="How can we help?" required options={intentOptions} value={intent} onChange={(e) => setIntent(e.target.value as ContactIntent)} error={errors.intent} />

      {isSecurity ? (
        <div className="flex gap-3 rounded-md border border-warning/40 bg-surface-2 p-4 text-sm text-fg-2" role="note">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-warning" />
          <p>
            For a vulnerability report or an active incident, describe the general nature only. Do not include exploit details, credentials or affected system names here; we will arrange a secure channel. See{" "}
            <Link href="/trust/responsible-disclosure" className="text-accent underline">responsible disclosure</Link>.
          </p>
        </div>
      ) : null}
      {isSupport ? (
        <div className="flex gap-3 rounded-md border border-line bg-surface-2 p-4 text-sm text-fg-2" role="note">
          <Icon name="clock" size={18} className="mt-0.5 shrink-0 text-accent" />
          <p>Existing clients: use the support channel in your service agreement for time-sensitive issues. This form is monitored during business hours.</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField id="name" label="Name" required autoComplete="name" maxLength={120} error={errors.name} />
        <TextField
          id="email"
          label="Work email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          error={errors.email}
          hint={emailHint}
          onBlur={(e) => {
            const domain = e.target.value.split("@")[1]?.toLowerCase();
            setEmailHint(domain && FREE_MAIL.has(domain) ? "A work address helps us route your request to the right engineer." : undefined);
          }}
        />
        <TextField id="company" label="Organization" required autoComplete="organization" maxLength={160} error={errors.company} />
        <TextField id="phone" label="Phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={40} error={errors.phone} />
      </div>

      {!isSecurity && !isSupport ? <SelectField id="need" label="Service or need" options={needOptions} defaultValue={initialNeed && CONTACT_NEEDS.includes(initialNeed as never) ? initialNeed : "not-sure"} error={errors.need} /> : null}

      <TextArea
        id="message"
        label={isSecurity ? "General description" : "What is going on?"}
        required
        maxLength={4000}
        error={errors.message}
        hint={intent === "assessment" ? "Roughly how many users and sites, what you run today, and any deadline (audit, insurance renewal, migration)." : undefined}
      />

      {/* Honeypot: hidden from users and assistive tech; bots fill it. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex items-start gap-3">
        <input id="consent" name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[var(--accent-primary)]" aria-describedby={errors.consent ? "consent-error" : undefined} aria-invalid={errors.consent ? true : undefined} />
        <label htmlFor="consent" className="text-sm text-fg-2">
          I agree that Celestino may store this submission and contact me about it, as described in the{" "}
          <Link href="/privacy" className="text-accent underline">privacy policy</Link>.
        </label>
      </div>
      {errors.consent ? (
        <p id="consent-error" role="alert" className="-mt-3 text-xs font-medium text-danger">
          {errors.consent}
        </p>
      ) : null}

      {TURNSTILE_SITE_KEY ? <div ref={turnstileRef} className="min-h-[65px]" /> : null}

      {formError ? (
        <p id="form-error" role="alert" className="rounded-md border border-danger/40 bg-surface-2 p-3 text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" icon="arrow-right" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : intent === "assessment" ? "Request the assessment" : "Send message"}
        </Button>
        <p className="text-xs text-fg-muted">Responses within one business day. No sensitive incident details in this form.</p>
      </div>
    </form>
  );
}
