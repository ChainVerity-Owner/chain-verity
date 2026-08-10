// Generates Chain-Verity-Technical-Brief.docx from the content below.
// Source of truth for the prose is TECHNICAL_BRIEF.md — keep them in step.
// Run:  npm i docx  (or NODE_PATH=<dir with docx>)  then  node docs/generate/build-brief.js

const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber,
  TabStopType, TabStopPosition, BorderStyle,
} = require("docx");
const K = require("./docx-kit");

const { H1, H2, P, BULLET, NUM, GAP, CODE, CALLOUT, TABLE, INK, MUTED, ACCENT, RISK, OK } = K;

const body = [];

// ── Title ────────────────────────────────────────────────────────────────────
body.push(
  new Paragraph({ children: [new TextRun({ text: "CHAIN VERITY", bold: true, size: 20, color: ACCENT })], spacing: { after: 60 } }),
  new Paragraph({ children: [new TextRun({ text: "Technical Brief", bold: true, size: 52, color: INK })], spacing: { after: 100 } }),
  new Paragraph({ children: [new TextRun({ text: "Handoff document for an incoming CTO / technical lead", size: 24, color: MUTED })], spacing: { after: 40 } }),
  new Paragraph({
    children: [
      new TextRun({ text: "Written against commit ", size: 20, color: MUTED }),
      new TextRun({ text: "131b1b3", font: "Consolas", size: 19, color: MUTED }),
      new TextRun({ text: "  ·  ~21,000 lines of TypeScript  ·  49 commits", size: 20, color: MUTED }),
    ],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
    spacing: { after: 260 },
  })
);

body.push(
  CALLOUT([
    { t: "Read this first. ", b: true },
    { t: "Chain Verity today is a high-fidelity demo, not a product. The UI and the external-data enrichment layer are real and working. There is no database, no real authentication, and no per-user persistence. Section 4 lists exactly which surfaces are simulated. Nothing in this document overstates what exists — please verify any claim that matters to you, and see Section 9 for the honest liabilities." },
  ])
);

// ── 1 ────────────────────────────────────────────────────────────────────────
body.push(H1("1. Stack"));
body.push(
  TABLE(
    ["Layer", "Choice", "Notes"],
    [
      ["Framework", { t: "Next.js 16.2.6 (App Router)", b: true }, "Not the Next.js most engineers know — see AGENTS.md; read node_modules/next/dist/docs/ before assuming API shapes"],
      ["UI", { t: "React 19.2.4", b: true }, "No component library. All styling is hand-written CSS with custom properties in src/app/globals.css"],
      ["Language", "TypeScript 5, strict", "npx tsc --noEmit is clean"],
      ["Styling", "Tailwind 4 installed but effectively unused", "Verified: the app is token-based CSS. Legacy dependency, safe to remove"],
      ["Charts / maps", "react-simple-maps 3, hand-rolled SVG + Canvas", "No charting library"],
      ["AI", "@anthropic-ai/sdk ^0.98", "Claude, via 5 API routes"],
      ["Tests", { t: "Vitest 4 — 66 tests, 1 file", b: true }, "Covers src/lib/analytics.ts only"],
      ["Hosting", "Vercel → demo.chainverity.ai", "vercel.json pins framework + build only; no Node version pinned"],
    ],
    [1500, 3100, 4760]
  )
);
body.push(GAP(160));
body.push(P([{ t: "There is no backend of our own", b: true }, { t: " — no database, ORM, queue, or cache. Server-side code is entirely Next.js route handlers proxying third-party APIs." }]));

