import type { Article } from "../types";

export const article: Article = {
  slug: "backup-vs-disaster-recovery",
  title: "Backup vs Disaster Recovery: Why Having One Does Not Mean You Have the Other",
  description:
    "The difference between backup and disaster recovery explained through recovery point and recovery time objectives, the 3-2-1-1-0 pattern, immutability, restore testing cadence and the Microsoft 365 backup misconception.",
  category: "resilience",
  type: "decision-guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-07-16",
  reviewedAt: "2026-08-30",
  readingMinutes: 10,
  summary:
    "Backup is a copy of data that can be restored; disaster recovery is the tested capability to bring systems and services back into operation within a defined time after a disruption. Backups answer the question of how much data you can lose (recovery point objective), while disaster recovery answers how long you can be down (recovery time objective), and it requires infrastructure to restore onto, a documented order of operations, and regular exercises. An organization with reliable backups and no disaster recovery plan will eventually recover its data, but the recovery may take days or weeks, which for most businesses is the disaster.",
  sections: [
    {
      id: "two-different-questions",
      heading: "Two different questions",
      body: [
        "Backup and disaster recovery are conflated because the same vendors sell both and the same appliance often does both. They answer different questions. Backup answers: if data is lost, corrupted or encrypted, can we get a good copy back, and how recent is it? Disaster recovery answers: if a system, a site or the whole environment is unavailable, how quickly can we be operating again, on what infrastructure, in what order, and who does what?",
        "A backup is a noun: a copy of data. Disaster recovery is a capability: the combination of copies, infrastructure, documentation, people and practice that turns a copy into a working service. You can have excellent backups and no disaster recovery capability, and many organizations do. The reverse is impossible, because recovery depends on having something to recover from.",
        "The distinction matters most in a ransomware event. An organization with backups but no recovery plan spends the first day discovering that it has nowhere to restore to because the hypervisor is encrypted, that nobody knows the restore order for the identity, database and application tiers, and that the backup console credentials were in the password manager that is also down.",
      ],
    },
    {
      id: "rpo-and-rto-explained",
      heading: "RPO and RTO explained",
      body: [
        "Recovery point objective (RPO) is the maximum amount of data loss, measured in time, that a system can tolerate. An RPO of four hours means backups must be taken at least every four hours, and that a failure could lose up to four hours of work. RPO is set by the business owner of the system, not by IT, and it drives backup frequency and the technology used.",
        "Recovery time objective (RTO) is the maximum time a system can be unavailable before the impact becomes unacceptable. An RTO of eight hours means the system must be restored and usable within eight hours of the disruption. RTO drives the recovery architecture: a system with a 15-minute RTO needs replication and a warm standby, while a system with a three-day RTO can be rebuilt from backups onto replacement hardware.",
        "Every system should have a documented RPO and RTO agreed with its business owner and recorded in a register. The register is the foundation of the disaster recovery plan, because it dictates which systems get expensive replication and which get inexpensive backup, and it defines the order in which systems are restored. Organizations that skip this step discover their real tolerances during the outage, which is the most expensive way to learn them.",
      ],
    },
    {
      id: "the-3-2-1-1-0-pattern",
      heading: "The 3-2-1-1-0 pattern",
      body: [
        "The classic 3-2-1 rule, three copies of data on two different media with one offsite, was designed for hardware failure and site loss. Ransomware changed the threat, and the pattern has been extended to 3-2-1-1-0 to address it.",
      ],
      list: [
        "3: keep at least three copies of the data, the production copy and two backups.",
        "2: store the backups on at least two different types of media or platforms, so that a single failure mode cannot destroy both.",
        "1: keep at least one copy offsite, in a different physical location or a cloud region, to survive site loss.",
        "1: keep at least one copy that is offline, air-gapped or immutable, so that an attacker with production credentials cannot alter or delete it.",
        "0: verify zero errors through automated backup verification and regular restore testing, because a backup that has never been restored is an assumption.",
      ],
    },
    {
      id: "immutability-and-credential-isolation",
      heading: "Immutability and credential isolation",
      body: [
        "Ransomware operators routinely spend days inside an environment before encrypting anything, and one of their first objectives is to locate and destroy backups. A backup repository that can be deleted or overwritten using credentials found in the production environment will be deleted or overwritten. Immutability is the control that prevents this: the backup platform or the storage layer refuses to modify or delete backup data for a defined retention period regardless of the credentials presented.",
        "Immutability comes in several forms. Cloud object storage with object lock in compliance mode, hardened Linux repositories with immutable flags, purpose-built backup appliances with immutable snapshots, and tape or removable media that is physically disconnected. What they share is that the production administrator, and therefore an attacker holding the production administrator's credentials, cannot shorten the retention or remove the data.",
        "Immutability must be paired with credential isolation. The backup platform should authenticate through its own identity store or a separate tenant, with MFA, not through the production directory. The offsite copy should live in an account or tenant that production credentials cannot reach. Celestino's [backup and disaster recovery](/services/backup-disaster-recovery) designs treat this separation as non-negotiable, because it is the difference between recovering in hours and negotiating with a criminal.",
      ],
    },
    {
      id: "the-microsoft-365-misconception",
      heading: "The Microsoft 365 backup misconception",
      body: [
        "A common belief is that data in Microsoft 365 or Google Workspace is backed up by the platform. It is not, in the sense that matters. The platforms provide high availability and replication, which protects against infrastructure failure, and retention features such as the recycle bin, litigation hold and retention policies, which protect against some deletions for some period. They do not provide a point-in-time copy that you control, stored outside the tenant, that can be restored if the tenant is compromised, an administrator deletes data maliciously, a retention policy is misconfigured, or a sync client propagates ransomware encryption into SharePoint and OneDrive.",
        "Microsoft's own service agreements make clear that customers are responsible for their data and recommend third-party backup. The practical consequence is that email, SharePoint, OneDrive, Teams and the identity configuration should be backed up to a separate platform, with retention you control and restore granularity down to the individual item. This is inexpensive relative to the exposure and is now a standard question on cyber-insurance applications.",
        "The same reasoning applies to other SaaS platforms holding business-critical data, including CRM, accounting and practice management systems. Check each vendor's export and backup capabilities, and where they are inadequate, schedule regular exports to storage you control.",
      ],
    },
    {
      id: "restore-testing-cadence",
      heading: "Restore testing cadence",
      body: [
        "Backup success reports measure whether a job ran, not whether the data can be restored into a working system. The only proof is a restore. A practical cadence for organizations of 20 to 500 people is: automated backup verification on every job where the platform supports it; file-level restore tests monthly, rotating through systems; full system restore tests of each critical system at least quarterly, measured against its RTO; and a full environment recovery exercise at least annually, restoring identity, core infrastructure and the top-priority applications in the documented order onto isolated infrastructure.",
        "Each test should produce a short record: what was restored, from which copy, how long it took, whether the result was usable, and what was learned. Failed tests are valuable; they surface missing dependencies, expired credentials, undocumented configuration and unrealistic RTOs while there is time to fix them.",
        "Restore testing is also the point where backup and disaster recovery meet. A quarterly full restore that takes eleven hours against an eight-hour RTO is a disaster recovery finding, not a backup finding, and the fix is usually in architecture or process rather than in the backup software.",
      ],
    },
    {
      id: "what-disaster-recovery-adds",
      heading: "What disaster recovery adds",
      body: [
        "Disaster recovery adds everything needed to turn copies into services within the RTO. That includes recovery infrastructure, whether standby hardware, a secondary site, a cloud landing zone or a provider's recovery environment; replication for systems whose RTO is too short for restore-from-backup; a documented restore order that respects dependencies, typically identity first, then networking and core services, then databases, then applications; runbooks with credentials stored outside the production environment; assigned roles and an activation decision process; and communication templates for staff, customers and partners.",
        "It also adds the connection to business continuity: while systems are being recovered, the business needs manual workarounds, alternate communication channels and a way to prioritize. The companion guide on business continuity versus disaster recovery covers that layer.",
        "Organizations should be able to state, for each critical system, where it will be restored, from which copy, by whom, in how long, and when that was last proven. If any of those answers is unknown, the organization has backups and does not yet have disaster recovery.",
      ],
    },
    {
      id: "decision-summary",
      heading: "Decision summary",
      body: [
        "The table summarizes what each capability provides and what it requires. Use it to assess where you stand and to structure conversations with providers. A [cyber resilience](/solutions/cyber-resilience) assessment typically evaluates both columns against the RPO and RTO register.",
      ],
      table: {
        headers: ["Question", "Backup", "Disaster recovery"],
        rows: [
          ["What it answers", "Can we get the data back, and how recent is it?", "How quickly can we operate again, and on what?"],
          ["Primary metric", "Recovery point objective (RPO)", "Recovery time objective (RTO)"],
          ["Core components", "Copies, retention, immutability, verification", "Recovery infrastructure, replication, runbooks, restore order, roles, exercises"],
          ["Protects against", "Data loss, corruption, deletion, ransomware encryption", "System, site or environment unavailability"],
          ["Proof it works", "Successful restore of data", "Timed recovery of services within RTO"],
          ["Typical gap", "No immutable or isolated copy; SaaS data not backed up", "No recovery infrastructure, no restore order, never exercised"],
          ["Test cadence", "Monthly file restores, automated verification", "Quarterly system restores, annual full exercise"],
        ],
      },
    },
  ],
  keyTakeaways: [
    "Backup is a copy of data; disaster recovery is the tested capability to restore services within a defined time, and having the first does not give you the second.",
    "RPO defines acceptable data loss and drives backup frequency; RTO defines acceptable downtime and drives recovery architecture; both must be agreed with business owners and recorded.",
    "Follow 3-2-1-1-0: three copies, two media, one offsite, one immutable or offline, zero verification errors.",
    "Immutability and credential isolation are what keep backups alive through a ransomware event; a backup deletable with production credentials is not a backup.",
    "Microsoft 365 and other SaaS platforms do not back up your data in a form you control; back them up to a separate platform.",
    "Only restores prove recoverability: monthly file restores, quarterly system restores and an annual full environment exercise.",
  ],
  references: [
    { label: "CISA #StopRansomware Guide", url: "https://www.cisa.gov/stopransomware/ransomware-guide" },
    { label: "NIST SP 800-34 Rev. 1, Contingency Planning Guide for Federal Information Systems", url: "https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final" },
    { label: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
  ],
  relatedServiceSlugs: ["backup-disaster-recovery", "cloud-infrastructure", "cybersecurity"],
  relatedArticleSlugs: ["business-continuity-vs-disaster-recovery", "cyber-resilience-readiness-checklist", "cloud-vs-hybrid-infrastructure"],
};
