import { describe, expect, it } from "vitest";
import { SqlJsDb } from "../../src/data/sqljsDb";
import { migrate, SCHEMA_VERSION } from "../../src/data/migrations";
import { Repo } from "../../src/data/repo";
import { MemoryFileStore } from "../../src/data/files";
import { parseOutline } from "../../src/domain/objectivesParse";
import { testRepo } from "../helpers";

describe("migrations", () => {
  it("apply once and are idempotent", async () => {
    const { db } = await testRepo();
    expect(await migrate(db)).toBe(SCHEMA_VERSION);
    const rows = await db.all<{ version: number }>("SELECT version FROM schema_migrations");
    expect(rows).toHaveLength(SCHEMA_VERSION);
  });
  it("refuse a database from a newer app", async () => {
    const { db } = await testRepo();
    await db.run("INSERT INTO schema_migrations VALUES (999, 'future', 0)");
    await expect(migrate(db)).rejects.toThrow(/newer StudyMode/);
  });
});

describe("study workflow persistence", () => {
  it("survives a restart (database image reload)", async () => {
    const { repo, db, SQL, files } = await testRepo();
    const cert = await repo.createCertification({ name: "Example Cert", provider: "Vendor", examCode: "EX-101", examDate: "2026-12-01" });
    await repo.importOutline(cert.id, parseOutline("1.0 Basics (60%)\n1.1 Explain things\n2.0 Advanced (40%)\n2.1 Do things"), "Vendor exam guide", "v2");
    const [obj] = await repo.listObjectives(cert.id);
    const mat = await repo.createMaterial(
      { certId: cert.id, title: "Notes", kind: "text", originalName: "n.txt", mime: "text/plain", sizeBytes: 5, sha256: "x", status: "ready", statusDetail: "", tags: ["core"], isSample: false },
      [{ label: "Text", page: null, text: "Hello world. Second sentence." }],
      { bytes: new TextEncoder().encode("hello"), ext: "txt" },
      [obj.id],
    );
    await repo.addHighlight({ materialId: mat.id, sectionIdx: 0, startOffset: 0, endOffset: 5, text: "Hello", color: "amber" });
    await repo.addBookmark(mat.id, 0, "Start");
    await repo.saveNote({ certId: cert.id, materialId: mat.id, sectionIdx: 0, sourceLabel: "Notes · Text", quote: "Hello", body: "Greeting", objectiveIds: [obj.id] });
    const cardId = await repo.createCard({ certId: cert.id, front: "Hello?", back: "World", materialId: mat.id, sectionIdx: 0, sourceLabel: "Notes · Text", objectiveIds: [obj.id] });
    await repo.reviewCard(cardId, 3, Date.now(), 4000);
    await repo.savePosition(mat.id, { sectionIdx: 0, scrollRatio: 0.5 });
    await repo.setSetting("theme", "dark");
    await repo.recordSession({ certId: cert.id, kind: "focus", task: "Read", startedAt: 1, endedAt: 2, focusSec: 1500, breakSec: 300, pausedSec: 0, plannedFocusSec: 1500, status: "completed", timerId: "t1" });

    // "Restart": serialise the SQLite image and reopen it.
    const image = (db as SqlJsDb)["db"].export();
    const db2 = await SqlJsDb.create(SQL, image);
    await migrate(db2);
    const repo2 = new Repo(db2, files);

    const [c2] = await repo2.listCertifications();
    expect(c2).toMatchObject({ name: "Example Cert", examCode: "EX-101", examDate: "2026-12-01" });
    const domains = await repo2.listDomains(cert.id);
    expect(domains.map((d) => [d.name, d.weight, d.source, d.sourceVersion])).toEqual([
      ["Basics", 60, "Vendor exam guide", "v2"],
      ["Advanced", 40, "Vendor exam guide", "v2"],
    ]);
    const [m2] = await repo2.listMaterials(cert.id);
    expect(m2.position).toEqual({ sectionIdx: 0, scrollRatio: 0.5 });
    expect(m2.tags).toEqual(["core"]);
    expect(await repo2.listHighlights(mat.id)).toHaveLength(1);
    expect(await repo2.listBookmarks(mat.id)).toHaveLength(1);
    const [note] = await repo2.listNotes(cert.id);
    expect(note.objectiveIds).toEqual([obj.id]);
    const card = await repo2.getCard(cardId);
    expect(card?.reps).toBe(1);
    expect(card?.objectiveIds).toEqual([obj.id]);
    expect(await repo2.reviewHistory(cert.id)).toHaveLength(1);
    expect(await repo2.getSetting("theme", "light")).toBe("dark");
    expect(await repo2.listSessions(cert.id)).toHaveLength(1);
    expect(await files.get(m2.fileKey!)).toEqual(new TextEncoder().encode("hello"));
  });

  it("records a focus session only once per timer id", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const s = { certId: cert.id, kind: "focus" as const, task: "", startedAt: 1, endedAt: 2, focusSec: 60, breakSec: 0, pausedSec: 0, plannedFocusSec: 60, status: "completed" as const, timerId: "same" };
    await repo.recordSession(s);
    await repo.recordSession(s);
    expect(await repo.listSessions(cert.id)).toHaveLength(1);
  });

  it("deleting a certification cascades and removes stored files", async () => {
    const { repo, files } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    await repo.createMaterial(
      { certId: cert.id, title: "T", kind: "text", originalName: "t.txt", mime: "", sizeBytes: 1, sha256: "y", status: "ready", statusDetail: "", tags: [], isSample: false },
      [{ label: "Text", page: null, text: "abc" }],
      { bytes: new Uint8Array([1]), ext: "txt" },
    );
    await repo.createCard({ certId: cert.id, front: "a", back: "b" });
    await repo.deleteCertification(cert.id);
    expect(await repo.listCertifications()).toHaveLength(0);
    expect(await files.list()).toHaveLength(0);
    const leftovers = await repo.db.all<{ c: number }>("SELECT (SELECT COUNT(*) FROM cards) + (SELECT COUNT(*) FROM material_sections) AS c");
    expect(Number(leftovers[0].c)).toBe(0);
  });

  it("batch writes are atomic", async () => {
    const { repo, files } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    await expect(
      repo.db.batch([
        { sql: "INSERT INTO notes (id,cert_id,body,created_at,updated_at) VALUES ('n1',?, 'x', 0, 0)", params: [cert.id] },
        { sql: "INSERT INTO notes (id,cert_id,body,created_at,updated_at) VALUES ('n1',?, 'dup', 0, 0)", params: [cert.id] },
      ]),
    ).rejects.toThrow();
    expect(await repo.listNotes(cert.id)).toHaveLength(0);
    void files;
  });

  it("removes the stored original if the database write fails", async () => {
    const { repo, files } = await testRepo();
    await expect(
      repo.createMaterial(
        { certId: "missing-cert", title: "T", kind: "text", originalName: "t.txt", mime: "", sizeBytes: 1, sha256: "y", status: "ready", statusDetail: "", tags: [], isSample: false },
        [{ label: "Text", page: null, text: "abc" }],
        { bytes: new Uint8Array([1]), ext: "txt" },
      ),
    ).rejects.toThrow();
    expect(await files.list()).toHaveLength(0);
  });
});

