# Chain Verity — MVP Build Plan

Scope: turn the current demo into a system a design partner can use on **their own supplier data**.
Written against the codebase as of commit `0fc9956`.

---

## 0. Where we actually are

**Real today:** the UI, and the external-data enrichment layer — EDGAR, GLEIF, Companies House,
World Bank, OpenSanctions, FRED, UN Comtrade, NASA EONET, USGS, NWS, GDELT — plus genuine AI
features (chat, contract analysis, sub-tier discovery) on Claude.

**Not real today — the three load-bearing gaps:**

| Gap | Evidence |
|---|---|
| No database | All domain data is hardcoded in `src/lib/data/*.ts` (~2,000 lines) for two fictional companies |
| No real auth | One shared `DEMO_PASSWORD`; the cookie *stores the password* (`middleware.ts:5`, `src/app/api/auth/route.ts`). Roles are a client-side dropdown, unenforced server-side |
| No persistence | User changes live in `localStorage` (`AppContext.tsx:197–231`) — per-browser, lost on clear |

Also simulated: ERP write-back, supplier portal, assessment responses.

### Two findings that shape everything below

**(a) The data seam is a single choke point — this is a big asset.**
`AppContext.tsx:154–165` is eleven lines of `const platformX = clientMode === "wb" ? A : B`. Every
view reads through `useApp()` / `useSuppliers()`. Swapping static data for a database means
replacing *that provider*, not rewriting the views. The migration is far more contained than the
line count suggests — and because the MVP ships a single client mode (§1.1), those eleven ternaries
collapse to eleven plain org-scoped queries rather than being ported across as branches.

**(b) `/api/lookup-supplier` fabricates data and must be deleted, not reused.**
Its prompt asks Claude to "return realistic supplier profile data … or plausible estimates if not,"
and it invents DUNS numbers, spend, and FRISK scores (`route.ts:12–59`). Harmless in a demo where
everything is fictional; in an MVP it silently manufactures plausible-looking financial data about
real companies. **This is a correctness and trust hazard and is the single thing I would remove
before any real customer sees the product.** It is not an entity resolver — see §4.

Conversely, `/api/gleif` *is* the seed of a real resolver: it already does name → LEI fuzzy matching
with a scoring cascade (fuzzycompletions → start-of-string preference → filter fallback). Keep and
extend it.

---

## 1. MVP scope — the thinnest viable cut

| In | Out (defer) |
|---|---|
| **US client mode only** (§1.1) | European / Worcester Bosch mode |
| CSV supplier import | ERP connectors (SAP/Coupa) |
| Real auth, orgs, server-enforced roles | Supplier-facing portal |
| Entity resolution + human review queue | Assessments as a real product |
| Persisted enrichment + real risk scores | Disruption simulator polish |
| Real email/Slack alerts on live events | Multi-currency, white-label |
| AI features with persisted, reviewable output | Mobile app |

**The MVP promise:** *"Upload your supplier list. We resolve each company to its real legal entity,
enrich it from public sources, score it, and alert you when something happens near it — and we tell
you exactly how confident we are in every fact."*

That last clause is the differentiator, and the provenance UI already built (Verified /
Corroborated / AI-Inferred) is the right frame for it.

### 1.1 Single client mode — US (decided)

The demo ships two parallel universes: **Meridian Industrial** (US, $, UFLPA) and **Worcester Bosch**
(European, £, CSDDD/EUDR), switched by `?client=wb` and branched through eleven ternaries at
`AppContext.tsx:154–165`. Every dataset, fixture, and compliance framework exists twice.

**The MVP ships the US path only.** This is already the demo's default — `?client=wb` opts *into* the
European one — so it is also the lower-friction choice.

What that fixes in place:

| Dimension | MVP setting |
|---|---|
| Base currency | USD |
| Compliance narrative | UFLPA / CBP detention risk; CSDDD + EUDR out of scope |
| Resolver sources (§4) | **SEC EDGAR + GLEIF**; Companies House out of the resolver path |
| Jurisdiction | US-registered entities are the resolution targets |

