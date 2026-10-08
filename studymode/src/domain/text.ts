/** Text utilities shared by the reader, import pipeline and read-aloud. */

export function normalizeWhitespace(s: string): string {
  return s.replace(/\r\n?/g, "\n").replace(/[ \t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

/** Paragraphs separated by blank lines (single newlines are soft breaks). */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
}

export interface SpeechChunk {
  /** Paragraph index within the section. */
  para: number;
  text: string;
}

/**
 * Split a section into speech chunks: paragraph-aligned, then sentence-split
 * so no chunk exceeds maxLen (long utterances are unreliable in several
 * speech engines). Chunk order is stable for a given text, which keeps the
 * persisted reading cursor valid across restarts.
 */
export function speechChunks(text: string, maxLen = 240): SpeechChunk[] {
  const out: SpeechChunk[] = [];
  paragraphs(text).forEach((p, para) => {
    const sentences = p.match(/[^.!?;:]+[.!?;:]+["')\]]*\s*|[^.!?;:]+$/g) ?? [p];
    let buf = "";
    for (const raw of sentences) {
      const s = raw.trim();
      if (!s) continue;
      if (buf && (buf + " " + s).length > maxLen) {
        out.push({ para, text: buf });
        buf = "";
      }
      if (s.length > maxLen) {
        // Hard-wrap very long sentences on word boundaries.
        let rest = s;
        while (rest.length > maxLen) {
          let cut = rest.lastIndexOf(" ", maxLen);
          if (cut < maxLen * 0.5) cut = maxLen;
          out.push({ para, text: rest.slice(0, cut).trim() });
          rest = rest.slice(cut).trim();
        }
        buf = rest;
      } else {
        buf = buf ? `${buf} ${s}` : s;
      }
    }
    if (buf) out.push({ para, text: buf });
  });
  return out;
}

export function excerpt(s: string, n = 160): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + "…" : t;
}

export function parseTags(input: string): string[] {
  return [...new Set(input.split(/[,\n]/).map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 30);
}

export function countWords(s: string): number {
  return (s.match(/\S+/g) ?? []).length;
}
