/**
 * Repository: typed persistence operations over the Db abstraction. All study
 * data access goes through here so UI code never writes SQL.
 */
import type { Db, SqlParam, Statement } from "./db";
import type { FileStore } from "./files";
import type {
  AttemptItem,
  Bookmark,
  Certification,
  Choice,
  Domain,
  Flashcard,
  Grade,
  Highlight,
  Id,
  Material,
  MaterialSection,
  Note,
  Objective,
  Origin,
  Question,
  QuizAttempt,
  QuizConfig,
  ReadingPosition,
  ReviewQueueEntry,
  StudySession,
} from "../domain/types";
import { makeScheduler, newSchedule, review as srsReview } from "../domain/srs";
import { assembleQuiz, choiceOrder, mulberry32, scoreAnswer, type QuestionStats } from "../domain/quiz";
import type { ParsedOutline } from "../domain/objectivesParse";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => (v == null ? 0 : Number(v));
const nn = (v: unknown) => (v == null ? null : Number(v));
const b = (v: unknown) => Number(v) === 1;
const json = <T>(v: unknown, fallback: T): T => {
  try {
    return v == null || v === "" ? fallback : (JSON.parse(String(v)) as T);
  } catch {
    return fallback;
  }
};

const certFrom = (r: Row): Certification => ({
  id: s(r.id),
  name: s(r.name),
  provider: s(r.provider),
  examCode: s(r.exam_code),
  examVersion: s(r.exam_version),
  examDate: r.exam_date ? s(r.exam_date) : null,
  dailyMinutes: n(r.daily_minutes),
  dailyCards: n(r.daily_cards),
  notes: s(r.notes),
  isSample: b(r.is_sample),
  archived: b(r.archived),
  createdAt: n(r.created_at),
  updatedAt: n(r.updated_at),
});

const materialFrom = (r: Row): Material => ({
  id: s(r.id),
  certId: s(r.cert_id),
  title: s(r.title),
  kind: s(r.kind) as Material["kind"],
  originalName: s(r.original_name),
  fileKey: r.file_key ? s(r.file_key) : null,
  mime: s(r.mime),
  sizeBytes: n(r.size_bytes),
  sha256: s(r.sha256),
  sectionCount: n(r.section_count),
  charCount: n(r.char_count),
  status: s(r.status) as Material["status"],
  statusDetail: s(r.status_detail),
  tags: json<string[]>(r.tags, []),
  position: json<ReadingPosition | null>(r.position, null),
  furthestSection: n(r.furthest_section),
  isSample: b(r.is_sample),
  createdAt: n(r.created_at),
  updatedAt: n(r.updated_at),
});

const cardFrom = (r: Row, objectiveIds: Id[] = []): Flashcard => ({
  id: s(r.id),
  certId: s(r.cert_id),
  front: s(r.front),
  back: s(r.back),
  materialId: r.material_id ? s(r.material_id) : null,
  sectionIdx: nn(r.section_idx),
  sourceLabel: s(r.source_label),
  sourceQuote: s(r.source_quote),
  tags: json<string[]>(r.tags, []),
  origin: s(r.origin) as Origin,
  suspended: b(r.suspended),
  due: n(r.due),
  stability: n(r.stability),
  difficulty: n(r.difficulty),
  elapsedDays: n(r.elapsed_days),
  scheduledDays: n(r.scheduled_days),
  learningSteps: n(r.learning_steps),
  reps: n(r.reps),
  lapses: n(r.lapses),
  state: n(r.state),
  lastReview: nn(r.last_review),
  isSample: b(r.is_sample),
  createdAt: n(r.created_at),
  updatedAt: n(r.updated_at),
  objectiveIds,
});

const questionFrom = (r: Row, objectiveIds: Id[] = []): Question => ({
  id: s(r.id),
  certId: s(r.cert_id),
  kind: s(r.kind) as Question["kind"],
  stem: s(r.stem),
  choices: json<Choice[]>(r.choices, []),
  correct: json<string[]>(r.correct, []),
  explanation: s(r.explanation),
  materialId: r.material_id ? s(r.material_id) : null,
  sectionIdx: nn(r.section_idx),
  sourceLabel: s(r.source_label),
  sourceQuote: s(r.source_quote),
  origin: s(r.origin) as Origin,
  isSample: b(r.is_sample),
  createdAt: n(r.created_at),
  updatedAt: n(r.updated_at),
  objectiveIds,
});

const noteFrom = (r: Row, objectiveIds: Id[] = []): Note => ({
  id: s(r.id),
  certId: s(r.cert_id),
  materialId: r.material_id ? s(r.material_id) : null,
  sectionIdx: nn(r.section_idx),
  sourceLabel: s(r.source_label),
  quote: s(r.quote),
  body: s(r.body),
  tags: json<string[]>(r.tags, []),
  origin: s(r.origin) as Origin,
  isSample: b(r.is_sample),
  createdAt: n(r.created_at),
  updatedAt: n(r.updated_at),
  objectiveIds,
});

const attemptFrom = (r: Row): QuizAttempt => ({
  id: s(r.id),
  certId: s(r.cert_id),
  mode: s(r.mode) as QuizAttempt["mode"],
  kind: s(r.kind) as QuizAttempt["kind"],
  status: s(r.status) as QuizAttempt["status"],
  startedAt: n(r.started_at),
  deadlineAt: nn(r.deadline_at),
  submittedAt: nn(r.submitted_at),
  questionCount: n(r.question_count),
  score: nn(r.score),
  maxScore: nn(r.max_score),
  config: json<QuizConfig>(r.config, {} as QuizConfig),
  warnings: json<string[]>(r.warnings, []),
});

const itemFrom = (r: Row): AttemptItem => ({
  id: s(r.id),
  attemptId: s(r.attempt_id),
  questionId: s(r.question_id),
  position: n(r.position),
  choiceOrder: json<string[]>(r.choice_order, []),
  selected: json<string[]>(r.selected, []),
  flagged: b(r.flagged),
  score: nn(r.score),
  isCorrect: r.is_correct == null ? null : b(r.is_correct),
  seenBefore: b(r.seen_before),
  answeredAt: nn(r.answered_at),
});

