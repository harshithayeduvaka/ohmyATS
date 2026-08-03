// Eval harness: seed fixtures for measuring pipeline accuracy.
// Hand-labelled CV+JD pairs, tagged per feature so /eval reports a
// per-feature accuracy number instead of one blended figure.
// Ground truth is deliberately loose in some fields (bands, not exact values).

export type EvalFeature =
  | "cv-scan"
  | "cover-letter"
  | "outreach"
  | "linkedin"
  | "pitch"
  | "interview-qa"
  | "interview-sim"
  | "jd-optimizer"
  | "keywords";

export const FEATURE_LABELS: Record<EvalFeature, string> = {
  "cv-scan": "CV ATS Scanner",
  "cover-letter": "Cover Letter",
  outreach: "Cold Outreach",
  linkedin: "LinkedIn Coach",
  pitch: "Elevator Pitch",
  "interview-qa": "Interview Q&A",
  "interview-sim": "Interview Simulator",
  "jd-optimizer": "JD Optimiser",
  keywords: "Keyword Analyser",
};

export interface EvalFixture {
  id: string;
  label: string;
  feature: EvalFeature;
  cv: string;
  jd: string;
  truth: {
    atsBand: [number, number];              // acceptable score range (min, max)
    mustHaveKeywords: string[];             // MUST be extracted from the JD
    forbiddenClaims?: string[];             // strings that must NOT appear in generated output
    companyName?: string;
    roleName?: string;
    roleFitVerdict?: "strong" | "moderate" | "weak";
  };
}

/* ---------------------------------------------------------------- CV bodies */

const CV_DATA_ANALYST = `Marie Dupont
marie.dupont@example.com | +33 6 12 34 56 78 | linkedin.com/in/mariedupont | Paris

SUMMARY
Data analyst with 3 years' experience in e-commerce analytics. SQL, Python, Tableau. Delivered dashboards used by 40+ stakeholders.

EXPERIENCE
Data Analyst — Acme Retail (Paris) — Jan 2022 – Present
• Built weekly revenue dashboard in Tableau tracking €12M ARR across 6 markets, cutting reporting cycle from 5 days to 4 hours
• Automated cohort retention analysis in Python, reducing manual work by 15 hours/week
• A/B tested checkout flow changes lifting conversion 8% (€480k incremental revenue)
• Partnered with marketing on attribution model in BigQuery covering 12M sessions/month

Junior Analyst — DataCorp (Lyon) — Sep 2020 – Dec 2021
• Wrote SQL queries against PostgreSQL for 20+ ad-hoc requests weekly
• Cleaned and normalised 3 legacy datasets for migration to Snowflake

EDUCATION
MSc Data Science — Université Paris-Saclay — 2020
BSc Statistics — SKEMA Business School — 2018

SKILLS
SQL, Python (pandas, numpy), Tableau, Looker, BigQuery, Snowflake, dbt, Git`;

const JD_DATA_ANALYST_SENIOR = `Senior Data Analyst — Doctolib — Paris

We're looking for a Senior Data Analyst to join our Growth team. You'll partner with marketing and product to build dashboards, run experiments, and shape our attribution model.

Requirements:
- 4+ years in analytics, ideally B2C/marketplace
- Expert SQL (BigQuery preferred), Python for analysis
- Experience with dbt and modern data stack
- A/B testing and experimentation framework experience
- Tableau or Looker for stakeholder-facing dashboards
- French fluency, English working proficiency

Nice to have:
- Marketing attribution modelling
- Snowflake experience
- Prior work in healthcare or regulated industry`;

const CV_MARKETING_JUNIOR = `Alex Chen
alex.chen@example.com | +33 7 98 76 54 32 | linkedin.com/in/alexchen | Paris

SUMMARY
Recent SKEMA graduate targeting a junior marketing role. Internship experience in social media and content.

EXPERIENCE
Marketing Intern — StartupX (Paris) — Jun 2024 – Dec 2024
• Managed Instagram and TikTok content calendar, growing followers from 2k to 8.5k in 6 months
• Wrote weekly newsletter to 12k subscribers, 32% open rate
• Ran €5k Meta ads test campaign, 2.1 ROAS

Content Intern — Boutique Agency (Nice) — Jun 2023 – Aug 2023
• Drafted 40 blog posts across 4 client brands
• Basic SEO keyword research using Ubersuggest

EDUCATION
MSc International Marketing — SKEMA Business School — 2024

SKILLS
Meta Ads, Google Ads, Canva, Notion, French (native), English (fluent), Spanish (B2)`;