describe("flashcard queue", () => {
  it("serves due cards then new cards up to the daily limit, and persists review history", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    for (let i = 0; i < 5; i++) await repo.createCard({ certId: cert.id, front: `F${i}`, back: `B${i}` });
    const now = Date.now();
    let q = await repo.reviewQueue(cert.id, now, 3);
    expect(q).toHaveLength(3);
    await repo.reviewCard(q[0].id, 1, now, 1000); // Again → relearn, due in minutes
    await repo.reviewCard(q[1].id, 4, now, 1000); // Easy → due in days
    q = await repo.reviewQueue(cert.id, now + 30 * 60_000, 1);
    // the "Again" card is due again within 30 minutes; plus 1 new card
    expect(q.map((c) => c.front)).toContain("F0");
    expect(q.map((c) => c.front)).not.toContain("F1");
    const counts = await repo.cardCounts(cert.id, now + 30 * 60_000);
    expect(counts.total).toBe(5);
    expect(await repo.reviewHistory(cert.id)).toHaveLength(2);
  });
});

describe("quiz flow", () => {
  async function setup() {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "C" });
    const mk = (id: string, kind: "single" | "multiple", correct: string[]) =>
      repo.saveQuestion({
        id,
        certId: cert.id,
        kind,
        stem: `Stem ${id}`,
        choices: ["a", "b", "c", "d"].map((c) => ({ id: c, text: c, explanation: `why ${c}` })),
        correct,
        explanation: "because",
        materialId: null,
        sectionIdx: null,
        sourceLabel: "",
        sourceQuote: "",
        origin: "manual",
        isSample: false,
        objectiveIds: [],
      });
    await mk("q1", "single", ["a"]);
    await mk("q2", "multiple", ["b", "c"]);
    await mk("q3", "single", ["d"]);
    return { repo, cert };
  }

  it("exam mode scores on submit, records mistakes, and review queue drives a review quiz", async () => {
    const { repo, cert } = await setup();
    const { attemptId } = await repo.createAttempt(cert.id, { kind: "exam", mode: "exam", count: 3, minutes: 10, shuffleChoices: true, multiScoring: "all_or_nothing", useDomainWeights: false, seed: 7 }, 1000);
    const data = (await repo.getAttempt(attemptId!))!;
    expect(data.attempt.deadlineAt).toBe(1000 + 10 * 60_000);
    for (const item of data.items) {
      const q = data.questions.get(item.questionId)!;
      // Answer q1 right, q2 half right, q3 wrong.
      const sel = q.id === "q1" ? ["a"] : q.id === "q2" ? ["b"] : ["a"];
      await repo.answerItem(attemptId!, item.id, sel, 2000);
    }
    const mid = (await repo.getAttempt(attemptId!))!;
    expect(mid.items.every((i) => i.score === null)).toBe(true); // no feedback before submit
    const flagged = mid.items.find((i) => i.questionId === "q1")!;
    await repo.flagItem(flagged.id, true);
    const done = await repo.submitAttempt(attemptId!, 3000);
    expect(done).toMatchObject({ status: "submitted", score: 1, maxScore: 3 });
    const queue = await repo.reviewQueueEntries(cert.id);
    expect(queue.map((q) => [q.questionId, q.reason]).sort()).toEqual([
      ["q1", "flagged"],
      ["q2", "missed"],
      ["q3", "missed"],
    ]);
    // Review quiz answering correctly resolves entries.
    const r = await repo.createAttempt(cert.id, { kind: "review", mode: "study", count: 10, minutes: null, shuffleChoices: false, multiScoring: "all_or_nothing", useDomainWeights: false, seed: 1 }, 4000);
    const rd = (await repo.getAttempt(r.attemptId!))!;
    expect(rd.items).toHaveLength(3);
    for (const item of rd.items) await repo.answerItem(r.attemptId!, item.id, rd.questions.get(item.questionId)!.correct, 5000);
    const studied = (await repo.getAttempt(r.attemptId!))!;
    expect(studied.items.every((i) => i.isCorrect === true)).toBe(true); // instant feedback in study mode
    await repo.submitAttempt(r.attemptId!, 6000);
    expect(await repo.reviewQueueEntries(cert.id)).toHaveLength(0);
  });

  it("study mode locks an answer after feedback", async () => {
    const { repo, cert } = await setup();
    const { attemptId } = await repo.createAttempt(cert.id, { kind: "quick", mode: "study", count: 1, minutes: null, shuffleChoices: false, multiScoring: "all_or_nothing", useDomainWeights: false, seed: 2 }, 0);
    const d = (await repo.getAttempt(attemptId!))!;
    const item = d.items[0];
    const wrong = d.questions.get(item.questionId)!.choices.find((c) => !d.questions.get(item.questionId)!.correct.includes(c.id))!.id;
    await repo.answerItem(attemptId!, item.id, [wrong], 1);
    await repo.answerItem(attemptId!, item.id, d.questions.get(item.questionId)!.correct, 2);
    const after = (await repo.getAttempt(attemptId!))!;
    expect(after.items[0].selected).toEqual([wrong]);
    expect(after.items[0].isCorrect).toBe(false);
  });

  it("empty pool returns a clear warning", async () => {
    const { repo } = await testRepo();
    const cert = await repo.createCertification({ name: "Empty" });
    const r = await repo.createAttempt(cert.id, { kind: "quick", mode: "study", count: 5, minutes: null, shuffleChoices: true, multiScoring: "all_or_nothing", useDomainWeights: false }, 0);
    expect(r.attemptId).toBeNull();
    expect(r.warnings.join(" ")).toMatch(/No questions/);
  });
});

void MemoryFileStore;
