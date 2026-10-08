/**
 * Lightweight local retrieval: split sections into passages and rank them by
 * BM25 against the question. Runs entirely on-device; only the top passages
 * are offered to the user for sending.
 */
export interface Passage {
  ref: string; // "S1", "S2", ...
  materialId: string;
  materialTitle: string;
  sectionIdx: number;
  label: string;
  text: string;
}

const STOP = new Set("a an and are as at be by for from has have how i in is it its of on or that the this to was what when where which who why will with you your".split(" "));

export function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((t) => t.length > 1 && !STOP.has(t));
}

export function splitPassages(text: string, max = 1200): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (buf && buf.length + p.length > max) {
      out.push(buf);
      buf = "";
    }
    buf = buf ? `${buf}\n\n${p}` : p;
    while (buf.length > max * 1.5) {
      out.push(buf.slice(0, max));
      buf = buf.slice(max);
    }
  }
  if (buf) out.push(buf);
  return out;
}

export function retrieve(
  question: string,
  sections: { material_id: string; title: string; idx: number; label: string; text: string }[],
  k = 6,
): Passage[] {
  const q = [...new Set(tokenize(question))];
  if (!q.length) return [];
  const docs: { meta: Omit<Passage, "ref" | "text">; text: string; tf: Map<string, number>; len: number }[] = [];
  for (const s of sections) {
    for (const p of splitPassages(s.text)) {
      const toks = tokenize(p);
      const tf = new Map<string, number>();
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
      docs.push({ meta: { materialId: s.material_id, materialTitle: s.title, sectionIdx: Number(s.idx), label: s.label }, text: p, tf, len: toks.length });
    }
  }
  if (!docs.length) return [];
  const avg = docs.reduce((a, d) => a + d.len, 0) / docs.length;
  const df = new Map<string, number>();
  for (const t of q) df.set(t, docs.filter((d) => d.tf.has(t)).length);
  const k1 = 1.4;
  const b = 0.75;
  const scored = docs
    .map((d) => {
      let score = 0;
      for (const t of q) {
        const f = d.tf.get(t) ?? 0;
        if (!f) continue;
        const idf = Math.log(1 + (docs.length - df.get(t)! + 0.5) / (df.get(t)! + 0.5));
        score += (idf * f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avg));
      }
      return { d, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b2) => b2.score - a.score)
    .slice(0, k);
  return scored.map((x, i) => ({ ref: `S${i + 1}`, ...x.d.meta, text: x.d.text }));
}

/** Extract [S1]-style citations and map them to passages. */
export function citations(answer: string, passages: Passage[]): Passage[] {
  const used = new Set((answer.match(/\[S(\d+)\]/g) ?? []).map((m) => m.slice(1, -1)));
  return passages.filter((p) => used.has(p.ref));
}
