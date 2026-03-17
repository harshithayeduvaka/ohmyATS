import { ScanResult } from "./types";

export const mockScanResult: ScanResult = {
  botPass: {
    formatIssues: [
      "Two-column layout detected — right column may not parse in Workday or Taleo.",
      "Header/footer content detected — contact info in header may be invisible to ATS.",
    ],
    extractedFields: [
      { label: "full_name", value: "Extracted OK", status: "ok" },
      { label: "email", value: "Extracted OK", status: "ok" },
      { label: "phone", value: "Partial — missing country code", status: "warning" },
      { label: "education.institution", value: "SKEMA Business School", status: "ok" },
      { label: "education.degree", value: "MSc IMBD", status: "ok" },
      { label: "experience.dates", value: "Inconsistent format (MM/YY vs. Month YYYY)", status: "warning" },
      { label: "linkedin_url", value: "Not found", status: "error" },
    ],
  },
  algorithm: {
    hardRequirements: [
      { skill: "Business Development", status: "matched", context: "Mentioned 3x with relevant context." },
      { skill: "CRM Tools (Salesforce/HubSpot)", status: "missing", context: "No CRM tool mentioned anywhere in CV." },
      { skill: "Market Research & Analysis", status: "weak", context: "Mentioned once without quantifiable outcome." },
      { skill: "International Market Entry", status: "matched", context: "Strong — SKEMA cross-campus + work experience align." },
      { skill: "Revenue Growth / Pipeline Management", status: "missing", context: "No revenue figures or pipeline metrics found." },
    ],
    softSkills: [
      { skill: "Cross-cultural Communication", status: "matched" },
      { skill: "Stakeholder Management", status: "matched" },
      { skill: "Leadership", status: "missing" },
      { skill: "Negotiation", status: "missing" },
      { skill: "Adaptability", status: "matched" },
    ],
    phantomMatches: [
      { keyword: "marketing strategy", reason: "Appears in a task description ('assisted with marketing strategy') with no measurable impact — ATS ranks this low." },
      { keyword: "project management", reason: "Listed in skills section but never demonstrated in experience bullets." },
    ],
  },
  humanPass: {
    overallImpression:
      "The CV reads as a task list rather than an impact portfolio. A SKEMA IMBD grad should signal strategic thinking and international business acumen. Currently, the experience bullets describe responsibilities, not achievements. The education section is well-positioned but underutilized — no mention of key coursework, exchange campuses, or capstone projects.",
    strengths: [
      "Strong international exposure (multi-campus SKEMA)",
      "Relevant industry verticals",
      "Clean, professional formatting",
    ],
    weaknesses: [
      "No quantified business impact (revenue, growth %, conversions)",
      "Task-oriented bullet points — 'responsible for' instead of 'drove'",
      "Missing strategic narrative connecting roles to career trajectory",
    ],
    weakVerbs: [
      { original: "Responsible for", suggestion: "Spearheaded" },
      { original: "Helped with", suggestion: "Collaborated on" },
      { original: "Worked on", suggestion: "Delivered" },
      { original: "Assisted in", suggestion: "Co-led" },
    ],
  },
  rewrites: [
    {
      context: "Business Development Intern — Bullet #1",
      before: "Responsible for conducting market research for the European market.",
      after: "Spearheaded a competitive analysis of 12 European markets, identifying 3 high-potential entry points that informed the team's €2M expansion roadmap.",
    },
    {
      context: "Marketing Assistant — Bullet #2",
      before: "Helped with social media campaigns and content creation.",
      after: "Co-led a 6-week integrated social campaign across LinkedIn and Instagram, generating a 34% increase in qualified lead engagement and 1,200+ new followers.",
    },
    {
      context: "Project Experience — Capstone",
      before: "Worked on a group project about market entry strategy for a French SME.",
      after: "Delivered a go-to-market strategy for a French SME's APAC expansion as part of a 5-member team, presenting to C-level executives and receiving the top cohort grade.",
    },
    {
      context: "Skills Section — CRM Gap Fix",
      before: "(CRM tools not mentioned)",
      after: "Add under Tools: 'HubSpot CRM (lead tracking, pipeline management)' — even basic coursework or certification exposure counts for ATS matching.",
    },
  ],
};