// ── 2 ────────────────────────────────────────────────────────────────────────
body.push(H1("2. Code layout"));
body.push(
  ...CODE([
    "src/",
    "  app/",
    "    api/            18 route handlers (1,849 LOC) — the only server-side code",
    "    globals.css     design tokens + every component style (single stylesheet)",
    "    page.tsx        mounts ChainVerityApp",
    "  components/",
    "    views/          19 view components (12,781 LOC) — the bulk of the codebase",
    "    ui/             shared primitives: Card, Badge, Charts, InfoTip, ProvenanceChip (1,710)",
    "    layout/         Sidebar, Topbar, Modal (291)",
    "  context/          AppContext.tsx — single global store (384)",
    "  lib/",
    "    analytics.ts    scoring + derived metrics — the closest thing to proprietary IP",
    "    data/           2,099 LOC of hardcoded fixture data",
    "    roles.ts        route-level RBAC table",
    "  types/            index.ts — all domain types (462)",
    "middleware.ts       shared-password gate over the whole app",
  ], 18)
);
body.push(
  P([
    { t: "Architectural fact worth knowing early: ", b: true },
    { t: "AppContext.tsx:154–165", mono: true },
    { t: " is eleven lines of clientMode ternaries. Every view consumes data through useApp() / useSuppliers(). That is the single seam between the UI and its data — replacing it with real queries is a contained change, not a rewrite. This is the most important thing to know before planning any backend work." },
  ])
);

// ── 3 ────────────────────────────────────────────────────────────────────────
body.push(H1("3. What is genuinely real"));
body.push(H2("3.1  Live external data — 18 API routes"));
body.push(P("Keyless — no account, no cost, work anywhere:"));
body.push(
  TABLE(
    ["Route", "Source", "Purpose"],
    [
      [{ t: "edgar", mono: true }, "SEC EDGAR", "Real financials via XBRL companyfacts for US-listed suppliers"],
      [{ t: "gleif", mono: true }, "GLEIF", "Legal-entity lookup; fuzzy name → LEI with a scoring cascade"],
      [{ t: "usgs", mono: true }, "USGS", "Earthquakes, proximity-matched to supplier coordinates"],
      [{ t: "nws", mono: true }, "NOAA / NWS", "Active US severe-weather alerts, polygon-matched to sites"],
      [{ t: "gdelt", mono: true }, "GDELT DOC 2.0", "News events — sector feed plus ?q= per supplier"],
      [{ t: "eonet", mono: true }, "NASA EONET", "Natural-disaster events"],
      [{ t: "sanctions", mono: true }, "OpenSanctions", "Screening"],
      [{ t: "worldbank", mono: true }, "World Bank", "Country governance indicators"],
    ],
    [1500, 2100, 5760]
  )
);
body.push(GAP(160));
body.push(
  P([
    { t: "Keyed (free tiers; all four keys set in Vercel production): " },
    { t: "fred", mono: true }, { t: " (FRED commodity series + frankfurter.app FX), " },
    { t: "companies-house", mono: true }, { t: ", " }, { t: "comtrade", mono: true },
    { t: " (with cached fallback), " }, { t: "weather", mono: true }, { t: "." },
  ])
);
body.push(
  P([
    { t: "AI (Anthropic — the only metered cost in the system): ", b: true },
    { t: "chat", mono: true }, { t: ", " }, { t: "analyze-contract", mono: true }, { t: ", " },
    { t: "discover-subtier", mono: true }, { t: ", " }, { t: "suggest-alternatives", mono: true },
    { t: ", " }, { t: "lookup-supplier", mono: true }, { t: "." },
  ])
);
body.push(
  P([
    { t: "Caching is per-route " }, { t: "export const revalidate = 900", mono: true },
    { t: " (15 min). " }, { t: "Nothing is persisted", b: true },
    { t: " — every figure is recomputed or refetched per request. Historical trends in the UI are synthesised from current values, not stored history." },
  ])
);