One nuance worth being explicit about: **foreign sub-tier nodes still appear** — TSMC, ASML, Zhongke
Sanhuan and the rest are your suppliers' suppliers, and the UFLPA narrative depends on them. They are
displayed and reasoned about, but they are *not* resolution targets in the MVP: no attempt to verify
them against a registry, so they carry `inferred` provenance unless they happen to hold an LEI.

Why one mode: dual mode doubles seed fixtures, currency handling and compliance branching — and, most
expensively, requires building and tuning **two entity-resolution paths** (§4) before you know whether
either works, for zero additional MVP learning.

**Worcester Bosch is demoted, not deleted.** Keep it as a seeded `is_demo` organization (§8) so sales
can still show the European narrative — but remove it from the shipping path: no `clientMode`
branching in production queries, one set of real fixtures, one resolver configuration. The
`/api/companies-house` route stays for that demo seed; it simply isn't part of MVP resolution.

---

## 2. Architecture decisions

| Decision | Choice | Why / trade-off |
|---|---|---|
| Database | **Postgres on Neon** | Serverless-friendly branching, generous free tier, `pg_trgm` for fuzzy matching (needed in §4). Supabase is the alternative if you want RLS + storage + auth bundled |
| ORM | **Drizzle** | SQL-first, tiny cold-start (matters on Vercel), migrations are plain SQL. Prisma is heavier in serverless |
| Auth | **Clerk** (recommended) or Auth.js v5 | Clerk ships organizations, invites, and RBAC — saves weeks of undifferentiated work. Costs money and is a vendor dependency. Auth.js is free but you build org/invite flows yourself |
| Tenancy | `org_id` on every customer-owned row, enforced in a scoped query layer | Postgres RLS is stronger but harder to test; a single `db.forOrg(orgId)` wrapper is enough at MVP if *nothing* bypasses it |
| Jobs | **Vercel Cron** | Already on Vercel; no new infra. Move to Inngest/QStash when you need retries + fan-out |
| Hosting | Keep Next.js App Router on Vercel | No reason to change |
| Email / Slack | Resend + Slack incoming webhooks | Cheap, minimal setup |

---

## 3. Schema

Three distinct data classes, and keeping them separate is the most important structural call:

1. **Tenancy** — who can see what
2. **Customer-owned** — their suppliers, contracts, spend (per-org, private)
3. **Shared enrichment** — facts about real-world companies (**global, cross-tenant**)

> **Key design call:** EDGAR data for Honeywell is identical for every customer. Cache enrichment
> against a *global entity registry*, not per-tenant. This turns N customers × M suppliers of API
> calls into one fetch per entity, and makes trend history accumulate across the whole customer base.

```sql
-- ── Tenancy ────────────────────────────────────────────────────────────────
organizations (id, name, slug, base_currency, is_demo bool, created_at)
users         (id, email, name, created_at)          -- or delegate to Clerk
memberships   (org_id, user_id, role, created_at)    -- role: cfo|procurement|analyst|admin

-- ── Customer-owned (org-scoped) ────────────────────────────────────────────
suppliers (
  id, org_id, entity_id NULL,          -- FK → entities (may be unresolved)
  name, legal_name, category, tier, region, country_code,
  spend_annual, currency, status, source,   -- source: import|manual|erp
  archived_at, created_at, updated_at
)
supplier_identifiers (
  id, supplier_id, kind, value,        -- kind: lei|duns|ticker|cik|company_number|vat
  confidence numeric, provenance,      -- customer_provided|verified|corroborated|inferred
  resolver_version, resolved_at
)
supplier_sites (id, supplier_id, name, city, country_code, lat, lon)
contracts        (id, org_id, supplier_id, ...)
recovery_profiles(id, org_id, supplier_id, tts, ttr, buffer_days, ...)

-- ── Shared enrichment (GLOBAL — no org_id) ─────────────────────────────────
entities (
  id, legal_name, country_code,
  lei UNIQUE NULL, cik UNIQUE NULL, ticker NULL, duns NULL,
  normalized_name,                     -- for pg_trgm index
  created_at, updated_at
)
entity_snapshots (                     -- append-only
  id, entity_id, source,               -- edgar|gleif|companies_house|worldbank|sanctions
  payload jsonb, fetched_at, valid_until
)

-- ── Events: global feed, per-tenant matches ────────────────────────────────
events (
  id, source, external_id UNIQUE,      -- gdelt|usgs|nws|eonet
  category, severity, title, detail, lat, lon, occurred_at, link, ingested_at
)
event_supplier_matches (
  id, org_id, event_id, supplier_id,
  distance_km, match_reason,           -- proximity|name_mention
  confidence, notified_at, created_at
)

-- ── Scores: append-only so trends are real, not synthetic ──────────────────
risk_scores (
  id, org_id, supplier_id, score, band,
  score_version,                       -- reproducibility
  inputs jsonb,                        -- explainability: what fed this score
  computed_at
)

-- ── AI output: persisted + reviewable ──────────────────────────────────────
ai_outputs (
  id, org_id, kind,                    -- subtier|contract_analysis
  subject_supplier_id, model, prompt_version,
  payload jsonb, provenance,
  review_state,                        -- pending|accepted|rejected|edited
  reviewed_by, reviewed_at, created_at
)

-- ── Ingestion staging ──────────────────────────────────────────────────────
import_batches (id, org_id, filename, uploaded_by, row_count, status,
                column_mapping jsonb, created_at)
import_rows    (id, batch_id, raw jsonb, normalized jsonb,
                resolution_state, candidates jsonb,
                chosen_entity_id, supplier_id, error)

-- ── Ops ────────────────────────────────────────────────────────────────────
audit_log         (id, org_id, actor_user_id, action, target_type, target_id,
                   before jsonb, after jsonb, created_at)
notification_prefs(org_id, user_id, channel, event_types, min_severity)
api_usage         (id, org_id, provider, units, cost_cents, occurred_at)
```