const JD_MARKETING_MID = `Marketing Manager — L'Oréal — Paris

Lead the digital marketing strategy for one of our haircare brands. You'll own the paid media budget (€2M+/year), coordinate with agencies, and report to the Brand Director.

Requirements:
- 5+ years in brand or performance marketing at a consumer brand
- Team management (2+ direct reports)
- Deep Meta / Google / TikTok ads expertise at scale
- P&L ownership experience
- Fluent French + English

We are NOT looking for entry-level candidates.`;

const CV_SWE = `Ravi Kumar
ravi.kumar@example.com | +33 6 55 44 33 22 | linkedin.com/in/ravikumar | Remote (EU)

EXPERIENCE
Senior Backend Engineer — Stripe (Remote) — 2022 – Present
• Owned migration of legacy Ruby payments service to Go, cutting p99 latency 340ms → 85ms
• Led team of 4 engineers shipping fraud-scoring API handling 8k rps
• Designed idempotency layer used across 12 downstream services

Software Engineer — Datadog — 2019 – 2022
• Built log-ingestion pipeline in Rust processing 2.5M events/sec
• On-call rotation for tier-1 service (99.99% SLA)

EDUCATION
BSc Computer Science — EPITA Paris — 2019

SKILLS
Go, Rust, Ruby, Python, PostgreSQL, Kafka, Kubernetes, AWS, Terraform`;

const JD_SWE = `Staff Backend Engineer — Alan — Paris

Join our platform team to scale our health-insurance backend. Go, Postgres, Kubernetes.

Requirements:
- 6+ years backend
- Go or Rust in production
- Distributed systems experience at scale
- Kubernetes operational experience
- French health insurance regulatory awareness a plus`;

const CV_FINANCE = `Camille Roux
camille.roux@example.com | +33 6 21 43 65 87 | linkedin.com/in/camilleroux | Paris

SUMMARY
Financial analyst, 4 years in FP&A for a listed retail group. Budgeting, forecasting, variance analysis.

EXPERIENCE
Financial Analyst — Carrefour (Massy) — 2021 – Present
• Owned monthly forecast for a €340M P&L across 3 business units, forecast accuracy within 2.1%
• Rebuilt budgeting model in Excel + Anaplan, cutting close cycle from 9 to 5 days
• Presented variance analysis to CFO monthly, flagging €4.2M of cost overrun

Audit Associate — Deloitte (Paris) — 2019 – 2021
• Audited 12 mid-cap clients under IFRS
• Built cash-flow testing workpapers reviewed by senior managers

EDUCATION
MSc Corporate Finance — SKEMA Business School — 2019

SKILLS
Excel (advanced), Anaplan, SAP, Power BI, SQL (basic), IFRS, French (native), English (C1)`;

const JD_FINANCE = `FP&A Manager — Sanofi — Paris

Own the forecasting cycle for a global business unit. Partner with commercial leads on budget and long-range plan.

Requirements:
- 5+ years FP&A, pharma or FMCG preferred
- Advanced Excel and a planning tool (Anaplan, TM1, SAP BPC)
- IFRS knowledge
- Strong business partnering with senior stakeholders
- Fluent English, French a plus`;