body.push(H2("3.2  Proprietary logic — src/lib/analytics.ts"));
body.push(
  P([
    { t: "The only meaningfully defensible code. Pure functions, fully unit-tested (66 tests): " },
    { t: "computeRisk", mono: true }, { t: ", " }, { t: "calcDPS", mono: true },
    { t: " (disruption probability), " }, { t: "computeAltmanZ", mono: true }, { t: ", " },
    { t: "computeResiliency", mono: true }, { t: ", " }, { t: "computeLeadTimeDrift", mono: true },
    { t: ", " }, { t: "computeOnTime", mono: true }, { t: ", " }, { t: "runMC", mono: true },
    { t: " (5,000-iteration Monte Carlo), " }, { t: "topDrivers", mono: true }, { t: ", " },
    { t: "getRec", mono: true },
    { t: ". Currently runs client-side against fixture data; designed to be liftable to the server unchanged." },
  ])
);

body.push(H2("3.3  Evidence provenance"));
body.push(
  P([
    { t: "Recent and load-bearing to the product thesis. " }, { t: "src/lib/data/provenance.ts", mono: true },
    { t: " grades every supplier verified / corroborated / inferred / unenriched, and the UI refuses to show scores or financials for unenriched suppliers rather than inventing them. Surfaced via ProvenanceChip in the register, supplier detail, sub-tier map, and the import review queue." },
  ])
);

// ── 4 ────────────────────────────────────────────────────────────────────────
body.push(H1("4. What is simulated — read before demoing"));
body.push(
  TABLE(
    ["Surface", "Reality"],
    [
      [{ t: "ERP write-back (CFO/CPO Briefing)", b: true }, "setTimeout flips a badge QUEUED → SYNCED. No connector exists."],
      [{ t: "Supplier Portal (Assessments)", b: true }, "Static activity feed. No supplier-facing app, no auth for suppliers."],
      [{ t: "Assessments", b: true }, "Sending / reminding is setTimeout; no questionnaire is delivered."],
      [{ t: "Import & Resolve", b: true }, "Full UI + interactive review queue, but fixture rows. No CSV parser, no resolver."],
      [{ t: "Alert delivery (Alerts)", b: true }, "Email / Slack are rendered previews. Nothing is sent."],
      [{ t: "Reports", b: true }, "Generates HTML client-side; export is a stub download."],
      [{ t: "Credit data (FRISK, D&B, Moody's badges)", b: true }, "Fixture values. No licensed credit provider is connected."],
      [{ t: "All supplier / contract / event data", b: true }, "2,099 LOC of hardcoded fixtures for two fictional companies. Per mode: 8 richly-modelled 'governed' suppliers + 46 thinner records."],
      [{ t: "Trend history", b: true }, "Synthesised, e.g. dps * 0.6, dps * 0.75, …"],
    ],
    [3200, 6160]
  )
);
body.push(GAP(160));
body.push(
  CALLOUT(
    [
      { t: "Commercial risk. ", b: true },
      { t: "A buyer shown the ERP write-back or supplier portal will reasonably believe they are live. That mismatch surfaces during implementation as churn and, in a signed contract, as a misrepresentation problem. Label simulated surfaces, or be explicit verbally." },
    ],
    "FFF8E8",
    K.WARN
  )
);

// ── 5 ────────────────────────────────────────────────────────────────────────
body.push(H1("5. Auth, tenancy, security"));
body.push(P([{ t: "There is effectively none. ", b: true }, { t: "Be blunt about this with any prospect who asks." }]));
body.push(
  BULLET([
    { t: "middleware.ts", mono: true }, { t: " gates the whole app on a single shared " },
    { t: "DEMO_PASSWORD", mono: true }, { t: ", and the auth cookie's value " },
    { t: "is the password itself", b: true }, { t: " (" },
    { t: 'cookies.set("cv_auth", PASSWORD)', mono: true },
    { t: "). Anyone with the cookie has the password." },
  ])
);
body.push(BULLET("No user accounts, sessions, or organizations. No multi-tenancy of any kind."));
body.push(
  BULLET([
    { t: "Roles are client-side only. ", b: true }, { t: "src/lib/roles.ts", mono: true },
    { t: " maps role → permitted routes, enforced in the React tree. Switching role is a dropdown; there is no server-side check. Trivially bypassed." },
  ])
);
body.push(
  BULLET([
    { t: "All user state is localStorage, 7 keys (" },
    { t: "cv_role, cv_custom_suppliers, cv_archived_suppliers, cv_supplier_notes, cv_contract_contacts, cv_risk_appetite, cv_dark_mode", mono: true },
    { t: "). Per-browser, lost on clear, invisible to any other device." },
  ])
);
body.push(BULLET("No audit log, rate limiting, error tracking, or AI spend cap."));
body.push(P([{ t: "Do not put real customer data in this system as it stands.", b: true, color: RISK }], { after: 200 }));

