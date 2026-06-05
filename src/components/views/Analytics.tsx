"use client";

import { useApp, useSuppliers } from "@/context/AppContext";
import { calcDPS, trendLabel, buildDE, buildPM, buildOCF, getRec } from "@/lib/analytics";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MiniDonut, LegendDot, HeatBar, Sparkline, TrendPill } from "@/components/ui/Charts";

export function Analytics() {
  const { simulatedEscalation, platformBenchmarks, currency } = useApp();
  const suppliersAll = useSuppliers();

  function trendVariant(t: string) {
    if (t === "Improving") return "ok" as const;
    if (t === "Deteriorating") return "risk" as const;
    return "muted-b" as const;
  }

  const highRisk = suppliersAll.filter(s => calcDPS(s) >= 55).length;
  const medRisk = suppliersAll.filter(s => calcDPS(s) >= 30 && calcDPS(s) < 55).length;
  const lowRisk = suppliersAll.filter(s => calcDPS(s) < 30).length;

  const riskSegments = [
    { value: highRisk, color: "#dc2626" },
    { value: medRisk, color: "#d97706" },
    { value: lowRisk, color: "#16a34a" },
  ];

  const scenarioData = [
    { label: "Lose Tier-1 supplier", impact: `+${currency}14.2M exposure`, probability: "High", confidence: "Medium", bars: 85 },
    { label: "Port congestion +14 days", impact: `+${currency}2.8M delay costs`, probability: "28%", confidence: "High", bars: 28 },
    { label: "Supplier liquidity crisis", impact: `+${currency}4.6M at risk`, probability: "Medium", confidence: "Medium", bars: 50 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCardV2
          label="Avg. DPS (Portfolio)" value="42%"
          sub="Across 8 governed suppliers" accent="var(--warn)"
          trend={-3} trendSuffix="%" trendHigherIsBetter={false}
          sparkData={[38, 40, 44, 41, 43, 45, 42, 42]}
        />
        <KpiCardV2
          label="High-risk Suppliers" value={String(highRisk)}
          sub="DPS score ≥ 55" accent="var(--risk)"
          icon="⚠️"
        />
        <KpiCardV2
          label="Estimated Downside" value={`${currency}8.3M`}
          sub="95th pct stress case" accent="var(--risk)"
          trend={-5} trendSuffix="%" trendHigherIsBetter={false}
        />
        <KpiCardV2
          label="Mitigated Exposure" value={`${currency}5.1M`}
          sub="Through renegotiation actions" accent="var(--ok)"
          trend={12} trendSuffix="%" trendHigherIsBetter={true}
        />
      </div>

      {/* Portfolio Risk Breakdown */}
      <div className="grid-32">
        <div className="card">
          <h2>Portfolio Risk Breakdown</h2>
          <div className="card-sub">Disruption probability score (DPS) by supplier</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
            {suppliersAll.slice(0, 7).map((s) => {
              const dps = calcDPS(s);
              const col = dps >= 55 ? "#dc2626" : dps >= 30 ? "#d97706" : "#16a34a";
              const fade = dps >= 55 ? "rgba(220,38,38,.35)" : dps >= 30 ? "rgba(217,119,6,.35)" : "rgba(22,163,74,.35)";
              const sparkD = [dps * 0.6, dps * 0.75, dps * 0.85, dps * 0.92, dps];
              return (
                <div key={s.id}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</span>
                      <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>Tier {s.tier} · {s.region}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Sparkline data={sparkD} color={col} height={18} width={45} filled={false} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: col, minWidth: 36, textAlign: "right" }}>{dps}%</span>
                    </div>
                  </div>
                  <div className="gbar-wrap">
                    <div className="gbar-fill" style={{ width: `${dps}%`, background: `linear-gradient(90deg, ${fade}, ${col})` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card">
          <h2>DPS Distribution</h2>
          <div className="card-sub">Portfolio split by disruption risk band</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
            <MiniDonut
              segments={riskSegments}
              size={130}
              thickness={26}
              label={String(suppliersAll.length)}
              sublabel="suppliers"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
            {[
              { label: "High DPS (≥55%)", count: highRisk, color: "#dc2626", pct: Math.round(highRisk / suppliersAll.length * 100) },
              { label: "Medium DPS (30–54%)", count: medRisk, color: "#d97706", pct: Math.round(medRisk / suppliersAll.length * 100) },
              { label: "Low DPS (<30%)", count: lowRisk, color: "#16a34a", pct: Math.round(lowRisk / suppliersAll.length * 100) },
            ].map(b => (
              <div key={b.label}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <LegendDot color={b.color} label={b.label} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: b.color }}>{b.count} ({b.pct}%)</span>
                </div>
                <HeatBar value={b.pct} max={100} showLabel={false} height={5} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What-If Scenarios */}
      <div className="card">
        <h2>What-If Scenario Modeling</h2>
        <div className="card-sub">Disruption impact scenarios — not demand forecasting</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 14 }}>
          {scenarioData.map((sc, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, background: "var(--surface)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>
                Scenario {i + 1}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{sc.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--risk)", marginBottom: 8 }}>{sc.impact}</div>
              <div style={{ marginBottom: 4 }}>
                <HeatBar value={sc.bars} max={100} height={6} />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                <span className="muted" style={{ fontSize: 11 }}>Probability: <b>{sc.probability}</b></span>
                <span className="muted" style={{ fontSize: 11 }}>Confidence: <b>{sc.confidence}</b></span>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          Scenario outputs are illustrative. In production, calibrated using live financial feeds and Monte Carlo models.
        </div>
      </div>

      {/* Industry Benchmarking */}
      <div className="card">
        <h2>Industry Benchmarking</h2>
        <div className="card-sub">
          Portfolio performance vs. HVAC sector peers · D&B + S&P Industry Analytics
        </div>
        <div style={{ overflowX: "auto", marginTop: 14 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Sector</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Avg Risk Score</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Avg DPS</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>On-Time %</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Avg ESG</th>
                <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", borderBottom: "1px solid var(--line)" }}>Sample</th>
              </tr>
            </thead>
            <tbody>
              {platformBenchmarks.map((b, i) => {
                const isPortfolio = i === 0;
                return (
                  <tr key={i} style={{ background: isPortfolio ? "rgba(37,99,235,.05)" : undefined }}>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", fontWeight: isPortfolio ? 800 : 600, fontSize: 13, color: isPortfolio ? "var(--accent)" : "var(--text)" }}>
                      {isPortfolio ? "🏆 " : ""}{b.sector}
                      {isPortfolio && <div style={{ fontSize: 10, color: "var(--accent)", fontWeight: 500 }}>Your portfolio</div>}
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontWeight: 700, color: b.avgRiskScore >= 55 ? "var(--risk)" : b.avgRiskScore >= 40 ? "var(--warn)" : "var(--ok)" }}>
                          {b.avgRiskScore}
                        </span>
                        <HeatBar value={b.avgRiskScore} max={100} height={5} showLabel={false} />
                      </div>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", fontWeight: 600 }}>
                      {b.avgDPS}%
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ fontWeight: 700, color: b.avgOnTime >= 95 ? "var(--ok)" : b.avgOnTime >= 88 ? "var(--warn)" : "var(--risk)" }}>
                        {b.avgOnTime}%
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ fontWeight: 700, color: b.avgESGScore >= 70 ? "var(--ok)" : b.avgESGScore >= 55 ? "var(--warn)" : "var(--risk)" }}>
                        {b.avgESGScore}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", borderBottom: "1px solid var(--line)", color: "var(--muted)", fontSize: 12 }}>
                      {b.sampleSize.toLocaleString()} suppliers
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          Benchmarks sourced from D&B Industry Analytics and S&P Supply Chain Intelligence · updated quarterly.
        </div>
      </div>

      {/* Portfolio Trend Signals */}
      <div className="card">
        <h2>Portfolio Trend Signals</h2>
        <div className="card-sub">Financial trend direction per supplier — trailing 3 years quarterly data</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>D/E Trend</th>
                <th>Margin Trend</th>
                <th>OCF Trend</th>
                <th>3Y DPS Trend</th>
                <th>Recommended Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliersAll.slice(0, 6).map((s) => {
                const de = trendLabel(buildDE(s), false);
                const pm = trendLabel(buildPM(s), true);
                const ocf = trendLabel(buildOCF(s), true);
                const rec = getRec(s, simulatedEscalation);
                const dps = calcDPS(s);
                const dpsSpark = [dps * 0.75, dps * 0.82, dps * 0.9, dps * 0.95, dps];
                const col = dps >= 55 ? "#dc2626" : dps >= 30 ? "#d97706" : "#16a34a";
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>Tier {s.tier}</div>
                    </td>
                    <td>
                      <Badge variant={trendVariant(de)}>{de === "Improving" ? "↓ Improving" : de === "Deteriorating" ? "↑ Worsening" : "→ Stable"}</Badge>
                    </td>
                    <td>
                      <Badge variant={trendVariant(pm)}>{pm === "Improving" ? "↑ Improving" : pm === "Deteriorating" ? "↓ Worsening" : "→ Stable"}</Badge>
                    </td>
                    <td>
                      <Badge variant={trendVariant(ocf)}>{ocf === "Improving" ? "↑ Improving" : ocf === "Deteriorating" ? "↓ Worsening" : "→ Stable"}</Badge>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Sparkline data={dpsSpark} color={col} height={20} width={50} filled={false} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: col }}>{dps}%</span>
                      </div>
                    </td>
                    <td>
                      <Badge
                        variant={rec.action === "Find secondary source" ? "risk" : rec.action === "Renegotiation of contract" ? "warn" : "ok"}
                        style={{ fontSize: 11 }}
                      >
                        {rec.action}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
