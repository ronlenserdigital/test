/**
 * Anthropic Messages API provider. The HTTP request is made by the Rust
 * backend (`ai_messages`) so the API key stays in the OS credential store and
 * never enters the webview. This module only builds the body and interprets
 * the response.
 */
import { invoke } from "@tauri-apps/api/core";
import { AiError, type AiProvider, type AiRequest, type AiResult, type ModelOption } from "./provider";
import { secrets } from "../platform/secrets";
import { isNative } from "../platform/env";

export const ANTHROPIC_MODELS: ModelOption[] = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (most capable)", inputPerMTok: 4, outputPerMTok: 20 },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (balanced)", inputPerMTok: 2, outputPerMTok: 10 },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (fastest, lowest cost)", inputPerMTok: 0.1, outputPerMTok: 0.5 },
];

/** Server-side refusal fallback (opt-in beta), routed by refusal category. */
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export interface TransportResponse {
  status: number;
  body: unknown;
  retry_after: string | null;
  cancelled: boolean;
  error: string | null;
}

export type Transport = (requestId: string, body: Record<string, unknown>, betas: string[]) => Promise<TransportResponse>;
export type CancelFn = (requestId: string) => Promise<unknown>;

const nativeTransport: Transport = (requestId, body, betas) => invoke<TransportResponse>("ai_messages", { requestId, body, betas });
const nativeCancel: CancelFn = (requestId) => invoke("ai_cancel", { requestId });

export function buildBody(req: AiRequest, model: string): { body: Record<string, unknown>; betas: string[] } {
  const body: Record<string, unknown> = {
    model,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: req.messages,
    output_config: {
      effort: "low",
      ...(req.jsonSchema ? { format: { type: "json_schema", schema: req.jsonSchema } } : {}),
    },
  };
  const betas: string[] = [];
  if (model === "claude-opus-5-5" || model === "claude-sonnet-5-5") {
    body.fallbacks = "default";
    betas.push(FALLBACK_BETA);
  }
  return { body, betas };
}

export function interpret(resp: TransportResponse): AiResult {
  if (resp.cancelled) throw new AiError("cancelled", "Request cancelled.");
  if (resp.status === 0) throw new AiError("network", resp.error ?? "Could not reach the AI provider.");
  const body = (resp.body ?? {}) as {
    content?: { type: string; text?: string }[];
    stop_reason?: string;
    model?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
    error?: { type?: string; message?: string };
  };
  const retry = resp.retry_after ? Number(resp.retry_after) : null;
  if (resp.status === 401 || resp.status === 403) throw new AiError("auth", "The API key was rejected. Check it in Settings → AI assistance.");
  if (resp.status === 429) throw new AiError("rate_limited", `Rate limit reached.${retry ? ` Try again in ${retry} s.` : " Try again shortly."}`, retry);
  if (resp.status === 529) throw new AiError("overloaded", "The AI provider is temporarily overloaded. Try again in a minute.", retry);
  if (resp.status >= 500) throw new AiError("server", "The AI provider had an internal error. Try again later.");
  if (resp.status >= 400) {
    // Show the provider's message; it never contains the key.
    throw new AiError("bad_request", `The AI request was rejected: ${body.error?.message ?? `HTTP ${resp.status}`}`);
  }
  if (body.stop_reason === "refusal") throw new AiError("refused", "The model declined this request.");
  const text = (body.content ?? [])
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("");
  if (body.stop_reason === "max_tokens") throw new AiError("truncated", "The response was cut off. Try a shorter selection.");
  return { text, model: body.model ?? "", inputTokens: body.usage?.input_tokens ?? 0, outputTokens: body.usage?.output_tokens ?? 0 };
}

export class AnthropicProvider implements AiProvider {
  readonly id = "anthropic";
  readonly label = "Anthropic (Claude)";
  readonly models = ANTHROPIC_MODELS;
  readonly destination = "api.anthropic.com (Anthropic, PBC)";

  constructor(
    private readonly transport: Transport = nativeTransport,
    private readonly cancel: CancelFn = nativeCancel,
    private readonly configured: () => Promise<boolean> = () => (isNative() ? secrets.exists("anthropic_api_key") : Promise.resolve(false)),
  ) {}

  isConfigured() {
    return this.configured();
  }

  async complete(req: AiRequest, model: string, signal: AbortSignal): Promise<AiResult> {
    if (!(await this.isConfigured())) throw new AiError("not_configured", "Add an API key in Settings → AI assistance.");
    if (signal.aborted) throw new AiError("cancelled", "Request cancelled.");
    const requestId = crypto.randomUUID();
    const onAbort = () => void this.cancel(requestId).catch(() => undefined);
    signal.addEventListener("abort", onAbort);
    try {
      const { body, betas } = buildBody(req, model);
      const resp = await this.transport(requestId, body, betas);
      return interpret(resp);
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  }
}
