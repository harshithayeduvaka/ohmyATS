// Eval harness: seed fixtures for measuring pipeline accuracy.
// 10 hand-labelled CV+JD pairs. Add more via the /eval UI.
// Ground truth is deliberately loose in some fields (bands, not exact values).

export interface EvalFixture {
  id: string;
  label: string;
  cv: string;
  jd: string;
  truth: {
    atsBand: [number, number];              // acceptable score range (min, max)
    mustHaveKeywords: string[];             // MUST be extracted from the JD
    forbiddenClaims?: string[];             // strings that must NOT appear in generated cover letter
    companyName?: string;
    roleName?: string;
    roleFitVerdict?: "strong" | "moderate" | "weak";
  };
}

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

export const EVAL_FIXTURES: EvalFixture[] = [
  {
    id: "f1-analyst-strong",
    label: "Data Analyst → Senior Analyst (strong fit)",
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
    id: "f2-marketing-weak",
    label: "Junior Marketing → Senior Marketing Manager (weak fit)",
    cv: CV_MARKETING_JUNIOR,
    jd: JD_MARKETING_MID,
    truth: {
      atsBand: [25, 48],
      mustHaveKeywords: ["team management", "P&L", "brand marketing", "Meta", "TikTok", "5+ years"],
      forbiddenClaims: ["extensive team leadership", "P&L ownership at scale", "senior leadership"],
      companyName: "L'Oréal",
      roleName: "Marketing Manager",
      roleFitVerdict: "weak",
    },
  },
  {
    id: "f3-swe-strong",
    label: "Senior SWE → Staff SWE (strong fit)",
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
    id: "f4-analyst-lateral",
    label: "Data Analyst → SWE role (transferable but weak)",
    cv: CV_DATA_ANALYST,
    jd: JD_SWE,
    truth: {
      atsBand: [20, 45],
      mustHaveKeywords: ["Go", "Kubernetes", "distributed systems", "backend"],
      roleFitVerdict: "weak",
    },
  },
  {
    id: "f5-marketing-moderate",
    label: "Marketing Intern → Junior CRM role (moderate)",
    cv: CV_MARKETING_JUNIOR,
    jd: `Junior CRM Executive — Sephora — Paris\n\nSupport the CRM team on email campaigns, segmentation, and reporting. 1-2 years experience or strong internships. Meta ads exposure a plus. French + English.`,
    truth: {
      atsBand: [50, 72],
      mustHaveKeywords: ["email", "CRM", "segmentation", "French", "English"],
      companyName: "Sephora",
      roleFitVerdict: "moderate",
    },
  },
];
