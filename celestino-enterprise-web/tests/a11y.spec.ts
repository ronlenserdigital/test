import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { sampleRoutes } from "./routes";

for (const route of sampleRoutes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 3).map((n) => n.target) }))).toEqual([]);
  });
}

test("skip link and landmarks", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const active = await page.evaluate(() => document.activeElement?.textContent);
  expect(active).toContain("Skip to main content");
  await expect(page.locator("header nav[aria-label='Primary']")).toHaveCount(1);
  await expect(page.locator("main#main")).toHaveCount(1);
  await expect(page.locator("footer")).toHaveCount(1);
});
