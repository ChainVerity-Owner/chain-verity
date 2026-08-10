// Generates Chain-Verity-MVP-Build-Plan.docx from the content below.
// Source of truth for the prose is MVP_PLAN.md — keep them in step.
// Run:  npm i docx  (or NODE_PATH=<dir with docx>)  then  node docs/generate/build-plan.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  TabStopType, TabStopPosition, BorderStyle,
} = require("docx");
const K = require("./docx-kit");

const { H1, H2, P, BULLET, NUM, QUOTE, GAP, CODE, CALLOUT, TABLE, INK, MUTED, ACCENT, RISK, OK, WARN } = K;

const body = [];

// ── Title ────────────────────────────────────────────────────────────────────
body.push(
  new Paragraph({ children: [new TextRun({ text: "CHAIN VERITY", bold: true, size: 20, color: ACCENT })], spacing: { after: 60 } }),
  new Paragraph({ children: [new TextRun({ text: "MVP Build Plan", bold: true, size: 52, color: INK })], spacing: { after: 100 } }),
  new Paragraph({
    children: [
      new TextRun({ text: "Turning the demo into a system a design partner can use on ", size: 24, color: MUTED }),
      new TextRun({ text: "their own supplier data", size: 24, color: MUTED, bold: true }),
      new TextRun({ text: ".", size: 24, color: MUTED }),
    ],
    spacing: { after: 40 },
  }),
  new Paragraph({
    children: [
      new TextRun({ text: "Plan written against commit ", size: 20, color: MUTED }),
      new TextRun({ text: "0fc9956", font: "Consolas", size: 19, color: MUTED }),
      new TextRun({ text: "  ·  codebase now at ", size: 20, color: MUTED }),
      new TextRun({ text: "131b1b3", font: "Consolas", size: 19, color: MUTED }),
    ],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
    spacing: { after: 240 },
  })
);

body.push(
  CALLOUT(
    [
      { t: "Status note. ", b: true },
      { t: "Since this plan was written, the demo gained UI shells for several MVP surfaces — Import & Resolve with a review queue, evidence-coverage reporting, unenriched supplier states, and alert-delivery previews. Those are presentation only: still fixture-driven, with no database, resolver, or delivery behind them. Every engineering item below stands unchanged." },
    ],
    "EEF3FB",
    ACCENT
  )
);

// ── 0 ────────────────────────────────────────────────────────────────────────
body.push(H1("0. Where we actually are"));
body.push(
  P([
    { t: "Real today: ", b: true },
    { t: "the UI, and the external-data enrichment layer — EDGAR, GLEIF, Companies House, World Bank, OpenSanctions, FRED, UN Comtrade, NASA EONET, USGS, NWS, GDELT — plus genuine AI features (chat, contract analysis, sub-tier discovery) on Claude." },
  ])
);
body.push(P([{ t: "Not real today — the three load-bearing gaps:", b: true }]));
body.push(
  TABLE(
    ["Gap", "Evidence"],
    [
      [{ t: "No database", b: true }, [{ t: "All domain data is hardcoded in " }, { t: "src/lib/data/*.ts", mono: true }, { t: " (~2,000 lines) for two fictional companies" }]],
      [{ t: "No real auth", b: true }, [{ t: "One shared " }, { t: "DEMO_PASSWORD", mono: true }, { t: "; the cookie stores the password. Roles are a client-side dropdown, unenforced server-side" }]],
      [{ t: "No persistence", b: true }, [{ t: "User changes live in " }, { t: "localStorage", mono: true }, { t: " — per-browser, lost on clear" }]],
    ],
    [2000, 7360]
  )
);
body.push(GAP(150));
body.push(P("Also simulated: ERP write-back, supplier portal, assessment responses."));

