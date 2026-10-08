/**
 * Clearly labelled sample workspace. It describes study techniques rather
 * than any real certification, so it cannot be mistaken for an official
 * syllabus. Everything is flagged is_sample and removable in Settings.
 */
import type { Repo } from "./repo";
import { uid } from "./repo";
import { parseOutline } from "../domain/objectivesParse";

const TEXT = `Active recall means retrieving information from memory instead of re-reading it. Each time you pull an answer out of memory, the memory becomes easier to retrieve later. Flashcards and practice questions are both forms of active recall.

Spaced repetition schedules reviews at increasing intervals. Reviewing just before you would forget is more efficient than reviewing on a fixed schedule. StudyMode uses the FSRS algorithm, which estimates how stable each memory is and schedules the next review for a target recall probability.

Interleaving mixes different topics within one study session. It feels harder than studying one topic at a time, but it helps you learn to choose the right approach for each problem.

Elaboration means explaining ideas in your own words and connecting them to what you already know. Writing short notes beside the source text is a simple way to elaborate.

Focused study blocks with short breaks help maintain attention. A common pattern is 25 minutes of focus followed by a 5-minute break, with a longer break after four blocks.`;

export async function createSampleWorkspace(repo: Repo) {
  const cert = await repo.createCertification({
    name: "Sample: Study Skills",
    provider: "StudyMode sample",
    examCode: "SAMPLE",
    examVersion: "not a real exam",
    dailyMinutes: 30,
    dailyCards: 10,
    isSample: true,
    notes: "This is sample data to explore StudyMode. It is not an official exam. Remove it in Settings → Data.",
  });
  await repo.importOutline(
    cert.id,
    parseOutline("1.0 Memory techniques\n1.1 Explain active recall\n1.2 Describe spaced repetition\n2.0 Study habits\n2.1 Use interleaving and elaboration\n2.2 Plan focused study blocks"),
    "StudyMode sample outline",
    "sample",
  );
  const objectives = await repo.listObjectives(cert.id);
  const obj = (code: string) => objectives.find((o) => o.code === code)!.id;
  const material = await repo.createMaterial(
    { certId: cert.id, title: "Sample: Effective study techniques", kind: "note", originalName: "", mime: "text/plain", sizeBytes: TEXT.length, sha256: "sample", status: "ready", statusDetail: "", tags: ["sample"], isSample: true },
    [{ label: "Study techniques", page: null, text: TEXT }],
    { bytes: new TextEncoder().encode(TEXT), ext: "txt" },
    [obj("1.1"), obj("1.2"), obj("2.1"), obj("2.2")],
  );
  const src = { materialId: material.id, sectionIdx: 0, sourceLabel: "Sample: Effective study techniques · Study techniques", origin: "sample" as const, isSample: true, certId: cert.id };
  await repo.createCards([
    { ...src, front: "What is active recall?", back: "Retrieving information from memory instead of re-reading it.", objectiveIds: [obj("1.1")] },
    { ...src, front: "Why does spaced repetition review just before forgetting?", back: "It is more efficient than reviewing on a fixed schedule.", objectiveIds: [obj("1.2")] },
    { ...src, front: "What is interleaving?", back: "Mixing different topics within one study session.", objectiveIds: [obj("2.1")] },
    { ...src, front: "Give a common focus/break pattern.", back: "25 minutes focus, 5 minutes break; longer break after four blocks.", objectiveIds: [obj("2.2")] },
  ]);
  const q = (stem: string, choices: [string, boolean, string][], explanation: string, objectiveIds: string[]) => ({
    id: uid(),
    certId: cert.id,
    kind: choices.filter((c) => c[1]).length > 1 ? ("multiple" as const) : ("single" as const),
    stem,
    choices: choices.map(([text, , why], i) => ({ id: "abcdef"[i], text, explanation: why })),
    correct: choices.flatMap(([, ok], i) => (ok ? ["abcdef"[i]] : [])),
    explanation,
    materialId: material.id,
    sectionIdx: 0,
    sourceLabel: src.sourceLabel,
    sourceQuote: "",
    origin: "sample" as const,
    isSample: true,
    objectiveIds,
  });
  await repo.saveQuestions([
    q("Which activity is an example of active recall?", [["Re-reading a chapter", false, "Re-reading is passive review."], ["Answering a flashcard from memory", true, "Retrieving the answer from memory is active recall."], ["Highlighting key terms", false, "Highlighting alone does not require retrieval."], ["Listening to a summary", false, "Listening is passive."]], "Active recall requires retrieving information from memory.", [obj("1.1")]),
    q("What does spaced repetition optimise?", [["The timing of reviews", true, "It schedules reviews at increasing intervals."], ["The number of topics per day", false, "That is not what spacing controls."], ["Font size", false, "Unrelated."], ["Note length", false, "Unrelated."]], "Spacing schedules reviews just before you would forget.", [obj("1.2")]),
    q("Which TWO are study techniques described in the sample material?", [["Interleaving", true, "Mixing topics within a session."], ["Elaboration", true, "Explaining ideas in your own words."], ["Cramming the night before", false, "Not described as effective."], ["Skipping breaks", false, "The material recommends breaks."]], "The material describes interleaving and elaboration.", [obj("2.1")]),
    q("In the common focus pattern, how long is the short break?", [["5 minutes", true, "25 minutes focus then 5 minutes break."], ["15 minutes", false, "That is the longer break after four blocks."], ["1 minute", false, "Too short for the described pattern."], ["30 minutes", false, "Not described."]], "25/5 with a longer break after four blocks.", [obj("2.2")]),
  ]);
  return cert;
}
