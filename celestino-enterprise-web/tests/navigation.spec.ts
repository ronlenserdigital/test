import { test, expect } from "@playwright/test";

test.describe("desktop mega menu", () => {
  test.skip(({ isMobile }) => Boolean(isMobile), "desktop only");

  test("opens on hover, closes on Escape, keyboard navigable", async ({ page }) => {
    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Services" });
    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true", { timeout: 2000 });
    const panel = page.locator(`#${await trigger.getAttribute("aria-controls")}`.replace(/:/g, "\\:"));
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("link", { name: /Managed IT Services/ })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("button", { name: "Solutions" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("button", { name: "Solutions" })).toHaveAttribute("aria-expanded", "true");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBe("A");
  });

  test("operating model tabs are keyboard operable", async ({ page }) => {
    await page.goto("/approach");
    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(6);
    await tabs.nth(0).focus();
    await page.keyboard.press("ArrowDown");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel")).toContainText("Design");
  });
});

test.describe("mobile navigation", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("opens, locks scroll, closes with Escape, CTA visible", async ({ page }) => {
    await page.goto("/");
    const btn = page.getByRole("button", { name: "Open menu" });
    await btn.click();
    const menu = page.locator("#mobile-menu");
    await expect(menu).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await menu.locator("summary", { hasText: "Services" }).click();
    await expect(menu.getByRole("link", { name: "Cybersecurity Services" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Request an assessment" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  });
});

test.describe("mega menu navigation", () => {
  test("clicking a link inside every open panel navigates", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "desktop only");
    await page.goto("/");
    const targets = [
      ["Services", "/services/managed-it"],
      ["Solutions", "/solutions/cyber-resilience"],
      ["Industries", "/industries/healthcare"],
      ["Why Celestino", "/approach"],
      ["Resources", "/resources/topics/cybersecurity"],
    ] as const;
    for (const [label, href] of targets) {
      await page.goto("/");
      const trigger = page.getByRole("button", { name: label, exact: true });
      await trigger.click();
      const panelId = await trigger.getAttribute("aria-controls");
      const panel = page.locator(`[id="${panelId}"]`);
      await expect(panel).toBeVisible();
      await panel.locator(`a[href="${href}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${href.replace(/\//g, "\\/")}$`));
      await expect(page.locator("main h1")).toBeVisible();
    }
  });

  test("feature card inside the panel navigates", async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), "desktop only");
    await page.goto("/");
    await page.getByRole("button", { name: "Solutions", exact: true }).click();
    await page.getByRole("link", { name: /Cyber resilience readiness checklist/ }).click();
    await expect(page).toHaveURL(/\/resources\/cyber-resilience-readiness-checklist$/);
  });
});

test.describe("reveal animations after client-side navigation", () => {
  test("content becomes visible without a refresh", async ({ page }) => {
    await page.goto("/");
    // Navigate client-side (no full reload) to a page with reveal sections.
    await page.locator('footer a[href="/industries/healthcare"]').click();
    await page.waitForURL(/\/industries\/healthcare$/);
    const revealed = page.locator("[data-reveal]");
    const count = await revealed.count();
    expect(count).toBeGreaterThan(0);
    // Scroll through the page; every reveal element must end up visible.
    // Scroll like a user (wheel) through the whole page.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y <= height; y += 500) {
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    for (let i = 0; i < count; i++) {
      const el = revealed.nth(i);
      await expect(el).toHaveClass(/is-visible/);
      expect(await el.evaluate((n) => Number(getComputedStyle(n).opacity))).toBeGreaterThan(0.9);
    }
  });
});

test("reveal survives instant programmatic scroll (anchor jumps)", async ({ page }) => {
  await page.goto("/");
  await page.locator('footer a[href="/services/managed-it"]').click();
  await page.waitForURL(/\/services\/managed-it$/);
  await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" as ScrollBehavior }));
  await page.waitForTimeout(300);
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: "instant" as ScrollBehavior }));
  await page.waitForTimeout(400);
  const hiddenInView = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)")].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight;
    }).length,
  );
  expect(hiddenInView).toBe(0);
});