body.push(H2("Two findings that shape everything below"));
body.push(
  P([
    { t: "(a) The data seam is a single choke point — this is a big asset. ", b: true },
    { t: "AppContext.tsx:154–165", mono: true },
    { t: " is eleven lines of clientMode ternaries. Every view reads through useApp() / useSuppliers(). Swapping static data for a database means replacing that provider, not rewriting the views. The migration is far more contained than the line count suggests — and because the MVP ships a single client mode (§1.1), those eleven ternaries collapse to eleven plain org-scoped queries rather than being ported across as branches." },
  ])
);
body.push(
  P([
    { t: "(b) /api/lookup-supplier fabricates data and must be deleted, not reused. ", b: true },
    { t: "Its prompt asks Claude to “return realistic supplier profile data … or plausible estimates if not,” and it invents DUNS numbers, spend, and FRISK scores. Harmless in a demo where everything is fictional; in an MVP it silently manufactures plausible-looking financial data about real companies. " },
    { t: "This is a correctness and trust hazard and is the single thing I would remove before any real customer sees the product.", b: true, color: RISK },
    { t: " It is not an entity resolver — see §4." },
  ])
);
body.push(
  P([
    { t: "Conversely, " }, { t: "/api/gleif", mono: true },
    { t: " is the seed of a real resolver: it already does name → LEI fuzzy matching with a scoring cascade (fuzzycompletions → start-of-string preference → filter fallback). Keep and extend it." },
  ])
);

// ── 1 ────────────────────────────────────────────────────────────────────────
body.push(H1("1. MVP scope — the thinnest viable cut"));
body.push(
  TABLE(
    ["In", "Out (defer)"],
    [
      [[{ t: "US client mode only", b: true }, { t: " (§1.1)" }], "European / Worcester Bosch mode"],
      ["CSV supplier import", "ERP connectors (SAP / Coupa)"],
      ["Real auth, orgs, server-enforced roles", "Supplier-facing portal"],
      ["Entity resolution + human review queue", "Assessments as a real product"],
      ["Persisted enrichment + real risk scores", "Disruption simulator polish"],
      ["Real email / Slack alerts on live events", "Multi-currency, white-label"],
      ["AI features with persisted, reviewable output", "Mobile app"],
    ],
    [4680, 4680]
  )
);
body.push(GAP(150));
body.push(P([{ t: "The MVP promise:", b: true }]));
body.push(QUOTE([{ t: "“Upload your supplier list. We resolve each company to its real legal entity, enrich it from public sources, score it, and alert you when something happens near it — and we tell you exactly how confident we are in every fact.”", i: true }]));
body.push(P("That last clause is the differentiator, and the provenance UI already built (Verified / Corroborated / AI-Inferred) is the right frame for it."));

body.push(H2("1.1  Single client mode — US (decided)"));
body.push(
  P([
    { t: "The demo ships two parallel universes: " }, { t: "Meridian Industrial", b: true },
    { t: " (US, $, UFLPA) and " }, { t: "Worcester Bosch", b: true },
    { t: " (European, £, CSDDD/EUDR), switched by " }, { t: "?client=wb", mono: true },
    { t: ". Every dataset, fixture, and compliance framework exists twice." },
  ])
);
body.push(
  P([
    { t: "The MVP ships the US path only.", b: true },
    { t: " This is already the demo's default — " }, { t: "?client=wb", mono: true },
    { t: " opts into the European one — so it is also the lower-friction choice. What that fixes in place:" },
  ])
);
body.push(
  TABLE(
    ["Dimension", "MVP setting"],
    [
      ["Base currency", "USD"],
      ["Compliance narrative", "UFLPA / CBP detention risk; CSDDD + EUDR out of scope"],
      ["Resolver sources (§4)", [{ t: "SEC EDGAR + GLEIF", b: true }, { t: "; Companies House out of the resolver path" }]],
      ["Jurisdiction", "US-registered entities are the resolution targets"],
    ],
    [2600, 6760]
  )
);
body.push(GAP(150));
body.push(
  P([
    { t: "One nuance worth being explicit about: " },
    { t: "foreign sub-tier nodes still appear", b: true },
    { t: " — TSMC, ASML, Zhongke Sanhuan and the rest are your suppliers' suppliers, and the UFLPA narrative depends on them. They are displayed and reasoned about, but they are not resolution targets in the MVP: no attempt to verify them against a registry, so they carry " },
    { t: "inferred", mono: true }, { t: " provenance unless they happen to hold an LEI." },
  ])
);
body.push(
  P([
    { t: "Why one mode: dual mode doubles seed fixtures, currency handling and compliance branching — and, most expensively, requires building and tuning " },
    { t: "two entity-resolution paths", b: true },
    { t: " (§4) before you know whether either works, for zero additional MVP learning." },
  ])
);
body.push(
  P([
    { t: "Worcester Bosch is demoted, not deleted.", b: true },
    { t: " Keep it as a seeded " }, { t: "is_demo", mono: true },
    { t: " organization (§8) so sales can still show the European narrative — but remove it from the shipping path: no clientMode branching in production queries, one set of real fixtures, one resolver configuration. The " },
    { t: "/api/companies-house", mono: true },
    { t: " route stays for that demo seed; it simply isn't part of MVP resolution." },
  ])
);

