import { z } from "zod";

export const CONTACT_INTENTS = ["assessment", "expert", "general", "support", "government", "security"] as const;
export type ContactIntent = (typeof CONTACT_INTENTS)[number];

export const intentLabels: Record<ContactIntent, string> = {
  assessment: "Request an assessment",
  expert: "Talk to an engineer",
  general: "General inquiry",
  support: "Existing client support",
  government: "Public-sector / capability request",
  security: "Security question or report",
};

export const CONTACT_NEEDS = [
  "managed-it",
  "co-managed-it",
  "cybersecurity",
  "security-risk-advisory",
  "cloud-infrastructure",
  "network-management",
  "backup-disaster-recovery",
  "software-development",
  "web-application-engineering",
  "ai-automation",
  "not-sure",
] as const;

const trimmed = (max: number) => z.string().trim().min(1).max(max);

/**
 * Server-side schema. Length limits protect the database and downstream mail.
 * `website` is a honeypot: it must be empty. `startedAt` is used for a minimum
 * fill-time check. Neither is stored.
 */
export const contactSchema = z.object({
  name: trimmed(120),
  email: z.string().trim().toLowerCase().email().max(254),
  company: trimmed(160),
  phone: z
    .string()
    .trim()
    .max(40)
    .regex(/^[+()\d\s.-]*$/, "Phone may contain digits, spaces and + ( ) - . only")
    .optional()
    .or(z.literal("")),
  intent: z.enum(CONTACT_INTENTS),
  need: z.enum(CONTACT_NEEDS).optional().or(z.literal("")),
  message: trimmed(4000),
  consent: z.literal(true, { error: "Consent is required" }),
  website: z.string().max(200).optional(),
  startedAt: z.coerce.number().int().positive().optional(),
  turnstileToken: z.string().max(4096).optional(),
  page: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

/** Free-mail domains prompt a soft hint in the UI; they are not rejected. */
export const FREE_MAIL = new Set(["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com", "proton.me", "protonmail.com"]);