Note `risk_scores.inputs` and `ai_outputs.provenance`: the UI already has "Why this
recommendation" and evidence badges. These columns are what make those honest instead of decorative.

---

## 4. Entity resolution — the core technical risk

This is the layer the demo hides. Its 50 suppliers are hand-curated and pre-matched; a real
customer uploads 800 messy names. Every downstream number depends on getting this right.

**Principle: deterministic → fuzzy → human → AI last. AI never produces a stored fact.**

**Stage 0 — Normalize.** Lowercase, strip diacritics, collapse punctuation, strip legal suffixes
(`Inc`, `LLC`, `Ltd`, `Limited`, `GmbH`, `AG`, `S.p.A.`, `B.V.`, `N.V.`, `S.A.`, `AB`, `A/S`, `Oy`,
`Pty`, `PLC`, `Corp`, `Holdings`, `Group`…). Always retain the original string.

**Stage 1 — Deterministic (confidence 1.0).** If the customer supplied an identifier, use it:
- Ticker → SEC `company_tickers.json` (cache locally, ~10k rows, refresh weekly) → CIK → `verified`
- LEI → GLEIF exact lookup → `verified`
- DUNS → store as `customer_provided` (not freely verifiable)

UK company number → Companies House is deliberately out of scope (§1.1).

**Stage 2 — Candidate generation.** For unresolved names, query two sources only: SEC name similarity
via `pg_trgm` against the cached ticker/CIK file, and GLEIF fuzzy matching (reuse `/api/gleif` logic).
Constrain by `country_code` when known. Building one resolver path instead of two is the single
largest engineering saving from dropping dual mode (§1.1).

**Stage 3 — Score candidates.** Name similarity (`pg_trgm` / Jaro-Winkler on normalized names) +
country agreement (strong penalty on mismatch) + distinctive-token overlap (discard generic words).
Explicitly flag parent-vs-subsidiary ambiguity rather than guessing.

**Stage 4 — Confidence bands.**

| Score | Action | Provenance |
|---|---|---|
| ≥ 0.92 + country match | auto-accept | `verified` |
| two independent sources agree | auto-accept | `corroborated` |
| 0.70 – 0.92 | **human review queue** (top 3 candidates) | set on accept |
| < 0.70 | create supplier, mark **unenriched** | — |

Low confidence must **never block import** and must **never silently guess**.

**Stage 5 — AI as a re-resolution hint only.** For still-unmatched names, ask Claude (structured
`tool_use`) for a likely legal name / jurisdiction / ticker, then **re-run Stages 1–3 on that
suggestion**. The AI's answer is a search hint, never a stored fact. Anything accepted this way is
`inferred` and visibly labelled. This replaces `/api/lookup-supplier`, which must be deleted (§0b).

