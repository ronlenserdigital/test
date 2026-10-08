import initSqlJs from "sql.js";
import { SqlJsDb } from "../src/data/sqljsDb";
import { migrate } from "../src/data/migrations";
import { Repo } from "../src/data/repo";
import { MemoryFileStore } from "../src/data/files";

export async function testRepo() {
  const SQL = await initSqlJs();
  const db = await SqlJsDb.create(SQL);
  await migrate(db);
  const files = new MemoryFileStore();
  const repo = new Repo(db, files);
  repo.setSchedulerFuzz(false);
  return { repo, db, files, SQL };
}

/**
 * Build a minimal valid PDF. Each entry is one page; null makes a page with
 * only vector graphics (no text layer), like a scanned page.
 */
export function makePdf(pages: (string | null)[]): Uint8Array {
  const objs: string[] = [];
  const add = (s: string) => {
    objs.push(s);
    return objs.length;
  };
  const font = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pagesId = 2 + pages.length * 2 + 1; // reserved below
  const pageIds: number[] = [];
  for (const text of pages) {
    const lines = text == null ? [] : text.split("\n");
    const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const stream =
      text == null
        ? "0.5 g 50 50 500 700 re f"
        : "BT /F1 12 Tf 72 720 Td 14 TL " + lines.map((l) => `(${esc(l)}) Tj T*`).join(" ") + " ET";
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${content} 0 R >>`));
  }
  while (objs.length < pagesId - 1) add("null");
  add(`<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  out += `trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

export const pdfjsNode = async () => (await import("pdfjs-dist/legacy/build/pdf.mjs")) as never;
