import { expect, test } from "@playwright/test";

test("app boots to onboarding without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Which certification are you studying for?" })).toBeVisible();
  await page.screenshot({ path: "test-results/onboarding.png" });
  expect(errors).toEqual([]);
});
