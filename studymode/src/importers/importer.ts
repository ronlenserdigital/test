/**
 * Import pipeline: validate → hash (duplicate check) → extract → store.
 * The pdf.js module is injected so the same code runs in the app and in tests.
 */
import type { Repo } from "../data/repo";
import { sha256Hex } from "../data/backup";
import type { Id, Material, MaterialKind } from "../domain/types";
import { classifyPdf, describePages, extractPdf, ImportError, type PdfJsLike } from "./pdf";
import { decodeText, looksBinary, markdownToSections, plainTextToSections, type SectionDraft } from "./textFormats";

export const MAX_IMPORT_BYTES = 200 * 1024 * 1024;
export const LARGE_IMPORT_BYTES = 25 * 1024 * 1024;

export type ImportOutcome =
  | { status: "imported"; material: Material; notice?: string }
  | { status: "duplicate"; existing: Material }
  | { status: "needs_ocr"; pageCount: number; message: string }
  | { status: "error"; message: string; code: string };

export interface ImportOptions {
  pdfjs: () => Promise<PdfJsLike>;
  allowDuplicate?: boolean;
  /** Store an image-only PDF anyway (marked as needing OCR, no text). */
  keepImageOnly?: boolean;
  objectiveIds?: Id[];
  tags?: string[];
  onProgress?: (message: string, fraction: number | null) => void;
  signal?: AbortSignal;
}

export function kindFor(name: string): MaterialKind | null {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "md" || ext === "markdown") return "markdown";
  if (ext === "txt" || ext === "text") return "text";
  return null;
}

export const ACCEPTED_EXTENSIONS = ".pdf,.md,.markdown,.txt,.text";

const titleFrom = (name: string) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Untitled";

export async function importFile(repo: Repo, certId: Id, file: { name: string; bytes: Uint8Array }, opts: ImportOptions): Promise<ImportOutcome> {
  try {
    const kind = kindFor(file.name);
    if (!kind) return { status: "error", code: "unsupported", message: `"${file.name}" is not a supported file type. Import PDF, Markdown (.md) or text (.txt) files.` };
    if (file.bytes.length === 0) return { status: "error", code: "empty", message: `"${file.name}" is empty.` };
    if (file.bytes.length > MAX_IMPORT_BYTES) {
      return { status: "error", code: "too_large", message: `"${file.name}" is larger than ${MAX_IMPORT_BYTES / 1024 / 1024} MB. Split it into smaller files.` };
    }
    opts.onProgress?.("Checking for duplicates…", null);
    const sha = await sha256Hex(file.bytes);
    if (!opts.allowDuplicate) {
      const dup = await repo.findDuplicate(certId, sha);
      if (dup) return { status: "duplicate", existing: dup };
    }

    let sections: SectionDraft[];
    let status: Material["status"] = "ready";
    let statusDetail = "";
    let notice: string | undefined;
    if (kind === "pdf") {
      if (!(file.bytes[0] === 0x25 && file.bytes[1] === 0x50 && file.bytes[2] === 0x44 && file.bytes[3] === 0x46)) {
        // "%PDF" header missing; let pdf.js try (it tolerates leading junk) but expect failure.
        opts.onProgress?.("File does not start with a PDF header; attempting to read…", null);
      }
      const pdfjs = await opts.pdfjs();
      const x = await extractPdf(pdfjs, file.bytes, {
        signal: opts.signal,
        onProgress: (d, t) => opts.onProgress?.(`Extracting text: page ${d} of ${t}`, d / t),
      });
      const cls = classifyPdf(x);
      if (cls === "image_only") {
        const message =
          `"${file.name}" appears to be scanned or image-only: ${x.pageCount - x.pagesWithoutText.length} of ${x.pageCount} pages have selectable text. ` +
          "StudyMode cannot read it aloud, search it, or create cards from it without OCR (optical character recognition). " +
          "Run it through an OCR tool (for example, the OCR feature in your PDF editor) and import the result.";
        if (!opts.keepImageOnly) return { status: "needs_ocr", pageCount: x.pageCount, message };
        status = "needs_ocr";
        statusDetail = message;
      } else if (cls === "partial") {
        statusDetail = `No selectable text on page${x.pagesWithoutText.length === 1 ? "" : "s"} ${describePages(x.pagesWithoutText)}; those pages may need OCR.`;
        notice = statusDetail;
      }
      sections = x.pages.map((p) => ({ label: `Page ${p.page}`, page: p.page, text: p.text }));
      if (status === "needs_ocr") sections = sections.filter((s) => s.text.trim());
    } else {
      if (looksBinary(file.bytes)) return { status: "error", code: "corrupt", message: `"${file.name}" does not look like a text file.` };
      const text = decodeText(file.bytes);
      sections = kind === "markdown" ? markdownToSections(text, titleFrom(file.name)) : plainTextToSections(text);
      if (sections.length === 0) return { status: "error", code: "empty", message: `"${file.name}" contains no readable text.` };
    }
    if (file.bytes.length > LARGE_IMPORT_BYTES && !notice) notice = "Large file imported. Searching and reading may be slower.";

    opts.onProgress?.("Saving…", null);
    const ext = file.name.split(".").pop() ?? "bin";
    const material = await repo.createMaterial(
      {
        certId,
        title: titleFrom(file.name),
        kind,
        originalName: file.name,
        mime: kind === "pdf" ? "application/pdf" : kind === "markdown" ? "text/markdown" : "text/plain",
        sizeBytes: file.bytes.length,
        sha256: sha,
        status,
        statusDetail,
        tags: opts.tags ?? [],
        isSample: false,
      },
      sections,
      { bytes: file.bytes, ext },
      opts.objectiveIds ?? [],
    );
    return { status: "imported", material, notice };
  } catch (e) {
    if (e instanceof ImportError) return { status: "error", code: e.code, message: e.message };
    return { status: "error", code: "unknown", message: `Import failed: ${(e as Error).message}` };
  }
}

/** Pasted notes become a "note" material with a single editable section. */
export async function importPasted(repo: Repo, certId: Id, title: string, text: string, objectiveIds: Id[] = []): Promise<Material> {
  const body = text.trim();
  if (!body) throw new Error("Paste some text first.");
  const sections = markdownToSections(body, title.trim() || "Pasted notes");
  return repo.createMaterial(
    {
      certId,
      title: title.trim() || "Pasted notes",
      kind: "note",
      originalName: "",
      mime: "text/plain",
      sizeBytes: new TextEncoder().encode(body).length,
      sha256: await sha256Hex(new TextEncoder().encode(body)),
      status: "ready",
      statusDetail: "",
      tags: [],
      isSample: false,
    },
    sections.length ? sections : [{ label: "Notes", page: null, text: body }],
    { bytes: new TextEncoder().encode(body), ext: "txt" },
    objectiveIds,
  );
}
