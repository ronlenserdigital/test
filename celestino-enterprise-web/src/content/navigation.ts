import { services } from "./services";
import { solutions } from "./solutions";
import { industries } from "./industries";
import type { IconName } from "@/components/icons/icon-names";

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: IconName;
}

export interface NavGroup {
  heading: string;
  links: NavLink[];
}

export interface NavFeature {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export interface NavItem {
  label: string;
  href: string;
  groups?: NavGroup[];
  feature?: NavFeature;
}

const serviceLinks = (slugs: string[]): NavLink[] =>
  slugs
    .map((slug) => services.find((s) => s.slug === slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({ label: s.navLabel, href: `/services/${s.slug}`, description: s.shortDescription, icon: s.icon }));

export const primaryNav: NavItem[] = [
  {
    label: "Services",
    href: "/services",
    groups: [
      {
        heading: "Operate",
        links: serviceLinks(["managed-it", "co-managed-it", "network-management"]),
      },
      {
        heading: "Protect & recover",
        links: serviceLinks(["cybersecurity", "security-risk-advisory", "backup-disaster-recovery"]),
      },
      {
        heading: "Modernize & build",
        links: serviceLinks(["cloud-infrastructure", "software-development", "web-application-engineering", "ai-automation"]),
      },
    ],
    feature: {
      eyebrow: "Start here",
      title: "Not sure which service fits?",
      description: "A readiness assessment maps your environment to the right operating model in one conversation.",
      href: "/contact?intent=assessment",
      cta: "Request an assessment",
    },
  },
  {
    label: "Solutions",
    href: "/solutions",
    groups: [
      {
        heading: "By outcome",
        links: solutions.map((s) => ({
          label: s.name,
          href: `/solutions/${s.slug}`,
          description: s.shortDescription,
          icon: s.icon,
        })),
      },
    ],
    feature: {
      eyebrow: "Guide",
      title: "Cyber resilience readiness checklist",
      description: "Fifteen controls, in order, that decide whether an attack is an incident or an outage.",
      href: "/resources/cyber-resilience-readiness-checklist",
      cta: "Read the checklist",
    },
  },
  {
    label: "Industries",
    href: "/industries",
    groups: [
      {
        heading: "Sectors",
        links: industries.map((i) => ({
          label: i.name,
          href: `/industries/${i.slug}`,
          description: i.shortDescription,
          icon: i.icon,
        })),
      },
    ],
    feature: {
      eyebrow: "Public sector",
      title: "Government capabilities",
      description: "Capabilities, procurement information and compliance frameworks for public-sector buyers.",
      href: "/government",
      cta: "View capabilities",
    },
  },
  {
    label: "Why Celestino",
    href: "/about",
    groups: [
      {
        heading: "Company",
        links: [
          { label: "About", href: "/about", description: "Who we are and what we stand behind.", icon: "flag" },
          { label: "Our approach", href: "/approach", description: "The Assess → Improve operating model.", icon: "compass" },
          { label: "Nationwide support", href: "/nationwide-support", description: "Remote-first operations, onsite response across the US.", icon: "globe" },
        ],
      },
      {
        heading: "Trust",
        links: [
          { label: "Trust Center", href: "/trust", description: "Security practices, privacy, disclosure, accessibility.", icon: "shield-check" },
          { label: "Certifications & partners", href: "/trust/certifications", description: "Verified credentials, as they are confirmed.", icon: "badge" },
          { label: "Government & public sector", href: "/government", description: "Capabilities and procurement information.", icon: "building" },
        ],
      },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    groups: [
      {
        heading: "Insights",
        links: [
          { label: "All resources", href: "/resources", description: "Guides, checklists and decision frameworks.", icon: "document" },
          { label: "Cybersecurity", href: "/resources/topics/cybersecurity", description: "Controls, frameworks and threat commentary.", icon: "shield" },
          { label: "IT strategy & operations", href: "/resources/topics/it-operations", description: "Operating models, staffing and lifecycle.", icon: "server" },
          { label: "Compliance", href: "/resources/topics/compliance", description: "HIPAA, FINRA, SOX, NIST and CMMC guidance.", icon: "document" },
          { label: "Resilience", href: "/resources/topics/resilience", description: "Backup, recovery and continuity.", icon: "backup" },
        ],
      },
      {
        heading: "Evidence",
        links: [
          { label: "Case studies", href: "/case-studies", description: "Verified engagements, published as they are approved.", icon: "target" },
          { label: "Government technology", href: "/resources/topics/government-technology", description: "Procurement and security guidance for public bodies.", icon: "building" },
        ],
      },
    ],
    feature: {
      eyebrow: "Decision guide",
      title: "Managed IT vs Co-Managed IT",
      description: "How to choose an operating model based on staff, risk and growth, with a responsibility matrix template.",
      href: "/resources/managed-it-vs-co-managed-it",
      cta: "Read the guide",
    },
  },
];

export const primaryCta = { label: "Request an assessment", href: "/contact?intent=assessment" };
export const secondaryCta = { label: "Talk to an engineer", href: "/contact?intent=expert" };

export const footerColumns: NavGroup[] = [
  {
    heading: "Services",
    links: services.map((s) => ({ label: s.navLabel, href: `/services/${s.slug}` })),
  },
  {
    heading: "Solutions",
    links: solutions.map((s) => ({ label: s.name, href: `/solutions/${s.slug}` })),
  },
  {
    heading: "Industries",
    links: [
      ...industries.map((i) => ({ label: i.name, href: `/industries/${i.slug}` })),
      { label: "Government capabilities", href: "/government" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Our approach", href: "/approach" },
      { label: "Nationwide support", href: "/nationwide-support" },
      { label: "Case studies", href: "/case-studies" },
      { label: "Resources", href: "/resources" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Trust",
    links: [
      { label: "Trust Center", href: "/trust" },
      { label: "Security practices", href: "/trust/security-practices" },
      { label: "Privacy", href: "/privacy" },
      { label: "Responsible disclosure", href: "/trust/responsible-disclosure" },
      { label: "Accessibility", href: "/trust/accessibility" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