const CV_HR = `Sofia Bianchi
sofia.bianchi@example.com | +33 6 90 12 34 56 | linkedin.com/in/sofiabianchi | Lyon

SUMMARY
Talent acquisition specialist, 3 years hiring tech and commercial profiles in France.

EXPERIENCE
Talent Acquisition Specialist — Ubisoft (Lyon) — 2022 – Present
• Closed 46 hires in 18 months across engineering and art, average time-to-fill 34 days
• Rolled out structured interview scorecards in Greenhouse, reducing offer-decline rate from 22% to 11%
• Ran employer-branding campaign on LinkedIn reaching 180k impressions

HR Assistant — Adecco (Lyon) — 2020 – 2022
• Managed onboarding paperwork for 200+ temporary staff under French labour law

EDUCATION
MSc Human Resources — SKEMA Business School — 2020

SKILLS
Greenhouse, Workday, LinkedIn Recruiter, Boolean search, French (native), English (fluent), Italian (native)`;

const JD_HR = `Talent Acquisition Partner — BlaBlaCar — Paris

Own end-to-end hiring for our product and engineering teams. Partner with hiring managers on scorecards and process.

Requirements:
- 3+ years in-house tech recruitment
- ATS experience (Greenhouse or Lever)
- Structured interviewing and scorecard design
- Data-driven approach to funnel metrics
- French and English fluency`;

const CV_SUPPLY = `Thomas Weber
thomas.weber@example.com | +33 6 77 88 99 00 | linkedin.com/in/thomasweber | Lille

EXPERIENCE
Supply Chain Analyst — Decathlon (Lille) — 2021 – Present
• Reduced stockouts 31% across 120 SKUs by rebuilding the reorder-point model in Python
• Negotiated lead times with 8 Asian suppliers, cutting average lead time 42 → 29 days
• Built SAP-fed Power BI inventory dashboard used by 3 regional managers

Logistics Intern — Kuehne+Nagel (Lille) — 2020
• Tracked 400+ shipments weekly and reconciled freight invoices

EDUCATION
MSc Supply Chain Management — SKEMA Business School — 2021

SKILLS
SAP, Power BI, Python, Excel, S&OP, demand planning, German (native), French (C1), English (fluent)`;

const JD_SUPPLY = `Demand Planner — Danone — Paris

Own demand forecasting for a dairy category. Run S&OP cycle with sales and production.

Requirements:
- 2-4 years demand planning or supply chain analytics
- SAP APO or equivalent
- Strong Excel, Power BI a plus
- S&OP process experience
- English fluency, French preferred`;

const CV_PM = `Nadia Haddad
nadia.haddad@example.com | +33 6 33 22 11 00 | linkedin.com/in/nadiahaddad | Paris

EXPERIENCE
Product Manager — Qonto (Paris) — 2022 – Present
• Shipped invoice-automation feature adopted by 18k SMEs, cutting manual entry time 63%
• Ran discovery with 40 customers, reprioritised roadmap and killed two low-value initiatives
• Defined north-star metric with data team; activation rose from 41% to 57%

Associate PM — Doctolib (Paris) — 2020 – 2022
• Owned booking-funnel experiments, +12% completed bookings over 4 quarters

EDUCATION
MSc Management — SKEMA Business School — 2020

SKILLS
Product discovery, A/B testing, SQL, Amplitude, Figma, Jira, French (native), English (fluent)`;

const JD_PM = `Senior Product Manager — Alan — Paris

Own a core member-experience surface. Discovery, experimentation, and roadmap ownership with a squad of 6.

Requirements:
- 4+ years product management in B2C or B2B SaaS
- Experimentation and analytics literacy (SQL, Amplitude or Mixpanel)
- Customer discovery practice
- French and English`;

const CV_DESIGNER = `Lucas Moreau
lucas.moreau@example.com | +33 6 44 55 66 77 | linkedin.com/in/lucasmoreau | Bordeaux

EXPERIENCE
Product Designer — Swile (Remote) — 2022 – Present
• Redesigned onboarding flow, cutting drop-off from 38% to 19% across 90k monthly signups
• Built and maintained a 120-component design system used by 4 squads
• Ran 24 moderated usability sessions informing the 2024 roadmap

UI Designer — Freelance — 2020 – 2022
• Delivered 15 client projects across fintech and retail

EDUCATION
BA Design — Université Bordeaux Montaigne — 2020

SKILLS
Figma, design systems, prototyping, usability testing, accessibility (WCAG), French (native), English (C1)`;

