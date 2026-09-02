import { test, expect } from "@playwright/test";
import { allRoutes } from "./routes";

/** Crawls every internal link on every route and asserts it resolves (no dead links, no orphans). */
test("no broken internal links and every route is linked from somewhere", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "desktop only");
  test.setTimeout(300_000);
  const linked = new Set<string>();
  const checked = new Map<string, number>();
  for (const route of allRoutes) {
    await page.goto(route);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
    for (const href of hrefs) {
      const path = href.split("#")[0].split("?")[0];
      if (!path) continue;
      linked.add(path);
      if (checked.has(path)) continue;
      const res = await request.get(path, { maxRedirects: 5 });
      checked.set(path, res.status());
    }
  }
  const broken = [...checked.entries()].filter(([, s]) => s >= 400);
  expect(broken, `broken links: ${JSON.stringify(broken)}`).toEqual([]);
  const orphans = allRoutes.filter((r) => r !== "/" && !linked.has(r));
  expect(orphans, `orphan routes: ${orphans.join(", ")}`).toEqual([]);
});