// ── 2 ────────────────────────────────────────────────────────────────────────
body.push(H1("2. Architecture decisions"));
body.push(
  TABLE(
    ["Decision", "Choice", "Why / trade-off"],
    [
      ["Database", [{ t: "Postgres on Neon", b: true }], "Serverless-friendly branching, generous free tier, pg_trgm for fuzzy matching (needed in §4). Supabase is the alternative if you want RLS + storage + auth bundled"],
      ["ORM", [{ t: "Drizzle", b: true }], "SQL-first, tiny cold-start (matters on Vercel), migrations are plain SQL. Prisma is heavier in serverless"],
      ["Auth", [{ t: "Clerk", b: true }, { t: " (recommended) or Auth.js v5" }], "Clerk ships organizations, invites and RBAC — saves weeks of undifferentiated work. Costs money and is a vendor dependency. Auth.js is free but you build org/invite flows yourself"],
      ["Tenancy", [{ t: "org_id", mono: true }, { t: " on every customer-owned row, enforced in a scoped query layer" }], "Postgres RLS is stronger but harder to test; a single db.forOrg(orgId) wrapper is enough at MVP if nothing bypasses it"],
      ["Jobs", [{ t: "Vercel Cron", b: true }], "Already on Vercel; no new infra. Move to Inngest/QStash when you need retries + fan-out"],
      ["Hosting", "Keep Next.js App Router on Vercel", "No reason to change"],
      ["Email / Slack", "Resend + Slack incoming webhooks", "Cheap, minimal setup"],
    ],
    [1400, 2400, 5560]
  )
);

