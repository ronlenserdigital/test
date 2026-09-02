import { NextResponse, type NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { contactSchema } from "@/lib/validation/contact";
import { getServiceClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MIN_FILL_MS = 3000;

function clientKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${ip}|${process.env.RATE_LIMIT_SALT ?? "celestino"}`).digest("hex").slice(0, 32);
}

async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // Turnstile not configured: rely on honeypot + timing + rate limit.
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

/** Same-origin check to complement SameSite defaults; blocks cross-site form posts. */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients are handled by rate limit + validation
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });

  const key = clientKey(req);
  const rl = rateLimit(key, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again shortly." }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(json);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string" && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return NextResponse.json({ ok: false, error: "Please correct the highlighted fields.", fieldErrors }, { status: 422 });
  }
  const data = parsed.data;

  // Bot controls: honeypot, minimum fill time, Turnstile (when configured).
  if (data.website && data.website.length > 0) return NextResponse.json({ ok: true }); // silently accept, do not store
  if (data.startedAt && Date.now() - data.startedAt < MIN_FILL_MS) return NextResponse.json({ ok: true });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ ok: false, error: "Verification failed. Please try again." }, { status: 400 });
  }

  const record = {
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone || null,
    intent: data.intent,
    need: data.need || null,
    message: data.message,
    source_page: data.page ?? null,
    client_hash: key,
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
  };

  const supabase = getServiceClient();
  if (supabase) {
    const { error } = await supabase.from("contact_submissions").insert(record);
    if (error) {
      console.error("contact_submissions insert failed", { code: error.code });
      return NextResponse.json({ ok: false, error: "We could not save your message. Please try again or email us directly." }, { status: 500 });
    }
  } else {
    // Preview / local: no database configured. Log a redacted line only.
    console.info("contact submission (no database configured)", { intent: record.intent, need: record.need, company: record.company });
  }

  return NextResponse.json({ ok: true });
}