const JD_DESIGNER = `Product Designer — Payfit — Paris

Design payroll workflows for SMEs. Work embedded in a squad with PM and engineers.

Requirements:
- 3+ years product design on a SaaS product
- Figma and design-system ownership
- Usability testing practice
- Accessibility awareness (WCAG)
- French and English`;

/* --------------------------------------------------------------- Fixtures */

export const EVAL_FIXTURES: EvalFixture[] = [
  /* ------------------------------------------------------- CV ATS Scanner */
  {
    id: "cv-01-analyst-strong",
    label: "Data Analyst → Senior Analyst (strong fit)",
    feature: "cv-scan",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["SQL", "BigQuery", "Python", "dbt", "Tableau", "A/B testing", "attribution"],
      companyName: "Doctolib",
      roleName: "Senior Data Analyst",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-02-marketing-weak",
    label: "Junior Marketing → Marketing Manager (weak fit)",
    feature: "cv-scan",
    cv: CV_MARKETING_JUNIOR,
    jd: JD_MARKETING_MID,
    truth: {
      atsBand: [25, 48],
      mustHaveKeywords: ["team management", "P&L", "brand marketing", "Meta", "TikTok"],
      forbiddenClaims: ["extensive team leadership", "P&L ownership at scale", "senior leadership"],
      companyName: "L'Oréal",
      roleName: "Marketing Manager",
      roleFitVerdict: "weak",
    },
  },
  {
    id: "cv-03-swe-strong",
    label: "Senior SWE → Staff SWE (strong fit)",
    feature: "cv-scan",
    cv: CV_SWE,
    jd: JD_SWE,
    truth: {
      atsBand: [72, 92],
      mustHaveKeywords: ["Go", "Postgres", "Kubernetes", "distributed systems", "backend"],
      companyName: "Alan",
      roleName: "Staff Backend Engineer",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-04-analyst-lateral",
    label: "Data Analyst → SWE role (transferable but weak)",
    feature: "cv-scan",
    cv: CV_DATA_ANALYST,
    jd: JD_SWE,
    truth: {
      atsBand: [20, 45],
      mustHaveKeywords: ["Go", "Kubernetes", "distributed systems", "backend"],
      roleFitVerdict: "weak",
    },
  },
  {
    id: "cv-05-marketing-moderate",
    label: "Marketing Intern → Junior CRM (moderate)",
    feature: "cv-scan",
    cv: CV_MARKETING_JUNIOR,
    jd: `Junior CRM Executive — Sephora — Paris\n\nSupport the CRM team on email campaigns, segmentation, and reporting. 1-2 years experience or strong internships. Meta ads exposure a plus. French + English.`,
    truth: {
      atsBand: [50, 72],
      mustHaveKeywords: ["email", "CRM", "segmentation", "French", "English"],
      companyName: "Sephora",
      roleFitVerdict: "moderate",
    },
  },
  {
    id: "cv-06-finance-strong",
    label: "FP&A Analyst → FP&A Manager (moderate/strong)",
    feature: "cv-scan",
    cv: CV_FINANCE,
    jd: JD_FINANCE,
    truth: {
      atsBand: [62, 85],
      mustHaveKeywords: ["Excel", "Anaplan", "IFRS", "English", "French"],
      companyName: "Sanofi",
      roleName: "FP&A Manager",
      roleFitVerdict: "moderate",
    },
  },
  {
    id: "cv-07-hr-strong",
    label: "TA Specialist → TA Partner (strong fit)",
    feature: "cv-scan",
    cv: CV_HR,
    jd: JD_HR,
    truth: {
      atsBand: [70, 90],
      mustHaveKeywords: ["Greenhouse", "French", "English"],
      companyName: "BlaBlaCar",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-08-supply-strong",
    label: "Supply Chain Analyst → Demand Planner (strong fit)",
    feature: "cv-scan",
    cv: CV_SUPPLY,
    jd: JD_SUPPLY,
    truth: {
      atsBand: [65, 88],
      mustHaveKeywords: ["SAP", "Power BI", "Excel", "S&OP", "English", "French"],
      companyName: "Danone",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-09-pm-strong",
    label: "PM → Senior PM (strong fit)",
    feature: "cv-scan",
    cv: CV_PM,
    jd: JD_PM,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["SQL", "French", "English"],
      companyName: "Alan",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-10-designer-strong",
    label: "Product Designer → Product Designer (strong fit)",
    feature: "cv-scan",
    cv: CV_DESIGNER,
    jd: JD_DESIGNER,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["Figma", "usability testing", "French", "English"],
      companyName: "Payfit",
      roleFitVerdict: "strong",
    },
  },
  {
    id: "cv-11-finance-lateral",
    label: "Finance → PM role (weak/lateral)",
    feature: "cv-scan",
    cv: CV_FINANCE,
    jd: JD_PM,
    truth: {
      atsBand: [22, 48],
      mustHaveKeywords: ["SQL", "product management", "French", "English"],
      roleFitVerdict: "weak",
    },
  },
  {
    id: "cv-12-designer-lateral",
    label: "Designer → Demand Planner (very weak)",
    feature: "cv-scan",
    cv: CV_DESIGNER,
    jd: JD_SUPPLY,
    truth: {
      atsBand: [10, 38],
      mustHaveKeywords: ["SAP", "S&OP", "Excel"],
      roleFitVerdict: "weak",
    },
  },

  /* --------------------------------------------------------- Cover Letter */
  {
    id: "cl-01-analyst",
    label: "Cover letter — Analyst → Doctolib",
    feature: "cover-letter",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["SQL", "BigQuery", "dbt", "A/B testing"],
      forbiddenClaims: ["passionate", "dynamic", "results-driven", "I am writing to apply"],
      companyName: "Doctolib",
      roleName: "Senior Data Analyst",
    },
  },
  {
    id: "cl-02-marketing-stretch",
    label: "Cover letter — Junior marketer → L'Oréal (must not over-claim)",
    feature: "cover-letter",
    cv: CV_MARKETING_JUNIOR,
    jd: JD_MARKETING_MID,
    truth: {
      atsBand: [25, 48],
      mustHaveKeywords: ["Meta", "TikTok", "brand marketing"],
      forbiddenClaims: ["five years", "P&L ownership", "managed a team", "direct reports"],
      companyName: "L'Oréal",
    },
  },
  {
    id: "cl-03-swe",
    label: "Cover letter — SWE → Alan",
    feature: "cover-letter",
    cv: CV_SWE,
    jd: JD_SWE,
    truth: {
      atsBand: [72, 92],
      mustHaveKeywords: ["Go", "Kubernetes", "distributed systems"],
      forbiddenClaims: ["passionate", "hit the ground running", "health insurance expert"],
      companyName: "Alan",
    },
  },
  {
    id: "cl-04-finance",
    label: "Cover letter — FP&A → Sanofi",
    feature: "cover-letter",
    cv: CV_FINANCE,
    jd: JD_FINANCE,
    truth: {
      atsBand: [62, 85],
      mustHaveKeywords: ["Anaplan", "IFRS", "Excel"],
      forbiddenClaims: ["pharma experience", "led a team of"],
      companyName: "Sanofi",
    },
  },
  {
    id: "cl-05-hr",
    label: "Cover letter — TA → BlaBlaCar",
    feature: "cover-letter",
    cv: CV_HR,
    jd: JD_HR,
    truth: {
      atsBand: [70, 90],
      mustHaveKeywords: ["Greenhouse", "scorecard"],
      forbiddenClaims: ["passionate", "team player"],
      companyName: "BlaBlaCar",
    },
  },

  /* ------------------------------------------------------------- Outreach */
  {
    id: "or-01-analyst",
    label: "Outreach — Analyst → Doctolib hiring manager",
    feature: "outreach",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["SQL", "attribution"],
      forbiddenClaims: ["I hope this message finds you well", "passionate", "synergy"],
      companyName: "Doctolib",
    },
  },
  {
    id: "or-02-pm",
    label: "Outreach — PM → Alan",
    feature: "outreach",
    cv: CV_PM,
    jd: JD_PM,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["experimentation", "discovery"],
      forbiddenClaims: ["passionate", "reaching out to explore synergies"],
      companyName: "Alan",
    },
  },
  {
    id: "or-03-designer",
    label: "Outreach — Designer → Payfit",
    feature: "outreach",
    cv: CV_DESIGNER,
    jd: JD_DESIGNER,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["Figma", "design system"],
      forbiddenClaims: ["passionate", "thrilled"],
      companyName: "Payfit",
    },
  },

  /* -------------------------------------------------------- LinkedIn Coach */
  {
    id: "li-01-analyst",
    label: "LinkedIn — Analyst profile audit",
    feature: "linkedin",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [60, 85],
      mustHaveKeywords: ["SQL", "Python", "Tableau"],
      forbiddenClaims: ["thought leader", "guru", "ninja"],
    },
  },
  {
    id: "li-02-marketing",
    label: "LinkedIn — Junior marketer profile audit",
    feature: "linkedin",
    cv: CV_MARKETING_JUNIOR,
    jd: JD_MARKETING_MID,
    truth: {
      atsBand: [35, 62],
      mustHaveKeywords: ["Meta", "TikTok"],
      forbiddenClaims: ["senior", "expert in paid media at scale"],
    },
  },
  {
    id: "li-03-swe",
    label: "LinkedIn — Backend engineer profile audit",
    feature: "linkedin",
    cv: CV_SWE,
    jd: JD_SWE,
    truth: {
      atsBand: [65, 90],
      mustHaveKeywords: ["Go", "Kubernetes"],
      forbiddenClaims: ["10x engineer", "guru"],
    },
  },

  /* ------------------------------------------------------- Elevator Pitch */
  {
    id: "ep-01-analyst",
    label: "Pitch — Analyst, 60s",
    feature: "pitch",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["SQL", "dashboard"],
      forbiddenClaims: ["passionate", "results-driven"],
    },
  },
  {
    id: "ep-02-supply",
    label: "Pitch — Supply chain, 30s",
    feature: "pitch",
    cv: CV_SUPPLY,
    jd: JD_SUPPLY,
    truth: {
      atsBand: [65, 88],
      mustHaveKeywords: ["stockouts", "SAP"],
      forbiddenClaims: ["passionate", "team player"],
    },
  },
  {
    id: "ep-03-hr",
    label: "Pitch — Talent acquisition, 90s",
    feature: "pitch",
    cv: CV_HR,
    jd: JD_HR,
    truth: {
      atsBand: [70, 90],
      mustHaveKeywords: ["hires", "Greenhouse"],
      forbiddenClaims: ["passionate", "people person"],
    },
  },

  /* -------------------------------------------------------- Interview Q&A */
  {
    id: "qa-01-analyst",
    label: "Interview Q&A — Analyst at Doctolib",
    feature: "interview-qa",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["A/B testing", "attribution", "SQL"],
      forbiddenClaims: ["as a passionate", "team player"],
      companyName: "Doctolib",
    },
  },
  {
    id: "qa-02-swe",
    label: "Interview Q&A — Staff engineer at Alan",
    feature: "interview-qa",
    cv: CV_SWE,
    jd: JD_SWE,
    truth: {
      atsBand: [72, 92],
      mustHaveKeywords: ["distributed systems", "Kubernetes", "Go"],
      forbiddenClaims: ["passionate"],
      companyName: "Alan",
    },
  },
  {
    id: "qa-03-finance",
    label: "Interview Q&A — FP&A at Sanofi",
    feature: "interview-qa",
    cv: CV_FINANCE,
    jd: JD_FINANCE,
    truth: {
      atsBand: [62, 85],
      mustHaveKeywords: ["forecast", "IFRS", "Anaplan"],
      forbiddenClaims: ["passionate"],
      companyName: "Sanofi",
    },
  },

  /* --------------------------------------------------- Interview Simulator */
  {
    id: "is-01-pm",
    label: "Simulator — PM behavioural round",
    feature: "interview-sim",
    cv: CV_PM,
    jd: JD_PM,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["discovery", "experimentation"],
      forbiddenClaims: ["passionate", "synergy"],
      companyName: "Alan",
    },
  },
  {
    id: "is-02-designer",
    label: "Simulator — Designer portfolio round",
    feature: "interview-sim",
    cv: CV_DESIGNER,
    jd: JD_DESIGNER,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["usability testing", "design system"],
      forbiddenClaims: ["passionate"],
      companyName: "Payfit",
    },
  },
  {
    id: "is-03-hr",
    label: "Simulator — TA competency round",
    feature: "interview-sim",
    cv: CV_HR,
    jd: JD_HR,
    truth: {
      atsBand: [70, 90],
      mustHaveKeywords: ["Greenhouse", "time-to-fill"],
      forbiddenClaims: ["people person"],
      companyName: "BlaBlaCar",
    },
  },

  /* ---------------------------------------------------------- JD Optimiser */
  {
    id: "jd-01-analyst",
    label: "JD Optimiser — Senior Data Analyst",
    feature: "jd-optimizer",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["dbt", "BigQuery", "A/B testing", "Tableau", "attribution"],
      companyName: "Doctolib",
    },
  },
  {
    id: "jd-02-marketing",
    label: "JD Optimiser — Marketing Manager",
    feature: "jd-optimizer",
    cv: CV_MARKETING_JUNIOR,
    jd: JD_MARKETING_MID,
    truth: {
      atsBand: [25, 48],
      mustHaveKeywords: ["P&L", "team management", "TikTok", "Meta"],
      companyName: "L'Oréal",
    },
  },
  {
    id: "jd-03-supply",
    label: "JD Optimiser — Demand Planner",
    feature: "jd-optimizer",
    cv: CV_SUPPLY,
    jd: JD_SUPPLY,
    truth: {
      atsBand: [65, 88],
      mustHaveKeywords: ["SAP", "S&OP", "Excel", "Power BI"],
      companyName: "Danone",
    },
  },

  /* ------------------------------------------------------ Keyword Analyser */
  {
    id: "kw-01-analyst",
    label: "Keywords — Senior Data Analyst JD",
    feature: "keywords",
    cv: CV_DATA_ANALYST,
    jd: JD_DATA_ANALYST_SENIOR,
    truth: {
      atsBand: [70, 88],
      mustHaveKeywords: ["SQL", "BigQuery", "Python", "dbt", "Tableau", "Snowflake", "attribution", "A/B testing", "French", "English"],
    },
  },
  {
    id: "kw-02-swe",
    label: "Keywords — Staff Backend Engineer JD",
    feature: "keywords",
    cv: CV_SWE,
    jd: JD_SWE,
    truth: {
      atsBand: [72, 92],
      mustHaveKeywords: ["Go", "Rust", "Postgres", "Kubernetes", "distributed systems", "backend"],
    },
  },
  {
    id: "kw-03-hr",
    label: "Keywords — Talent Acquisition Partner JD",
    feature: "keywords",
    cv: CV_HR,
    jd: JD_HR,
    truth: {
      atsBand: [70, 90],
      mustHaveKeywords: ["Greenhouse", "French", "English"],
    },
  },
  {
    id: "kw-04-finance",
    label: "Keywords — FP&A Manager JD",
    feature: "keywords",
    cv: CV_FINANCE,
    jd: JD_FINANCE,
    truth: {
      atsBand: [62, 85],
      mustHaveKeywords: ["Excel", "Anaplan", "IFRS", "English", "French"],
    },
  },
  {
    id: "kw-05-designer",
    label: "Keywords — Product Designer JD",
    feature: "keywords",
    cv: CV_DESIGNER,
    jd: JD_DESIGNER,
    truth: {
      atsBand: [68, 90],
      mustHaveKeywords: ["Figma", "usability testing", "French", "English"],
    },
  },
];

export const FIXTURES_BY_FEATURE = EVAL_FIXTURES.reduce((acc, f) => {
  (acc[f.feature] ??= []).push(f);
  return acc;
}, {} as Record<EvalFeature, EvalFixture[]>);