// ── 3 ────────────────────────────────────────────────────────────────────────
body.push(H1("3. Schema"));
body.push(P("Three distinct data classes, and keeping them separate is the most important structural call:"));
body.push(NUM([{ t: "Tenancy", b: true }, { t: " — who can see what" }]));
body.push(NUM([{ t: "Customer-owned", b: true }, { t: " — their suppliers, contracts, spend (per-org, private)" }]));
body.push(NUM([{ t: "Shared enrichment", b: true }, { t: " — facts about real-world companies (global, cross-tenant)" }]));
body.push(
  CALLOUT(
    [
      { t: "Key design call. ", b: true },
      { t: "EDGAR data for Honeywell is identical for every customer. Cache enrichment against a global entity registry, not per-tenant. This turns N customers × M suppliers of API calls into one fetch per entity, and makes trend history accumulate across the whole customer base." },
    ],
    "EEF3FB",
    ACCENT
  )
);
body.push(
  ...CODE([
    "-- ── Tenancy ──────────────────────────────────────────────────────────",
    "organizations (id, name, slug, base_currency, is_demo bool, created_at)",
    "users         (id, email, name, created_at)        -- or delegate to Clerk",
    "memberships   (org_id, user_id, role, created_at)  -- cfo|procurement|analyst|admin",
    "",
    "-- ── Customer-owned (org-scoped) ──────────────────────────────────────",
    "suppliers (",
    "  id, org_id, entity_id NULL,        -- FK → entities (may be unresolved)",
    "  name, legal_name, category, tier, region, country_code,",
    "  spend_annual, currency, status, source,  -- source: import|manual|erp",
    "  archived_at, created_at, updated_at",
    ")",
    "supplier_identifiers (",
    "  id, supplier_id, kind, value,      -- lei|duns|ticker|cik|company_number|vat",
    "  confidence numeric, provenance,    -- customer_provided|verified|corroborated|inferred",
    "  resolver_version, resolved_at",
    ")",
    "supplier_sites (id, supplier_id, name, city, country_code, lat, lon)",
    "contracts         (id, org_id, supplier_id, ...)",
    "recovery_profiles (id, org_id, supplier_id, tts, ttr, buffer_days, ...)",
    "",
    "-- ── Shared enrichment (GLOBAL — no org_id) ───────────────────────────",
    "entities (",
    "  id, legal_name, country_code,",
    "  lei UNIQUE NULL, cik UNIQUE NULL, ticker NULL, duns NULL,",
    "  normalized_name,                   -- for pg_trgm index",
    "  created_at, updated_at",
    ")",
    "entity_snapshots (                   -- append-only",
    "  id, entity_id, source,             -- edgar|gleif|companies_house|worldbank|sanctions",
    "  payload jsonb, fetched_at, valid_until",
    ")",
    "",
    "-- ── Events: global feed, per-tenant matches ──────────────────────────",
    "events (",
    "  id, source, external_id UNIQUE,    -- gdelt|usgs|nws|eonet",
    "  category, severity, title, detail, lat, lon, occurred_at, link, ingested_at",
    ")",
    "event_supplier_matches (",
    "  id, org_id, event_id, supplier_id,",
    "  distance_km, match_reason,         -- proximity|name_mention",
    "  confidence, notified_at, created_at",
    ")",
    "",
    "-- ── Scores: append-only so trends are real, not synthetic ────────────",
    "risk_scores (",
    "  id, org_id, supplier_id, score, band,",
    "  score_version,                     -- reproducibility",
    "  inputs jsonb,                      -- explainability: what fed this score",
    "  computed_at",
    ")",
    "",
    "-- ── AI output: persisted + reviewable ────────────────────────────────",
    "ai_outputs (",
    "  id, org_id, kind,                  -- subtier|contract_analysis",
    "  subject_supplier_id, model, prompt_version,",
    "  payload jsonb, provenance,",
    "  review_state,                      -- pending|accepted|rejected|edited",
    "  reviewed_by, reviewed_at, created_at",
    ")",
    "",
    "-- ── Ingestion staging ────────────────────────────────────────────────",
    "import_batches (id, org_id, filename, uploaded_by, row_count, status,",
    "                column_mapping jsonb, created_at)",
    "import_rows    (id, batch_id, raw jsonb, normalized jsonb,",
    "                resolution_state, candidates jsonb,",
    "                chosen_entity_id, supplier_id, error)",
    "",
    "-- ── Ops ──────────────────────────────────────────────────────────────",
    "audit_log          (id, org_id, actor_user_id, action, target_type,",
    "                    target_id, before jsonb, after jsonb, created_at)",
    "notification_prefs (org_id, user_id, channel, event_types, min_severity)",
    "api_usage          (id, org_id, provider, units, cost_cents, occurred_at)",
  ])
);
body.push(
  P([
    { t: "Note " }, { t: "risk_scores.inputs", mono: true }, { t: " and " },
    { t: "ai_outputs.provenance", mono: true },
    { t: ": the UI already has “Why this recommendation” and evidence badges. These columns are what make those honest instead of decorative." },
  ])
);

