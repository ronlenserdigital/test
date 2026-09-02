import type { IconName } from "@/components/icons/icon-names";

export interface Stage {
  id: string;
  label: string;
  icon: IconName;
  summary: string;
  inputs: string[];
  outputs: string[];
  evidence: string;
}

export const STAGES: Stage[] = [
  {
    id: "assess",
    label: "Assess",
    icon: "search",
    summary: "Inventory the environment, score it against a framework, and rank what to fix first.",
    inputs: ["Systems, identities, network and cloud inventory", "Applicable regulations and insurer requirements", "Business recovery priorities"],
    outputs: ["Scored baseline against NIST CSF or CIS Controls", "Prioritized remediation plan with effort and risk", "Recovery objectives per system"],
    evidence: "Assessment report and risk register",
  },
  {
    id: "design",
    label: "Design",
    icon: "compass",
    summary: "Decide the target architecture, the operating model and who owns what.",
    inputs: ["Baseline findings", "Growth, budget and staffing plans", "Workload dependencies"],
    outputs: ["Target architecture (hybrid, cloud, on-premises)", "Responsibility matrix for managed or co-managed delivery", "Migration and hardening sequence"],
    evidence: "Architecture document and responsibility matrix",
  },
  {
    id: "secure",
    label: "Secure",
    icon: "shield-check",
    summary: "Close the highest-risk gaps first: identity, patching, endpoints, backups, segmentation.",
    inputs: ["Remediation plan", "Change windows agreed with the business"],
    outputs: ["MFA and conditional access enforced", "Endpoint detection deployed and tuned", "Immutable, isolated backups", "Network segmentation and firewall policy"],
    evidence: "Control implementation records and configuration baselines",
  },
  {
    id: "operate",
    label: "Operate",
    icon: "server",
    summary: "Run help desk, servers, endpoints, network and cloud under one change process.",
    inputs: ["Documented environment", "Ticketing, patching and monitoring platforms"],
    outputs: ["Resolved tickets with root cause", "Patch compliance on schedule", "Lifecycle and licensing tracked"],
    evidence: "Monthly service reports",
  },
  {
    id: "monitor",
    label: "Monitor",
    icon: "monitor",
    summary: "Turn availability, capacity and security events into tickets with owners.",
    inputs: ["Telemetry from identity, endpoints, infrastructure and backups"],
    outputs: ["Alerts triaged and escalated per runbook", "Security events contained and documented", "Backup and restore verification"],
    evidence: "Alert history, incident records, restore test logs",
  },
  {
    id: "improve",
    label: "Improve",
    icon: "refresh",
    summary: "Review the evidence quarterly and feed it back into the plan.",
    inputs: ["Service reports, incidents, audit findings", "Business changes and new requirements"],
    outputs: ["Updated roadmap and budget", "Policy and runbook revisions", "Re-scored baseline"],
    evidence: "Quarterly review minutes and updated risk register",
  },
];

