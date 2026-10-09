import { test } from "@playwright/test";

// Captures screenshots for visual review (not assertions). Run with: SCREENS=1 npx playwright test screens
test.skip(!process.env.SCREENS, "screenshots only on demand");
const OUT = process.env.SCREENS_DIR ?? "test-results/screens";

test("capture key screens", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open a labelled sample workspace" }).click();
  await page.waitForTimeout(500);
  const shot = async (name: string) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  await shot("dashboard");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await shot("library");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.waitForTimeout(300);
  await shot("reader");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: /Review/ }).click();
  await page.keyboard.press("Space");
  await shot("review");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Practice" }).click();
  await shot("practice");
  await page.getByRole("button", { name: "Start quick quiz" }).click();
  await page.getByRole("radio").first().click();
  await page.getByRole("button", { name: "Check answer" }).click();
  await shot("quiz");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Focus" }).click();
  await shot("focus-setup");
  await page.getByRole("button", { name: /Start 25-minute focus/ }).click();
  await page.waitForTimeout(1200);
  await shot("focus-running");
  await page.getByRole("button", { name: "End session" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByRole("tab", { name: "Focus & distractions" }).click();
  await shot("settings-focus");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Today" }).click();
  await shot("dashboard-dark");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Library" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await shot("reader-dark");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Today" }).click();
  await shot("mobile-dashboard");
  await page.getByRole("navigation", { name: "Main" }).getByRole("button", { name: "Focus" }).click();
  await shot("mobile-focus");
});
