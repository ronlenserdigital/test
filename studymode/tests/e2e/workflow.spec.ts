import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

/**
 * Main study workflow in the browser build. Speech synthesis is replaced by a
 * deterministic fake engine (headless Chromium has no voices) so we can verify
 * chunking, cursor tracking and controls; the real engine is checked manually
 * on each platform (docs/MANUAL_TESTS.md).
 */
const FAKE_SPEECH = `
  window.__spoken = [];
  class FakeUtterance { constructor(text) { this.text = text; this.rate = 1; this.pitch = 1; this.volume = 1; this.voice = null; } }
  const synth = {
    _cur: null, _t: null,
    getVoices() { return [{ voiceURI: "fake-local", name: "Fake Local Voice", lang: "en-US", localService: true, default: true }]; },
    addEventListener() {}, removeEventListener() {},
    speak(u) {
      window.__spoken.push(u.text);
      this._cur = u;
      setTimeout(() => { u.onstart && u.onstart({}); }, 5);
      this._t = setTimeout(() => { if (this._cur === u) { this._cur = null; u.onend && u.onend({}); } }, 700);
    },
    cancel() { const u = this._cur; this._cur = null; clearTimeout(this._t); if (u && u.onerror) u.onerror({ error: "interrupted" }); },
    pause() {}, resume() {},
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = FakeUtterance;
`;

const DOC = `# Networking basics

Routers forward packets between networks using a routing table. Each entry maps a destination prefix to a next hop.

Switches forward frames within a network using MAC address tables. They learn addresses from the source of incoming frames.

## Addressing

An IPv4 address has 32 bits. A subnet mask separates the network portion from the host portion.
`;

async function selectText(page: Page, contains: string) {
  await page.evaluate((needle) => {
    const p = [...document.querySelectorAll("article.reader-text p")].find((x) => x.textContent?.includes(needle));
    if (!p) throw new Error("text not on screen: " + needle);
    const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = w.nextNode()) && !node.textContent!.includes(needle));
    if (!node) throw new Error("needle spans nodes: " + needle);
    const start = node.textContent!.indexOf(needle);
    const r = document.createRange();
    r.setStart(node, start);
    r.setEnd(node, start + needle.length);
    const s = window.getSelection()!;
    s.removeAllRanges();
    s.addRange(r);
  }, contains);
  await expect(page.getByRole("toolbar", { name: "Selection actions" })).toBeVisible();
}