// ── 4 ────────────────────────────────────────────────────────────────────────
body.push(H1("4. Entity resolution — the core technical risk"));
body.push(P("This is the layer the demo hides. Its 50 suppliers are hand-curated and pre-matched; a real customer uploads 800 messy names. Every downstream number depends on getting this right."));
body.push(CALLOUT([{ t: "Principle: deterministic → fuzzy → human → AI last. AI never produces a stored fact.", b: true }], "FFF8E8", WARN));
body.push(
  P([
    { t: "Stage 0 — Normalize. ", b: true },
    { t: "Lowercase, strip diacritics, collapse punctuation, strip legal suffixes (Inc, LLC, Ltd, Limited, GmbH, AG, S.p.A., B.V., N.V., S.A., AB, A/S, Oy, Pty, PLC, Corp, Holdings, Group…). Always retain the original string." },
  ])
);
body.push(P([{ t: "Stage 1 — Deterministic (confidence 1.0). ", b: true }, { t: "If the customer supplied an identifier, use it:" }]));
body.push(BULLET([{ t: "Ticker → SEC " }, { t: "company_tickers.json", mono: true }, { t: " (cache locally, ~10k rows, refresh weekly) → CIK → verified" }]));
body.push(BULLET("LEI → GLEIF exact lookup → verified"));
body.push(BULLET("DUNS → store as customer_provided (not freely verifiable)"));
body.push(P("UK company number → Companies House is deliberately out of scope (§1.1)."));
body.push(
  P([
    { t: "Stage 2 — Candidate generation. ", b: true },
    { t: "For unresolved names, query two sources only: SEC name similarity via " }, { t: "pg_trgm", mono: true },
    { t: " against the cached ticker/CIK file, and GLEIF fuzzy matching (reuse " }, { t: "/api/gleif", mono: true },
    { t: " logic). Constrain by country_code when known. Building one resolver path instead of two is the single largest engineering saving from dropping dual mode (§1.1)." },
  ])
);
body.push(
  P([
    { t: "Stage 3 — Score candidates. ", b: true },
    { t: "Name similarity (pg_trgm / Jaro-Winkler on normalized names) + country agreement (strong penalty on mismatch) + distinctive-token overlap (discard generic words). Explicitly flag parent-vs-subsidiary ambiguity rather than guessing." },
  ])
);
body.push(P([{ t: "Stage 4 — Confidence bands.", b: true }]));
body.push(
  TABLE(
    ["Score", "Action", "Provenance"],
    [
      ["≥ 0.92 + country match", "auto-accept", [{ t: "verified", mono: true }]],
      ["two independent sources agree", "auto-accept", [{ t: "corroborated", mono: true }]],
      ["0.70 – 0.92", [{ t: "human review queue", b: true }, { t: " (top 3 candidates)" }], "set on accept"],
      ["< 0.70", [{ t: "create supplier, mark " }, { t: "unenriched", b: true }], "—"],
    ],
    [2800, 4160, 2400]
  )
);
body.push(GAP(150));
body.push(P([{ t: "Low confidence must never block import and must never silently guess.", b: true }]));
body.push(
  P([
    { t: "Stage 5 — AI as a re-resolution hint only. ", b: true },
    { t: "For still-unmatched names, ask Claude (structured tool_use) for a likely legal name / jurisdiction / ticker, then re-run Stages 1–3 on that suggestion. The AI's answer is a search hint, never a stored fact. Anything accepted this way is inferred and visibly labelled. This replaces " },
    { t: "/api/lookup-supplier", mono: true }, { t: ", which must be deleted (§0b)." },
  ])
);

body.push(H2("Coverage reality — state this plainly in the product"));
body.push(
  TABLE(
    ["Source", "Covers", "Blind spot"],
    [
      ["SEC EDGAR", "US-listed public companies (~5–8k)", "everything private — i.e. most suppliers"],
      ["GLEIF", "~2.5M LEI holders, skewed large/financial", "small private suppliers often absent"],
    ],
    [1700, 3600, 4060]
  )
);
body.push(GAP(150));
body.push(
  CALLOUT(
    [
      { t: "The demo flatters both sources. ", b: true },
      { t: "Meridian's supplier list is largely real public companies — Flex, Emerson, Parker Hannifin, Honeywell, Moog, Textron, Ametek — so EDGAR hits on nearly everything. A real customer's list is mostly private machine shops, distributors and regional fabricators with no filings and often no LEI. Expect the unresolved tail to be far larger than the demo implies." },
    ],
    "FFF8E8",
    WARN
  )
);
body.push(P("Design for graceful degradation accordingly: “Unenriched · customer data only” beats a fabricated profile. The provenance UI already supports saying this honestly, which is a competitive advantage, not an apology."));

