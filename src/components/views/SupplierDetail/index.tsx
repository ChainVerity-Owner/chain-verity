"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { buildCR, buildDE, buildPM, buildOCF, buildEB, calcDPS } from "@/lib/analytics";
import { getRec } from "@/lib/analytics";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Charts";
import { LineChart } from "@/components/ui/LineChart";
import { ActionCard } from "./ActionCard";
import { ContactCard } from "./ContactCard";
import { DPSCard } from "./DPSCard";
import { CreditRiskCard } from "./CreditRiskCard";
import { ResiliencyCard } from "./ResiliencyCard";
import { ESGCard } from "./ESGCard";
import { moneyM, fmt2, fmtPct, downloadStub, riskStateClass } from "@/lib/utils";
import { RECOVERY_PROFILES, DATA_FEEDS } from "@/lib/data";
import { InfoTip } from "@/components/ui/InfoTip";

interface SanctionsResult {
  match: boolean;
  topScore: number;
  results: { caption: string; score: number; datasets: string[] }[];
  screened: boolean;
  lists: string[];
}

interface CHResult {
  found: boolean;
  companyNumber?: string;
  companyName?: string;
  status?: string;
  incorporatedOn?: string;
  address?: string | null;
  accountsLastMadeUpTo?: string | null;
  accountsNextDue?: string | null;
  recentFilings?: { date: string; description: string; type: string }[];
  companiesHouseUrl?: string;
  noKey?: boolean;
  searched?: string[];
  note?: string;
  searchedAs?: string;
}

interface GLEIFResult {
  found: boolean;
  lei?: string;
  legalName?: string;
  status?: string;
  jurisdiction?: string;
  country?: string;
  city?: string;
  address?: string;
  registrationStatus?: string;
  nextRenewalDate?: string | null;
  ultimateParent?: { lei: string; legalName: string; country: string };
  gleifUrl?: string;
  error?: string;
}

interface WBResult {
  country: string;
  countryName: string;
  gdpGrowth: { value: number; year: string } | null;
  politicalStability: { raw: number; score: number; year: string } | null;
  regulatoryQuality: { raw: number; score: number; year: string } | null;
  govtEffectiveness: { raw: number; score: number; year: string } | null;
  tradeOpenness: { value: number; year: string } | null;
}

// ISO-2 country code lookup by supplier ID
const SUPPLIER_COUNTRY: Record<string, string> = {
  sit: "IT", ebm: "DE", aal: "NL", gru: "DK",
  dan: "DK", gfp: "CH", dbs: "DE", sen: "NL",
};

import type { AppRole } from "@/context/AppContext";