test.setTimeout(180_000);
test("create → import → annotate → listen → card → review → quiz → focus → progress, persisted and backed up", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(FAKE_SPEECH);
  await page.goto("/");

  // 1. Onboarding: certification, goal, import
  await page.getByLabel("Certification name").fill("Example Networking Cert");
  await page.getByLabel("Provider", { exact: true }).fill("Example Vendor");
  await page.getByLabel(/^Exam code/).fill("EX-200");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Set a daily study goal" })).toBeVisible();
  await page.getByLabel("Minutes per day").fill("45");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Add your study material" })).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose files…" }).click();
  await (await chooser).setFiles({ name: "networking.md", mimeType: "text/markdown", buffer: Buffer.from(DOC) });
  await expect(page.getByText("Imported 2 sections.")).toBeVisible();
  await page.getByRole("button", { name: "Go to today's plan" }).click();
  await expect(page.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Example Networking Cert/ })).toBeVisible();

  // 2. Reader: open, highlight, note, flashcard, read aloud
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await expect(page.getByRole("heading", { name: "networking" })).toBeVisible();
  await selectText(page, "Routers forward packets");
  await page.getByRole("button", { name: "Highlight" }).click();
  await expect(page.locator("article.reader-text mark[data-hl]")).toHaveText("Routers forward packets");

  await selectText(page, "routing table");
  await page.getByRole("toolbar", { name: "Selection actions" }).getByRole("button", { name: "Add note" }).click();
  await page.getByRole("dialog", { name: "Add note" }).getByLabel("Note").fill("Routing table = destination → next hop");
  await page.getByRole("button", { name: "Save note" }).click();
  await page.getByRole("tab", { name: /Notes/ }).click();
  await expect(page.getByText("Routing table = destination → next hop")).toBeVisible();

  await selectText(page, "A subnet mask separates the network portion from the host portion.").catch(async () => {
    await page.getByRole("button", { name: "Next" }).click();
    await selectText(page, "A subnet mask separates the network portion from the host portion.");
  });
  await page.getByRole("button", { name: "Create flashcard" }).click();
  const cardDialog = page.getByRole("dialog", { name: "Create flashcard" });
  await cardDialog.getByLabel("Front (prompt)").fill("What does a subnet mask do?");
  await cardDialog.getByRole("button", { name: "Create card" }).click();
  await expect(page.getByText("Flashcard created.")).toBeVisible();

  // Read aloud from the current position, continuing into the next section, with the reader following along.
  await page.getByRole("button", { name: "Previous" }).click();
  await page.getByRole("button", { name: "Listen" }).click();
  await expect(page.locator("p.tts-para")).toContainText("Routers forward packets");
  const spokenCount = () => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.length);
  await page.getByRole("button", { name: /Pause reading/ }).first().click();
  await expect(page.getByRole("button", { name: /Resume reading/ }).first()).toBeVisible();
  const paused = await spokenCount();
  await page.waitForTimeout(1000);
  expect(await spokenCount()).toBe(paused); // nothing plays while paused
  await page.getByRole("button", { name: /Resume reading/ }).first().click();
  await expect(page.locator("p.tts-para")).toContainText("An IPv4 address has 32 bits", { timeout: 15000 });
  await expect(page.locator(".subtle", { hasText: "Addressing · section 2 of 2" })).toBeVisible();
  await page.getByRole("button", { name: /Stop reading/ }).first().click();
  const spoken = await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken);
  expect(spoken[0]).toContain("Routers forward packets");
  expect(spoken.at(-1)).toContain("An IPv4 address has 32 bits");
  // No overlapping audio: starting a new reading stops the old one first.
  await selectText(page, "subnet mask");
  await page.getByRole("button", { name: "Read aloud" }).click();
  expect((await page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)).at(-1)).toBe("subnet mask");
  await page.getByRole("button", { name: /Stop reading/ }).first().click();

  // 3. Review the card
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /Review/ }).click();
  await expect(page.getByText("What does a subnet mask do?")).toBeVisible();
  await expect(page.getByRole("button", { name: "networking · Addressing" })).toBeVisible(); // source link visible
  await page.keyboard.press("Space");
  await expect(page.getByText("A subnet mask separates the network portion")).toBeVisible();
  await page.getByRole("button", { name: /^Easy/ }).click();
  await expect(page.getByRole("heading", { name: "Review complete" })).toBeVisible();

  // 4. Write a question and complete a quiz
  await page.getByRole("button", { name: "Question bank" }).click();
  await page.getByRole("button", { name: "New question" }).click();
  const qd = page.getByRole("dialog", { name: "New question" });
  await qd.getByLabel("Question", { exact: true }).fill("How many bits are in an IPv4 address?");
  await qd.getByLabel("Choice A text").fill("16");
  await qd.getByLabel("Choice B text").fill("32");
  await qd.getByLabel("Choice C text").fill("64");
  await qd.getByLabel("Choice D text").fill("128");
  await qd.getByLabel("Choice B is correct").check();
  await qd.getByLabel("Explanation for choice A").fill("16 bits is too few.");
  await qd.getByRole("button", { name: "Save question" }).click();
  await expect(page.getByText("How many bits are in an IPv4 address?")).toBeVisible();

  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Practice" }).click();
  await page.getByRole("button", { name: "Start quick quiz" }).click();
  await expect(page.getByText("Only 1 question available")).toBeVisible();
  await page.getByRole("radio", { name: "16", exact: true }).click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Not quite.")).toBeVisible();
  await expect(page.getByText("Why it's wrong: 16 bits is too few.")).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.getByRole("dialog", { name: "Submit quiz?" }).getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Results" })).toBeVisible();
  await expect(page.getByText("0 of 1 points")).toBeVisible();
  await page.getByRole("button", { name: "Mistake queue" }).click();
  await expect(page.getByText("How many bits are in an IPv4 address?")).toBeVisible();

  // 5. Focus session: run 26 minutes of wall-clock time, then end and save
  await page.clock.install();
  await page.clock.resume();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Focus" }).click();
  await page.getByLabel("What are you studying?").fill("Subnetting");
  await page.getByRole("button", { name: /Start 25-minute focus/ }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await expect(page.getByText("In-app focus on")).toBeVisible(); // navigation hidden
  for (let i = 0; i < 26; i++) await page.clock.fastForward("01:00");
  await expect(page.getByText("Break", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "End session" }).click();
  await expect(page.getByText(/Session saved: 25 min/)).toBeVisible();
  await expect(page.getByText("Recent sessions")).toBeVisible();
  await expect(page.getByText(/25 min focus · 1 min break/)).toBeVisible();

  // 6. Progress reflects real activity
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Progress" }).click();
  await expect(page.getByText("focused in 1 sessions")).toBeVisible();
  await expect(page.getByText("reviews done")).toBeVisible();

  // 7. Restart: everything survives a reload. (The browser adapter batches
  // IndexedDB writes for ~60 ms; the native SQLite adapter writes synchronously.)
  await page.waitForTimeout(300);
  await page.reload();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await expect(page.getByRole("heading", { name: "networking" })).toBeVisible();
  await page.getByRole("button", { name: "Flashcards" }).click();
  await expect(page.getByText("What does a subnet mask do?")).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Focus" }).click();
  await expect(page.getByText("Subnetting")).toBeVisible();
  await page.getByRole("button", { name: /Mistakes/ }).click();
  await expect(page.getByText("How many bits are in an IPv4 address?")).toBeVisible();

  // 8. Backup, wipe by restoring into a fresh profile, verify
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Data & backup" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export full backup" }).click();
  const backupPath = await (await dl).path();
  const backup = readFileSync(backupPath!);
  expect(backup.length).toBeGreaterThan(100);

  await page.evaluate(() => new Promise<void>((res) => {
    const r = indexedDB.deleteDatabase("studymode");
    r.onsuccess = r.onerror = r.onblocked = () => res();
  }));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Which certification are you studying for?" })).toBeVisible();
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Data & backup" }).click();
  const chooser2 = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Restore from backup…" }).click();
  await (await chooser2).setFiles({ name: "backup.zip", mimeType: "application/zip", buffer: backup });
  await page.getByRole("button", { name: "Replace my data" }).click();
  await expect(page.getByText(/Restored 1 certification/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Example Networking Cert" })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Addressing · section 2 of 2")).toBeVisible(); // reading position restored
  await page.getByRole("button", { name: "Previous" }).click();
  await expect(page.locator("article.reader-text mark[data-hl]").first()).toHaveText("Routers forward packets");

  expect(errors).toEqual([]);
});

