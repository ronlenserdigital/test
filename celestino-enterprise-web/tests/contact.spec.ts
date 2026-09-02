import { test, expect } from "@playwright/test";

test("contact form validates on server and submits", async ({ page, request }, testInfo) => {
  // Each project uses its own client identity so API probes do not exhaust the rate limit for the UI submission.
  const headers = { "x-forwarded-for": testInfo.project.name === "mobile" ? "198.51.100.20" : "198.51.100.10" };
  await page.goto("/contact?intent=assessment");
  await expect(page.getByLabel("How can we help?")).toHaveValue("assessment");

  // Server-side validation: invalid email + short fill time rejected/handled.
  const bad = await request.post("/api/contact", { headers, data: { name: "A", email: "not-an-email", company: "X", intent: "assessment", message: "hi", consent: true } });
  expect(bad.status()).toBe(422);
  const body = await bad.json();
  expect(body.fieldErrors.email).toBeTruthy();

  // Honeypot: accepted silently.
  const honey = await request.post("/api/contact", { headers, data: { name: "Bot", email: "bot@example.com", company: "Bot", intent: "general", message: "spam", consent: true, website: "http://spam" } });
  expect(honey.status()).toBe(200);

  // Cross-origin post blocked.
  const xo = await request.post("/api/contact", { headers: { origin: "https://evil.example" }, data: {} });
  expect(xo.status()).toBe(403);

  // UI path.
  await page.locator("#name").fill("Test Buyer");
  await page.locator("#email").fill("buyer@example.org");
  await page.locator("#company").fill("Example Health");
  await page.locator("#message").fill("We have 60 users across two clinics and an insurance renewal in November.");
  await page.locator("#consent").check();
  await page.waitForTimeout(3200); // minimum fill time
  await page.getByRole("button", { name: /Request the assessment/ }).click();
  await expect(page).toHaveURL(/\/contact\/thanks\?intent=assessment/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Received");
});

test("rate limit returns 429 after 5 submissions", async ({ request }) => {
  const data = { name: "R", email: "r@example.org", company: "R", intent: "general", message: "rate", consent: true };
  let last = 200;
  for (let i = 0; i < 7; i++) {
    const res = await request.post("/api/contact", { headers: { "x-forwarded-for": "203.0.113.77" }, data });
    last = res.status();
    if (last === 429) break;
  }
  expect(last).toBe(429);
});
