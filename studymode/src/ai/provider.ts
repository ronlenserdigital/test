/**
 * Provider abstraction for optional AI assistance. StudyMode works fully
 * without any provider. Implementations must not log request contents.
 */
export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiRequest {
  system: string;
  messages: AiMessage[];
  maxTokens: number;
  /** JSON Schema for structured output, when the caller needs JSON. */
  jsonSchema?: Record<string, unknown>;
}

export interface AiResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export type AiErrorKind = "not_configured" | "rate_limited" | "overloaded" | "auth" | "bad_request" | "refused" | "truncated" | "network" | "cancelled" | "server" | "invalid_output";

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
    readonly retryAfterSec: number | null = null,
  ) {
    super(message);
  }
}

export interface ModelOption {
  id: string;
  label: string;
  inputPerMTok: number;
  outputPerMTok: number;
}

export interface AiProvider {
  readonly id: string;
  readonly label: string;
  readonly models: ModelOption[];
  /** Where data goes, shown to the user before sending. */
  readonly destination: string;
  isConfigured(): Promise<boolean>;
  complete(req: AiRequest, model: string, signal: AbortSignal): Promise<AiResult>;
}

/** Rough pre-send estimate (≈4 characters per token) for the consent dialog. */
export function estimateCost(chars: number, maxOutputTokens: number, m: ModelOption) {
  const inTok = Math.ceil(chars / 4);
  const low = (inTok * m.inputPerMTok) / 1e6;
  const high = low + (maxOutputTokens * m.outputPerMTok) / 1e6;
  return { inputTokens: inTok, lowUsd: low, highUsd: high };
}
