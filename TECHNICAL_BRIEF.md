# Chain Verity — Technical Brief

Handoff document for an incoming CTO / technical lead.
Written against commit `131b1b3`. ~21,000 lines of TypeScript across 49 commits.

**Read this first:** Chain Verity today is a **high-fidelity demo, not a product.** The UI and the
external-data enrichment layer are real and working. There is no database, no real authentication,
and no per-user persistence. Section 4 lists exactly which surfaces are simulated. Nothing below
overstates what exists — please verify any claim that matters to you, and see §9 for the honest
liabilities.

---

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16.2.6** (App Router) | Not the Next.js most engineers know — see `AGENTS.md`; read `node_modules/next/dist/docs/` before assuming API shapes |
| UI | **React 19.2.4** | No component library. All styling is hand-written CSS with custom properties in `src/app/globals.css` |
| Language | TypeScript 5, strict | `npx tsc --noEmit` is clean |
| Styling | Tailwind 4 is installed but **effectively unused** — the app is token-based CSS | Legacy dependency; safe to remove |
| Charts / maps | `react-simple-maps` 3, hand-rolled SVG + Canvas | No charting library |
| AI | `@anthropic-ai/sdk` ^0.98 | Claude, via 5 API routes |
| Tests | Vitest 4 — **66 tests, 1 file** | Covers `src/lib/analytics.ts` only |
| Hosting | Vercel, aliased to `demo.chainverity.ai` | `vercel.json` pins framework + build only; **no Node version pinned** |

There is **no backend of our own** — no database, ORM, queue, or cache. Server-side code is entirely
Next.js route handlers proxying third-party APIs.

## 2. Code layout

```
src/
  app/
    api/            18 route handlers (1,849 LOC) — the only server-side code
    globals.css     design tokens + every component style (single stylesheet)
    page.tsx        mounts ChainVerityApp
  components/
    views/          19 view components (12,781 LOC) — the bulk of the codebase
    ui/             shared primitives: Card, Badge, Charts, InfoTip, ProvenanceChip (1,710)
    layout/         Sidebar, Topbar, Modal (291)
  context/          AppContext.tsx — single global store (384)
  lib/
    analytics.ts    scoring + derived metrics — the closest thing to proprietary IP
    data/           2,099 LOC of hardcoded fixture data
    roles.ts        route-level RBAC table
  types/            index.ts — all domain types (462)
middleware.ts       shared-password gate over the whole app
```

**Architectural fact worth knowing early:** `src/context/AppContext.tsx:154–165` is eleven lines of
`const platformX = clientMode === "wb" ? A : B`. Every view consumes data through `useApp()` /
`useSuppliers()`. That is the **single seam** between the UI and its data — replacing it with real
queries is a contained change, not a rewrite. This is the most important thing to know before
planning any backend work.

## 3. What is genuinely real

### 3.1 Live external data — 18 API routes

Keyless (no account, no cost, work anywhere):

| Route | Source | Purpose |
|---|---|---|
| `edgar` | SEC EDGAR | Real financials via XBRL `companyfacts` for US-listed suppliers |
| `gleif` | GLEIF | Legal-entity lookup; fuzzy name → LEI with a scoring cascade |
| `usgs` | USGS | Earthquakes, proximity-matched to supplier coordinates |
| `nws` | NOAA/NWS | Active US severe-weather alerts, polygon-matched to sites |
| `gdelt` | GDELT DOC 2.0 | News events (two modes: sector feed, and `?q=` per supplier) |
| `eonet` | NASA EONET | Natural-disaster events |
| `sanctions` | OpenSanctions | Screening |
| `worldbank` | World Bank | Country governance indicators |

Keyed (free tiers; all four keys are set in Vercel production):
`fred` (FRED commodity series + frankfurter.app FX), `companies-house` (UK registry),
`comtrade` (UN trade flows, with cached fallback), `weather` (OpenWeatherMap).

AI (Anthropic — the **only metered cost** in the system):
`chat`, `analyze-contract`, `discover-subtier`, `suggest-alternatives`, `lookup-supplier`.

