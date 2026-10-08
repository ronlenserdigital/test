import { describe, expect, it } from "vitest";
import { strToU8, unzipSync, zipSync } from "fflate";
import { BackupError, createBackup, restoreBackup } from "../../src/data/backup";
import { testRepo } from "../helpers";

async function populated() {
  const t = await testRepo();
  const cert = await t.repo.createCertification({ name: "Backup Cert", examCode: "B-1" });
  const mat = await t.repo.createMaterial(
    { certId: cert.id, title: "Doc", kind: "text", originalName: "doc.txt", mime: "text/plain", sizeBytes: 3, sha256: "abc", status: "ready", statusDetail: "", tags: [], isSample: false },
    [{ label: "Text", page: null, text: "Some study text." }],
    { bytes: new TextEncoder().encode("abc"), ext: "txt" },
  );
  const card = await t.repo.createCard({ certId: cert.id, front: "Q", back: "A", materialId: mat.id, sectionIdx: 0, sourceLabel: "Doc · Text" });
  await t.repo.reviewCard(card, 3, Date.now(), 1000);
  await t.repo.recordSession({ certId: cert.id, kind: "focus", task: "x", startedAt: 1, endedAt: 2, focusSec: 60, breakSec: 0, pausedSec: 0, plannedFocusSec: 60, status: "completed", timerId: "a" });
  await t.repo.setSetting("activeTimer", { device: true });
  return { ...t, cert, mat };
}

describe("backup and restore", () => {
  it("round-trips the full workspace including source files", async () => {
    const src = await populated();
    const zip = await createBackup(src.db, src.files);

    const dst = await testRepo();
    await dst.repo.createCertification({ name: "Will be replaced" });
    await dst.files.put("stale.txt", new Uint8Array([9]));
    const summary = await restoreBackup(zip, dst.db, dst.files);
    expect(summary.files).toBe(1);

    const certs = await dst.repo.listCertifications();
    expect(certs.map((c) => c.name)).toEqual(["Backup Cert"]);
    const [m] = await dst.repo.listMaterials(certs[0].id);
    expect(await dst.files.get(m.fileKey!)).toEqual(new TextEncoder().encode("abc"));
    expect(await dst.files.list()).not.toContain("stale.txt");
    const [c] = await dst.repo.listCards(certs[0].id);
    expect(c.reps).toBe(1);
    expect(c.sourceLabel).toBe("Doc · Text");
    expect(await dst.repo.reviewHistory(certs[0].id)).toHaveLength(1);
    expect(await dst.repo.listSessions(null)).toHaveLength(1);
    // Device-specific settings are not carried over.
    expect(await dst.repo.getSetting("activeTimer", null)).toBeNull();
  });

  it("rejects corrupt archives without changing anything", async () => {
    const dst = await populated();
    await expect(restoreBackup(new Uint8Array([1, 2, 3]), dst.db, dst.files)).rejects.toBeInstanceOf(BackupError);
    expect(await dst.repo.listCertifications()).toHaveLength(1);
  });

  it("rejects a tampered file (checksum mismatch)", async () => {
    const src = await populated();
    const entries = unzipSync(await createBackup(src.db, src.files));
    const key = Object.keys(entries).find((k) => k.startsWith("files/"))!;
    entries[key] = strToU8("tampered");
    const dst = await testRepo();
    await expect(restoreBackup(zipSync(entries), dst.db, dst.files)).rejects.toThrow(/integrity/);
    expect(await dst.repo.listCertifications()).toHaveLength(0);
  });

  it("rejects unknown columns and newer schema versions", async () => {
    const src = await populated();
    const entries = unzipSync(await createBackup(src.db, src.files));
    const certs = JSON.parse(new TextDecoder().decode(entries["data/certifications.json"]));
    certs[0].evil = "x";
    const bad = { ...entries, "data/certifications.json": strToU8(JSON.stringify(certs)) };
    const dst = await testRepo();
    await expect(restoreBackup(zipSync(bad), dst.db, dst.files)).rejects.toThrow(/unknown column/);

    const mf = JSON.parse(new TextDecoder().decode(entries["manifest.json"]));
    mf.schemaVersion = 999;
    await expect(restoreBackup(zipSync({ ...entries, "manifest.json": strToU8(JSON.stringify(mf)) }), dst.db, dst.files)).rejects.toThrow(/newer StudyMode/);
  });

  it("rejects path traversal in file names", async () => {
    const src = await populated();
    const entries = unzipSync(await createBackup(src.db, src.files));
    const mf = JSON.parse(new TextDecoder().decode(entries["manifest.json"]));
    mf.files[0].key = "../escape";
    const dst = await testRepo();
    await expect(restoreBackup(zipSync({ ...entries, "manifest.json": strToU8(JSON.stringify(mf)) }), dst.db, dst.files)).rejects.toThrow(/invalid file name/);
  });
});