function SupplierNotes({
  supplierId, notes, onAdd, onDelete, role,
}: {
  supplierId: string;
  notes: { text: string; ts: string; author: string }[];
  onAdd: (id: string, text: string, author: string) => void;
  onDelete: (id: string, idx: number) => void;
  role: AppRole;
}) {
  const [draft, setDraft] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);
  const ROLE_NAMES: Record<AppRole, string> = { CFO: "Sarah Renwick", Procurement: "Marcus Delgado", Analyst: "Priya Nair" };

  return (
    <div className="card">
      <h2>Relationship Notes</h2>
      <div className="card-sub">Communication log, call records, and relationship context. Persisted locally.</div>

      {notes.length === 0 ? (
        <div className="muted" style={{ fontSize: 12, padding: "10px 0" }}>No notes yet. Add a call record or context note below.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0" }}>
          {notes.map((n, i) => (
            <div key={i} style={{ background: "var(--bg)", border: "1px solid var(--line)", borderLeft: "3px solid var(--accent)", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)" }}>{n.author}</span>
                  <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{n.ts}</span>
                </div>
                <button
                  onClick={() => onDelete(supplierId, i)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 14 }}
                  title="Delete note"
                >
                  ×
                </button>
              </div>
              <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{n.text}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10 }}>
        <textarea
          ref={textRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note — call records, negotiation context, relationship updates…"
          style={{
            width: "100%", minHeight: 72, padding: "8px 10px", fontSize: 13,
            border: "1px solid var(--line)", borderRadius: 8,
            background: "var(--surface)", color: "var(--fg)", resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <button
            className="btn primary"
            style={{ fontSize: 12 }}
            disabled={!draft.trim()}
            onClick={() => {
              if (draft.trim()) {
                onAdd(supplierId, draft.trim(), ROLE_NAMES[role]);
                setDraft("");
                textRef.current?.focus();
              }
            }}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}


export function SupplierDetail() {
  const { params, setSimulatedEscalation, simulatedEscalation, supplierNotes, addSupplierNote, deleteSupplierNote, role, currency, clientMode, platformProductLines } = useApp();
  const allSuppliers = useSuppliers();
  const s = allSuppliers.find((x) => x.id === params.id) || allSuppliers[0];
  const [obsNote, setObsNote] = useState({ text: "Risk cannot be closed manually. All approvals determine closure.", color: "var(--muted)" });

  // Sanctions check state
  const [sanctions, setSanctions] = useState<SanctionsResult | null>(null);
  const [sanctionsLoading, setSanctionsLoading] = useState(false);

  // Companies House state
  const [ch, setCH] = useState<CHResult | null>(null);
  const [chLoading, setChLoading] = useState(false);

  // GLEIF state
  const [gleif, setGleif] = useState<GLEIFResult | null>(null);
  const [gleifLoading, setGleifLoading] = useState(false);

  // World Bank state
  const [wb, setWB] = useState<WBResult | null>(null);
  const [wbLoading, setWBLoading] = useState(false);

  // News state
  interface NewsArticle { title: string; description: string | null; url: string; source: string; publishedAt: string; }
  const [news, setNews] = useState<NewsArticle[] | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsNoKey, setNewsNoKey] = useState(false);

  // Auto-fetch World Bank country risk on supplier change
  useEffect(() => {
    const code = s.countryCode;
    if (!code) return;
    setWB(null);
    setWBLoading(true);
    fetch(`/api/worldbank?country=${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WBResult | null) => setWB(data))
      .catch(() => setWB(null))
      .finally(() => setWBLoading(false));
  }, [s.id, s.countryCode]);

  // Auto-fetch news on supplier change
  useEffect(() => {
    setNews(null);
    setNewsNoKey(false);
    setNewsLoading(true);
    fetch(`/api/news?q=${encodeURIComponent(s.name)}`)
      .then(async (r) => {
        if (r.status === 503) { setNewsNoKey(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((data) => { if (data) setNews(data.articles ?? []); })
      .catch(() => setNews([]))
      .finally(() => setNewsLoading(false));
  }, [s.id, s.name]);

  const runSanctionsCheck = useCallback(async () => {
    setSanctionsLoading(true);
    setSanctions(null);
    try {
      const res = await fetch("/api/sanctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: s.name, country: s.region }),
      });
      if (!res.ok) throw new Error("Sanctions check failed");
      setSanctions(await res.json());
    } catch {
      setSanctions({ match: false, topScore: 0, results: [], screened: false, lists: [] });
    } finally {
      setSanctionsLoading(false);
    }
  }, [s.name, s.region]);

  const runCHLookup = useCallback(async () => {
    setChLoading(true);
    setCH(null);
    try {
      const res = await fetch(`/api/companies-house?name=${encodeURIComponent(s.name)}&id=${s.id}`);
      if (!res.ok) {
        const err = await res.json();
        setCH({ found: false, noKey: err.noKey });
        return;
      }
      setCH(await res.json());
    } catch {
      setCH({ found: false });
    } finally {
      setChLoading(false);
    }
  }, [s.name]);

  const runGLEIFLookup = useCallback(async () => {
    setGleifLoading(true);
    setGleif(null);
    try {
      const res = await fetch(`/api/gleif?name=${encodeURIComponent(s.name)}`);
      setGleif(res.ok ? await res.json() : { found: false });
    } catch {
      setGleif({ found: false });
    } finally {
      setGleifLoading(false);
    }
  }, [s.name]);

  const runWBLookup = useCallback(async () => {
    const code = SUPPLIER_COUNTRY[s.id];
    if (!code) return;
    setWBLoading(true);
    setWB(null);
    try {
      const res = await fetch(`/api/worldbank?country=${code}`);
      setWB(res.ok ? await res.json() : null);
    } catch {
      setWB(null);
    } finally {
      setWBLoading(false);
    }
  }, [s.id]);

  function buildRiskText() {
    const rec = getRec(s, simulatedEscalation);
    return [
      "CHAIN VERITY — RISK SUMMARY",
      "Supplier: " + s.name,
      "Tier: " + (s.tier ?? "—"),
      "Category: " + (s.category ?? "—") + " (" + (s.categoryConfidence ?? "—") + ")",
      "Risk State: " + (s.riskState ?? "—"),
      "",
      "Recommended Action: " + rec.action,
      "Reason: " + rec.reason,
      "",
      "Financial Ratios:",
      ...(s.ratios
        ? [
            "  D/E: " + s.ratios.debtToEquity.toFixed(2),
            "  Net Profit Margin: " + (s.ratios.netProfitMargin * 100).toFixed(1) + "%",
            "  Current Ratio: " + s.ratios.currentRatio.toFixed(2),
          ]
        : ["  (not available)"]),
      "",
      "Timeline:",
      ...(s.timeline || []).map((e) => "  " + e.date + " — " + e.text),
    ].join("\n");
  }

  const rsCls = riskStateClass(s.riskState, s.risk) as any;

  // Resolve financial data source for this supplier
  const financialSource = (() => {
    if (s.ticker) {
      const exchange =
        s.ticker.endsWith(".AS") ? "Euronext Amsterdam" :
        s.ticker.endsWith(".SW") ? "SIX Swiss Exchange" :
        s.countryCode === "SG" ? "NASDAQ" :
        "SEC EDGAR";
      return { icon: "📋", label: exchange, detail: `Ticker: ${s.ticker}`, confidence: "High" as const };
    }
    const REGISTRY: Record<string, { icon: string; label: string; detail: string }> = {
      DE: { icon: "🏛", label: "Bundesanzeiger", detail: "German Commercial Register" },
      IT: { icon: "🏛", label: "Infocamere",     detail: "Italian Chamber of Commerce (CCIAA)" },
      NL: { icon: "🏛", label: "KVK",            detail: "Dutch Chamber of Commerce" },
      DK: { icon: "🏛", label: "Erhvervsstyrelsen", detail: "Danish Business Authority" },
      CH: { icon: "🏛", label: "Zefix",          detail: "Swiss Commercial Register" },
      GB: { icon: "🏛", label: "Companies House", detail: "UK Companies House" },
      CN: { icon: "📊", label: "D&B Estimate",   detail: "D&B aggregated from SAIC filing — private company" },
      SG: { icon: "🏛", label: "ACRA",           detail: "Accounting & Corporate Regulatory Authority (SG)" },
      US: { icon: "📊", label: "Supplier-Submitted", detail: "Financials provided directly by supplier" },
    };
    const reg = s.countryCode ? REGISTRY[s.countryCode] : undefined;
    return reg
      ? { ...reg, confidence: s.countryCode === "CN" ? "Medium" as const : "High" as const }
      : { icon: "📊", label: "Supplier-Submitted", detail: "Financials provided directly by supplier", confidence: "Medium" as const };
  })();

  type Tab = "overview" | "financial" | "esg" | "operations" | "intelligence";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [chartTab, setChartTab] = useState(0);

  // Reset tabs when supplier changes
  useEffect(() => { setActiveTab("overview"); setChartTab(0); }, [s.id]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "financial", label: "Financial" },
    { id: "esg", label: "ESG & Resilience" },
    { id: "operations", label: "Operations" },
    { id: "intelligence", label: "Intelligence" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Sticky header card ───────────────────────────────────────── */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.name}</div>
            <div className="muted" style={{ marginTop: 3, fontSize: 13 }}>
              Tier {s.tier ?? "—"} · {s.category || "Uncategorized"} · {s.region || "—"}
              {s.duns ? ` · DUNS ${s.duns}` : ""}
            </div>

            {/* Risk trend sparkline */}
            {s.riskHistory && s.riskHistory.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <Sparkline
                  data={s.riskHistory}
                  color={(s.risk ?? 0) >= 65 ? "#dc2626" : (s.risk ?? 0) >= 45 ? "#d97706" : "#16a34a"}
                  width={120}
                  height={26}
                  filled={false}
                />
                <span className="muted" style={{ fontSize: 11 }}>
                  12m trend ·{" "}
                  {(() => {
                    const first = s.riskHistory[0];
                    const last = s.riskHistory[s.riskHistory.length - 1];
                    const delta = last - first;
                    return delta > 0 ? `▲ +${delta} pts` : delta < 0 ? `▼ ${delta} pts` : "Stable";
                  })()}
                </span>
              </div>
            )}

            {/* Badges row */}
            {(() => {
              const dps = calcDPS(s);
              const riskLevel = (s.risk ?? 0) >= 65 ? "High" : (s.risk ?? 0) >= 45 ? "Medium" : "Low";
              const dpsLevel = dps >= 55 ? "High" : dps >= 25 ? "Medium" : "Low";
              const dpsVariant = dps >= 55 ? "risk" as const : dps >= 25 ? "warn" as const : "ok" as const;
              // Divergence: DPS level is higher than risk level
              const divergence =
                (riskLevel === "Low" && (dpsLevel === "Medium" || dpsLevel === "High")) ||
                (riskLevel === "Medium" && dpsLevel === "High");

              return (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                    {s.data && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Badge variant="info">Confidence: <b>{s.data.confidence}</b></Badge>
                        <InfoTip text="Data confidence reflects the completeness and freshness of the information underpinning this supplier's risk scores. HIGH = verified financials, live credit data, and recent operational data. MEDIUM = some data gaps or slightly stale inputs. LOW = limited data available; scores should be treated as indicative only." width={270} />
                      </span>
                    )}
                    {s.data && <Badge variant="muted-b">{s.data.updatedLabel}</Badge>}
                    {typeof s.risk === "number" && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Badge variant={s.risk >= 70 ? "risk" : s.risk >= 50 ? "warn" : "ok"}>
                          Health Risk: <b>{s.risk}</b>
                        </Badge>
                        <InfoTip
                          text="Composite health score (0–100) across Financial Health 30%, Credit Risk 25%, ESG 15%, Resiliency 15%, and Operational 15%. Below 45 = Low, 45–64 = Medium, 65+ = High. Measures current supplier health — not disruption probability."
                          width={270}
                        />
                      </span>
                    )}
                    {(() => {
                      const rp = RECOVERY_PROFILES[s.id];
                      const isSingleSource = rp
                        ? !rp.alternativeQualified
                        : (s.spend ?? 0) > 0 && ((s.exposure ?? 0) / s.spend!) > 0.5;
                      return isSingleSource ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Badge variant="warn">⚑ Single Source</Badge>
                          <InfoTip
                            text="No qualified alternative supplier exists for this supplier's critical components. Single-source dependency significantly amplifies disruption risk — any failure directly impacts production with no immediate fallback."
                            width={260}
                          />
                        </span>
                      ) : null;
                    })()}
                    {(() => {
                      const TARIFF_MAP: Record<string, { level: "High" | "Medium"; detail: string; rate: string }> = {
                        CN: { level: "High", detail: "Section 301 + additional tariffs apply to electronic components, precision assemblies, and manufactured goods. Increases landed cost and compresses supplier margins — evaluate total cost of ownership and US-based alternative sourcing.", rate: "Up to 145% effective rate" },
                        SG: { level: "Medium", detail: "Singapore-incorporated supplier may carry China-content tariff exposure depending on manufacturing origin. PCB assemblies and electronics sourced from Chinese facilities may be subject to Section 301 duties.", rate: "0–25% potential" },
                      };
                      const tariff = s.countryCode ? TARIFF_MAP[s.countryCode] : null;
                      return tariff && clientMode === "generic" ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Badge variant={tariff.level === "High" ? "risk" : "warn"}>
                            🏛 Tariff Risk: <b>{tariff.level}</b>
                          </Badge>
                          <InfoTip text={`${tariff.detail} Current rate: ${tariff.rate}.`} width={280} />
                        </span>
                      ) : null;
                    })()}
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <Badge variant={dpsVariant}>
                        Disruption Risk: <b>{dps}%</b>
                      </Badge>
                      <InfoTip
                        text="Disruption Probability Score — forward-looking estimate of the likelihood this supplier disrupts your supply chain within 12 months. Combines financial stress signals, delivery performance, and dependency exposure. Below 25% = Low, 25–54% = Medium, 55%+ = High."
                        width={270}
                      />
                    </span>
                  </div>
                  {divergence && (
                    <div style={{
                      marginTop: 8, fontSize: 11, fontWeight: 600,
                      color: "var(--warn)",
                      background: "rgba(217,119,6,.07)",
                      border: "1px solid rgba(217,119,6,.2)",
                      borderRadius: 6, padding: "4px 10px",
                      display: "inline-flex", alignItems: "center", gap: 6,
                    }}>
                      ⚠ Disruption risk elevated relative to financial health — possible single-source dependency or geopolitical exposure. See Financial tab for full analysis.
                    </div>
                  )}
                </>
              );
            })()}

            {/* Data feed pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
              {DATA_FEEDS.slice(0, 4).map((feed) => (
                <span key={feed.shortName} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 5, background: feed.status === "Live" ? "rgba(22,163,74,.1)" : "var(--surface)", color: feed.status === "Live" ? "var(--ok)" : "var(--muted)", border: "1px solid var(--line)", fontWeight: 600 }}>
                  {feed.shortName} · {feed.status === "Live" ? "●" : "○"} {feed.status}
                </span>
              ))}
            </div>
          </div>
          <Badge variant={rsCls}>{s.riskState || "STABLE"}</Badge>
        </div>
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, borderBottom: "2px solid var(--line)", paddingBottom: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: activeTab === t.id ? 700 : 500,
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
              marginBottom: -2,
              cursor: "pointer",
              color: activeTab === t.id ? "var(--accent)" : "var(--muted)",
              transition: "color .15s",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.id === "intelligence" && (sanctions || ch || gleif) && (
              <span style={{ marginLeft: 6, fontSize: 10, background: "var(--accent)", color: "#fff", borderRadius: 10, padding: "1px 6px" }}>
                {[sanctions, ch, gleif].filter(Boolean).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: OVERVIEW
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* KPIs */}
          <div className="grid-4">
            <KpiCard label="Spend (Annual)" value={moneyM(s.spend, currency)} sub="Current run rate" />
            <KpiCard label="Exposure at Risk" value={moneyM(s.exposure, currency)} sub="Working capital impact" tip="Estimated financial exposure if this supplier experiences a disruption — factoring in spend concentration, single-source dependency, and lead time to qualify an alternative." />
            <KpiCard label="On-Time Rate" value={(s.onTime || "—") + (s.onTime ? "%" : "")} sub="Last 90 days" tip="Percentage of purchase orders delivered on time and in full (OTIF) over the past 90 days. Below 95% warrants monitoring; below 90% is a risk trigger." />
            <KpiCard label="Quality (PPM)" value={String(s.qualityPPM || "—")} sub="Defects per million" tip="Parts Per Million — the number of defective units per one million units supplied. Industry standard quality metric. Below 100 PPM is generally acceptable; above 300 PPM signals quality instability." />
          </div>

          {/* Action */}
          <ActionCard supplier={s} />

          {/* Observation window */}
          {s.observation && (
            <div className="card">
              <h2>Observation Window</h2>
              <div className="card-sub">90-day post-renegotiation monitoring period.</div>
              <div className="row" style={{ marginBottom: 8 }}>
                <span>Day {s.observation.day} of {s.observation.total}</span>
                <span className="mono">{s.observation.progressPct}% complete</span>
              </div>
              <div className="progress" style={{ height: 10 }}>
                <div className="progress-fill" style={{ width: `${s.observation.progressPct}%`, background: "var(--accent)" }} />
              </div>
              <div className="kv" style={{ marginTop: 12 }}>
                <div className="box">
                  Contract executed
                  <b style={{ color: s.checklist?.contractExecuted ? "var(--ok)" : "var(--muted)" }}>
                    {s.checklist?.contractExecuted ? "✓ Yes" : "Pending"}
                  </b>
                </div>
                <div className="box">
                  Ops stable
                  <b style={{ color: s.checklist?.opsStable ? "var(--ok)" : "var(--muted)" }}>
                    {s.checklist?.opsStable ? "✓ Yes" : "Pending"}
                  </b>
                </div>
                <div className="box">
                  Finance recovery
                  <b style={{ color: s.checklist?.financeRecovery ? "var(--ok)" : "var(--warn)" }}>
                    {s.checklist?.financeRecovery ? "✓ Yes" : "Pending"}
                  </b>
                </div>
              </div>
              <div className="inline" style={{ marginTop: 12 }}>
                <button
                  className="btn primary"
                  onClick={() => {
                    if (!s.checklist?.financeRecovery) {
                      setObsNote({ text: "Cannot close: Finance recovery milestone not met. Observation continues.", color: "var(--warn)" });
                    } else {
                      setObsNote({ text: "Risk closed. Supplier returned to standard monitoring.", color: "var(--ok)" });
                    }
                  }}
                >
                  Attempt Close Risk
                </button>
                <button
                  className="btn"
                  onClick={() => {
                    setSimulatedEscalation(s.id);
                    setObsNote({ text: "Simulated failure: system escalates to 'Find secondary source'.", color: "var(--risk)" });
                  }}
                >
                  Simulate Observation Failure
                </button>
              </div>
              <div className="note" style={{ color: obsNote.color }}>{obsNote.text}</div>
            </div>
          )}

          {/* Alerts */}
          {s.alerts && s.alerts.length > 0 && (
            <div className="card">
              <h2>Supplier Alerts</h2>
              <div className="list">
                {s.alerts.map((a) => (
                  <div key={a.id} className="item">
                    <Badge variant={a.type === "risk" ? "risk" : a.type === "contract" ? "warn" : "info"}>
                      {a.type.toUpperCase()}
                    </Badge>
                    <div style={{ marginTop: 5 }}>{a.text}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{a.date || ""}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOM — sole-sourced critical parts from this supplier */}
          {(() => {
            const criticalParts = platformProductLines.flatMap((pl) =>
              pl.bomItems
                .filter((b) => b.supplierId === s.id && b.soloSourced)
                .map((b) => ({ ...b, productLine: pl.name }))
            );
            if (criticalParts.length === 0) return null;
            const annualRisk = criticalParts.reduce((sum, b) => sum + b.unitCost * b.quantity * 1000, 0);
            return (
              <div className="card" style={{ borderLeft: "3px solid var(--risk)" }}>
                <div className="row" style={{ marginBottom: 8 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>⚠ Sole-Sourced Critical Parts</h2>
                    <div className="card-sub">No qualified alternative supplier exists for these components.</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "var(--risk)" }}>${(annualRisk / 1e6).toFixed(1)}M</div>
                    <div className="muted" style={{ fontSize: 11 }}>est. annual parts value</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr><th>Part #</th><th>Part Name</th><th>Product Line</th><th>Lead Time</th><th>Unit Cost</th><th>Qty/Unit</th></tr>
                    </thead>
                    <tbody>
                      {criticalParts.map((b) => (
                        <tr key={b.partNumber}>
                          <td className="mono" style={{ fontSize: 11 }}>{b.partNumber}</td>
                          <td><b>{b.partName}</b></td>
                          <td style={{ fontSize: 12, color: "var(--muted)" }}>{b.productLine}</td>
                          <td style={{ color: b.leadTimeDays > 14 ? "var(--warn)" : "inherit", fontWeight: b.leadTimeDays > 14 ? 700 : 400 }}>
                            {b.leadTimeDays}d {b.leadTimeDays > 14 ? "⚠" : ""}
                          </td>
                          <td>${b.unitCost}</td>
                          <td>{b.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="note">Each sole-sourced part is a single point of failure. A disruption to this supplier immediately halts production of the affected lines with no alternative. Qualify a secondary source to eliminate this exposure.</div>
              </div>
            );
          })()}

          {/* Timeline */}
          {s.timeline && s.timeline.length > 0 && (
            <div className="card">
              <h2>Event Timeline</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                {s.timeline.map((e, i) => (
                  <div key={i} className="box">
                    <div className="row">
                      <span className="mono" style={{ color: "var(--muted)" }}>{e.date}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>{e.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Relationship Notes ── */}
          <SupplierNotes supplierId={s.id} notes={supplierNotes[s.id] || []} onAdd={addSupplierNote} onDelete={deleteSupplierNote} role={role} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: FINANCIAL
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "financial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* DPS */}
          <DPSCard supplier={s} />

          {/* Credit Risk */}
          <CreditRiskCard supplier={s} />

          {/* Ratios */}
          {s.ratios && (
            <div className="card">
              <div className="row" style={{ marginBottom: 8 }}>
                <h2 style={{ margin: 0 }}>Financial Ratios (Latest Filing)</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                    {financialSource.icon} {financialSource.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                    background: financialSource.confidence === "High" ? "rgba(22,163,74,.1)" : "rgba(217,119,6,.1)",
                    color: financialSource.confidence === "High" ? "var(--ok)" : "var(--warn)",
                  }}>
                    {financialSource.confidence}
                  </span>
                </div>
              </div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 12 }}>{financialSource.detail}</div>
              <div className="kv">
                <div className="box">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Debt / Equity
                    <InfoTip text="Total debt divided by shareholders' equity. Measures financial leverage. Below 0.5 is conservative; above 1.5 indicates high leverage, increasing vulnerability to economic downturns. Above 2.0 is a significant risk signal." width={220} />
                  </div>
                  <b>
                    {fmt2(s.ratios.debtToEquity)}
                    {s.ratios.debtToEquity > 1.5 && <span style={{ color: "var(--warn)" }}> ⚠ elevated</span>}
                  </b>
                </div>
                <div className="box">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Net Profit Margin
                    <InfoTip text="Net income divided by revenue. Measures how much profit a company keeps from each pound of sales. Below 5% signals thin margins with little buffer against cost shocks; below 0% means the company is losing money." width={220} />
                  </div>
                  <b>
                    {fmtPct(s.ratios.netProfitMargin)}
                    {s.ratios.netProfitMargin < 0.05 && <span style={{ color: "var(--warn)" }}> ⚠ trigger</span>}
                  </b>
                </div>
                <div className="box">
                  <div style={{ display: "flex", alignItems: "center" }}>
                    Current Ratio
                    <InfoTip text="Current assets divided by current liabilities. Measures short-term liquidity. Below 1.0 means the supplier may struggle to meet near-term obligations — a potential insolvency signal. Above 2.0 is considered healthy." width={220} />
                  </div>
                  <b>
                    {fmt2(s.ratios.currentRatio)}
                    {s.ratios.currentRatio < 1 && <span style={{ color: "var(--risk)" }}> ⚠ &lt; 1.0</span>}
                  </b>
                </div>
              </div>
              <div className="inline" style={{ marginTop: 12 }}>
                <button className="btn primary" onClick={() => downloadStub(`Chain_Verity_${s.name.replace(/\s/g, "_")}.txt`, buildRiskText())}>
                  Export Risk Summary
                </button>
              </div>
              <div className="note">Exports are stubbed in this demo.</div>
            </div>
          )}

          {/* Charts */}
          {/* Financial trend charts — tabbed */}
          {(() => {
            const charts = [
              { label: "Current Ratio",  el: <LineChart series={buildCR(s)}  label="Current Ratio Trend"          formatY={(v) => v.toFixed(2)}                    higherIsBetter /> },
              { label: "Debt / Equity",  el: <LineChart series={buildDE(s)}  label="Debt-to-Equity Trend"         formatY={(v) => v.toFixed(2)}                    higherIsBetter={false} /> },
              { label: "Net Margin",     el: <LineChart series={buildPM(s)}  label="Net Profit Margin Trend"      formatY={(v) => v.toFixed(1) + "%"}              higherIsBetter /> },
              { label: "Cash Flow",      el: <LineChart series={buildOCF(s)} label="Operating Cash Flow Trend"    formatY={(v) => currency + v.toFixed(1) + "M"}   higherIsBetter /> },
              { label: "EBITDA",         el: <LineChart series={buildEB(s)}  label="EBITDA Trend"                 formatY={(v) => currency + v.toFixed(1) + "M"}   higherIsBetter /> },
            ];
            const active = Math.min(chartTab, charts.length - 1);
            return (
              <div className="card" style={{ paddingTop: 0 }}>
                <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 16, overflowX: "auto" }}>
                  {charts.map((c, i) => (
                    <button
                      key={c.label}
                      onClick={() => setChartTab(i)}
                      style={{
                        padding: "10px 16px", fontSize: 12,
                        fontWeight: active === i ? 700 : 500,
                        background: "none", border: "none",
                        borderBottom: active === i ? "2px solid var(--accent)" : "2px solid transparent",
                        marginBottom: -1, cursor: "pointer",
                        color: active === i ? "var(--accent)" : "var(--muted)",
                        whiteSpace: "nowrap", transition: "color .15s",
                      }}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {charts[active].el}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                  <span className="muted" style={{ fontSize: 11 }}>Source:</span>
                  <span style={{ fontSize: 11, color: "var(--fg-muted)" }}>{financialSource.icon} {financialSource.label}</span>
                  <span className="muted" style={{ fontSize: 11 }}>· {financialSource.detail}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: "1px 5px", borderRadius: 4, marginLeft: "auto",
                    background: financialSource.confidence === "High" ? "rgba(22,163,74,.1)" : "rgba(217,119,6,.1)",
                    color: financialSource.confidence === "High" ? "var(--ok)" : "var(--warn)",
                  }}>
                    {financialSource.confidence} confidence
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: ESG & RESILIENCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "esg" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <ESGCard supplier={s} />
          <ResiliencyCard supplier={s} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: OPERATIONS
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "operations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Contact */}
          <ContactCard supplier={s} />

          {/* Business Continuity / TTR-TTS */}
          {RECOVERY_PROFILES[s.id] && (() => {
            const rp = RECOVERY_PROFILES[s.id];
            const gap = rp.timeToRecover - rp.timeToSurvive;
            return (
              <div className="card">
                <h2>Business Continuity Profile</h2>
                <div className="card-sub">Time-to-Survive (TTS) and Time-to-Recover (TTR) · updated {rp.lastReviewed}</div>
                <div className="kv" style={{ marginTop: 12 }}>
                  <div className="box">
                    Inventory Buffer
                    <b>{rp.inventoryBufferDays} days</b>
                  </div>
                  <div className="box">
                    Time to Survive
                    <b style={{ color: rp.timeToSurvive <= 14 ? "var(--risk)" : rp.timeToSurvive <= 30 ? "var(--warn)" : "var(--ok)" }}>
                      {rp.timeToSurvive} days
                    </b>
                  </div>
                  <div className="box">
                    Time to Recover
                    <b style={{ color: "var(--info)" }}>{rp.timeToRecover} days</b>
                  </div>
                  <div className="box">
                    TTR Gap
                    <b style={{ color: gap > 30 ? "var(--risk)" : gap > 0 ? "var(--warn)" : "var(--ok)" }}>
                      {gap > 0 ? `+${gap}d` : `${gap}d`} {gap > 0 ? "⚠" : "✓"}
                    </b>
                  </div>
                  <div className="box">
                    Alt. Supplier Qualified
                    <b style={{ color: rp.alternativeQualified ? "var(--ok)" : "var(--risk)" }}>
                      {rp.alternativeQualified ? "✓ Yes" : "✗ No"}
                    </b>
                  </div>
                  <div className="box">
                    Safety Stock Rec.
                    <b style={{ color: rp.safetyStockRecommendation > rp.inventoryBufferDays ? "var(--warn)" : "var(--ok)" }}>
                      {rp.safetyStockRecommendation} days
                      {rp.safetyStockRecommendation > rp.inventoryBufferDays && <span style={{ fontWeight: 400, fontSize: 11 }}> (increase needed)</span>}
                    </b>
                  </div>
                </div>
                {rp.criticalComponents.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Critical components:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {rp.criticalComponents.map((c, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--line)" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                {rp.affectedProductLines.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Affected product lines:</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {rp.affectedProductLines.map((p, i) => (
                        <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(37,99,235,.08)", color: "var(--accent)", border: "1px solid rgba(37,99,235,.15)" }}>{p}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: INTELLIGENCE
      ══════════════════════════════════════════════════════════════ */}
      {activeTab === "intelligence" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Live check buttons */}
          <div className="card" style={{ padding: "14px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Live Registry &amp; Compliance Checks</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn"
                style={{ fontSize: 13 }}
                onClick={runSanctionsCheck}
                disabled={sanctionsLoading}
              >
                {sanctionsLoading ? "Checking…" : "🛡 Sanctions Screen"}
              </button>
              <button
                className="btn"
                style={{ fontSize: 13 }}
                onClick={runCHLookup}
                disabled={chLoading}
              >
                {chLoading ? "Looking up…" : "🏛 Companies House"}
              </button>
              <button
                className="btn"
                style={{ fontSize: 13 }}
                onClick={runGLEIFLookup}
                disabled={gleifLoading}
              >
                {gleifLoading ? "Searching…" : "🌍 GLEIF Registry"}
              </button>
            </div>
          </div>

          {/* Sanctions result */}
          {sanctions && (
            <div className="card" style={{ borderLeft: `4px solid ${sanctions.match ? "var(--risk)" : "var(--ok)"}` }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{sanctions.match ? "⚠️" : "✅"}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: sanctions.match ? "var(--risk)" : "var(--ok)" }}>
                      {sanctions.match ? "Potential Sanctions Match — Review Required" : "No Sanctions Match Found"}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {sanctions.screened ? `Screened against: ${sanctions.lists.join(", ")}` : "Screening unavailable"}
                    </div>
                  </div>
                </div>
                <span className="muted" style={{ fontSize: 11 }}>via OpenSanctions · {new Date().toLocaleDateString()}</span>
              </div>
              {sanctions.results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {sanctions.results.map((r, i) => (
                    <div key={i} style={{ background: "var(--surface)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.caption}</div>
                        <div className="muted" style={{ fontSize: 11 }}>{r.datasets?.slice(0, 3).join(", ")}</div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: r.score > 0.8 ? "var(--risk)" : "var(--warn)" }}>
                        {Math.round(r.score * 100)}% match
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {!sanctions.match && sanctions.screened && (
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                  {s.name} does not appear on any monitored sanctions list. Score: {sanctions.topScore}%.
                </div>
              )}
            </div>
          )}

          {/* Companies House result */}
          {ch && (
            <div className="card">
              <div className="row" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🏛</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {ch.noKey ? "Companies House — API Key Required" : ch.found ? `UK Entity: ${ch.companyName}` : "No UK-registered entity found"}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {ch.noKey
                        ? "Add COMPANIES_HOUSE_API_KEY to Vercel environment variables"
                        : ch.found
                        ? `Company No. ${ch.companyNumber} · ${ch.status}${ch.searchedAs ? ` · matched as "${ch.searchedAs}"` : ""}`
                        : ch.note ?? `Searched: ${ch.searched?.join(", ")} — no UK entity on record`}
                    </div>
                  </div>
                </div>
                {ch.found && ch.companiesHouseUrl && (
                  <a href={ch.companiesHouseUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: 12 }}>
                    View Filing ↗
                  </a>
                )}
              </div>
              {ch.found && (
                <div className="kv">
                  {ch.incorporatedOn && <div className="box">Incorporated<b>{ch.incorporatedOn}</b></div>}
                  {ch.accountsLastMadeUpTo && <div className="box">Last Accounts<b>{ch.accountsLastMadeUpTo}</b></div>}
                  {ch.accountsNextDue && (
                    <div className="box">
                      Next Accounts Due
                      <b style={{ color: new Date(ch.accountsNextDue) < new Date() ? "var(--risk)" : "inherit" }}>
                        {ch.accountsNextDue}{new Date(ch.accountsNextDue) < new Date() && " ⚠ overdue"}
                      </b>
                    </div>
                  )}
                  {ch.address && <div className="box">Registered Address<b style={{ fontSize: 11 }}>{ch.address}</b></div>}
                </div>
              )}
              {ch.found && ch.recentFilings && ch.recentFilings.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6, fontWeight: 600 }}>Recent Filings</div>
                  {ch.recentFilings.map((f, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--line)" }}>
                      <span className="mono" style={{ color: "var(--muted)", flexShrink: 0 }}>{f.date}</span>
                      <span>{f.description ?? f.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* GLEIF result */}
          {gleif && (
            <div className="card">
              <div className="row" style={{ marginBottom: gleif.found ? 10 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🌍</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>
                      {gleif.found ? `GLEIF: ${gleif.legalName}` : "No GLEIF record found"}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {gleif.found
                        ? `LEI: ${gleif.lei} · ${gleif.jurisdiction ?? gleif.country} · ${gleif.registrationStatus}`
                        : `${s.name} has no LEI on the global registry`}
                    </div>
                  </div>
                </div>
                {gleif.found && gleif.gleifUrl && (
                  <a href={gleif.gleifUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: 12 }}>
                    View GLEIF ↗
                  </a>
                )}
              </div>
              {gleif.found && (
                <>
                  <div className="kv">
                    {gleif.status && <div className="box">Status<b>{gleif.status}</b></div>}
                    {gleif.jurisdiction && <div className="box">Jurisdiction<b>{gleif.jurisdiction}</b></div>}
                    {gleif.city && gleif.country && <div className="box">Location<b>{gleif.city}, {gleif.country}</b></div>}
                    {gleif.nextRenewalDate && (
                      <div className="box">
                        LEI Renewal Due
                        <b style={{ color: new Date(gleif.nextRenewalDate) < new Date() ? "var(--risk)" : "inherit" }}>
                          {gleif.nextRenewalDate.slice(0, 10)}
                        </b>
                      </div>
                    )}
                  </div>
                  {gleif.ultimateParent && (
                    <div style={{ marginTop: 10, padding: "8px 12px", background: "var(--surface)", borderRadius: 8, fontSize: 13 }}>
                      <span className="muted">Ultimate Parent: </span>
                      <b>{gleif.ultimateParent.legalName}</b>
                      <span className="muted"> · LEI {gleif.ultimateParent.lei} · {gleif.ultimateParent.country}</span>
                    </div>
                  )}
                  {gleif.address && (
                    <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>Registered address: {gleif.address}</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* World Bank country risk — auto-loaded */}
          {wbLoading && (
            <div className="card" style={{ color: "var(--muted)", fontSize: 13 }}>Loading country risk data…</div>
          )}
          {wb && (
            <div className="card">
              <div className="row" style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🌐</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>Country Risk Profile — {wb.countryName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>World Bank Open Data · World Governance Indicators</div>
                  </div>
                </div>
              </div>
              <div className="kv">
                {wb.gdpGrowth && (
                  <div className="box">
                    GDP Growth
                    <b style={{ color: wb.gdpGrowth.value >= 0 ? "var(--ok)" : "var(--risk)" }}>
                      {wb.gdpGrowth.value > 0 ? "+" : ""}{wb.gdpGrowth.value}% ({wb.gdpGrowth.year})
                    </b>
                  </div>
                )}
                {wb.tradeOpenness && (
                  <div className="box">Trade Openness<b>{wb.tradeOpenness.value}% of GDP ({wb.tradeOpenness.year})</b></div>
                )}
              </div>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Political Stability", data: wb.politicalStability },
                  { label: "Regulatory Quality", data: wb.regulatoryQuality },
                  { label: "Govt Effectiveness", data: wb.govtEffectiveness },
                ].map(({ label, data }) =>
                  data ? (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 150, fontSize: 12, flexShrink: 0 }}>{label}</div>
                      <div style={{ flex: 1, background: "var(--line)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{ width: `${data.score}%`, height: "100%", borderRadius: 4, background: data.score >= 70 ? "var(--ok)" : data.score >= 45 ? "var(--warn)" : "var(--risk)" }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, width: 36, textAlign: "right" }}>{data.score}/100</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* News feed — auto-loaded */}
          <div className="card">
            <div className="row" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 16 }}>📰</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>Latest News — {s.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>via NewsAPI · auto-refreshes every 30 min</div>
                </div>
              </div>
              {!newsNoKey && news && news.length > 0 && (
                <span style={{ fontSize: 11, color: "var(--ok)", fontWeight: 600 }}>● LIVE</span>
              )}
            </div>
            {newsLoading && <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>Fetching latest news…</div>}
            {newsNoKey && (
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: "12px 14px", fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Add NEWS_API_KEY to enable live supplier news monitoring</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Register free at <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>newsapi.org</a> →
                  copy your API key → <code style={{ fontSize: 11 }}>vercel env add NEWS_API_KEY production</code>
                </div>
              </div>
            )}
            {!newsLoading && !newsNoKey && news && news.length === 0 && (
              <div className="muted" style={{ fontSize: 13 }}>No recent news articles found for {s.name}.</div>
            )}
            {news && news.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {news.map((article, i) => (
                  <a key={i} href={article.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "inherit" }}>
                    <div
                      style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 14px", borderLeft: "3px solid var(--accent)", transition: "background .15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--line)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface)")}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, lineHeight: 1.4 }}>{article.title}</div>
                      {article.description && (
                        <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 4 }}>
                          {article.description.length > 160 ? article.description.slice(0, 160) + "…" : article.description}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--muted)" }}>
                        <span>{article.source}</span>
                        <span>·</span>
                        <span>{new Date(article.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
