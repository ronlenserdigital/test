import { test, expect } from "@playwright/test";
import { allRoutes } from "./routes";

const FORBIDDEN = [/lorem ipsum/i, /in today's rapidly evolving/i, /whether you're a small business or/i, /at celestino, we understand/i, /unlock the power/i, /your trusted partner/i, /seamless solutions/i, /cutting-edge/i, /next-generation/i, /revolutionary/i, /TODO/, /PLACEHOLDER/];

test.describe("SEO and content quality on every indexable route", () => {
  const seenTitles = new Map<string, string>();
  for (const route of allRoutes) {
    test(`${route}`, async ({ page, baseURL }, testInfo) => {
      test.skip(testInfo.project.name === "mobile", "desktop only");
      const res = await page.goto(route);
      expect(res?.status(), `status for ${route}`).toBe(200);

      const title = await page.title();
      expect(title.length, "title length").toBeGreaterThan(10);
      expect(title.length, "title length").toBeLessThan(90);
      expect(seenTitles.get(title), `duplicate title "${title}" also on ${seenTitles.get(title)}`).toBeUndefined();
      seenTitles.set(title, route);

      const desc = await page.locator('meta[name="description"]').getAttribute("content");
      expect(desc, "meta description").toBeTruthy();
      expect(desc!.length).toBeGreaterThan(50);
      expect(desc!.length).toBeLessThan(320);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, "canonical").toBeTruthy();
      expect(canonical).toMatch(/^https:\/\/celestinoenterprise\.com/);
      expect(canonical!.endsWith("/") && route !== "/", "canonical trailing slash").toBe(false);

      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

      const h1s = page.locator("h1");
      await expect(h1s, "exactly one h1").toHaveCount(1);

      const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(ld.length, "json-ld present").toBeGreaterThan(0);
      for (const block of ld) {
        const parsed = JSON.parse(block);
        expect(parsed["@context"]).toBe("https://schema.org");
        const types = JSON.stringify(parsed);
        expect(types).not.toMatch(/"AggregateRating"|"Review"|"Award"/);
      }

      const text = await page.locator("main").innerText();
      for (const re of FORBIDDEN) expect(text, `forbidden pattern ${re}`).not.toMatch(re);

      // Heading order: no skipped levels.
      const levels = await page.locator("main h1, main h2, main h3, main h4").evaluateAll((els) => els.map((e) => Number(e.tagName[1])));
      for (let i = 1; i < levels.length; i++) expect(levels[i] - levels[i - 1], `heading jump at index ${i}: ${levels.join(",")}`).toBeLessThanOrEqual(1);

      // No horizontal overflow.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
      expect(overflow, "horizontal overflow").toBe(false);

      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("nav[aria-label='Breadcrumb']")).toHaveCount(route === "/" ? 0 : 1);
    });
  }
});

test("sitemap and robots", async ({ request }) => {
  const sm = await request.get("/sitemap.xml");
  expect(sm.status()).toBe(200);
  const xml = await sm.text();
  for (const r of allRoutes) expect(xml, `sitemap includes ${r}`).toContain(`https://celestinoenterprise.com${r}<`);
  expect(xml).not.toContain("/contact/thanks");
  expect(xml).not.toContain("/api/");
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
});

test("legacy redirects are single-hop 301/308", async ({ request }) => {
  for (const [from, to] of [
    ["/home", "/"],
    ["/web-development", "/services/web-application-engineering"],
    ["/business-it-support", "/services/managed-it"],
    ["/contact-us", "/contact"],
    ["/about-us", "/about"],
  ]) {
    const res = await request.get(from, { maxRedirects: 0 });
    expect([301, 308], `${from}`).toContain(res.status());
    expect(res.headers()["location"], `${from} location`).toBe(to);
  }
});

test("security headers and 404", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["content-security-policy"]).not.toContain("unsafe-eval");
  expect(h["strict-transport-security"]).toContain("max-age=");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["x-powered-by"]).toBeUndefined();
  const nf = await request.get("/this-page-does-not-exist");
  expect(nf.status()).toBe(404);
  const sec = await request.get("/.well-known/security.txt");
  expect(sec.status()).toBe(404); // no verified security contact yet
});
