import type { Article } from "../types";

export const article: Article = {
  slug: "cloud-vs-hybrid-infrastructure",
  title: "Cloud vs Hybrid Infrastructure: A Workload-by-Workload Decision Guide",
  description:
    "A decision guide for placing each workload in public cloud, on-premises or a hybrid arrangement, covering email and collaboration, file services, line-of-business applications, databases, specialized hardware and backups, with the factors that decide each case.",
  category: "cloud",
  type: "decision-guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-07-09",
  reviewedAt: "2026-08-30",
  readingMinutes: 11,
  summary:
    "The cloud versus hybrid question is answered workload by workload, not for the organization as a whole. Email, collaboration and most productivity tools belong in software-as-a-service. Modern line-of-business applications and general-purpose file services usually belong in cloud platforms. Databases with heavy local integration, applications tied to specialized hardware, legacy systems with licensing constraints, and sites with poor connectivity are the usual reasons to keep an on-premises footprint, and most organizations of 20 to 500 people end up hybrid for at least one of those reasons.",
  sections: [
    {
      id: "stop-asking-the-question-at-the-organization-level",
      heading: "Stop asking the question at the organization level",
      body: [
        "Cloud-first, cloud-only and cloud-never are all policies that ignore the actual shape of an organization's workloads. Every environment contains services with different latency, integration, licensing, compliance and connectivity requirements, and each of those requirements pushes a workload toward a particular home. The useful question is where each workload runs best, and the answer for the organization is whatever falls out of that analysis.",
        "Hybrid is not a compromise; it is the normal end state for organizations with any physical operations, any legacy applications or any site with unreliable connectivity. The goal is a deliberate hybrid, where each workload's placement is a decision with a documented reason, rather than an accidental hybrid, where on-premises systems remain because nobody got around to them.",
        "This guide works through the major workload classes and the factors that decide each one. The [cloud and infrastructure](/services/cloud-infrastructure) work Celestino delivers starts with exactly this inventory.",
      ],
    },
    {
      id: "the-factors-that-decide-placement",
      heading: "The factors that decide placement",
      body: [
        "Six factors decide most placements. Weigh them per workload and the placement is usually obvious.",
      ],
      list: [
        "Latency and integration: does the workload need sub-10 millisecond access to something physical, such as a machine, scanner, instrument or local database? If so, it stays close to that thing.",
        "Connectivity: can the site tolerate an internet outage for this workload? If not, and the site lacks redundant circuits, keep a local capability.",
        "Licensing and support: does the vendor support or license the application in cloud environments? Some legacy line-of-business vendors do not, or price it prohibitively.",
        "Compliance and data residency: are there contractual or regulatory constraints on where the data lives or who administers it? Most are satisfiable in cloud with the right controls, but they must be verified.",
        "Cost shape: is the workload steady-state and predictable, or bursty and variable? Steady, always-on compute is often cheaper on-premises over a five-year life; variable or growing workloads favor cloud.",
        "Operational capability: who will run it? A workload that needs skills you do not have and cannot economically hire is a candidate for a managed cloud service regardless of the other factors.",
      ],
    },
    {
      id: "decision-table-by-workload",
      heading: "Decision table by workload type",
      body: [
        "The table gives the default placement for each major workload class and the conditions that change the default. Defaults reflect what works for most organizations of 20 to 500 people; the exceptions are where the real decisions live.",
      ],
      table: {
        headers: ["Workload", "Default placement", "Keep on-premises or hybrid when", "Notes"],
        rows: [
          ["Email, calendar and collaboration", "SaaS (Microsoft 365 or Google Workspace)", "Almost never; air-gapped or classified environments only", "Identity becomes the control plane; secure the tenant as carefully as a data center"],
          ["File services", "Cloud (SharePoint, OneDrive, cloud file platforms)", "Large CAD, media or imaging files edited locally; sites with poor bandwidth; applications that require SMB paths", "Hybrid with a local cache or sync appliance is common for engineering and media"],
          ["Line-of-business applications", "Vendor SaaS where offered; otherwise cloud IaaS", "Vendor does not support cloud; heavy integration with local hardware; licensing tied to physical servers", "Confirm vendor support in writing before migrating"],
          ["Databases", "Managed cloud database service", "Sub-10 ms latency to local applications; very large steady-state workloads; licensing constraints", "Egress and IOPS costs surprise more organizations than compute costs"],
          ["Specialized hardware (manufacturing, lab, imaging, building systems)", "On-premises, isolated network segment", "Always; the hardware is physical", "Cloud for reporting, analytics and backup of the data these systems produce"],
          ["Backups", "Cloud immutable storage for the offsite copy", "Local copy for fast restores of large datasets", "3-2-1-1-0 requires both; the cloud copy must be isolated from production credentials"],
          ["Identity and directory", "Cloud identity provider", "Legacy applications requiring on-premises Active Directory", "Hybrid identity is standard; plan to retire on-premises AD over time"],
          ["Virtual desktops", "Cloud VDI or Windows 365 for remote and contract workers", "Graphics-heavy workloads; sites where latency to cloud is poor", "Often the right answer for contractor and acquisition onboarding"],
          ["Web and customer-facing applications", "Cloud platform services", "Rarely", "Use platform services and managed security rather than self-managed servers"],
        ],
      },
    },
    {
      id: "email-collaboration-and-files",
      heading: "Email, collaboration and file services",
      body: [
        "Email and collaboration are the settled case. Running an on-premises mail server in 2026 carries security exposure, patching burden and availability risk with no offsetting benefit for nearly every organization. The decision is which platform, and the work is securing the tenant: conditional access, MFA, mailbox auditing, DMARC enforcement and a backup of the tenant data, because the platform's native retention is not a backup.",
        "File services are more nuanced. Document collaboration belongs in cloud platforms, where versioning, sharing controls and search are better than any file server. The exceptions are large binary files edited locally, such as CAD, video, GIS and medical imaging, and applications that require a traditional SMB path. Those cases are usually served by a hybrid file platform with a local cache or a right-sized on-premises file server that replicates to cloud storage.",
        "The common mistake is lifting a file server into a cloud virtual machine unchanged. That preserves every limitation of the file server while adding latency and cloud cost. Migrate to a cloud file platform, or keep the server local with cloud backup, but avoid the middle ground.",
      ],
    },
    {
      id: "line-of-business-applications-and-databases",
      heading: "Line-of-business applications and databases",
      body: [
        "Line-of-business applications follow their vendors. Where the vendor offers a mature SaaS edition, that is usually the right destination, and the migration is a data and integration project rather than an infrastructure project. Where the vendor supports cloud infrastructure, a lift to cloud IaaS with right-sized virtual machines works well for applications that no longer have physical dependencies.",
        "Applications stay on-premises when the vendor will not support cloud, when licensing is bound to physical hosts or cores at a cost that cloud makes worse, or when the application talks to local hardware with tight timing. Practice management systems attached to imaging equipment, manufacturing execution systems attached to machines, and warehouse systems attached to scanners and conveyors are typical.",
        "Databases follow the applications they serve. A managed cloud database service is the default for applications in cloud, because it removes patching, backup and high-availability work. Keep a database on-premises when a local application needs very low latency to it, when the workload is large and steady enough that cloud pricing is unfavorable, or when licensing constraints apply. Watch for egress and storage IOPS pricing, which are the two cost lines that most often exceed estimates. Celestino's [infrastructure modernization](/solutions/infrastructure-modernization) work usually starts by untangling application and database dependencies for exactly this reason.",
      ],
    },
    {
      id: "specialized-hardware-and-backups",
      heading: "Specialized hardware and backups",
      body: [
        "Anything physical stays physical. Manufacturing equipment, laboratory instruments, imaging modalities, building automation, access control and point-of-sale systems all require local infrastructure, and the correct architecture is an isolated network segment with strict firewall rules, local servers where the equipment vendors require them, and a controlled path for the data those systems produce to reach cloud services for reporting, analytics and backup.",
        "Backups are inherently hybrid. A local copy provides fast restore of large datasets and continued protection during an internet outage; an immutable offsite copy in cloud object storage provides protection against site loss and ransomware. The offsite copy must be isolated from production credentials, ideally in a separate tenant with object lock enabled, and both copies must be tested by restoring from them. The companion guide on backup versus disaster recovery covers the 3-2-1-1-0 pattern in detail.",
      ],
    },
    {
      id: "designing-the-hybrid-deliberately",
      heading: "Designing the hybrid deliberately",
      body: [
        "Once workload placements are decided, design the connective tissue. Hybrid environments need a cloud identity provider that is the source of truth with on-premises directory synchronization where legacy applications require it, a site-to-cloud network with redundant internet circuits and, where latency matters, private connectivity, a consistent security stack across both sides including endpoint detection, logging and backup, and a single management and monitoring view.",
        "Document the reason each on-premises workload remains and set a review date. Vendors add cloud support, hardware reaches end of life and connectivity improves, and each of those events can change a placement. A deliberate hybrid shrinks over time; an accidental one grows.",
        "Finally, price the full picture. Cloud subscriptions, local hardware refresh, connectivity, backup storage, licensing and the operational labor for both sides should be modeled over five years before committing. The lowest-cost architecture on paper is frequently not the one with the lowest total cost once egress, licensing and the labor to run two environments are included.",
      ],
    },
    {
      id: "a-short-worked-example",
      heading: "A short worked example",
      body: [
        "Consider a 120-person professional services firm with two offices and a small imaging lab. Applying the table: email and collaboration move to SaaS, general file services move to a cloud file platform, the practice management system moves to the vendor's SaaS edition, and finance moves to a cloud accounting platform. The imaging modality and its acquisition workstation stay on an isolated local segment with a small local server the vendor requires, and its studies replicate nightly to cloud storage. Identity moves to a cloud identity provider with directory synchronization retained only until the last on-premises application is retired. Backups use a local appliance for fast restore and an immutable cloud copy for site loss.",
        "The result is a hybrid with one on-premises workload that has a documented reason and a review date, cloud everywhere else, and a single security and monitoring stack across both. That is the outcome to aim for: not cloud or hybrid, but each workload where it belongs, for a reason you can state.",
      ],
    },
  ],
  keyTakeaways: [
    "Decide placement per workload using latency, connectivity, licensing, compliance, cost shape and operational capability; the organization's architecture follows from those decisions.",
    "Email and collaboration belong in SaaS; general file services and modern applications belong in cloud platforms; physical equipment always keeps local infrastructure.",
    "Databases follow their applications, and egress and IOPS costs are the lines most likely to exceed estimates.",
    "Backups are hybrid by design: a local copy for fast restore and an immutable, credential-isolated cloud copy for site loss and ransomware.",
    "Document the reason for every on-premises workload and set a review date so the hybrid shrinks deliberately instead of growing by default.",
  ],
  references: [
    { label: "NIST SP 800-145, The NIST Definition of Cloud Computing", url: "https://csrc.nist.gov/pubs/sp/800/145/final" },
    { label: "CISA Cloud Security Technical Reference Architecture", url: "https://www.cisa.gov/resources-tools/resources/cloud-security-technical-reference-architecture" },
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
  ],
  relatedServiceSlugs: ["cloud-infrastructure", "network-management", "backup-disaster-recovery"],
  relatedArticleSlugs: ["backup-vs-disaster-recovery", "managed-it-vs-co-managed-it", "cyber-resilience-readiness-checklist"],
};
