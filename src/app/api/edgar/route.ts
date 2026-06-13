import { NextRequest } from "next/server";

// SEC EDGAR XBRL API — no key required, but User-Agent is mandatory
const UA = "ChainVerity supply-chain-intelligence demo@chainverity.ai";

type Entry = { val: number; end: string; start?: string; filed: string; form: string };

// ── helpers ──────────────────────────────────────────────────────────────────

function ql(end: string) {
  const d = new Date(end);
  return `Q${Math.ceil((d.getMonth() + 1) / 3)} '${String(d.getFullYear()).slice(2)}`;
}

function dedup(arr: Entry[]): Map<string, Entry> {
  const m = new Map<string, Entry>();
  for (const v of arr) {
    if (!["10-Q", "10-K", "20-F"].includes(v.form)) continue;
    const prev = m.get(v.end);
    if (!prev || new Date(v.filed) > new Date(prev.filed)) m.set(v.end, v);
  }
  return m;
}

function dedupQ(arr: Entry[]): Map<string, Entry> {
  return dedup(
    arr.filter((v) => {
      if (!v.start) return false;
      const d = (new Date(v.end).getTime() - new Date(v.start).getTime()) / 86400000;
      return d >= 75 && d <= 110;
    })
  );
}

function lastN<T>(m: Map<string, T>, n: number): [string, T][] {
  return Array.from(m.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(-n);
}

function best(m: Map<string, Entry> | null): Entry | null {
  if (!m?.size) return null;
  return lastN(m, 1)[0]?.[1] ?? null;
}

// Fetch a single XBRL concept for one company — much smaller than full companyfacts
async function fetchConcept(cik: string, tag: string, signal: AbortSignal): Promise<Entry[] | null> {
  try {
    const res = await fetch(
      `https://data.sec.gov/api/xbrl/companyconcept/CIK${cik}/us-gaap/${tag}.json`,
      { headers: { "User-Agent": UA }, signal }
    );
    if (!res.ok) return null;
    const d = await res.json();
    return (d.units?.USD ?? null) as Entry[] | null;
  } catch {
    return null;
  }
}

// Try multiple concept tags in parallel, use first successful
async function fetchFirst(cik: string, signal: AbortSignal, ...tags: string[]): Promise<Entry[] | null> {
  const results = await Promise.all(tags.map((t) => fetchConcept(cik, t, signal)));
  return results.find((r) => r && r.length > 0) ?? null;
}

// ── route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Strip non-alphanumeric (MOG.A → MOGA for lookup)
  const raw = req.nextUrl.searchParams.get("ticker") ?? "";
  const ticker = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!ticker) return Response.json({ error: "ticker required" }, { status: 400 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);

  try {
    // ── 1. Resolve ticker → CIK ─────────────────────────────────
    const tRes = await fetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": UA },
      signal: ctrl.signal,
      next: { revalidate: 3600 },
    });
    if (!tRes.ok) throw new Error("ticker list unavailable");

    const tMap: Record<string, { cik_str: number; ticker: string; title: string }> = await tRes.json();
    const entry = Object.values(tMap).find(
      (v) => v.ticker.toUpperCase().replace(/[^A-Z0-9]/g, "") === ticker
    );
    if (!entry) return Response.json({ error: `${raw} not in EDGAR` }, { status: 404 });

    const cik = String(entry.cik_str).padStart(10, "0");
    const entityName = entry.title;

    // ── 2. Fetch all needed concepts in parallel ──────────────────
    const [
      assetsCurr, liabsCurr,
      ltd, equity,
      netIncome, revenue,
      ocf,
      opIncome, dna,
    ] = await Promise.all([
      fetchFirst(cik, ctrl.signal, "AssetsCurrent"),
      fetchFirst(cik, ctrl.signal, "LiabilitiesCurrent"),
      fetchFirst(cik, ctrl.signal, "LongTermDebt", "LongTermDebtNoncurrent"),
      fetchFirst(cik, ctrl.signal, "StockholdersEquity", "StockholdersEquityAttributableToParent"),
      fetchFirst(cik, ctrl.signal, "NetIncomeLoss", "ProfitLoss"),
      fetchFirst(cik, ctrl.signal, "Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax", "SalesRevenueNet"),
      fetchFirst(cik, ctrl.signal, "NetCashProvidedByUsedInOperatingActivities"),
      fetchFirst(cik, ctrl.signal, "OperatingIncomeLoss"),
      fetchFirst(cik, ctrl.signal, "DepreciationDepletionAndAmortization", "DepreciationAndAmortization"),
    ]);

    // ── 3. Latest ratio values ────────────────────────────────────
    const aMap  = assetsCurr ? dedup(assetsCurr) : null;
    const lMap  = liabsCurr  ? dedup(liabsCurr)  : null;
    const dMap  = ltd        ? dedup(ltd)         : null;
    const eMap  = equity     ? dedup(equity)      : null;
    const niMap = netIncome  ? dedup(netIncome)   : null;
    const rMap  = revenue    ? dedup(revenue)     : null;
    const ocfMap = ocf       ? dedup(ocf)         : null;
    const oiMap  = opIncome  ? dedup(opIncome)    : null;
    const dnaMap = dna       ? dedup(dna)         : null;

    const aLast  = best(aMap);
    const lLast  = best(lMap);
    const dLast  = best(dMap);
    const eLast  = best(eMap);
    const niLast = best(niMap);
    const rLast  = best(rMap);
    const ocfLast = best(ocfMap);
    const oiLast  = best(oiMap);
    const dnaLast = best(dnaMap);

    const currentRatio    = aLast && lLast && lLast.val ? +(aLast.val / lLast.val).toFixed(2) : null;
    const debtToEquity    = dLast != null && eLast?.val ? +(dLast.val / eLast.val).toFixed(2) : null;
    const netProfitMargin = niLast != null && rLast?.val ? +(niLast.val / rLast.val).toFixed(4) : null;
    const operatingCashFlowM = ocfLast ? +(ocfLast.val / 1e6).toFixed(1) : null;
    const ebitdaM = oiLast && dnaLast ? +((oiLast.val + dnaLast.val) / 1e6).toFixed(1) : null;

    const filingDate = aLast?.end ?? eLast?.end ?? null;
    const filingForm = aLast?.form ?? "10-Q";

    // ── 4. Trend series (5 quarters) ─────────────────────────────

    // Current Ratio: pair matching end-dates
    const crTrend = lastN(aMap ?? new Map(), 5)
      .flatMap(([end, av]) => {
        const lv = lMap?.get(end);
        return lv && lv.val ? [{ label: ql(end), value: +(av.val / lv.val).toFixed(2) }] : [];
      });

    // D/E: pair matching end-dates
    const deTrend = lastN(dMap ?? new Map(), 5)
      .flatMap(([end, dv]) => {
        const ev = eMap?.get(end);
        return ev && ev.val ? [{ label: ql(end), value: +(dv.val / ev.val).toFixed(2) }] : [];
      });

    // Net Margin: prefer quarterly income / quarterly revenue
    const niQ  = netIncome ? dedupQ(netIncome) : new Map<string, Entry>();
    const revQ = revenue   ? dedupQ(revenue)   : new Map<string, Entry>();
    const pmTrend = lastN(revQ, 5)
      .flatMap(([end, rv]) => {
        const nv = niQ.get(end);
        return nv && rv.val ? [{ label: ql(end), value: +((nv.val / rv.val) * 100).toFixed(2) }] : [];
      });

    // OCF: quarterly
    const ocfQ = ocf ? dedupQ(ocf) : new Map<string, Entry>();
    const ocfTrend = lastN(ocfQ, 5).map(([end, v]) => ({ label: ql(end), value: +(v.val / 1e6).toFixed(1) }));

    // EBITDA: quarterly OpIncome + quarterly D&A at matching dates
    const oiQ  = opIncome ? dedupQ(opIncome) : new Map<string, Entry>();
    const dnaQ = dna      ? dedupQ(dna)      : new Map<string, Entry>();
    const ebTrend = lastN(oiQ, 5).map(([end, ov]) => {
      const dv = dnaQ.get(end);
      return { label: ql(end), value: +((ov.val + (dv?.val ?? 0)) / 1e6).toFixed(1) };
    });

    clearTimeout(timer);
    return Response.json(
      {
        entityName,
        cik: String(entry.cik_str),
        filingDate,
        filingForm,
        ratios: { currentRatio, debtToEquity, netProfitMargin, operatingCashFlowM, ebitdaM },
        trends: {
          currentRatio: crTrend,
          debtToEquity: deTrend,
          netProfitMargin: pmTrend,
          operatingCashFlow: ocfTrend,
          ebitda: ebTrend,
        },
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("AbortError")) {
      return Response.json({ error: "EDGAR timeout" }, { status: 504 });
    }
    return Response.json({ error: msg }, { status: 502 });
  }
}
