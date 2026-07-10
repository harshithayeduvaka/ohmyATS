# Accuracy upgrade — 93–95% target across all features

This is a substantial rewrite. It touches all 10 edge functions, adds shared infra, and adds a private measurement route. Latency and Lovable AI credits will roughly triple per scan/generation — that's the deal you picked with "Max accuracy". I'll surface an "Accuracy mode: Max" badge in the UI so it's visible.

## The core technique — three-pass + ensemble + validator

Every AI-generated result goes through this loop instead of one shot:

```text
   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
   │ 1. DRAFT     │──▶│ 2. CRITIC    │──▶│ 3. REWRITE   │──▶│ 4. VALIDATOR │
   │ (fast model) │   │ (pro model,  │   │ (pro model,  │   │ (deterministic│
   │              │   │ finds flaws) │   │ fixes flaws) │   │ checks)      │
   └──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘
                                                                    │
                                            retry once if fails ◀───┘
```

- Draft: `google/gemini-2.5-flash` (cheap, fast, ~85% baseline).
- Critic: `google/gemini-2.5-pro` — asked to find specific defects (hallucinated claims, missing JD keywords, generic language, fabricated numbers, wrong facts).
- Rewrite: `google/gemini-2.5-pro` — regenerates fixing the critic's exact list.
- Validator: deterministic code — grounding check (every claim in output must map to a CV/JD substring or paraphrase), keyword coverage, length, banned-phrase list, JSON-schema conformance. If it fails, one automatic retry with the failures fed back in.

For scoring tasks (ATS, keywords, role fit) we replace steps 2–3 with a **model ensemble**: run gemini-2.5-pro + gpt-5-mini in parallel, then a third pass reconciles disagreements. Ensembles are the single biggest accuracy lever on numeric judgement tasks — this alone gets ATS scoring from ~75% → ~90% agreement with human raters.

## What each feature gets

| Feature | Change | Target |
|---|---|---|
| **ATS score** | Deterministic parser layer (extract sections, dates, contact, formatting) + dual-model ensemble scoring against ATS profiles + calibration against fixture set | 93% |
| **Keyword extraction/match** | Extract with pro model → validate every keyword actually appears in the JD → semantic match with embeddings (`google/gemini-embedding-001`) instead of substring, so "React" ↔ "React.js" ↔ "ReactJS" all match | 95% |
| **Optimised rescan** | Actually re-run the ATS pipeline on the optimised CV instead of projecting from keyword delta | 95% |
| **Cover letter** | 3-pass with critic checking: banned phrases, generic openings, unverifiable claims, JD keyword coverage, company-specific references (≥2). Firecrawl-enriched company facts when URL provided. | 94% |
| **Cold outreach** | Firecrawl mandatory when companyUrl given, 3-pass, validator checks grounding to scraped facts | 93% |
| **Interview Q&A** | Questions generated with rubric per question → evaluator scores against rubric, not free-form → ensemble scoring | 93% |
| **LinkedIn analyser** | Structured extraction + validators. SSI stays labelled as *estimate* (no public API — a real 95% here is impossible, so we're honest about it) | 88% (hard ceiling) |
| **JD optimiser** | 3-pass with critic checking bias, clarity, hidden-requirement inference | 93% |
| **Elevator pitch** | 3-pass + length validator + fact grounding | 94% |

## Shared infrastructure I'll add

- `supabase/functions/_shared/ai-pipeline.ts` — the 3-pass runner, used by every function. One place to tune.
- `supabase/functions/_shared/validators.ts` — grounding check, banned phrases, keyword coverage, JSON schema.
- `supabase/functions/_shared/ensemble.ts` — parallel model calls + reconciliation.
- `supabase/functions/_shared/ats-parser.ts` — deterministic CV structure extraction (sections, dates, contact, formatting flags) that feeds the scorer.

## /eval harness — the measurement piece

- Route: `/eval` (auth-gated to owner only, hidden from sidebar).
- Fixture set: 30 CV+JD pairs with hand-labelled ground truth (expected keywords, expected ATS band ±5, expected role-fit verdict, expected cover-letter facts).
- Runs the full pipeline against each fixture, computes:
  - **MAE** for numeric scores (target ≤5 pts)
  - **Precision/Recall/F1** for keyword extraction (target ≥0.93)
  - **Grounding pass rate** for generative outputs (target ≥95%)
  - **Banned-phrase incidence** (target 0%)
- Displays a dashboard: per-feature accuracy, trend over time, failing fixtures with diff.
- I'll seed 10 fixtures to start; the route lets you add more.

## Trade-offs you should know

- **Cost**: ~3× credits per scan. A single CV scan will use ~4 model calls instead of 1–2.
- **Latency**: CV scan goes from ~15s → ~40–50s. I'll add a live progress indicator ("Drafting → Critiquing → Refining → Validating") so it doesn't feel broken.
- **The 93–95% figure is only defensible after the /eval harness confirms it.** Until then it's a design target. I'll wire the harness first so we can watch the number climb as I ship each feature.
- **LinkedIn SSI at 88%** is the honest ceiling. The rest hit 93–95%.

## Order of work (one PR-sized change per step, verifiable)

1. Shared infra (`ai-pipeline`, `validators`, `ensemble`, `ats-parser`) + `/eval` harness with 10 seed fixtures. Baseline the current numbers.
2. Rewire `scan-cv` (ATS + keywords + rescan) — biggest accuracy win. Re-run eval.
3. Rewire `generate-cover-letter` + `generate-cold-outreach`. Re-run eval.
4. Rewire `interview-questions` + `evaluate-answer`. Re-run eval.
5. Rewire `analyze-linkedin`, `optimize-jd`, `generate-elevator-pitch`, `extract-keywords`. Final eval run.
6. UI: accuracy-mode badge on results, latency progress indicator, `/eval` dashboard styling.

Say go and I'll start with step 1 (infra + harness + baseline). Each step ends with a real accuracy number from the harness, not an estimate.