test("read aloud reports missing voices instead of failing silently", async ({ page }) => {
  await page.addInitScript(`
    Object.defineProperty(window, "speechSynthesis", { value: { getVoices: () => [], addEventListener() {}, speak() {}, cancel() {} }, configurable: true });
    window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  `);
  await page.goto("/");
  await page.getByRole("button", { name: "Open a labelled sample workspace" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Read aloud" }).click();
  await expect(page.getByText("No voices are installed for speech synthesis.")).toBeVisible();
});

test("warm tint applies, persists and resets with Shift+Esc without blocking clicks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open a labelled sample workspace" }).click();
  await page.getByRole("button", { name: "Warmth and ambient sound" }).click();
  await page.getByRole("slider", { name: "Warmth" }).fill("80");
  const overlay = page.getByTestId("warm-overlay");
  await expect.poll(async () => Number(await overlay.evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.25);
  await page.keyboard.press("Escape");
  // Clicking through the overlay still works.
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await page.reload();
  await expect.poll(async () => Number(await page.getByTestId("warm-overlay").evaluate((e) => getComputedStyle(e).opacity))).toBeGreaterThan(0.25);
  await page.keyboard.press("Shift+Escape");
  await expect.poll(async () => Number(await page.getByTestId("warm-overlay").evaluate((e) => getComputedStyle(e).opacity))).toBe(0);
});

test("sample data is labelled and removable; analytics start empty", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open a labelled sample workspace" }).click();
  await expect(page.getByText("Sample data").first()).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Progress" }).click();
  await expect(page.getByText("No study activity yet")).toBeVisible();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Data & backup" }).click();
  await page.getByRole("button", { name: "Remove sample data" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Remove sample data" }).click();
  await expect(page.getByRole("heading", { name: "Which certification are you studying for?" })).toBeVisible();
});

test("scanned PDF is detected and not imported silently; corrupt PDF gives a clear error", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Certification name").fill("PDF Cert");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const scanned = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Length 24 >>\nstream\n0.5 g 50 50 500 700 re f\nendstream\nendobj\n2 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 1 0 R >>\nendobj\n3 0 obj\n<< /Type /Pages /Kids [2 0 R] /Count 1 >>\nendobj\n4 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\ntrailer\n<< /Root 4 0 R >>\n%%EOF\n",
  );
  let chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose files…" }).click();
  await (await chooser).setFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: scanned });
  await expect(page.getByRole("dialog", { name: "OCR required" })).toBeVisible();
  await expect(page.getByText(/appears to be scanned or image-only/)).toBeVisible();
  await page.getByRole("button", { name: "Don't import" }).click();
  chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Choose files…" }).click();
  await (await chooser).setFiles({ name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7 this is not really a pdf") });
  await expect(page.getByText("This PDF could not be opened. It may be corrupt or not a PDF.")).toBeVisible();
});