### Coverage reality — state this plainly in the product

| Source | Covers | Blind spot |
|---|---|---|
| SEC EDGAR | US-listed public companies (~5–8k) | everything private — i.e. most suppliers |
| GLEIF | ~2.5M LEI holders, skewed large/financial | small private suppliers often absent |

> **The demo flatters both sources.** Meridian's supplier list is largely real *public* companies —
> Flex, Emerson, Parker Hannifin, Honeywell, Moog, Textron, Ametek — so EDGAR hits on nearly
> everything. A real customer's list is mostly private machine shops, distributors, and regional
> fabricators with no filings and often no LEI. **Expect the unresolved tail to be far larger than the
> demo implies.**

Design for graceful degradation accordingly: "Unenriched · customer data only" beats a fabricated
profile. The provenance UI already supports saying this honestly, which is a competitive advantage,
not an apology.

---

## 5. Ingestion flow

```
CSV upload → import_batches
   → column-mapping UI (their headers → our fields; remember mapping per org)
   → validate (required fields, dupes within file, currency/number parsing)
   → entity resolution (§4) per row, write candidates to import_rows
   → REVIEW QUEUE  ← first-class screen, not a modal
        · auto-matched  (accept in bulk, spot-check)
        · needs review  (top-3 candidates, one-click choose / reject / mark private)
        · unmatched     (import anyway as unenriched)
   → commit → suppliers + supplier_identifiers (+ audit_log)
   → enqueue enrichment for newly-linked entities
```

Re-import must be idempotent: match on identifier first, then normalized name + country, and
**update** rather than duplicate.

---

## 6. Make the scoring real

Today `calcDPS` and friends (`src/lib/analytics.ts`) compute from mock fields client-side. Move to
the server, run against `entity_snapshots` + customer data, and write to `risk_scores` with:
- `score_version` — so a score is reproducible and you can explain a change as *methodology* vs *data*
- `inputs jsonb` — the actual values used, so "Why this score" cites real numbers
- one row per computation — trend sparklines become real history instead of `dps * 0.6, dps * 0.75, …`

Write a short scoring methodology doc. Procurement buyers *will* ask how the number is made, and
"proprietary" is not an acceptable answer to a risk committee.

---

## 7. Background refresh + real alerts

Feeds are per-request cached (`revalidate = 900`) and matched on the fly — nothing is stored or
delivered.

- **Cron: every 15–30 min** — poll GDELT / USGS / NWS / EONET → upsert `events` by `external_id`
- **Cron: nightly** — refresh `entity_snapshots` (EDGAR, GLEIF, sanctions), recompute `risk_scores`
- **On event ingest** — compute `event_supplier_matches` (proximity via the existing `haversineKm`
  in `src/lib/data/coords.ts`; name-mention for GDELT) and persist
- **Deliver** — email (Resend) + Slack on new matches above each user's threshold, honouring
  `notification_prefs` (the Settings toggles already exist and are currently inert). Dedupe per
  `(supplier, event)` and offer a daily digest, or you will spam people on day one.

This is the highest value-per-unit-effort item in the whole plan: the events are *already real*,
they're just not reaching anyone.

---

## 8. Migrating the frontend (cheaper than it looks)

1. Add `GET /api/bootstrap` → the org's full dataset in the shape `AppContext` already expects.
2. **Delete** the eleven `clientMode ? A : B` ternaries (`AppContext.tsx:154–165`) — do not port them
   across as branches. With a single client mode (§1.1), `clientMode` leaves production code
   entirely; org identity replaces it.
3. Move `localStorage` state (custom suppliers, archives, risk appetite) to DB-backed endpoints.
4. Then, incrementally: paginate/server-render the heavy tables (supplier register, events).

**Keep the sales demo working.** Seed a `is_demo` organization from the existing static data. The
demo then runs on the same code path as real tenants — you get to keep the polished narrative *and*
dogfood the real stack.

---

## 9. Operational readiness (table stakes for procurement buyers)

