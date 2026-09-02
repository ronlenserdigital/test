import type { Author } from "./types";

/**
 * Named subject-matter authors must be supplied by the client (name, role, credentials, photo).
 * Until then, articles are attributed to the Celestino engineering team as an organization.
 */
export const authors: Author[] = [
  {
    id: "celestino-engineering",
    slug: "celestino-engineering",
    name: "Celestino Engineering Team",
    role: "Infrastructure, security and application engineers",
    bio: "Articles attributed to the Celestino Engineering Team are written and reviewed by the engineers who deliver Celestino's managed IT, cybersecurity, recovery and application engineering services. Named author profiles with individual credentials are added as they are confirmed.",
    credentials: [],
    isOrganization: true,
    verified: true,
  },
];

export const authorMap = new Map(authors.map((a) => [a.id, a]));
export function getAuthor(id: string): Author | undefined {
  return authorMap.get(id);
}