Caching is per-route `export const revalidate = 900` (15 min). **Nothing is persisted** — every
figure is recomputed or refetched per request. Historical trends in the UI are synthesised from
current values, not stored history.

### 3.2 Proprietary logic — `src/lib/analytics.ts`

The only meaningfully defensible code. Pure functions, fully unit-tested (66 tests):
`computeRisk`, `calcDPS` (disruption probability), `computeAltmanZ`, `computeResiliency`,
`computeLeadTimeDrift`, `computeOnTime`, `runMC` (5,000-iteration Monte Carlo), `topDrivers`,
`getRec`. Currently runs **client-side against fixture data**; it is designed to be liftable to the
server unchanged.

### 3.3 Evidence provenance

Recent and load-bearing to the product thesis. `src/lib/data/provenance.ts` grades every supplier
`verified | corroborated | inferred | unenriched`, and the UI refuses to show scores or financials
for unenriched suppliers rather than inventing them. Surfaced via `ProvenanceChip` in the register,
supplier detail, sub-tier map, and the import review queue.

## 4. What is simulated — read before demoing

| Surface | Reality |
|---|---|
| **ERP write-back** (CFO/CPO Briefing) | `setTimeout` flips a badge QUEUED → SYNCED. No connector exists. |
| **Supplier Portal** (Assessments) | Static activity feed. No supplier-facing app, no auth for suppliers. |
| **Assessments** | Sending/reminding is `setTimeout`; no questionnaire is delivered. |
| **Import & Resolve** | Full UI + interactive review queue, but fixture rows. No CSV parser, no resolver. |
| **Alert delivery** (Alerts) | Email/Slack are rendered *previews*. Nothing is sent. |
| **Reports** | Generates HTML client-side; export is a stub download. |
| **Credit data** (FRISK, D&B, Moody's badges) | Fixture values. No licensed credit provider is connected. |
| **All supplier/contract/event data** | 2,099 LOC of hardcoded fixtures for two fictional companies (Meridian Industrial, US; Worcester Bosch, EU). Per mode: 8 richly-modelled "governed" suppliers + 46 thinner records. |
| **Trend history** | Synthesised, e.g. `dps * 0.6, dps * 0.75, …`. |

**Commercial risk:** a buyer shown the ERP write-back or supplier portal will reasonably believe
they are live. That mismatch surfaces during implementation as churn and, in a signed contract, as
a misrepresentation problem. Label simulated surfaces or be explicit verbally.

## 5. Auth, tenancy, security

**There is effectively none.** Be blunt about this with any prospect who asks.

- `middleware.ts` gates the whole app on a single shared `DEMO_PASSWORD`, and the auth cookie's
  value **is the password itself** (`res.cookies.set("cv_auth", PASSWORD)`). Anyone with the cookie
  has the password.
- No user accounts, sessions, or organizations. No multi-tenancy of any kind.
- **Roles are client-side only.** `src/lib/roles.ts` maps role → permitted routes, enforced in the
  React tree. Switching role is a dropdown; there is no server-side check. Trivially bypassed.
- All user state is `localStorage`, 7 keys (`cv_role`, `cv_custom_suppliers`,
  `cv_archived_suppliers`, `cv_supplier_notes`, `cv_contract_contacts`, `cv_risk_appetite`,
  `cv_dark_mode`). Per-browser, lost on clear, invisible to any other device.
- No audit log, rate limiting, error tracking, or AI spend cap.

**Do not put real customer data in this system as it stands.**

## 6. Running it

```bash
npm install
npm run dev        # localhost:3000 — no keys needed; keyless feeds work, AI features 500
npm test           # 66 tests
npx tsc --noEmit   # typecheck
npm run build      # production build
```

Env vars (all optional except Anthropic for AI features): `ANTHROPIC_API_KEY`, `FRED_API_KEY`,
`COMPANIES_HOUSE_API_KEY`, `COMTRADE_API_KEY`, `OPENWEATHERMAP_API_KEY`, `DEMO_PASSWORD`.

Deploy: `npx vercel@latest deploy --prod --yes`. A `npm run ship` script exists that force-commits
and deploys in one step — **I would delete it**; it encourages unreviewed pushes to production.

## 7. Two client modes

The app ships two parallel datasets — Meridian Industrial (US, USD, UFLPA) and Worcester Bosch (EU,
GBP, CSDDD/EUDR) — switched by the `?client=wb` query param and branched through the eleven
ternaries in §2. **Everything exists twice**: fixtures, currency handling, compliance framing, and
the relevant enrichment sources. `MVP_PLAN.md` argues for dropping the EU path from the shipping
product and keeping it only as a demo seed; that decision is not yet reflected in the code.

## 8. Code-quality notes

**Good:** strict TS with a clean typecheck; consistent token-based CSS; small pure-function core with
real tests; API routes uniformly defensive (retries, graceful degradation, no unhandled throws);
domain types centralised.

**Weak:**
- **View components are very large.** 12,781 LOC across 19 files; `SupplierDetail/index.tsx` is 1,588
  lines with five tabs inline, `Dashboard.tsx` 802, `SubTierIntelligence.tsx` 746. Extraction is the
  obvious first refactor.
- **Styling is entirely inline `style={{}}`** in views, with `globals.css` for shared classes. No CSS
  modules, no variants. Visually consistent because tokens are used, but verbose.
- **Test coverage is one file.** No component, route-handler, or integration tests.
- **No error boundaries**; a throw in a view blanks the app.
- **Fixture data is hand-maintained TypeScript** — adding a supplier means editing a literal.
- One pre-existing lint error (`as any` in `Suppliers/GovernedView.tsx:300`) and a few unused-var
  warnings.
- No `engines` pin in `package.json`; built on Node 24.

## 9. Liabilities I would fix first

1. **`/api/lookup-supplier` fabricates data.** Its prompt asks Claude for "realistic supplier profile
   data … or plausible estimates if not," and it invents DUNS numbers, spend, and FRISK scores.
   Harmless while every company is fictional; in production it silently manufactures
   plausible-looking financials about **real** companies. Delete it before any real customer sees the
   product.
2. **Auth.** The cookie-is-the-password design and client-only RBAC must both go before real data.
3. **Unbounded AI spend.** Five Claude routes, no caps, no per-tenant metering.
4. **NewsAPI was retired** (its free tier is non-commercial) in favour of GDELT — worth checking
   remaining third-party terms if you add licensed sources.

## 10. Path to a product

`MVP_PLAN.md` (uncommitted, in repo root) is the detailed plan. Summary: Postgres + Drizzle, real
auth with organizations, CSV ingestion with an **entity-resolution** layer, persisted enrichment and
versioned scoring, cron-driven feeds, real alert delivery. Estimated **4–5 months for one strong
full-stack engineer**, or 2.5–3 months with two; a design-partner-usable slice lands at roughly 60%
of that.

**The single largest unknown is entity resolution.** The demo is convincing because its 50 suppliers
are hand-curated and pre-matched to registry records. A real customer uploads 800 messy names, mostly
private companies with no SEC filing and no LEI. Enrichment accuracy — and therefore trust in every
downstream score — depends entirely on that matching layer, which does not exist yet. The plan's §12
recommends measuring auto-match rate against a **private-weighted** sample before building anything
else. If that number lands near 20% rather than 50%, the review queue becomes the product and needs a
different design.

---

## Appendix — routes

**Views (21 routes):** `dashboard`, `cfo`, `cpo`, `alerts`, `events`, `crisis`, `suppliers`,
`supplier`, `import`, `network`, `subtier`, `geomap`, `contracts`, `analytics`, `esg`, `recovery`,
`commodities`, `assessments`, `reports`, `admin`, `settings`.

**Role → route access** is defined in `src/lib/roles.ts` (CFO / Procurement / Analyst). Client-side
only — see §5.
