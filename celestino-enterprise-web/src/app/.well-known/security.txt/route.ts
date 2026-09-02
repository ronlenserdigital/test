import { SITE_URL, site } from "@/content/site";

/**
 * RFC 9116 security.txt. Served ONLY when a verified security contact exists in
 * site.ts; otherwise 404 so no false disclosure channel is advertised.
 */
export function GET() {
  const contact = site.securityContactEmail;
  if (!contact.verified || !contact.value) {
    return new Response("Not found", { status: 404 });
  }
  const expires = new Date();
  expires.setMonth(expires.getMonth() + 11);
  const body = [
    `Contact: mailto:${contact.value}`,
    `Expires: ${expires.toISOString()}`,
    `Policy: ${SITE_URL}/trust/responsible-disclosure`,
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    "Preferred-Languages: en",
    "",
  ].join("\n");
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
