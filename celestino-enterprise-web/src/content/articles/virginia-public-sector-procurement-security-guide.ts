import type { Article } from "../types";

export const article: Article = {
  slug: "virginia-public-sector-procurement-security-guide",
  title: "Selling Technology Services to Virginia Public Bodies: Procurement and Security Basics",
  description:
    "What technology vendors need to know before selling to Virginia state agencies, localities and public bodies: eVA registration, SWaM certification, the Commonwealth's information security standards administered by VITA, cooperative contracts, and the security documentation local governments ask vendors to provide.",
  category: "government-technology",
  type: "guide",
  authorId: "celestino-engineering",
  publishedAt: "2026-08-13",
  reviewedAt: "2026-08-30",
  readingMinutes: 11,
  summary:
    "Selling technology services to Virginia public bodies requires registration in eVA, the Commonwealth's electronic procurement system, and benefits from SWaM certification through the Department of Small Business and Supplier Diversity for small, women-owned and minority-owned businesses. Vendors serving executive-branch agencies must align with the Commonwealth's information security standards administered by the Virginia Information Technologies Agency (VITA), and vendors serving localities should expect security questionnaires, insurance requirements and contract clauses modeled on those standards. Cooperative contracts, including VITA statewide contracts and other public cooperative vehicles, are often the fastest path to an award. This guide describes those mechanisms; it does not assert that Celestino holds any specific registration or certification.",
  sections: [
    {
      id: "how-virginia-public-procurement-is-organized",
      heading: "How Virginia public procurement is organized",
      body: [
        "Public procurement in Virginia is governed by the Virginia Public Procurement Act (VPPA), which applies to state agencies, localities, school divisions, authorities and other public bodies. The Act sets the methods of procurement, including competitive sealed bidding, competitive negotiation, small purchase procedures and cooperative procurement, and it defines the thresholds and rules for each. Localities adopt their own procurement policies within the Act's framework, so the details vary by jurisdiction.",
        "State executive-branch agencies procure through the Department of General Services, Division of Purchases and Supply, for most goods and non-technology services, and through the Virginia Information Technologies Agency (VITA) for information technology. VITA's role is central for technology vendors: it sets the security and architecture standards that agencies must follow, operates statewide technology contracts, and reviews or approves agency technology procurements above defined thresholds.",
        "Local governments, school divisions and public universities have their own purchasing offices and considerable autonomy. They frequently use cooperative contracts established by the state or by other public bodies, and they increasingly borrow the Commonwealth's security requirements when writing their own solicitations. Understanding both the state layer and the local layer is necessary for vendors that want to serve either. Celestino's [government](/government) practice is organized around that distinction.",
      ],
    },
    {
      id: "eva-registration",
      heading: "eVA registration",
      body: [
        "eVA is the Commonwealth of Virginia's electronic procurement system. State agencies are required to use it, and most localities and other public bodies participate. Vendors register in eVA to receive solicitation notices, submit quotes and bids, receive purchase orders and, for many buyers, receive payment. Registration is the practical prerequisite for doing business with Virginia public bodies.",
        "Registration involves creating a vendor account, providing tax and business information, selecting commodity codes that describe the goods and services offered, and choosing a registration level. eVA charges transaction fees on orders placed through the system, with the fee structure depending on the registration option selected, so vendors should review the current fee schedule on the eVA site before registering. Commodity code selection matters because buyers use the codes to identify vendors for solicitations and small purchases.",
        "Once registered, vendors should maintain accurate contact information and commodity codes and monitor the Virginia Business Opportunities (VBO) postings, where solicitations are published. Many small technology awards are made through informal quotes to registered vendors rather than through formal solicitations, so visibility in the system has direct commercial value.",
      ],
    },
    {
      id: "swam-certification",
      heading: "SWaM certification",
      body: [
        "SWaM stands for Small, Women-owned and Minority-owned business. Certification is administered by the Virginia Department of Small Business and Supplier Diversity (SBSD). The Commonwealth has executive-level goals for the share of spending directed to SWaM-certified businesses, and state agencies report against those goals. Many localities have adopted similar programs. The practical result is that SWaM certification increases a vendor's visibility and, for small purchases, may be the basis for a set-aside or a preference.",
        "Eligibility for the small business category is based on employee count and revenue thresholds defined by SBSD, along with independent ownership and control. Women-owned and minority-owned categories require majority ownership and control by qualifying individuals. Micro business is a further designation within small business for the smallest firms. Certification is free, is applied for through SBSD's online portal, requires supporting documentation of ownership and size, and must be renewed periodically.",
        "Certification does not guarantee awards. It makes a vendor eligible for programs designed to increase small business participation, and it appears in eVA vendor records where buyers can search by it. Vendors should confirm their eligibility against current SBSD criteria and, if certified, reference the certification accurately in proposals. Celestino describes its own status in its proposals and does not represent that status here.",
      ],
    },
    {
      id: "commonwealth-security-standards",
      heading: "The Commonwealth's information security standards",
      body: [
        "VITA administers the information security policies and standards that apply to executive-branch agencies. The long-standing standard was SEC 501, the Commonwealth's Information Security Standard, based on the NIST SP 800-53 control catalog. VITA has since issued SEC 530 as the current Commonwealth Information Security Standard, which succeeds SEC 501 and continues to align with NIST SP 800-53. Because these documents are revised, vendors should confirm the current standard and version on the VITA policies and standards page rather than relying on a cited version.",
        "Related VITA standards address specific situations, including requirements for third-party hosted environments and cloud services, IT risk management, and technology audits. Agencies contracting for hosted or managed services will typically require the vendor to comply with the applicable standard, complete a security assessment, and accept contract terms that address data ownership, breach notification, security controls, audit rights and, for cloud services, data location and return.",
        "For vendors, the practical implication is that the Commonwealth's requirements are NIST-based. A vendor whose own security program is organized around NIST CSF 2.0 or NIST SP 800-53, with documented policies, risk assessment, access control, logging, incident response and backup and recovery, will find that agency security questionnaires map to controls it already operates. Vendors that cannot produce that documentation will struggle with executive-branch agencies regardless of their technical capability. Celestino's [security and risk advisory](/services/security-risk-advisory) work helps vendors and public bodies alike build that documentation.",
      ],
    },
    {
      id: "cooperative-contracts",
      heading: "Cooperative contracts",
      body: [
        "Cooperative procurement allows a public body to purchase from a contract competitively awarded by another public body, without running its own solicitation, when the original contract permits cooperative use. The VPPA authorizes this, and it is the most common way that localities and school divisions buy technology services quickly.",
        "Several categories of cooperative vehicles matter to technology vendors in Virginia. VITA statewide contracts cover a range of hardware, software and services and are available to state agencies and, for many contracts, to localities and other public bodies. Contracts awarded by localities and consortia, and contracts from national cooperative purchasing organizations, are used widely by Virginia localities where the underlying award was competitive and permits cooperative use. Vendors that hold a position on one of these vehicles can be purchased from directly, which removes months from a procurement.",
        "Getting onto a cooperative vehicle requires responding to the originating solicitation when it is issued, which means monitoring VBO and the procurement pages of the larger localities and cooperatives. Vendors without a contract vehicle can still sell through small purchase procedures, informal quotes and formal solicitations, but should expect longer timelines and, above the small purchase threshold, full competition.",
      ],
    },
    {
      id: "what-local-governments-ask-vendors-for",
      heading: "What local governments ask vendors for",
      body: [
        "Local governments in Virginia have become substantially more demanding about vendor security since a series of ransomware incidents affected localities and school divisions nationally. A technology vendor responding to a locality solicitation, or being onboarded as a managed service provider, should expect requests for the items below and should have them ready before the opportunity appears.",
      ],
      list: [
        "A description of the vendor's own security program, often as a completed questionnaire, covering policies, access control, MFA, endpoint protection, logging, vulnerability management, backup and incident response.",
        "Evidence of independent assessment where the vendor hosts or accesses public body data: a SOC 2 report, a recent penetration test summary or a third-party security assessment.",
        "Cyber liability and professional liability insurance certificates at limits specified in the solicitation, frequently with the public body named as additional insured.",
        "Background check attestations for personnel with access to public body systems or data, and in some cases, for personnel working in facilities such as schools or public safety.",
        "Contract terms addressing data ownership, confidentiality, breach notification timelines, return and destruction of data, subcontractor flow-down, audit cooperation and compliance with the Virginia records and freedom of information laws.",
        "For criminal justice, health, student or tax data, evidence of compliance with the applicable federal or state requirements such as CJIS, HIPAA, FERPA or IRS Publication 1075.",
        "References from other public bodies and, increasingly, a description of the vendor's own business continuity and disaster recovery capability, because a provider outage becomes the locality's outage.",
      ],
    },
    {
      id: "preparing-a-credible-vendor-package",
      heading: "Preparing a credible vendor package",
      body: [
        "The vendors that win public work in Virginia are rarely the ones with the lowest price. They are the ones whose proposals are complete, whose security documentation is ready, and whose references answer the phone. A reusable vendor package removes most of the friction from responding.",
        "The package should include current eVA registration details and commodity codes, SWaM certification documents if held, insurance certificates, a security program summary written against NIST-aligned control families, the most recent independent assessment, standard contract terms the vendor can accept, background check procedures, a business continuity summary, and public sector references. Keep it current with a quarterly review, because the documents that lapse most often are insurance certificates and assessment reports.",
        "Finally, read each solicitation completely. Virginia public bodies disqualify responses for missing forms, unsigned addenda and late submissions far more often than for weak technical content. A calendar of pre-bid conferences, question deadlines and submission deadlines for each opportunity is the simplest and most effective tool a vendor can maintain. For public bodies evaluating vendors, the [government and public sector](/industries/government-public-sector) resources on this site describe what a well-prepared provider should be able to show.",
      ],
    },
    {
      id: "a-checklist-for-first-time-vendors",
      heading: "A checklist for first-time vendors",
      body: [
        "The table summarizes the steps for a technology vendor entering the Virginia public market for the first time and where each is completed. Verify current requirements on the official sites, because fees, thresholds and forms change.",
      ],
      table: {
        headers: ["Step", "Where", "Notes"],
        rows: [
          ["Register in eVA with accurate commodity codes", "eva.virginia.gov", "Required for state agencies; used by most localities; review fee options"],
          ["Assess SWaM eligibility and apply if eligible", "sbsd.virginia.gov", "Free; requires ownership and size documentation; renew periodically"],
          ["Review the current VITA information security standard", "vita.virginia.gov", "Confirm the current standard and version; requirements are NIST SP 800-53 based"],
          ["Build a NIST-aligned security program summary", "Internal", "Maps to agency and locality questionnaires"],
          ["Obtain cyber and professional liability coverage", "Insurance broker", "Check solicitation limits; additional insured endorsements are common"],
          ["Monitor VBO and locality procurement pages", "eVA and locality sites", "Includes cooperative contract solicitations"],
          ["Identify cooperative vehicles relevant to your services", "VITA contracts, locality and cooperative sites", "Fastest route to purchase once awarded"],
          ["Assemble references and background check procedures", "Internal", "Public sector references carry the most weight"],
        ],
      },
    },
  ],
  keyTakeaways: [
    "eVA registration is the practical prerequisite for selling to Virginia state agencies and most localities; choose commodity codes carefully and review the fee options.",
    "SWaM certification through SBSD increases visibility and eligibility for small business programs but does not guarantee awards; confirm eligibility against current criteria.",
    "VITA administers the Commonwealth's NIST-based information security standards; confirm the current standard and version, and organize your own security program around NIST control families so questionnaires map to what you already run.",
    "Cooperative contracts, including VITA statewide contracts and other public cooperative vehicles, are usually the fastest path to a purchase.",
    "Local governments ask for security questionnaires, independent assessments, insurance, background checks, data protection contract terms and continuity capability; have a current vendor package ready before the opportunity appears.",
  ],
  references: [
    { label: "eVA, Virginia's eProcurement Portal", url: "https://eva.virginia.gov/" },
    { label: "Virginia Department of Small Business and Supplier Diversity (SWaM certification)", url: "https://www.sbsd.virginia.gov/" },
    { label: "Virginia Information Technologies Agency (VITA) Policies, Standards and Guidelines", url: "https://www.vita.virginia.gov/" },
    { label: "NIST SP 800-53 Security and Privacy Controls", url: "https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final" },
  ],
  relatedServiceSlugs: ["security-risk-advisory", "managed-it", "cybersecurity"],
  relatedArticleSlugs: ["cmmc-readiness-concepts", "nist-csf-implementation-guide-smb", "cyber-resilience-readiness-checklist"],
};
