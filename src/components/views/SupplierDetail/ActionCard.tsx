"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Supplier } from "@/types";
import { getRec } from "@/lib/analytics";
import { buildDE, buildPM, buildOCF } from "@/lib/analytics";
import { Badge } from "@/components/ui/Badge";
import ReactMarkdown from "react-markdown";

interface ActionCardProps {
  supplier: Supplier;
}

interface AltSuggestion {
  name: string;
  headquarters: string;
  viability?: number;
  description: string;
  why: string;
}

// Self-contained add button for use inside the modal (owns its own state)
function ModalAddButton({ onAdd }: { onAdd: () => Promise<void> }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  async function handleClick() {
    if (added) return;
    setAdding(true);
    try { await onAdd(); setAdded(true); } finally { setAdding(false); }
  }
  return (
    <button
      className="btn primary"
      style={{ fontSize: 13 }}
      onClick={handleClick}
      disabled={adding || added}
    >
      {added ? "✓ Added to Directory" : adding ? "Adding…" : "Add to Directory"}
    </button>
  );
}

export function ActionCard({ supplier }: ActionCardProps) {
  const { simulatedEscalation, openModal, addSupplier } = useApp();
  const rec = getRec(supplier, simulatedEscalation);

  const [altSuggestions, setAltSuggestions] = useState<AltSuggestion[]>([]);
  const [altLoading, setAltLoading] = useState(false);
  const [altLoaded, setAltLoaded] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [learnMoreLoadingId, setLearnMoreLoadingId] = useState<string | null>(null);

  async function handleFindAlternatives() {
    setAltLoading(true);
    try {
      const res = await fetch("/api/suggest-alternatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: supplier.category,
          region: supplier.region,
          supplierName: supplier.name,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAltSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setAltSuggestions([]);
    } finally {
      setAltLoading(false);
      setAltLoaded(true);
    }
  }

  async function handleLearnMore(alt: AltSuggestion) {
    setLearnMoreLoadingId(alt.name);
    try {
      const res = await fetch("/api/lookup-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: alt.name }),
      });
      const d = res.ok ? await res.json() : null;
      const fmt2 = (n: number) => n?.toFixed(2) ?? "—";
      const fmtPct = (n: number) => n != null ? (n * 100).toFixed(1) + "%" : "—";
      const riskColor = (r: number) => r >= 70 ? "var(--risk)" : r >= 50 ? "var(--warn)" : "var(--ok)";

      openModal(
        alt.name,
        alt.headquarters,
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
          {/* Description */}
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>{alt.description}</div>
          <div style={{ fontSize: 13, color: "var(--ok)", fontStyle: "italic" }}>{alt.why}</div>

          {d && !d.error && (
            <>
              {/* Key metrics */}
              <div className="kv">
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>Risk Score</div>
                  <div style={{ fontWeight: 800, fontSize: 20, color: riskColor(d.risk) }}>{d.risk ?? "—"}</div>
                </div>
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>Category</div>
                  <b>{d.category ?? alt.name}</b>
                </div>
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>Tier</div>
                  <b>Tier {d.tier ?? "—"}</b>
                </div>
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>Region</div>
                  <b>{d.region ?? "—"}</b>
                </div>
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>On-Time Delivery</div>
                  <b>{d.onTime != null ? d.onTime + "%" : "—"}</b>
                </div>
                <div className="box">
                  <div className="muted" style={{ fontSize: 11 }}>Quality (PPM)</div>
                  <b>{d.qualityPPM ?? "—"}</b>
                </div>
              </div>

              {/* Financial ratios */}
              {d.ratios && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Financial Ratios</div>
                  <div className="kv">
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Debt / Equity</div>
                      <b style={{ color: d.ratios.debtToEquity > 1.5 ? "var(--warn)" : undefined }}>
                        {fmt2(d.ratios.debtToEquity)}
                        {d.ratios.debtToEquity > 1.5 && " ⚠"}
                      </b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Net Profit Margin</div>
                      <b style={{ color: d.ratios.netProfitMargin < 0.05 ? "var(--warn)" : undefined }}>
                        {fmtPct(d.ratios.netProfitMargin)}
                        {d.ratios.netProfitMargin < 0.05 && " ⚠"}
                      </b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Current Ratio</div>
                      <b style={{ color: d.ratios.currentRatio < 1 ? "var(--risk)" : undefined }}>
                        {fmt2(d.ratios.currentRatio)}
                        {d.ratios.currentRatio < 1 && " ⚠"}
                      </b>
                    </div>
                  </div>
                </>
              )}

              {/* Credit risk */}
              {d.creditRisk && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Credit Risk</div>
                  <div className="kv">
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>FRISK Score</div>
                      <b>{d.creditRisk.friskScore}/10</b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Credit Rating</div>
                      <b>{d.creditRisk.creditRating}</b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Bankruptcy Risk 12m</div>
                      <b>{d.creditRisk.bankruptcyRisk12m}</b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Payment Behavior</div>
                      <b>{d.creditRisk.paymentBehavior}</b>
                    </div>
                  </div>
                </>
              )}

              {/* ESG */}
              {d.esg && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>ESG</div>
                  <div className="kv">
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>ESG Score</div>
                      <b>{d.esg.score}/100 ({d.esg.grade})</b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Labor Risk</div>
                      <b>{d.esg.laborRisk}</b>
                    </div>
                    <div className="box">
                      <div className="muted" style={{ fontSize: 11 }}>Environmental Risk</div>
                      <b>{d.esg.environmentalRisk}</b>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          <div className="inline" style={{ marginTop: 4 }}>
            <ModalAddButton onAdd={() => handleAddToDirectory(alt)} />
          </div>
          <div className="note">Data is AI-estimated based on publicly available information.</div>
        </div>
      );
    } catch {
      openModal(
        alt.name,
        alt.headquarters,
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13 }}>{alt.description}<br /><br />{alt.why}</div>
          <div className="inline">
            <ModalAddButton onAdd={() => handleAddToDirectory(alt)} />
          </div>
        </div>
      );
    } finally {
      setLearnMoreLoadingId(null);
    }
  }

  async function handleAddToDirectory(alt: AltSuggestion) {
    setAddingId(alt.name);
    try {
      const res = await fetch("/api/lookup-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: alt.name }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const makeId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      addSupplier({
        id: makeId(),
        name: String(data.name || alt.name),
        ticker: data.ticker ? String(data.ticker) : undefined,
        tier: data.tier ? (Number(data.tier) as 1 | 2 | 3) : undefined,
        category: data.category ? String(data.category) : supplier.category,
        region: data.region ? String(data.region) : undefined,
        risk: data.risk ? Number(data.risk) : undefined,
        spend: data.spend ? Number(data.spend) : undefined,
        exposure: data.exposure ? Number(data.exposure) : undefined,
        onTime: data.onTime ? Number(data.onTime) : undefined,
        qualityPPM: data.qualityPPM ? Number(data.qualityPPM) : undefined,
        duns: data.duns ? String(data.duns) : undefined,
        website: data.website ? String(data.website) : undefined,
        riskState: data.riskState ? String(data.riskState) : "STABLE",
        ratios: data.ratios as Supplier["ratios"],
        creditRisk: data.creditRisk ? { ...(data.creditRisk as object), lastUpdated: "Just added", source: "AI estimate" } as Supplier["creditRisk"] : undefined,
        esg: data.esg as Supplier["esg"],
        data: { updatedLabel: "Just added", confidence: "LOW" },
      });
      setAddedIds((prev) => new Set([...prev, alt.name]));
    } catch {
      // silently fail — user can add manually via Add Supplier
    } finally {
      setAddingId(null);
    }
  }
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const opts = ["Renegotiation of contract", "Find secondary source", "No recommended changes"];
  const bc = rec.action === "Find secondary source" ? "risk" : rec.action === "Renegotiation of contract" ? "warn" : "ok";

  function handleWhy() {
    const dS = buildDE(supplier);
    const pS = buildPM(supplier);
    const oS = buildOCF(supplier);
    const delta = (ser: { value: number }[]) =>
      ser && ser.length >= 2 ? (ser[ser.length - 1].value - ser[0].value).toFixed(2) : "—";

    openModal(
      "Why this recommendation",
      "Signal trace",
      <div>
        <div className="kv">
          <div className="box">
            <div className="muted" style={{ fontSize: 12 }}>Structural</div>
            <div style={{ fontWeight: 700 }}>D/E 3y change</div>
            <div className="mono" style={{ marginTop: 4 }}>{delta(dS)}</div>
          </div>
          <div className="box">
            <div className="muted" style={{ fontSize: 12 }}>Profitability</div>
            <div style={{ fontWeight: 700 }}>Margin 3y change</div>
            <div className="mono" style={{ marginTop: 4 }}>{delta(pS)} pp</div>
          </div>
          <div className="box">
            <div className="muted" style={{ fontSize: 12 }}>Liquidity</div>
            <div style={{ fontWeight: 700 }}>OCF 3y change</div>
            <div className="mono" style={{ marginTop: 4 }}>${delta(oS)}M</div>
          </div>
        </div>
        <div className="callout" style={{ marginTop: 12 }}>
          Recommendation: <b>{rec.action}</b><br />
          <span className="muted">{rec.reason}</span>
        </div>
        <div className="note">This recommendation is computed from the same 3-year trend series displayed on this page.</div>
      </div>
    );
  }

  async function handleAIAnalysis() {
    setAiLoading(true);
    setAiAnalysis("");
    const prompt = [
      `Analyze this supplier and provide 3-4 specific, actionable recommendations. Be direct and data-driven.`,
      `Supplier: ${supplier.name} (${supplier.ticker ?? "—"})`,
      `Tier: ${supplier.tier} | Region: ${supplier.region} | Category: ${supplier.category}`,
      `Risk Score: ${supplier.risk ?? "—"} | State: ${supplier.riskState ?? "STABLE"}`,
      `Spend: $${((supplier.spend ?? 0) / 1e6).toFixed(1)}M | Exposure: $${((supplier.exposure ?? 0) / 1e6).toFixed(1)}M`,
      supplier.ratios ? `D/E: ${supplier.ratios.debtToEquity} | Net margin: ${(supplier.ratios.netProfitMargin * 100).toFixed(1)}% | Current ratio: ${supplier.ratios.currentRatio}` : "",
      supplier.creditRisk ? `FRISK: ${supplier.creditRisk.friskScore}/10 | Credit: ${supplier.creditRisk.creditRating} | Bankruptcy risk: ${supplier.creditRisk.bankruptcyRisk12m}` : "",
      supplier.esg ? `ESG score: ${supplier.esg.score}/100 (${supplier.esg.grade}) | Labor risk: ${supplier.esg.laborRisk}` : "",
      `Current recommendation: ${rec.action} — ${rec.reason}`,
    ].filter(Boolean).join("\n");

    let result = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setAiAnalysis(result);
      }
    } catch {
      result = "Failed to generate analysis. Check ANTHROPIC_API_KEY.";
      setAiAnalysis(result);
    } finally {
      setAiLoading(false);
      openModal(
        `AI Analysis — ${supplier.name}`,
        `Recommended action: ${rec.action}`,
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            <button
              className="btn"
              style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
              onClick={() => {
                const win = window.open("", "_blank");
                if (!win) return;
                // Convert markdown to basic HTML for print
                const mdToHtml = (md: string) => md
                  .replace(/^### (.+)$/gm, "<h3>$1</h3>")
                  .replace(/^## (.+)$/gm, "<h2>$1</h2>")
                  .replace(/^# (.+)$/gm, "<h1 class='section'>$1</h1>")
                  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\*(.+?)\*/g, "<em>$1</em>")
                  .replace(/^[-•] (.+)$/gm, "<li>$1</li>")
                  .replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>")
                  .replace(/\n\n/g, "</p><p>")
                  .replace(/^(?!<[hul])(.+)$/gm, "<p>$1</p>");
                win.document.write(`<!DOCTYPE html><html><head><title>AI Analysis — ${supplier.name}</title><style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #111827; line-height: 1.75; }
                  .title { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
                  .meta { font-size: 12px; color: #6b7280; margin-bottom: 32px; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; }
                  h1.section { font-size: 16px; font-weight: 700; margin: 24px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; color: #111827; }
                  h2 { font-size: 14px; font-weight: 700; margin: 20px 0 6px; color: #374151; }
                  h3 { font-size: 13px; font-weight: 700; margin: 14px 0 4px; color: #374151; }
                  p { margin: 0 0 10px; font-size: 13px; }
                  ul { margin: 0 0 12px; padding-left: 20px; font-size: 13px; }
                  li { margin-bottom: 5px; }
                  strong { font-weight: 700; }
                  @media print { body { margin: 20px; } }
                </style></head><body>
                  <div class="title">AI Analysis — ${supplier.name}</div>
                  <div class="meta">Recommended action: ${rec.action} &nbsp;·&nbsp; Generated by Chain Verity</div>
                  ${mdToHtml(result)}
                  <script>window.onload = () => window.print();</script>
                </body></html>`);
                win.document.close();
              }}
            >
              🖨 Print / Save PDF
            </button>
          </div>
          <div className="ai-analysis-body">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      );
    }
  }

  function handleAudit() {
    openModal(
      "Audit trail",
      "Prototype log",
      <div>
        <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
          In production, includes data sources, model versions, timestamps, and user actions.
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Time</th><th>Event</th></tr>
            </thead>
            <tbody>
              <tr><td className="mono">T-0</td><td>Recommendation computed using risk score + financial ratios + 3-year trends</td></tr>
              <tr><td className="mono">T-0</td><td>Signals aggregated: Liquidity / Structural / Profitability</td></tr>
              <tr><td className="mono">T-0</td><td>Action selected: {rec.action}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0 }}>Recommended Action</h2>
          <div className="muted" style={{ marginTop: 5, maxWidth: 520 }}>{rec.reason}</div>
        </div>
        <Badge variant={bc as any} className="flex-shrink-0" style={{ fontSize: 13, fontWeight: 700 }}>
          {rec.action}
        </Badge>
      </div>

      <div className="inline" style={{ marginTop: 10 }}>
        <button className="btn" onClick={handleWhy}>Why this recommendation</button>
        <button className="btn" onClick={handleAudit}>Audit trail</button>
        <button className="btn ai" onClick={handleAIAnalysis} disabled={aiLoading}>
          {aiLoading ? "Analyzing…" : "AI Analysis"}
        </button>
      </div>


      <div className="divider" />
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Action options</div>
      <div className="grid-3">
        {opts.map((opt) => {
          const selected = opt === rec.action;
          return (
            <div
              key={opt}
              className={`badge ${selected ? "info" : ""}`}
              style={{ borderRadius: 10, padding: 12, display: "block", fontSize: 13 }}
            >
              <div style={{ fontWeight: 700 }}>{opt}</div>
              {selected && (
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  Selected based on risk, ratios, and 3-year trends.
                </div>
              )}
            </div>
          );
        })}
      </div>

      {rec.guidance?.length > 0 && (
        <>
          <div className="divider" />
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>What to do next</div>
          <ol style={{ margin: "0 0 0 18px", padding: 0, display: "flex", flexDirection: "column", gap: 5 }}>
            {rec.guidance.map((g, i) => (
              <li key={i} style={{ fontSize: 13 }}>{g}</li>
            ))}
          </ol>
        </>
      )}

      {rec.action === "Find secondary source" && (
        <>
          <div className="divider" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              Suggested alternative suppliers — {supplier.category}
            </div>
            {!altLoaded && (
              <button className="btn ai" style={{ fontSize: 12 }} onClick={handleFindAlternatives} disabled={altLoading}>
                {altLoading ? "Finding alternatives…" : "Find alternatives"}
              </button>
            )}
            {altLoaded && (
              <button className="btn" style={{ fontSize: 12 }} onClick={() => { setAltLoaded(false); setAltSuggestions([]); handleFindAlternatives(); }}>
                Refresh
              </button>
            )}
          </div>

          {altLoading && (
            <div className="callout" style={{ fontSize: 13 }}>
              Searching for reputable {supplier.category} suppliers…
            </div>
          )}

          {altLoaded && altSuggestions.length === 0 && (
            <div className="muted" style={{ fontSize: 13 }}>No suggestions available. Try again.</div>
          )}

          {altSuggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {altSuggestions.map((alt, idx) => {
                const isAdded = addedIds.has(alt.name);
                const isAdding = addingId === alt.name;
                const viability = alt.viability ?? (10 - idx);
                const viabilityColor = viability >= 8 ? "var(--ok)" : viability >= 5 ? "var(--warn)" : "var(--muted)";
                return (
                  <div key={alt.name} className="box" style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    {/* Rank indicator */}
                    <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: idx === 0 ? "var(--accent)" : "var(--surface-2, var(--line))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: idx === 0 ? "#fff" : "var(--muted)", marginTop: 2 }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{alt.name}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: viabilityColor }}>
                          Viability {viability}/10
                        </div>
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{alt.headquarters}</div>
                      <div style={{ fontSize: 12, marginTop: 5, lineHeight: 1.5 }}>{alt.description}</div>
                      <div style={{ fontSize: 12, marginTop: 4, color: "var(--ok)", fontStyle: "italic" }}>{alt.why}</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                      <button
                        className="btn"
                        style={{ fontSize: 11, whiteSpace: "nowrap" }}
                        onClick={() => handleLearnMore(alt)}
                        disabled={learnMoreLoadingId === alt.name}
                      >
                        {learnMoreLoadingId === alt.name ? "Loading…" : "Learn More"}
                      </button>
                      <button
                        className="btn"
                        style={{ fontSize: 11, whiteSpace: "nowrap", color: isAdded ? "var(--ok)" : undefined }}
                        onClick={() => !isAdded && handleAddToDirectory(alt)}
                        disabled={isAdding || isAdded}
                      >
                        {isAdded ? "✓ Added" : isAdding ? "Adding…" : "Add to Directory"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
