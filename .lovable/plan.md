# Plan: Retention + GDPR + Distribution

Three risks, one coherent shipment. Each phase is independently valuable so we can stop after any of them.

---

## Phase 1 — Retention loop (fixes "one-shot tool", "graduates every year")

**Goal:** give users a reason to return weekly instead of scanning once and leaving.

1. **Auto-save every scan to history** (currently optional). If the user isn't signed in, show a soft "Sign up to save this scan + track progress" prompt on the results page, never blocking.
2. **Progress dashboard at `/dashboard`** — extend the existing page to show:
   - Latest overall score + delta vs. previous scan (e.g. "+12 since last week")
   - Sparkline of last 10 scans (Recharts, already in deps)
   - "Next milestone" hint ("Reach 75 for top-tier ATS readiness")
   - Streak counter (consecutive weeks with at least one scan)
3. **Weekly progress email** (optional, opt-in checkbox on signup):
   - Edge function `weekly-progress-digest` triggered by pg_cron Sunday 9am Europe/Paris
   - Pulls last week's scans per user, emails: score trend, top 1 unresolved weakness, suggested next action
   - Uses Lovable transactional email infra (no third-party key)
4. **"Pick up where you left off"** banner on `/scan` if a recent unsaved CV is in localStorage.

**Files touched:** `src/pages/Dashboard.tsx`, `src/pages/Index.tsx` (post-scan CTA), new `supabase/functions/weekly-progress-digest/`, new migration for `user_preferences` table (email opt-in, last_streak_date), pg_cron schedule.

---

## Phase 2 — GDPR hardening (fixes company-ending risk)

**Goal:** be defensibly compliant, not just claim to be.

1. **`/privacy` and `/data-processing` static pages** — actual DPA-style copy covering: data we collect (CV text, JD text, scan results, email), legal basis (consent + contract), retention (90 days unless saved), recipients (Lovable AI Gateway / Google / OpenAI sub-processors), user rights (access, deletion, portability), DPO contact.
2. **"Export my data" + "Delete my account"** in `/profile`:
   - Export: calls edge function returning JSON of all `scan_history`, `resume_versions`, `job_applications`, `company_contacts` rows for the user.
   - Delete: hard-deletes all user rows across tables, then deletes the auth user. Requires typing "DELETE" confirmation.
3. **Automatic 90-day retention** on `scan_history` via pg_cron job — only scans not pinned to a saved `resume_version` are purged.
4. **Cookie/consent banner** on first visit — minimal, just acknowledges essential cookies (no tracking yet, so easy).
5. **Enable HIBP password check** via `configure_auth`.

**Files touched:** new `src/pages/Privacy.tsx`, `src/pages/DataProcessing.tsx`, edits to `src/pages/Profile.tsx`, new `supabase/functions/export-user-data/`, `supabase/functions/delete-user-account/`, migration for retention cron + auth config tweak, new `CookieBanner.tsx`.

---

## Phase 3 — Distribution / virality (fixes "no flywheel")

**Goal:** every scan becomes a potential acquisition channel.

1. **Shareable public scan cards** — `/share/:scanId` route:
   - Shows score, top 3 strengths, top 3 weaknesses, "Powered by Made for ATS" footer with CTA.
   - Per-scan public flag (default false) — user explicitly opts in to share.
   - Generates a custom OG image via edge function (Satori/HTML-to-PNG) so LinkedIn previews show the actual score.
2. **"Share my result" button** on results page — copies the link, opens LinkedIn share intent.
3. **Referral credits** — simple: signed-up users get a `?ref=<userId>` link. We track new signups attributed to a referrer in a `referrals` table. Reward = 5 "premium scans" (we don't have premium yet, so this seats Phase-2-monetisation later).
4. **Public score-card OG image** on the homepage — current placeholder is generic; generate one Awwwards-grade with the score gauge.

**Files touched:** new `src/pages/SharedScan.tsx`, new `supabase/functions/og-image/`, `supabase/functions/share-scan/`, migration for `is_public` column on `scan_history` + new `referrals` table with RLS, edits to `App.tsx` routes and `ResultsFeed.tsx`.

---

## Recommended sequencing

I'd ship **Phase 2 (GDPR) first** — it's blocking risk, mostly UI + edge functions, low surprise.
Then **Phase 1 (Retention)** — biggest product impact.
Then **Phase 3 (Distribution)** — most fun, highest variance.

Total: ~3 reasonable-size chats. Reply with which phase to start (or "all of phase 2" / "do them in order").

## Technical notes

- New tables (`user_preferences`, `referrals`) follow the existing `user_id`-scoped RLS pattern.
- Cron jobs use `pg_cron` + `pg_net` (already available in Cloud).
- OG image generation runs in an edge function using `npm:@vercel/og` or a lightweight HTML→PNG approach; cached to Supabase Storage by `scan_id`.
- All UI copy stays British English per the design memory.
- Brutally honest scoring stays as-is — none of this changes the scoring logic.
