import { describe, expect, it } from "vitest";
import { importFile, importPasted } from "../../src/importers/importer";
import { makePdf, pdfjsNode, testRepo } from "../helpers";

const opts = { pdfjs: pdfjsNode };

describe("document import", () => {
  it("imports a text PDF with one section per page and keeps the original", async () => {
    const { repo, files } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const pdf = makePdf(["Chapter one covers subnetting basics in detail.", "Chapter two covers routing protocols in depth."]);
    const r = await importFile(repo, cert.id, { name: "guide.pdf", bytes: pdf }, opts);
    expect(r.status).toBe("imported");
    if (r.status !== "imported") return;
    expect(r.material.kind).toBe("pdf");
    const sections = await repo.listSections(r.material.id);
    expect(sections.map((s) => s.label)).toEqual(["Page 1", "Page 2"]);
    expect(sections[1].text).toContain("routing protocols");
    expect(await files.get(r.material.fileKey!)).toEqual(pdf);
    const hits = await repo.search(cert.id, "subnetting");
    expect(hits[0]).toMatchObject({ label: "Page 1", sectionIdx: 0 });
  });

  it("detects image-only PDFs and does not import them silently", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const r = await importFile(repo, cert.id, { name: "scan.pdf", bytes: makePdf([null, null, null]) }, opts);
    expect(r.status).toBe("needs_ocr");
    if (r.status === "needs_ocr") expect(r.message).toMatch(/OCR/);
    expect(await repo.listMaterials(cert.id)).toHaveLength(0);
    const kept = await importFile(repo, cert.id, { name: "scan.pdf", bytes: makePdf([null, null, null]) }, { ...opts, keepImageOnly: true });
    expect(kept.status).toBe("imported");
    if (kept.status === "imported") expect(kept.material.status).toBe("needs_ocr");
  });

  it("reports pages without text in partially scanned PDFs", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const r = await importFile(repo, cert.id, { name: "mixed.pdf", bytes: makePdf(["This page has plenty of selectable text.", null]) }, opts);
    expect(r.status).toBe("imported");
    if (r.status === "imported") expect(r.notice).toMatch(/page 2/);
  });

  it("rejects corrupt PDFs, empty files and unsupported types with useful messages", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const corrupt = await importFile(repo, cert.id, { name: "bad.pdf", bytes: new TextEncoder().encode("%PDF-1.4 garbage") }, opts);
    expect(corrupt).toMatchObject({ status: "error", code: "corrupt" });
    expect(await importFile(repo, cert.id, { name: "e.txt", bytes: new Uint8Array() }, opts)).toMatchObject({ status: "error", code: "empty" });
    expect(await importFile(repo, cert.id, { name: "blank.txt", bytes: new TextEncoder().encode("   \n\n ") }, opts)).toMatchObject({ status: "error", code: "empty" });
    expect(await importFile(repo, cert.id, { name: "x.docx", bytes: new Uint8Array([1]) }, opts)).toMatchObject({ status: "error", code: "unsupported" });
    expect(await importFile(repo, cert.id, { name: "bin.txt", bytes: new Uint8Array([0, 1, 2, 3, 0]) }, opts)).toMatchObject({ status: "error", code: "corrupt" });
    expect(await repo.listMaterials(cert.id)).toHaveLength(0);
  });

  it("detects duplicate imports", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const bytes = new TextEncoder().encode("# Title\n\nSome notes here.");
    expect((await importFile(repo, cert.id, { name: "a.md", bytes }, opts)).status).toBe("imported");
    const dup = await importFile(repo, cert.id, { name: "copy.md", bytes }, opts);
    expect(dup.status).toBe("duplicate");
    expect((await importFile(repo, cert.id, { name: "copy.md", bytes }, { ...opts, allowDuplicate: true })).status).toBe("imported");
  });

  it("splits markdown by headings and strips markup without rendering HTML", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const md = "# Intro\n\nThe **OSI** model has [seven](http://x) layers.<script>alert(1)</script>\n\n## Layers\n\n- Physical\n- Data link\n";
    const r = await importFile(repo, cert.id, { name: "osi.md", bytes: new TextEncoder().encode(md) }, opts);
    if (r.status !== "imported") throw new Error(r.status);
    const s = await repo.listSections(r.material.id);
    expect(s.map((x) => x.label)).toEqual(["Intro", "Layers"]);
    expect(s[0].text).toBe("The OSI model has seven layers.alert(1)");
    expect(s[1].text).toContain("• Physical");
  });

  it("imports pasted notes", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const m = await importPasted(repo, cert.id, "My notes", "Line one.\n\nLine two.");
    expect(m.kind).toBe("note");
    expect((await repo.listSections(m.id))[0].text).toBe("Line one.\n\nLine two.");
  });
});
