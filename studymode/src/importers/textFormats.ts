/** Markdown and plain-text import: convert to sectioned plain text. */
import { normalizeWhitespace } from "../domain/text";

export interface SectionDraft {
  label: string;
  page: number | null;
  text: string;
}

/** Decode bytes as UTF-8, falling back to Windows-1252 for legacy files. */
export function decodeText(bytes: Uint8Array): string {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const bad = (utf8.match(/�/g) ?? []).length;
  if (bad > 0 && bad / Math.max(1, utf8.length) > 0.001) {
    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch {
      return utf8;
    }
  }
  return utf8.replace(/^﻿/, "");
}

/** Detect binary content mislabelled as text. */
export function looksBinary(bytes: Uint8Array): boolean {
  const n = Math.min(bytes.length, 4096);
  let ctrl = 0;
  for (let i = 0; i < n; i++) {
    const c = bytes[i];
    if (c === 0) return true;
    if (c < 9 || (c > 13 && c < 32)) ctrl++;
  }
  return n > 0 && ctrl / n > 0.05;
}

/** Strip Markdown syntax to readable plain text (no HTML is ever rendered). */
export function markdownInline(s: string): string {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(\*|_)(\S(?:.*?\S)?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/~~(.+?)~~/g, "$1");
}

export function markdownToSections(md: string, fallbackTitle: string): SectionDraft[] {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const sections: SectionDraft[] = [];
  let label = fallbackTitle;
  let buf: string[] = [];
  let inFence = false;
  const flush = () => {
    const text = normalizeWhitespace(buf.join("\n"));
    if (text) sections.push({ label, page: null, text });
    buf = [];
  };
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      buf.push("");
      continue;
    }
    if (inFence) {
      buf.push(line);
      continue;
    }
    const h = line.match(/^(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (h) {
      flush();
      label = markdownInline(h[2]).trim() || label;
      continue;
    }
    if (/^\s*([-*_])\s*\1\s*\1[\s\1]*$/.test(line)) {
      buf.push("");
      continue;
    }
    const li = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (li) {
      // Keep list items as their own paragraphs.
      buf.push("", "• " + markdownInline(li[1]), "");
      continue;
    }
    const h4 = line.match(/^#{4,6}\s+(.+)$/);
    if (h4) {
      buf.push("", markdownInline(h4[1]), "");
      continue;
    }
    buf.push(markdownInline(line.replace(/^\s*>\s?/, "")));
  }
  flush();
  return mergeTiny(splitLong(sections));
}

export function plainTextToSections(text: string): SectionDraft[] {
  const norm = normalizeWhitespace(text);
  if (!norm) return [];
  return splitLong([{ label: "Text", page: null, text: norm }]).map((s, i, all) => ({
    ...s,
    label: all.length === 1 ? "Text" : `Part ${i + 1}`,
  }));
}

/** Keep sections a readable size (~6000 chars) on paragraph boundaries. */
function splitLong(sections: SectionDraft[], max = 6000): SectionDraft[] {
  const out: SectionDraft[] = [];
  for (const s of sections) {
    if (s.text.length <= max) {
      out.push(s);
      continue;
    }
    const paras = s.text.split(/\n\n/);
    let buf = "";
    let part = 1;
    for (const p of paras) {
      if (buf && buf.length + p.length > max) {
        out.push({ ...s, label: `${s.label} (${part++})`, text: buf });
        buf = "";
      }
      buf = buf ? `${buf}\n\n${p}` : p;
    }
    if (buf) out.push({ ...s, label: part > 1 ? `${s.label} (${part})` : s.label, text: buf });
  }
  return out;
}

function mergeTiny(sections: SectionDraft[]): SectionDraft[] {
  return sections.filter((s) => s.text.trim().length > 0);
}