// ── 6 ────────────────────────────────────────────────────────────────────────
body.push(H1("6. Running it"));
body.push(
  ...CODE([
    "npm install",
    "npm run dev        # localhost:3000 — no keys needed; keyless feeds work, AI features 500",
    "npm test           # 66 tests",
    "npx tsc --noEmit   # typecheck",
    "npm run build      # production build",
  ])
);
body.push(
  P([
    { t: "Env vars (all optional except Anthropic for AI features): " },
    { t: "ANTHROPIC_API_KEY, FRED_API_KEY, COMPANIES_HOUSE_API_KEY, COMTRADE_API_KEY, OPENWEATHERMAP_API_KEY, DEMO_PASSWORD", mono: true },
    { t: "." },
  ])
);
body.push(
  P([
    { t: "Deploy: " }, { t: "npx vercel@latest deploy --prod --yes", mono: true },
    { t: ". A " }, { t: "npm run ship", mono: true },
    { t: " script exists that force-commits and deploys in one step — " },
    { t: "I would delete it", b: true }, { t: "; it encourages unreviewed pushes to production." },
  ])
);

// ── 7 ────────────────────────────────────────────────────────────────────────
body.push(H1("7. Two client modes"));
body.push(
  P([
    { t: "The app ships two parallel datasets — Meridian Industrial (US, USD, UFLPA) and Worcester Bosch (EU, GBP, CSDDD/EUDR) — switched by the " },
    { t: "?client=wb", mono: true },
    { t: " query param and branched through the eleven ternaries in Section 2. " },
    { t: "Everything exists twice", b: true },
    { t: ": fixtures, currency handling, compliance framing, and the relevant enrichment sources. " },
    { t: "MVP_PLAN.md", mono: true },
    { t: " argues for dropping the EU path from the shipping product and keeping it only as a demo seed; that decision is not yet reflected in the code." },
  ])
);

// ── 8 ────────────────────────────────────────────────────────────────────────
body.push(H1("8. Code-quality notes"));
body.push(P([{ t: "Good.", b: true, color: OK }, { t: " Strict TS with a clean typecheck; consistent token-based CSS; a small pure-function core with real tests; API routes uniformly defensive (retries, graceful degradation, no unhandled throws); domain types centralised." }]));
body.push(P([{ t: "Weak.", b: true, color: RISK }]));
body.push(
  BULLET([
    { t: "View components are very large. ", b: true }, { t: "12,781 LOC across 19 files; " },
    { t: "SupplierDetail/index.tsx", mono: true }, { t: " is 1,588 lines with five tabs inline, " },
    { t: "Dashboard.tsx", mono: true }, { t: " 802, " }, { t: "SubTierIntelligence.tsx", mono: true },
    { t: " 746. Extraction is the obvious first refactor." },
  ])
);
body.push(BULLET([{ t: "Styling is entirely inline " }, { t: "style={{}}", mono: true }, { t: " in views, with globals.css for shared classes. No CSS modules, no variants. Visually consistent because tokens are used, but verbose." }]));
body.push(BULLET([{ t: "Test coverage is one file. ", b: true }, { t: "No component, route-handler, or integration tests." }]));
body.push(BULLET([{ t: "No error boundaries", b: true }, { t: "; a throw in a view blanks the app." }]));
body.push(BULLET("Fixture data is hand-maintained TypeScript — adding a supplier means editing a literal."));
body.push(BULLET([{ t: "One pre-existing lint error (" }, { t: "as any", mono: true }, { t: " in " }, { t: "Suppliers/GovernedView.tsx:300", mono: true }, { t: ") and a few unused-var warnings." }]));
body.push(BULLET([{ t: "No " }, { t: "engines", mono: true }, { t: " pin in package.json; built on Node 24." }]));

