import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE_URL ?? "http://localhost:3100";
const out = process.env.OUT ?? "screenshots";
const widths = (process.env.WIDTHS ?? "1440,1024,768,390,320").split(",").map(Number);
const routes = (process.env.ROUTES ?? "/,/services/cybersecurity,/resources/backup-vs-disaster-recovery,/contact,/government").split(",");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {});
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: "networkidle" });
    const name = `${out}/${w}${r === "/" ? "-home" : r.replace(/\//g, "-")}.png`;
    await page.screenshot({ path: name, fullPage: process.env.FULL === "1" });
    console.log(name);
  }
  await ctx.close();
}
await browser.close();