- `audit_log` written on every mutation (who changed what, before/after)
- Sentry + uptime monitoring
- Rate limiting (Upstash) on all AI endpoints
- **Anthropic cost caps + per-org metering** via `api_usage` — unbounded AI spend is a real risk
- Secrets in Vercel env only; rotate the demo password out of the cookie (it currently *is* the cookie)
- Automated backups + a tested restore
- SOC 2 readiness path (policies, access reviews) — ask early, sold late

---

## 10. Sequencing

Five chunks, each independently shippable with a hard exit criterion.

| # | Chunk | Exit criterion |
|---|---|---|
| 1 | **Foundation** — Neon + Drizzle, Clerk auth, orgs/memberships, server-enforced roles, seeded demo org, `/api/bootstrap`; strip `clientMode` from production paths | Two orgs exist; demo org renders identically to today; `clientMode` appears nowhere outside the demo seed; a Procurement user cannot reach an Analyst-only route *server-side* |
| 2 | **Ingestion + ER** — CSV upload, mapping, resolver (§4), review queue; delete `lookup-supplier` | A real 200+ row customer CSV imports; auto-match rate measured and reported; unmatched rows degrade gracefully |
| 3 | **Real intelligence** — persist enrichment, server-side scoring with `inputs` + `score_version`, persist AI outputs with review | Every score on screen traces to stored inputs; score history accumulates daily |
| 4 | **Alerts + jobs** — cron ingest, persisted event matches, email/Slack with dedupe | A real GDELT/USGS event matched to a real supplier arrives in an inbox once, not five times |
| 5 | **Hardening** — audit log, Sentry, rate limits, AI cost caps, backups | Every mutation audited; AI spend capped per org |

Chunks 1–2 are the MVP's spine. 3–4 are what make it worth paying for. 5 is what makes it sellable
to a company with a security review.

---

## 11. Risks, ranked honestly

1. **Entity-resolution accuracy on real data (highest).** The demo's credibility comes from
   pre-curated suppliers. If auto-match on a real list is poor, the human-review burden may exceed
   what a customer will tolerate. *Mitigate: spike this first (§12).*
2. **Enrichment coverage for private companies.** Most industrial suppliers are private — not SEC
   filers, and frequently without an LEI. The demo conceals this because Meridian's suppliers are
   mostly real public companies (§4), so EDGAR looks near-universal when it isn't. Positioning risk as
   much as technical.
3. **`lookup-supplier` fabrication.** Must be removed before any real customer sees it. It generates
   plausible fake financials about real companies.
4. **Reverting to dual client mode.** A second design partner in another geography makes it tempting
   to re-add the mode you dropped (§1.1) — which means a second resolver path, a second fixture set,
   and compliance branching, all before the first path is proven. Treat a second geography as a
   post-MVP decision with its own estimate, not a configuration flag.
5. **Unbounded AI cost.** Sub-tier discovery and chat are the only metered dependency; no caps today.
6. **Data licensing.** If you later add D&B/Everstream-class data, redistribution terms constrain
   what you can surface and export.
7. **GDPR — deferred, not dismissed.** On the US path (§1.1) this is not a launch blocker, and
   CCPA/CPRA applies lightly to B2B contact data. It becomes a blocker the moment you take a European
   customer or store EU supplier contacts, so keep the schema deletion-friendly now (cascade paths, no
   personal data inside append-only snapshots) to avoid a painful retrofit later.

---

## 12. What I'd do first — a one-week de-risking spike

Before writing any schema, resolve risk #1:

1. Get a real **US** supplier list from a design partner (or assemble a realistic 300-row set). Weight
   it the way a real one is: **mostly private** — machine shops, distributors, regional fabricators —
   with messy names (abbreviations, punctuation, `DBA`/division suffixes). Do *not* test against a
   public-company-heavy mix like the demo's; that yields a flattering and useless match rate.
2. Build the resolver as a **standalone script** — no UI, no DB. Normalize → SEC + GLEIF → score →
   emit a match-rate distribution by confidence band, **split by public vs private**. The private-only
   number is the one that matters.
3. **Decision gate:** if auto-match at ≥0.92 lands below ~60% on realistic data, the product needs
   more human-in-the-loop design (or paid data) *before* you build the surrounding app — not after.

Everything else in this plan is conventional engineering with known cost. This is the one place the
answer is genuinely unknown, so it should be measured first and cheaply.