// ── 9 ────────────────────────────────────────────────────────────────────────
body.push(H1("9. Liabilities I would fix first"));
body.push(
  NUM([
    { t: "/api/lookup-supplier fabricates data. ", b: true },
    { t: "Its prompt asks Claude for “realistic supplier profile data … or plausible estimates if not,” and it invents DUNS numbers, spend, and FRISK scores. Harmless while every company is fictional; in production it silently manufactures plausible-looking financials about " },
    { t: "real", b: true }, { t: " companies. Delete it before any real customer sees the product." },
  ])
);
body.push(NUM([{ t: "Auth. ", b: true }, { t: "The cookie-is-the-password design and client-only RBAC must both go before real data." }]));
body.push(NUM([{ t: "Unbounded AI spend. ", b: true }, { t: "Five Claude routes, no caps, no per-tenant metering." }]));
body.push(NUM([{ t: "NewsAPI was retired ", b: true }, { t: "(its free tier is non-commercial) in favour of GDELT — worth checking remaining third-party terms if you add licensed sources." }]));

// ── 10 ───────────────────────────────────────────────────────────────────────
body.push(H1("10. Path to a product"));
body.push(
  P([
    { t: "MVP_PLAN.md", mono: true },
    { t: " (in repo root) is the detailed plan. Summary: Postgres + Drizzle, real auth with organizations, CSV ingestion with an " },
    { t: "entity-resolution", b: true },
    { t: " layer, persisted enrichment and versioned scoring, cron-driven feeds, real alert delivery. Estimated " },
    { t: "4–5 months for one strong full-stack engineer", b: true },
    { t: ", or 2.5–3 months with two; a design-partner-usable slice lands at roughly 60% of that." },
  ])
);
body.push(
  CALLOUT(
    [
      { t: "The single largest unknown is entity resolution. ", b: true },
      { t: "The demo is convincing because its 50 suppliers are hand-curated and pre-matched to registry records. A real customer uploads 800 messy names, mostly private companies with no SEC filing and no LEI. Enrichment accuracy — and therefore trust in every downstream score — depends entirely on that matching layer, which does not exist yet. The plan's Section 12 recommends measuring auto-match rate against a private-weighted sample before building anything else. If that number lands near 20% rather than 50%, the review queue becomes the product and needs a different design." },
    ],
    "EEF3FB",
    ACCENT
  )
);

// ── Appendix ─────────────────────────────────────────────────────────────────
body.push(H1("Appendix — routes"));
body.push(
  P([
    { t: "Views (21 routes): ", b: true },
    { t: "dashboard, cfo, cpo, alerts, events, crisis, suppliers, supplier, import, network, subtier, geomap, contracts, analytics, esg, recovery, commodities, assessments, reports, admin, settings", mono: true },
    { t: "." },
  ])
);
body.push(
  P([
    { t: "Role → route access", b: true }, { t: " is defined in " },
    { t: "src/lib/roles.ts", mono: true },
    { t: " (CFO / Procurement / Analyst). Client-side only — see Section 5." },
  ])
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
                new TextRun({ text: "Chain Verity — Technical Brief", size: 17, color: MUTED }),
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
                new TextRun({ text: "commit 131b1b3", font: "Consolas", size: 16, color: MUTED }),
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

const out = path.resolve(__dirname, "../../Chain-Verity-Technical-Brief.docx");
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(out, buf);
  console.log("wrote", out, buf.length, "bytes");
});
