/** Core study-domain entities. Timestamps are epoch milliseconds. */

export type Id = string;

export interface Certification {
  id: Id;
  name: string;
  provider: string;
  examCode: string;
  examVersion: string;
  examDate: string | null; // YYYY-MM-DD
  dailyMinutes: number;
  dailyCards: number;
  notes: string;
  isSample: boolean;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Domain {
  id: Id;
  certId: Id;
  name: string;
  /** Percentage weight, only when supplied by the user/source. */
  weight: number | null;
  position: number;
  source: string;
  sourceVersion: string;
}

export interface Objective {
  id: Id;
  certId: Id;
  domainId: Id | null;
  code: string;
  title: string;
  position: number;
  source: string;
  sourceVersion: string;
}

export type MaterialKind = "pdf" | "markdown" | "text" | "note";
export type MaterialStatus = "ready" | "needs_ocr" | "error";

export interface ReadingPosition {
  sectionIdx: number;
  scrollRatio: number;
  /** Read-aloud cursor (chunk within section), if any. */
  ttsChunk?: number;
}

export interface Material {
  id: Id;
  certId: Id;
  title: string;
  kind: MaterialKind;
  originalName: string;
  fileKey: string | null;
  mime: string;
  sizeBytes: number;
  sha256: string;
  sectionCount: number;
  charCount: number;
  status: MaterialStatus;
  statusDetail: string;
  tags: string[];
  position: ReadingPosition | null;
  furthestSection: number;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MaterialSection {
  id: Id;
  materialId: Id;
  idx: number;
  /** Human-readable location, e.g. "Page 4" or a heading. */
  label: string;
  page: number | null;
  text: string;
}

export interface Bookmark {
  id: Id;
  materialId: Id;
  sectionIdx: number;
  label: string;
  createdAt: number;
}

export interface Highlight {
  id: Id;
  materialId: Id;
  sectionIdx: number;
  startOffset: number;
  endOffset: number;
  text: string;
  color: string;
  createdAt: number;
}

export type Origin = "manual" | "selection" | "import" | "ai" | "sample";

/** Where a note/card/question came from in the study material. */
export interface SourceRef {
  materialId: Id | null;
  sectionIdx: number | null;
  sourceLabel: string;
  sourceQuote: string;
}

export interface Note {
  id: Id;
  certId: Id;
  materialId: Id | null;
  sectionIdx: number | null;
  sourceLabel: string;
  quote: string;
  body: string;
  tags: string[];
  origin: Origin;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
  objectiveIds: Id[];
}

export interface CardSchedule {
  due: number;
  stability: number;
  difficulty: number;
  elapsedDays: number;
  scheduledDays: number;
  learningSteps: number;
  reps: number;
  lapses: number;
  /** 0 New, 1 Learning, 2 Review, 3 Relearning (FSRS states). */
  state: number;
  lastReview: number | null;
}

export interface Flashcard extends SourceRef, CardSchedule {
  id: Id;
  certId: Id;
  front: string;
  back: string;
  tags: string[];
  origin: Origin;
  suspended: boolean;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
  objectiveIds: Id[];
}

/** FSRS grades. */
export type Grade = 1 | 2 | 3 | 4; // Again, Hard, Good, Easy

export interface Choice {
  id: string;
  text: string;
  /** Why this choice is right or wrong, when available. */
  explanation: string;
}

export type QuestionKind = "single" | "multiple";

export interface Question extends SourceRef {
  id: Id;
  certId: Id;
  kind: QuestionKind;
  stem: string;
  choices: Choice[];
  correct: string[];
  explanation: string;
  origin: Origin;
  isSample: boolean;
  createdAt: number;
  updatedAt: number;
  objectiveIds: Id[];
}

export type QuizMode = "study" | "exam";
export type QuizKind = "quick" | "weak" | "exam" | "review";
export type MultiScoring = "all_or_nothing" | "partial";

export interface QuizConfig {
  kind: QuizKind;
  mode: QuizMode;
  count: number;
  /** Time limit in minutes for timed exams; null = untimed. */
  minutes: number | null;
  shuffleChoices: boolean;
  multiScoring: MultiScoring;
  useDomainWeights: boolean;
  objectiveIds?: Id[];
  seed?: number;
}

export interface QuizAttempt {
  id: Id;
  certId: Id;
  mode: QuizMode;
  kind: QuizKind;
  status: "in_progress" | "submitted" | "abandoned";
  startedAt: number;
  deadlineAt: number | null;
  submittedAt: number | null;
  questionCount: number;
  score: number | null;
  maxScore: number | null;
  config: QuizConfig;
  warnings: string[];
}

export interface AttemptItem {
  id: Id;
  attemptId: Id;
  questionId: Id;
  position: number;
  choiceOrder: string[];
  selected: string[];
  flagged: boolean;
  score: number | null;
  isCorrect: boolean | null;
  seenBefore: boolean;
  answeredAt: number | null;
}

export interface ReviewQueueEntry {
  questionId: Id;
  certId: Id;
  reason: "missed" | "flagged";
  addedAt: number;
  lastAttemptId: Id | null;
  resolvedAt: number | null;
}

export type SessionKind = "focus";
export type SessionStatus = "completed" | "ended_early" | "interrupted";

export interface StudySession {
  id: Id;
  certId: Id | null;
  kind: SessionKind;
  task: string;
  startedAt: number;
  endedAt: number;
  focusSec: number;
  breakSec: number;
  pausedSec: number;
  plannedFocusSec: number;
  status: SessionStatus;
  timerId: string | null;
}