// ── 5 ────────────────────────────────────────────────────────────────────────
body.push(H1("5. Ingestion flow"));
body.push(
  ...CODE([
    "CSV upload → import_batches",
    "   → column-mapping UI (their headers → our fields; remember per org)",
    "   → validate (required fields, dupes in file, currency/number parsing)",
    "   → entity resolution (§4) per row, write candidates to import_rows",
    "   → REVIEW QUEUE  ← first-class screen, not a modal",
    "        · auto-matched  (accept in bulk, spot-check)",
    "        · needs review  (top-3 candidates, choose / reject / mark private)",
    "        · unmatched     (import anyway as unenriched)",
    "   → commit → suppliers + supplier_identifiers (+ audit_log)",
    "   → enqueue enrichment for newly-linked entities",
  ])
);
body.push(P([{ t: "Re-import must be idempotent: match on identifier first, then normalized name + country, and " }, { t: "update", b: true }, { t: " rather than duplicate." }]));

// ── 6 ────────────────────────────────────────────────────────────────────────
body.push(H1("6. Make the scoring real"));
body.push(
  P([
    { t: "Today " }, { t: "calcDPS", mono: true }, { t: " and friends (" }, { t: "src/lib/analytics.ts", mono: true },
    { t: ") compute from mock fields client-side. Move to the server, run against " }, { t: "entity_snapshots", mono: true },
    { t: " + customer data, and write to " }, { t: "risk_scores", mono: true }, { t: " with:" },
  ])
);
body.push(BULLET([{ t: "score_version", mono: true }, { t: " — so a score is reproducible and you can explain a change as methodology vs data" }]));
body.push(BULLET([{ t: "inputs jsonb", mono: true }, { t: " — the actual values used, so “Why this score” cites real numbers" }]));
body.push(BULLET([{ t: "one row per computation — trend sparklines become real history instead of " }, { t: "dps * 0.6, dps * 0.75, …", mono: true }]));
body.push(P([{ t: "Write a short scoring methodology doc. Procurement buyers " }, { t: "will", b: true }, { t: " ask how the number is made, and “proprietary” is not an acceptable answer to a risk committee." }]));

// ── 7 ────────────────────────────────────────────────────────────────────────
body.push(H1("7. Background refresh + real alerts"));
body.push(P([{ t: "Feeds are per-request cached (" }, { t: "revalidate = 900", mono: true }, { t: ") and matched on the fly — nothing is stored or delivered." }]));
body.push(BULLET([{ t: "Cron: every 15–30 min", b: true }, { t: " — poll GDELT / USGS / NWS / EONET → upsert events by external_id" }]));
body.push(BULLET([{ t: "Cron: nightly", b: true }, { t: " — refresh entity_snapshots (EDGAR, GLEIF, sanctions), recompute risk_scores" }]));
body.push(BULLET([{ t: "On event ingest", b: true }, { t: " — compute event_supplier_matches (proximity via the existing " }, { t: "haversineKm", mono: true }, { t: " in src/lib/data/coords.ts; name-mention for GDELT) and persist" }]));
body.push(BULLET([{ t: "Deliver", b: true }, { t: " — email (Resend) + Slack on new matches above each user's threshold, honouring notification_prefs (the Settings toggles already exist and are currently inert). Dedupe per (supplier, event) and offer a daily digest, or you will spam people on day one." }]));
body.push(CALLOUT([{ t: "Highest value-per-unit-effort item in the whole plan. ", b: true }, { t: "The events are already real — they are simply not reaching anyone." }], "EDF7F1", OK));

