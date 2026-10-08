/**
 * PDF text extraction with pdf.js. Produces one section per page so every
 * note/card/question can cite "Page N". Pages without a text layer are
 * reported so scanned documents are never imported silently as empty.
 */
import { normalizeWhitespace } from "../domain/text";

// Minimal structural type for the parts of pdf.js we use; lets tests pass the
// Node "legacy" build and the app pass the browser build.
export interface PdfJsLike {
  getDocument(src: { data: Uint8Array; isEvalSupported?: boolean; disableFontFace?: boolean; useSystemFonts?: boolean }): {
    promise: Promise<PdfDocLike>;
    destroy(): Promise<void>;
  };
}
interface PdfDocLike {
  numPages: number;
  getPage(n: number): Promise<{ getTextContent(): Promise<{ items: unknown[] }>; cleanup(): void }>;
  destroy(): Promise<void>;
}
interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
  height?: number;
}

export interface PdfPage {
  page: number;
  text: string;
}

export interface PdfExtraction {
  pages: PdfPage[];
  pageCount: number;
  pagesWithoutText: number[];
}

export class ImportError extends Error {
  constructor(
    message: string,
    readonly code: "corrupt" | "password" | "empty" | "too_large" | "unsupported" | "cancelled",
  ) {
    super(message);
  }
}

/** Minimum characters for a page to count as having a usable text layer. */
const MIN_PAGE_CHARS = 20;

export function pageItemsToText(items: unknown[]): string {
  let out = "";
  let lastY: number | null = null;
  let lastH = 10;
  for (const raw of items) {
    const it = raw as TextItem;
    if (typeof it.str !== "string") continue;
    const y = it.transform?.[5];
    const h = it.height || lastH;
    if (y != null && lastY != null && out && !out.endsWith("\n")) {
      const gap = Math.abs(lastY - y);
      if (gap > h * 1.8) out += "\n\n";
      else if (gap > h * 0.5) out += "\n";
    } else if (y != null && lastY != null && out.endsWith("\n") && Math.abs(lastY - y) > h * 1.8 && !out.endsWith("\n\n")) {
      out += "\n";
    }
    out += it.str;
    if (it.hasEOL) out += "\n";
    if (y != null) lastY = y;
    lastH = h;
  }
  // Re-join words hyphenated across line breaks.
  out = out.replace(/(\p{L})-\n(\p{Ll})/gu, "$1$2");
  return normalizeWhitespace(out);
}

export async function extractPdf(
  pdfjs: PdfJsLike,
  bytes: Uint8Array,
  opts: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal } = {},
): Promise<PdfExtraction> {
  // pdf.js may transfer/detach the buffer; give it a copy.
  const task = pdfjs.getDocument({ data: bytes.slice(), isEvalSupported: false, disableFontFace: true, useSystemFonts: false });
  let doc: PdfDocLike;
  try {
    doc = await task.promise;
  } catch (e) {
    const name = (e as { name?: string })?.name ?? "";
    if (name === "PasswordException") throw new ImportError("This PDF is password-protected. Remove the password and import it again.", "password");
    throw new ImportError("This PDF could not be opened. It may be corrupt or not a PDF.", "corrupt");
  }
  try {
    const pages: PdfPage[] = [];
    const pagesWithoutText: number[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      if (opts.signal?.aborted) throw new ImportError("Import cancelled.", "cancelled");
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const text = pageItemsToText(content.items);
      page.cleanup();
      if (text.replace(/\s/g, "").length < MIN_PAGE_CHARS) pagesWithoutText.push(p);
      pages.push({ page: p, text });
      opts.onProgress?.(p, doc.numPages);
      // Yield to keep the UI responsive on large documents.
      if (p % 5 === 0) await new Promise((r) => setTimeout(r, 0));
    }
    return { pages, pageCount: doc.numPages, pagesWithoutText };
  } finally {
    await doc.destroy().catch(() => undefined);
  }
}

export type PdfTextClass = "text" | "partial" | "image_only";

/** Classify a PDF by how many pages have a usable text layer. */
export function classifyPdf(x: PdfExtraction): PdfTextClass {
  if (x.pageCount === 0) return "image_only";
  const withText = x.pageCount - x.pagesWithoutText.length;
  if (withText === 0) return "image_only";
  // Mostly scanned: fewer than 10% of pages have text.
  if (withText / x.pageCount < 0.1) return "image_only";
  return x.pagesWithoutText.length > 0 ? "partial" : "text";
}

export function describePages(pages: number[]): string {
  if (pages.length <= 8) return pages.join(", ");
  return `${pages.slice(0, 8).join(", ")} and ${pages.length - 8} more`;
}