const sessionFrom = (r: Row): StudySession => ({
  id: s(r.id),
  certId: r.cert_id ? s(r.cert_id) : null,
  kind: "focus",
  task: s(r.task),
  startedAt: n(r.started_at),
  endedAt: n(r.ended_at),
  focusSec: n(r.focus_sec),
  breakSec: n(r.break_sec),
  pausedSec: n(r.paused_sec),
  plannedFocusSec: n(r.planned_focus_sec),
  status: s(r.status) as StudySession["status"],
  timerId: r.timer_id ? s(r.timer_id) : null,
});

export type ItemType = "material" | "note" | "card" | "question";

export class Repo {
  /** Increments on every write; UI hooks use it to refresh. */
  version = 0;
  private listeners = new Set<() => void>();
  private scheduler = makeScheduler();

  constructor(
    readonly db: Db,
    readonly files: FileStore,
  ) {}

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
  changed() {
    this.version++;
    for (const l of this.listeners) l();
  }
  private async write(sql: string, params: SqlParam[] = []) {
    const r = await this.db.run(sql, params);
    this.changed();
    return r;
  }
  private async writeBatch(stmts: Statement[]) {
    await this.db.batch(stmts);
    this.changed();
  }
  /** Test hook: deterministic scheduling. */
  setSchedulerFuzz(enable: boolean) {
    this.scheduler = makeScheduler({ enableFuzz: enable });
  }