// ── 8 ────────────────────────────────────────────────────────────────────────
body.push(H1("8. Migrating the frontend (cheaper than it looks)"));
body.push(NUM([{ t: "Add " }, { t: "GET /api/bootstrap", mono: true }, { t: " → the org's full dataset in the shape AppContext already expects." }]));
body.push(NUM([{ t: "Delete", b: true }, { t: " the eleven clientMode ternaries (" }, { t: "AppContext.tsx:154–165", mono: true }, { t: ") — do not port them across as branches. With a single client mode (§1.1), clientMode leaves production code entirely; org identity replaces it." }]));
body.push(NUM([{ t: "Move " }, { t: "localStorage", mono: true }, { t: " state (custom suppliers, archives, risk appetite) to DB-backed endpoints." }]));
body.push(NUM("Then, incrementally: paginate / server-render the heavy tables (supplier register, events)."));
body.push(P([{ t: "Keep the sales demo working.", b: true }, { t: " Seed an " }, { t: "is_demo", mono: true }, { t: " organization from the existing static data. The demo then runs on the same code path as real tenants — you keep the polished narrative and dogfood the real stack." }]));

// ── 9 ────────────────────────────────────────────────────────────────────────
body.push(H1("9. Operational readiness (table stakes for procurement buyers)"));
[
  [{ t: "audit_log", mono: true }, { t: " written on every mutation (who changed what, before/after)" }],
  "Sentry + uptime monitoring",
  "Rate limiting (Upstash) on all AI endpoints",
  [{ t: "Anthropic cost caps + per-org metering", b: true }, { t: " via api_usage — unbounded AI spend is a real risk" }],
  "Secrets in Vercel env only; rotate the demo password out of the cookie (it currently is the cookie)",
  "Automated backups + a tested restore",
  "SOC 2 readiness path (policies, access reviews) — ask early, sold late",
].forEach((b) => body.push(BULLET(b)));

// ── 10 ───────────────────────────────────────────────────────────────────────
body.push(H1("10. Sequencing"));
body.push(P("Five chunks, each independently shippable with a hard exit criterion."));
body.push(
  TABLE(
    ["#", "Chunk", "Exit criterion"],
    [
      ["1", [{ t: "Foundation", b: true }, { t: " — Neon + Drizzle, Clerk auth, orgs/memberships, server-enforced roles, seeded demo org, /api/bootstrap; strip clientMode from production paths" }], "Two orgs exist; demo org renders identically to today; clientMode appears nowhere outside the demo seed; a Procurement user cannot reach an Analyst-only route server-side"],
      ["2", [{ t: "Ingestion + ER", b: true }, { t: " — CSV upload, mapping, resolver (§4), review queue; delete lookup-supplier" }], "A real 200+ row customer CSV imports; auto-match rate measured and reported; unmatched rows degrade gracefully"],
      ["3", [{ t: "Real intelligence", b: true }, { t: " — persist enrichment, server-side scoring with inputs + score_version, persist AI outputs with review" }], "Every score on screen traces to stored inputs; score history accumulates daily"],
      ["4", [{ t: "Alerts + jobs", b: true }, { t: " — cron ingest, persisted event matches, email/Slack with dedupe" }], "A real GDELT/USGS event matched to a real supplier arrives in an inbox once, not five times"],
      ["5", [{ t: "Hardening", b: true }, { t: " — audit log, Sentry, rate limits, AI cost caps, backups" }], "Every mutation audited; AI spend capped per org"],
    ],
    [500, 4200, 4660]
  )
);
body.push(GAP(150));
body.push(P("Chunks 1–2 are the MVP's spine. 3–4 are what make it worth paying for. 5 is what makes it sellable to a company with a security review."));