  // ---------- settings ----------
  async getSetting<T>(key: string, fallback: T): Promise<T> {
    const rows = await this.db.all<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
    return rows.length ? json<T>(rows[0].value, fallback) : fallback;
  }
  async setSetting(key: string, value: unknown, notify = true) {
    await this.db.run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [key, JSON.stringify(value)]);
    if (notify) this.changed();
  }
  async deleteSetting(key: string) {
    await this.write("DELETE FROM settings WHERE key = ?", [key]);
  }

  // ---------- certifications ----------
  async listCertifications(): Promise<Certification[]> {
    return (await this.db.all("SELECT * FROM certifications WHERE archived = 0 ORDER BY created_at")).map(certFrom);
  }
  async getCertification(id: Id): Promise<Certification | null> {
    const r = await this.db.all("SELECT * FROM certifications WHERE id = ?", [id]);
    return r.length ? certFrom(r[0]) : null;
  }
  async createCertification(input: Partial<Certification> & { name: string }): Promise<Certification> {
    const now = Date.now();
    const c: Certification = {
      id: input.id ?? uid(),
      name: input.name.trim(),
      provider: input.provider?.trim() ?? "",
      examCode: input.examCode?.trim() ?? "",
      examVersion: input.examVersion?.trim() ?? "",
      examDate: input.examDate || null,
      dailyMinutes: input.dailyMinutes ?? 30,
      dailyCards: input.dailyCards ?? 20,
      notes: input.notes ?? "",
      isSample: input.isSample ?? false,
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    if (!c.name) throw new Error("Certification name is required.");
    await this.write(
      `INSERT INTO certifications (id,name,provider,exam_code,exam_version,exam_date,daily_minutes,daily_cards,notes,is_sample,archived,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?)`,
      [c.id, c.name, c.provider, c.examCode, c.examVersion, c.examDate, c.dailyMinutes, c.dailyCards, c.notes, c.isSample ? 1 : 0, now, now],
    );
    return c;
  }
  async updateCertification(id: Id, patch: Partial<Certification>) {
    const cur = await this.getCertification(id);
    if (!cur) throw new Error("Certification not found.");
    const c = { ...cur, ...patch };
    if (!c.name.trim()) throw new Error("Certification name is required.");
    await this.write(
      `UPDATE certifications SET name=?,provider=?,exam_code=?,exam_version=?,exam_date=?,daily_minutes=?,daily_cards=?,notes=?,updated_at=? WHERE id=?`,
      [c.name.trim(), c.provider, c.examCode, c.examVersion, c.examDate || null, c.dailyMinutes, c.dailyCards, c.notes, Date.now(), id],
    );
  }
  async deleteCertification(id: Id) {
    const mats = await this.listMaterials(id);
    await this.writeBatch([
      { sql: "DELETE FROM item_objectives WHERE objective_id IN (SELECT id FROM objectives WHERE cert_id = ?)", params: [id] },
      { sql: "DELETE FROM review_queue WHERE cert_id = ?", params: [id] },
      { sql: "DELETE FROM certifications WHERE id = ?", params: [id] },
    ]);
    for (const m of mats) if (m.fileKey) await this.files.delete(m.fileKey).catch(() => undefined);
  }

  // ---------- domains & objectives ----------
  async listDomains(certId: Id): Promise<Domain[]> {
    const rows = await this.db.all("SELECT * FROM domains WHERE cert_id = ? ORDER BY position, name", [certId]);
    return rows.map((r) => ({
      id: s(r.id),
      certId: s(r.cert_id),
      name: s(r.name),
      weight: nn(r.weight),
      position: n(r.position),
      source: s(r.source),
      sourceVersion: s(r.source_version),
    }));
  }
  async listObjectives(certId: Id): Promise<Objective[]> {
    const rows = await this.db.all(
      "SELECT o.* FROM objectives o LEFT JOIN domains d ON d.id = o.domain_id WHERE o.cert_id = ? ORDER BY COALESCE(d.position, 9999), o.position",
      [certId],
    );
    return rows.map((r) => ({
      id: s(r.id),
      certId: s(r.cert_id),
      domainId: r.domain_id ? s(r.domain_id) : null,
      code: s(r.code),
      title: s(r.title),
      position: n(r.position),
      source: s(r.source),
      sourceVersion: s(r.source_version),
    }));
  }
  async saveDomain(d: Partial<Domain> & { certId: Id; name: string }) {
    const id = d.id ?? uid();
    await this.write(
      `INSERT INTO domains (id,cert_id,name,weight,position,source,source_version) VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET name=excluded.name, weight=excluded.weight, position=excluded.position, source=excluded.source, source_version=excluded.source_version`,
      [id, d.certId, d.name.trim(), d.weight ?? null, d.position ?? 0, d.source ?? "", d.sourceVersion ?? ""],
    );
    return id;
  }
  async deleteDomain(id: Id) {
    await this.write("DELETE FROM domains WHERE id = ?", [id]);
  }
  async saveObjective(o: Partial<Objective> & { certId: Id; title: string }) {
    const id = o.id ?? uid();
    await this.write(
      `INSERT INTO objectives (id,cert_id,domain_id,code,title,position,source,source_version) VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET domain_id=excluded.domain_id, code=excluded.code, title=excluded.title, position=excluded.position, source=excluded.source, source_version=excluded.source_version`,
      [id, o.certId, o.domainId ?? null, o.code ?? "", o.title.trim(), o.position ?? 0, o.source ?? "", o.sourceVersion ?? ""],
    );
    return id;
  }
  async deleteObjective(id: Id) {
    await this.write("DELETE FROM objectives WHERE id = ?", [id]);
  }
  /** Import a parsed outline, appending domains after existing ones. */
  async importOutline(certId: Id, outline: ParsedOutline, source: string, sourceVersion: string) {
    const existing = await this.listDomains(certId);
    let pos = existing.length;
    const stmts: Statement[] = [];
    for (const d of outline.domains) {
      const did = uid();
      stmts.push({
        sql: "INSERT INTO domains (id,cert_id,name,weight,position,source,source_version) VALUES (?,?,?,?,?,?,?)",
        params: [did, certId, d.name, d.weight, pos++, source, sourceVersion],
      });
      d.objectives.forEach((o, i) =>
        stmts.push({
          sql: "INSERT INTO objectives (id,cert_id,domain_id,code,title,position,source,source_version) VALUES (?,?,?,?,?,?,?,?)",
          params: [uid(), certId, did, o.code, o.title, i, source, sourceVersion],
        }),
      );
    }
    await this.writeBatch(stmts);
  }

  // ---------- objective links ----------
  async getLinks(itemType: ItemType, itemIds: Id[]): Promise<Map<Id, Id[]>> {
    const m = new Map<Id, Id[]>();
    if (itemIds.length === 0) return m;
    for (let i = 0; i < itemIds.length; i += 500) {
      const chunk = itemIds.slice(i, i + 500);
      const rows = await this.db.all<{ item_id: string; objective_id: string }>(
        `SELECT item_id, objective_id FROM item_objectives WHERE item_type = ? AND item_id IN (${chunk.map(() => "?").join(",")})`,
        [itemType, ...chunk],
      );
      for (const r of rows) m.set(r.item_id, [...(m.get(r.item_id) ?? []), r.objective_id]);
    }
    return m;
  }
  linkStatements(itemType: ItemType, itemId: Id, objectiveIds: Id[]): Statement[] {
    return [
      { sql: "DELETE FROM item_objectives WHERE item_type = ? AND item_id = ?", params: [itemType, itemId] },
      ...[...new Set(objectiveIds)].map((o) => ({
        sql: "INSERT OR IGNORE INTO item_objectives (item_type,item_id,objective_id) VALUES (?,?,?)",
        params: [itemType, itemId, o] as SqlParam[],
      })),
    ];
  }
  async setLinks(itemType: ItemType, itemId: Id, objectiveIds: Id[]) {
    await this.writeBatch(this.linkStatements(itemType, itemId, objectiveIds));
  }
  /** Count of linked items per objective and type. */
  async objectiveCoverage(certId: Id): Promise<Map<Id, Record<ItemType, number>>> {
    const rows = await this.db.all<{ objective_id: string; item_type: ItemType; c: number }>(
      `SELECT io.objective_id, io.item_type, COUNT(*) AS c FROM item_objectives io JOIN objectives o ON o.id = io.objective_id
       WHERE o.cert_id = ? GROUP BY io.objective_id, io.item_type`,
      [certId],
    );
    const m = new Map<Id, Record<ItemType, number>>();
    for (const r of rows) {
      const cur = m.get(r.objective_id) ?? { material: 0, note: 0, card: 0, question: 0 };
      cur[r.item_type] = Number(r.c);
      m.set(r.objective_id, cur);
    }
    return m;
  }

  // ---------- materials ----------
  async listMaterials(certId: Id): Promise<Material[]> {
    return (await this.db.all("SELECT * FROM materials WHERE cert_id = ? ORDER BY updated_at DESC", [certId])).map(materialFrom);
  }
  async getMaterial(id: Id): Promise<Material | null> {
    const r = await this.db.all("SELECT * FROM materials WHERE id = ?", [id]);
    return r.length ? materialFrom(r[0]) : null;
  }
  async findDuplicate(certId: Id, sha256: string): Promise<Material | null> {
    if (!sha256) return null;
    const r = await this.db.all("SELECT * FROM materials WHERE cert_id = ? AND sha256 = ? LIMIT 1", [certId, sha256]);
    return r.length ? materialFrom(r[0]) : null;
  }
  async listSections(materialId: Id): Promise<MaterialSection[]> {
    const rows = await this.db.all("SELECT * FROM material_sections WHERE material_id = ? ORDER BY idx", [materialId]);
    return rows.map((r) => ({ id: s(r.id), materialId: s(r.material_id), idx: n(r.idx), label: s(r.label), page: nn(r.page), text: s(r.text) }));
  }
  async getSection(materialId: Id, idx: number): Promise<MaterialSection | null> {
    const rows = await this.db.all("SELECT * FROM material_sections WHERE material_id = ? AND idx = ?", [materialId, idx]);
    const r = rows[0];
    return r ? { id: s(r.id), materialId: s(r.material_id), idx: n(r.idx), label: s(r.label), page: nn(r.page), text: s(r.text) } : null;
  }
  /**
   * Store an imported material. The original bytes are written to app storage
   * first; if the database write fails the stored file is removed again.
   */
  async createMaterial(
    m: Omit<Material, "id" | "createdAt" | "updatedAt" | "position" | "furthestSection" | "sectionCount" | "charCount" | "fileKey"> & { id?: Id },
    sections: { label: string; page: number | null; text: string }[],
    original: { bytes: Uint8Array; ext: string } | null,
    objectiveIds: Id[] = [],
  ): Promise<Material> {
    const id = m.id ?? uid();
    const now = Date.now();
    let fileKey: string | null = null;
    if (original) {
      fileKey = `${id}.${original.ext.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin"}`;
      await this.files.put(fileKey, original.bytes);
    }
    const charCount = sections.reduce((a, x) => a + x.text.length, 0);
    const stmts: Statement[] = [
      {
        sql: `INSERT INTO materials (id,cert_id,title,kind,original_name,file_key,mime,size_bytes,sha256,section_count,char_count,status,status_detail,tags,position,furthest_section,is_sample,created_at,updated_at)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,0,?,?,?)`,
        params: [id, m.certId, m.title, m.kind, m.originalName, fileKey, m.mime, m.sizeBytes, m.sha256, sections.length, charCount, m.status, m.statusDetail, JSON.stringify(m.tags), m.isSample ? 1 : 0, now, now],
      },
      ...sections.map((sec, idx) => ({
        sql: "INSERT INTO material_sections (id,material_id,idx,label,page,text) VALUES (?,?,?,?,?,?)",
        params: [uid(), id, idx, sec.label, sec.page, sec.text] as SqlParam[],
      })),
      ...this.linkStatements("material", id, objectiveIds),
    ];
    try {
      await this.writeBatch(stmts);
    } catch (e) {
      if (fileKey) await this.files.delete(fileKey).catch(() => undefined);
      throw e;
    }
    return (await this.getMaterial(id))!;
  }
  async updateMaterial(id: Id, patch: { title?: string; tags?: string[] }) {
    const m = await this.getMaterial(id);
    if (!m) return;
    await this.write("UPDATE materials SET title = ?, tags = ?, updated_at = ? WHERE id = ?", [
      (patch.title ?? m.title).trim() || m.title,
      JSON.stringify(patch.tags ?? m.tags),
      Date.now(),
      id,
    ]);
  }
  async updateNoteMaterialText(id: Id, title: string, sectionIdx: number, text: string) {
    await this.writeBatch([
      { sql: "UPDATE material_sections SET text = ? WHERE material_id = ? AND idx = ?", params: [text, id, sectionIdx] },
      {
        sql: "UPDATE materials SET title = ?, char_count = (SELECT COALESCE(SUM(LENGTH(text)), 0) FROM material_sections WHERE material_id = ?), updated_at = ? WHERE id = ?",
        params: [title, id, Date.now(), id],
      },
    ]);
  }
  async savePosition(id: Id, pos: ReadingPosition) {
    // Position saves are frequent; avoid a global refresh.
    await this.db.run(
      "UPDATE materials SET position = ?, furthest_section = MAX(furthest_section, ?) WHERE id = ?",
      [JSON.stringify(pos), pos.sectionIdx, id],
    );
  }
  async deleteMaterial(id: Id) {
    const m = await this.getMaterial(id);
    await this.writeBatch([
      { sql: "DELETE FROM item_objectives WHERE item_type = 'material' AND item_id = ?", params: [id] },
      { sql: "DELETE FROM materials WHERE id = ?", params: [id] },
    ]);
    if (m?.fileKey) await this.files.delete(m.fileKey).catch(() => undefined);
  }
  async search(certId: Id, query: string, limit = 50) {
    const q = query.trim();
    if (!q) return [];
    const like = `%${q.replace(/[%_\\]/g, (c) => "\\" + c)}%`;
    const rows = await this.db.all<{ material_id: string; title: string; idx: number; label: string; text: string }>(
      `SELECT s.material_id, m.title, s.idx, s.label, s.text FROM material_sections s JOIN materials m ON m.id = s.material_id
       WHERE m.cert_id = ? AND s.text LIKE ? ESCAPE '\\' ORDER BY m.title, s.idx LIMIT ?`,
      [certId, like, limit],
    );
    const lower = q.toLowerCase();
    return rows.map((r) => {
      const t = String(r.text);
      const at = t.toLowerCase().indexOf(lower);
      const start = Math.max(0, at - 60);
      return {
        materialId: r.material_id,
        title: r.title,
        sectionIdx: Number(r.idx),
        label: r.label,
        snippet: (start > 0 ? "…" : "") + t.slice(start, at + q.length + 100).replace(/\s+/g, " ") + "…",
        offset: at,
      };
    });
  }
  async allSectionsForCert(certId: Id) {
    return this.db.all<{ material_id: string; title: string; idx: number; label: string; text: string }>(
      `SELECT s.material_id, m.title, s.idx, s.label, s.text FROM material_sections s JOIN materials m ON m.id = s.material_id
       WHERE m.cert_id = ? AND m.status = 'ready' ORDER BY m.title, s.idx`,
      [certId],
    );
  }

  // ---------- bookmarks & highlights ----------
  async listBookmarks(materialId: Id): Promise<Bookmark[]> {
    const rows = await this.db.all("SELECT * FROM bookmarks WHERE material_id = ? ORDER BY section_idx", [materialId]);
    return rows.map((r) => ({ id: s(r.id), materialId: s(r.material_id), sectionIdx: n(r.section_idx), label: s(r.label), createdAt: n(r.created_at) }));
  }
  async addBookmark(materialId: Id, sectionIdx: number, label: string) {
    await this.write("INSERT INTO bookmarks (id,material_id,section_idx,label,created_at) VALUES (?,?,?,?,?)", [uid(), materialId, sectionIdx, label, Date.now()]);
  }
  async deleteBookmark(id: Id) {
    await this.write("DELETE FROM bookmarks WHERE id = ?", [id]);
  }
  async listHighlights(materialId: Id): Promise<Highlight[]> {
    const rows = await this.db.all("SELECT * FROM highlights WHERE material_id = ? ORDER BY section_idx, start_offset", [materialId]);
    return rows.map((r) => ({
      id: s(r.id),
      materialId: s(r.material_id),
      sectionIdx: n(r.section_idx),
      startOffset: n(r.start_offset),
      endOffset: n(r.end_offset),
      text: s(r.text),
      color: s(r.color),
      createdAt: n(r.created_at),
    }));
  }
  async addHighlight(h: Omit<Highlight, "id" | "createdAt">) {
    if (h.endOffset <= h.startOffset) throw new Error("Empty highlight.");
    await this.write("INSERT INTO highlights (id,material_id,section_idx,start_offset,end_offset,text,color,created_at) VALUES (?,?,?,?,?,?,?,?)", [
      uid(),
      h.materialId,
      h.sectionIdx,
      h.startOffset,
      h.endOffset,
      h.text,
      h.color,
      Date.now(),
    ]);
  }
  async deleteHighlight(id: Id) {
    await this.write("DELETE FROM highlights WHERE id = ?", [id]);
  }

  // ---------- notes ----------
  async listNotes(certId: Id, materialId?: Id): Promise<Note[]> {
    const rows = materialId
      ? await this.db.all("SELECT * FROM notes WHERE cert_id = ? AND material_id = ? ORDER BY section_idx, created_at", [certId, materialId])
      : await this.db.all("SELECT * FROM notes WHERE cert_id = ? ORDER BY updated_at DESC", [certId]);
    const links = await this.getLinks("note", rows.map((r) => s(r.id)));
    return rows.map((r) => noteFrom(r, links.get(s(r.id)) ?? []));
  }
  async saveNote(nt: Partial<Note> & { certId: Id; body: string }) {
    const now = Date.now();
    const id = nt.id ?? uid();
    await this.writeBatch([
      {
        sql: `INSERT INTO notes (id,cert_id,material_id,section_idx,source_label,quote,body,tags,origin,is_sample,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
              ON CONFLICT(id) DO UPDATE SET body=excluded.body, tags=excluded.tags, updated_at=excluded.updated_at`,
        params: [id, nt.certId, nt.materialId ?? null, nt.sectionIdx ?? null, nt.sourceLabel ?? "", nt.quote ?? "", nt.body, JSON.stringify(nt.tags ?? []), nt.origin ?? "manual", nt.isSample ? 1 : 0, now, now],
      },
      ...(nt.objectiveIds ? this.linkStatements("note", id, nt.objectiveIds) : []),
    ]);
    return id;
  }
  async deleteNote(id: Id) {
    await this.writeBatch([
      { sql: "DELETE FROM item_objectives WHERE item_type = 'note' AND item_id = ?", params: [id] },
      { sql: "DELETE FROM notes WHERE id = ?", params: [id] },
    ]);
  }

  // ---------- flashcards ----------
  async listCards(certId: Id): Promise<Flashcard[]> {
    const rows = await this.db.all("SELECT * FROM cards WHERE cert_id = ? ORDER BY created_at DESC", [certId]);
    const links = await this.getLinks("card", rows.map((r) => s(r.id)));
    return rows.map((r) => cardFrom(r, links.get(s(r.id)) ?? []));
  }
  async getCard(id: Id): Promise<Flashcard | null> {
    const rows = await this.db.all("SELECT * FROM cards WHERE id = ?", [id]);
    if (!rows.length) return null;
    const links = await this.getLinks("card", [id]);
    return cardFrom(rows[0], links.get(id) ?? []);
  }
  cardInsert(c: {
    id: Id;
    certId: Id;
    front: string;
    back: string;
    materialId?: Id | null;
    sectionIdx?: number | null;
    sourceLabel?: string;
    sourceQuote?: string;
    tags?: string[];
    origin?: Origin;
    isSample?: boolean;
    now: number;
  }): Statement {
    const sch = newSchedule(c.now);
    return {
      sql: `INSERT INTO cards (id,cert_id,front,back,material_id,section_idx,source_label,source_quote,tags,origin,suspended,due,stability,difficulty,elapsed_days,scheduled_days,learning_steps,reps,lapses,state,last_review,is_sample,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?,NULL,?,?,?)`,
      params: [
        c.id,
        c.certId,
        c.front.trim(),
        c.back.trim(),
        c.materialId ?? null,
        c.sectionIdx ?? null,
        c.sourceLabel ?? "",
        c.sourceQuote ?? "",
        JSON.stringify(c.tags ?? []),
        c.origin ?? "manual",
        sch.due,
        sch.stability,
        sch.difficulty,
        sch.elapsedDays,
        sch.scheduledDays,
        sch.learningSteps,
        sch.reps,
        sch.lapses,
        sch.state,
        c.isSample ? 1 : 0,
        c.now,
        c.now,
      ],
    };
  }
  async createCard(c: Omit<Parameters<Repo["cardInsert"]>[0], "id" | "now"> & { objectiveIds?: Id[] }): Promise<Id> {
    if (!c.front.trim() || !c.back.trim()) throw new Error("Both sides of the card are required.");
    const id = uid();
    await this.writeBatch([this.cardInsert({ ...c, id, now: Date.now() }), ...this.linkStatements("card", id, c.objectiveIds ?? [])]);
    return id;
  }
  async createCards(cards: (Omit<Parameters<Repo["cardInsert"]>[0], "id" | "now"> & { objectiveIds?: Id[] })[]) {
    const now = Date.now();
    const stmts: Statement[] = [];
    for (const c of cards) {
      const id = uid();
      stmts.push(this.cardInsert({ ...c, id, now }), ...this.linkStatements("card", id, c.objectiveIds ?? []));
    }
    await this.writeBatch(stmts);
    return cards.length;
  }
  async updateCard(id: Id, patch: { front?: string; back?: string; tags?: string[]; suspended?: boolean; objectiveIds?: Id[] }) {
    const c = await this.getCard(id);
    if (!c) throw new Error("Card not found.");
    const front = (patch.front ?? c.front).trim();
    const back = (patch.back ?? c.back).trim();
    if (!front || !back) throw new Error("Both sides of the card are required.");
    await this.writeBatch([
      {
        sql: "UPDATE cards SET front=?, back=?, tags=?, suspended=?, updated_at=? WHERE id=?",
        params: [front, back, JSON.stringify(patch.tags ?? c.tags), (patch.suspended ?? c.suspended) ? 1 : 0, Date.now(), id],
      },
      ...(patch.objectiveIds ? this.linkStatements("card", id, patch.objectiveIds) : []),
    ]);
  }
  async deleteCard(id: Id) {
    await this.writeBatch([
      { sql: "DELETE FROM item_objectives WHERE item_type = 'card' AND item_id = ?", params: [id] },
      { sql: "DELETE FROM cards WHERE id = ?", params: [id] },
    ]);
  }
  /** Daily review queue: due cards first (oldest due first), then new cards up to the daily limit. */
  async reviewQueue(certId: Id, now: number, newLimit: number): Promise<Flashcard[]> {
    const due = await this.db.all("SELECT * FROM cards WHERE cert_id = ? AND suspended = 0 AND state != 0 AND due <= ? ORDER BY due", [certId, now]);
    const newCards = newLimit > 0
      ? await this.db.all("SELECT * FROM cards WHERE cert_id = ? AND suspended = 0 AND state = 0 ORDER BY created_at LIMIT ?", [certId, newLimit])
      : [];
    const rows = [...due, ...newCards];
    const links = await this.getLinks("card", rows.map((r) => s(r.id)));
    return rows.map((r) => cardFrom(r, links.get(s(r.id)) ?? []));
  }
  async newCardsIntroducedToday(certId: Id, dayStart: number): Promise<number> {
    const r = await this.db.all<{ c: number }>(
      "SELECT COUNT(DISTINCT card_id) AS c FROM card_reviews WHERE cert_id = ? AND reviewed_at >= ? AND state = 0",
      [certId, dayStart],
    );
    return Number(r[0]?.c ?? 0);
  }
  async cardCounts(certId: Id, now: number) {
    const r = await this.db.all<{ total: number; due: number; fresh: number }>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN state != 0 AND due <= ? AND suspended = 0 THEN 1 ELSE 0 END) AS due,
              SUM(CASE WHEN state = 0 AND suspended = 0 THEN 1 ELSE 0 END) AS fresh FROM cards WHERE cert_id = ?`,
      [now, certId],
    );
    return { total: Number(r[0]?.total ?? 0), due: Number(r[0]?.due ?? 0), fresh: Number(r[0]?.fresh ?? 0) };
  }
  async reviewCard(id: Id, grade: Grade, now: number, durationMs: number) {
    const c = await this.getCard(id);
    if (!c) throw new Error("Card not found.");
    const { schedule: sc, log } = srsReview(this.scheduler, c, grade, now);
    await this.writeBatch([
      {
        sql: `UPDATE cards SET due=?, stability=?, difficulty=?, elapsed_days=?, scheduled_days=?, learning_steps=?, reps=?, lapses=?, state=?, last_review=?, updated_at=? WHERE id=?`,
        params: [sc.due, sc.stability, sc.difficulty, sc.elapsedDays, sc.scheduledDays, sc.learningSteps, sc.reps, sc.lapses, sc.state, sc.lastReview, now, id],
      },
      {
        sql: `INSERT INTO card_reviews (id,card_id,cert_id,rating,state,due,stability,difficulty,elapsed_days,last_elapsed_days,scheduled_days,learning_steps,reviewed_at,duration_ms)
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        params: [uid(), id, c.certId, log.rating, log.state, log.due, log.stability, log.difficulty, log.elapsedDays, log.lastElapsedDays, log.scheduledDays, log.learningSteps, now, Math.max(0, Math.round(durationMs))],
      },
    ]);
    return sc;
  }
  async reviewHistory(certId: Id, since = 0) {
    return this.db.all<{ card_id: string; rating: number; reviewed_at: number; duration_ms: number }>(
      "SELECT card_id, rating, reviewed_at, duration_ms FROM card_reviews WHERE cert_id = ? AND reviewed_at >= ? ORDER BY reviewed_at",
      [certId, since],
    );
  }
  /** Due counts for the next N days (forecast of review workload). */
  async dueForecast(certId: Id, now: number, days: number) {
    const rows = await this.db.all<{ due: number }>("SELECT due FROM cards WHERE cert_id = ? AND suspended = 0 AND state != 0 AND due < ?", [
      certId,
      now + days * 86_400_000,
    ]);
    const out = new Array(days).fill(0);
    for (const r of rows) out[Math.max(0, Math.floor((Number(r.due) - now) / 86_400_000))]++;
    return out as number[];
  }

  // ---------- questions ----------
  async listQuestions(certId: Id): Promise<Question[]> {
    const rows = await this.db.all("SELECT * FROM questions WHERE cert_id = ? ORDER BY created_at DESC", [certId]);
    const links = await this.getLinks("question", rows.map((r) => s(r.id)));
    return rows.map((r) => questionFrom(r, links.get(s(r.id)) ?? []));
  }
  async getQuestions(ids: Id[]): Promise<Map<Id, Question>> {
    const m = new Map<Id, Question>();
    if (!ids.length) return m;
    const rows = await this.db.all(`SELECT * FROM questions WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    const links = await this.getLinks("question", ids);
    for (const r of rows) m.set(s(r.id), questionFrom(r, links.get(s(r.id)) ?? []));
    return m;
  }
  questionInsert(q: Omit<Question, "createdAt" | "updatedAt" | "objectiveIds">, now: number): Statement {
    return {
      sql: `INSERT INTO questions (id,cert_id,kind,stem,choices,correct,explanation,material_id,section_idx,source_label,source_quote,origin,is_sample,created_at,updated_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET kind=excluded.kind, stem=excluded.stem, choices=excluded.choices, correct=excluded.correct, explanation=excluded.explanation, updated_at=excluded.updated_at`,
      params: [q.id, q.certId, q.kind, q.stem.trim(), JSON.stringify(q.choices), JSON.stringify(q.correct), q.explanation, q.materialId, q.sectionIdx, q.sourceLabel, q.sourceQuote, q.origin, q.isSample ? 1 : 0, now, now],
    };
  }
  async saveQuestion(q: Omit<Question, "createdAt" | "updatedAt">) {
    await this.writeBatch([this.questionInsert(q, Date.now()), ...this.linkStatements("question", q.id, q.objectiveIds)]);
  }
  async saveQuestions(qs: Omit<Question, "createdAt" | "updatedAt">[]) {
    const now = Date.now();
    await this.writeBatch(qs.flatMap((q) => [this.questionInsert(q, now), ...this.linkStatements("question", q.id, q.objectiveIds)]));
  }
  async deleteQuestion(id: Id) {
    await this.writeBatch([
      { sql: "DELETE FROM item_objectives WHERE item_type = 'question' AND item_id = ?", params: [id] },
      { sql: "DELETE FROM questions WHERE id = ?", params: [id] },
    ]);
  }

  // ---------- quizzes ----------
  async questionStats(certId: Id): Promise<Map<Id, QuestionStats>> {
    const rows = await this.db.all<{ question_id: string; seen: number; correct: number }>(
      `SELECT i.question_id, COUNT(*) AS seen, SUM(CASE WHEN i.is_correct = 1 THEN 1 ELSE 0 END) AS correct
       FROM attempt_items i JOIN quiz_attempts a ON a.id = i.attempt_id WHERE a.cert_id = ? AND a.status = 'submitted' AND i.is_correct IS NOT NULL GROUP BY i.question_id`,
      [certId],
    );
    const queue = await this.db.all<{ question_id: string }>("SELECT question_id FROM review_queue WHERE cert_id = ? AND resolved_at IS NULL", [certId]);
    const inQueue = new Set(queue.map((q) => q.question_id));
    const m = new Map<Id, QuestionStats>();
    for (const r of rows) m.set(r.question_id, { seen: Number(r.seen), correct: Number(r.correct ?? 0), inReviewQueue: inQueue.has(r.question_id) });
    for (const q of inQueue) if (!m.has(q)) m.set(q, { seen: 0, correct: 0, inReviewQueue: true });
    return m;
  }
  /** All submitted answers with objective tags, for analytics and weak-topic detection. */
  async answerRecords(certId: Id) {
    const rows = await this.db.all<{ question_id: string; is_correct: number; seen_before: number; submitted_at: number; mode: string }>(
      `SELECT i.question_id, i.is_correct, i.seen_before, a.submitted_at, a.mode FROM attempt_items i JOIN quiz_attempts a ON a.id = i.attempt_id
       WHERE a.cert_id = ? AND a.status = 'submitted' AND i.is_correct IS NOT NULL`,
      [certId],
    );
    const links = await this.getLinks("question", [...new Set(rows.map((r) => r.question_id))]);
    return rows.map((r) => ({
      questionId: r.question_id,
      objectiveIds: links.get(r.question_id) ?? [],
      isCorrect: Number(r.is_correct) === 1,
      seenBefore: Number(r.seen_before) === 1,
      at: Number(r.submitted_at),
    }));
  }
  async createAttempt(certId: Id, config: QuizConfig, now: number, objectiveAccuracy: Map<Id, { correct: number; total: number }> = new Map()) {
    const [pool, domains, objectives, stats] = await Promise.all([
      this.listQuestions(certId),
      this.listDomains(certId),
      this.listObjectives(certId),
      this.questionStats(certId),
    ]);
    const seed = config.seed ?? Math.floor(Math.random() * 2 ** 31);
    const rng = mulberry32(seed);
    const result = assembleQuiz(
      { pool, config, domains, objectiveDomain: new Map(objectives.map((o) => [o.id, o.domainId])), stats, objectiveAccuracy },
      rng,
    );
    if (result.questionIds.length === 0) return { attemptId: null, warnings: result.warnings };
    const id = uid();
    const byId = new Map(pool.map((q) => [q.id, q]));
    const deadline = config.mode === "exam" && config.minutes ? now + config.minutes * 60_000 : null;
    const stmts: Statement[] = [
      {
        sql: "INSERT INTO quiz_attempts (id,cert_id,mode,kind,status,started_at,deadline_at,question_count,config,warnings) VALUES (?,?,?,?,'in_progress',?,?,?,?,?)",
        params: [id, certId, config.mode, config.kind, now, deadline, result.questionIds.length, JSON.stringify({ ...config, seed }), JSON.stringify(result.warnings)],
      },
      ...result.questionIds.map((qid, i) => ({
        sql: "INSERT INTO attempt_items (id,attempt_id,question_id,position,choice_order,selected,flagged,seen_before) VALUES (?,?,?,?,?,'[]',0,?)",
        params: [uid(), id, qid, i, JSON.stringify(choiceOrder(byId.get(qid)!, config.shuffleChoices, rng)), result.seenBefore.has(qid) ? 1 : 0] as SqlParam[],
      })),
    ];
    await this.writeBatch(stmts);
    return { attemptId: id, warnings: result.warnings };
  }
  async getAttempt(id: Id) {
    const a = await this.db.all("SELECT * FROM quiz_attempts WHERE id = ?", [id]);
    if (!a.length) return null;
    const items = (await this.db.all("SELECT * FROM attempt_items WHERE attempt_id = ? ORDER BY position", [id])).map(itemFrom);
    const questions = await this.getQuestions(items.map((i) => i.questionId));
    return { attempt: attemptFrom(a[0]), items, questions };
  }
  async listAttempts(certId: Id, limit = 50) {
    return (await this.db.all("SELECT * FROM quiz_attempts WHERE cert_id = ? ORDER BY started_at DESC LIMIT ?", [certId, limit])).map(attemptFrom);
  }
  async inProgressAttempt(certId: Id) {
    const r = await this.db.all("SELECT * FROM quiz_attempts WHERE cert_id = ? AND status = 'in_progress' ORDER BY started_at DESC LIMIT 1", [certId]);
    return r.length ? attemptFrom(r[0]) : null;
  }
  /**
   * Record an answer. In study mode the item is scored immediately (instant
   * feedback); in exam mode scoring waits for submission.
   */
  async answerItem(attemptId: Id, itemId: Id, selected: string[], now: number) {
    const data = await this.getAttempt(attemptId);
    if (!data) throw new Error("Quiz not found.");
    if (data.attempt.status !== "in_progress") throw new Error("This quiz has already been submitted.");
    const item = data.items.find((i) => i.id === itemId);
    if (!item) throw new Error("Question not found in quiz.");
    if (data.attempt.mode === "study" && item.answeredAt != null) return; // locked after feedback
    const q = data.questions.get(item.questionId);
    let score: number | null = null;
    let correct: number | null = null;
    if (data.attempt.mode === "study" && q) {
      const r = scoreAnswer(q, selected, data.attempt.config.multiScoring);
      score = r.score;
      correct = r.isCorrect ? 1 : 0;
    }
    await this.write("UPDATE attempt_items SET selected = ?, answered_at = ?, score = ?, is_correct = ? WHERE id = ?", [
      JSON.stringify(selected),
      now,
      score,
      correct,
      itemId,
    ]);
  }
  async flagItem(itemId: Id, flagged: boolean) {
    await this.write("UPDATE attempt_items SET flagged = ? WHERE id = ?", [flagged ? 1 : 0, itemId]);
  }
  /** Score all items, close the attempt and update the mistake review queue. */
  async submitAttempt(attemptId: Id, now: number) {
    const data = await this.getAttempt(attemptId);
    if (!data) throw new Error("Quiz not found.");
    if (data.attempt.status === "submitted") return data.attempt;
    const stmts: Statement[] = [];
    let total = 0;
    for (const item of data.items) {
      const q = data.questions.get(item.questionId);
      if (!q) continue;
      const r = scoreAnswer(q, item.selected, data.attempt.config.multiScoring);
      total += r.score;
      stmts.push({ sql: "UPDATE attempt_items SET score = ?, is_correct = ? WHERE id = ?", params: [r.score, r.isCorrect ? 1 : 0, item.id] });
      if (!r.isCorrect || item.flagged) {
        stmts.push({
          sql: `INSERT INTO review_queue (question_id,cert_id,reason,added_at,last_attempt_id,resolved_at) VALUES (?,?,?,?,?,NULL)
                ON CONFLICT(question_id) DO UPDATE SET reason=excluded.reason, added_at=excluded.added_at, last_attempt_id=excluded.last_attempt_id, resolved_at=NULL`,
          params: [q.id, q.certId, !r.isCorrect ? "missed" : "flagged", now, attemptId],
        });
      } else if (data.attempt.kind === "review") {
        // Answering correctly in a mistake-review quiz resolves the entry.
        stmts.push({ sql: "UPDATE review_queue SET resolved_at = ? WHERE question_id = ? AND resolved_at IS NULL", params: [now, q.id] });
      }
    }
    stmts.push({
      sql: "UPDATE quiz_attempts SET status = 'submitted', submitted_at = ?, score = ?, max_score = ? WHERE id = ?",
      params: [now, total, data.items.length, attemptId],
    });
    await this.writeBatch(stmts);
    return (await this.getAttempt(attemptId))!.attempt;
  }
  async abandonAttempt(attemptId: Id) {
    await this.write("UPDATE quiz_attempts SET status = 'abandoned' WHERE id = ? AND status = 'in_progress'", [attemptId]);
  }
  async reviewQueueEntries(certId: Id): Promise<ReviewQueueEntry[]> {
    const rows = await this.db.all("SELECT * FROM review_queue WHERE cert_id = ? AND resolved_at IS NULL ORDER BY added_at DESC", [certId]);
    return rows.map((r) => ({
      questionId: s(r.question_id),
      certId: s(r.cert_id),
      reason: s(r.reason) as ReviewQueueEntry["reason"],
      addedAt: n(r.added_at),
      lastAttemptId: r.last_attempt_id ? s(r.last_attempt_id) : null,
      resolvedAt: nn(r.resolved_at),
    }));
  }
  async resolveMistake(questionId: Id) {
    await this.write("UPDATE review_queue SET resolved_at = ? WHERE question_id = ?", [Date.now(), questionId]);
  }

  // ---------- study sessions ----------
  /** Idempotent per timer id, so a retried/duplicated save never double counts. */
  async recordSession(sess: Omit<StudySession, "id">) {
    await this.write(
      `INSERT OR IGNORE INTO study_sessions (id,cert_id,kind,task,started_at,ended_at,focus_sec,break_sec,paused_sec,planned_focus_sec,status,timer_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [uid(), sess.certId, sess.kind, sess.task, sess.startedAt, sess.endedAt, sess.focusSec, sess.breakSec, sess.pausedSec, sess.plannedFocusSec, sess.status, sess.timerId],
    );
  }
  async listSessions(certId: Id | null, limit = 200): Promise<StudySession[]> {
    const rows = certId
      ? await this.db.all("SELECT * FROM study_sessions WHERE cert_id = ? ORDER BY started_at DESC LIMIT ?", [certId, limit])
      : await this.db.all("SELECT * FROM study_sessions ORDER BY started_at DESC LIMIT ?", [limit]);
    return rows.map(sessionFrom);
  }
  async deleteSession(id: Id) {
    await this.write("DELETE FROM study_sessions WHERE id = ?", [id]);
  }

  // ---------- sample data ----------
  async hasSampleData() {
    const r = await this.db.all<{ c: number }>("SELECT COUNT(*) AS c FROM certifications WHERE is_sample = 1");
    return Number(r[0]?.c ?? 0) > 0;
  }
  async removeSampleData() {
    const certs = await this.db.all<{ id: string }>("SELECT id FROM certifications WHERE is_sample = 1");
    for (const c of certs) await this.deleteCertification(c.id);
  }
}