// ── 11 ───────────────────────────────────────────────────────────────────────
body.push(H1("11. Risks, ranked honestly"));
[
  [{ t: "Entity-resolution accuracy on real data (highest). ", b: true }, { t: "The demo's credibility comes from pre-curated suppliers. If auto-match on a real list is poor, the human-review burden may exceed what a customer will tolerate. Mitigate: spike this first (§12)." }],
  [{ t: "Enrichment coverage for private companies. ", b: true }, { t: "Most industrial suppliers are private — not SEC filers, and frequently without an LEI. The demo conceals this because Meridian's suppliers are mostly real public companies (§4), so EDGAR looks near-universal when it isn't. Positioning risk as much as technical." }],
  [{ t: "lookup-supplier fabrication. ", b: true }, { t: "Must be removed before any real customer sees it. It generates plausible fake financials about real companies." }],
  [{ t: "Reverting to dual client mode. ", b: true }, { t: "A second design partner in another geography makes it tempting to re-add the mode you dropped (§1.1) — which means a second resolver path, a second fixture set, and compliance branching, all before the first path is proven. Treat a second geography as a post-MVP decision with its own estimate, not a configuration flag." }],
  [{ t: "Unbounded AI cost. ", b: true }, { t: "Sub-tier discovery and chat are the only metered dependency; no caps today." }],
  [{ t: "Data licensing. ", b: true }, { t: "If you later add D&B/Everstream-class data, redistribution terms constrain what you can surface and export." }],
  [{ t: "GDPR — deferred, not dismissed. ", b: true }, { t: "On the US path (§1.1) this is not a launch blocker, and CCPA/CPRA applies lightly to B2B contact data. It becomes a blocker the moment you take a European customer or store EU supplier contacts, so keep the schema deletion-friendly now (cascade paths, no personal data inside append-only snapshots) to avoid a painful retrofit later." }],
].forEach((r) => body.push(NUM(r)));

// ── 12 ───────────────────────────────────────────────────────────────────────
body.push(H1("12. What I'd do first — a one-week de-risking spike"));
body.push(P("Before writing any schema, resolve risk #1:"));
body.push(
  NUM([
    { t: "Get a real " }, { t: "US", b: true },
    { t: " supplier list from a design partner (or assemble a realistic 300-row set). Weight it the way a real one is: " },
    { t: "mostly private", b: true },
    { t: " — machine shops, distributors, regional fabricators — with messy names (abbreviations, punctuation, DBA/division suffixes). Do not test against a public-company-heavy mix like the demo's; that yields a flattering and useless match rate." },
  ])
);
body.push(
  NUM([
    { t: "Build the resolver as a " }, { t: "standalone script", b: true },
    { t: " — no UI, no DB. Normalize → SEC + GLEIF → score → emit a match-rate distribution by confidence band, " },
    { t: "split by public vs private", b: true }, { t: ". The private-only number is the one that matters." },
  ])
);
body.push(
  NUM([
    { t: "Decision gate: ", b: true },
    { t: "if auto-match at ≥0.92 lands below ~60% on realistic data, the product needs more human-in-the-loop design (or paid data) before you build the surrounding app — not after." },
  ])
);
body.push(
  CALLOUT(
    [
      { t: "Everything else in this plan is conventional engineering with known cost. ", b: true },
      { t: "This is the one place the answer is genuinely unknown, so it should be measured first and cheaply." },
    ],
    "EEF3FB",
    ACCENT
  )
);

// ── assemble ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: K.STYLES,
  numbering: K.NUMBERING,
  sections: [
    {
      properties: { page: K.PAGE },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Chain Verity — MVP Build Plan", size: 17, color: MUTED }),
                new TextRun({ text: "\tCONFIDENTIAL", size: 17, color: MUTED }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
              border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "DDE3EE", space: 4 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "plan @ 0fc9956 · codebase @ 131b1b3", font: "Consolas", size: 16, color: MUTED }),
                new TextRun({ text: "\t", size: 16 }),
                new TextRun({ children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES], size: 16, color: MUTED }),
              ],
              tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            }),
          ],
        }),
      },
      children: body,
    },
  ],
});

const out = path.resolve(__dirname, "../../Chain-Verity-MVP-Build-Plan.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
});
