"use client";

import { useApp, useSuppliers } from "@/context/AppContext";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MiniDonut, LegendDot, HeatBar, PulseDot, Sparkline, RiskGauge } from "@/components/ui/Charts";
import { RECOVERY_PROFILES, RECOVERY_PROFILES_US } from "@/lib/data";

function alertBadgeClass(type: string) {
  if (type === "risk") return "risk" as const;
  if (type === "contract") return "warn" as const;
  return "info" as const;
}

function riskPillClass(risk: number) {
  return risk >= 70 ? "high" : risk >= 45 ? "med" : "low";
}

// ── CFO Dashboard ─────────────────────────────────────────────────────────────
function CFODashboard() {
  const { setRoute, currency, platformContracts, platformAlerts, clientMode } = useApp();
  const suppliers = useSuppliers();

  const totalExposure = suppliers.reduce((sum, s) => sum + (s.exposure ?? 0), 0);
  const highRisk = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const underObservation = suppliers.filter((s) => s.observation);
  const contractsAtRisk = platformContracts.filter((c) => ["Under Renegotiation", "Pending Renewal"].includes(c.status));
  const tariffExposed = suppliers.filter((s) => s.countryCode && ["CN", "SG", "TW", "VN"].includes(s.countryCode));
  const tariffAnnualImpact = tariffExposed.reduce((sum, s) => sum + (s.spend ?? 0) * (s.countryCode === "CN" ? 0.25 : 0.08), 0);
  const contractValueAtRisk = contractsAtRisk.reduce((sum, c) => {
    const v = parseFloat(c.value.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const riskBands = [
    { label: "High risk", count: suppliers.filter(s => (s.risk ?? 0) >= 65).length, color: "#dc2626" },
    { label: "Medium risk", count: suppliers.filter(s => (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65).length, color: "#d97706" },
    { label: "Low risk", count: suppliers.filter(s => (s.risk ?? 0) < 45).length, color: "#16a34a" },
  ];

  const exposureCategories = [
    { name: "Components", pct: 68 },
    { name: "Raw Materials", pct: 52 },
    { name: "Electronics", pct: 54 },
    { name: "Logistics", pct: 21 },
  ];

  const exposureSparkData = [42, 48, 51, 55, 60, 58, 62, 67, 64, totalExposure];

  // Portfolio avg risk per month from supplier riskHistory (12 monthly points)
  const avgRiskTrend: number[] = Array.from({ length: 12 }, (_, i) => {
    const vals = suppliers.map((s) => s.riskHistory?.[i]).filter((v): v is number => v != null);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  });
  const avgRiskNow = avgRiskTrend[avgRiskTrend.length - 1] || 0;
  const avgRiskDelta = avgRiskNow - (avgRiskTrend[0] || 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hero Banner */}
      <div className="hero-card">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <PulseDot color="#f87171" size={10} />
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: ".05em", textTransform: "uppercase" }}>Portfolio Risk Status</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, letterSpacing: "-1px" }}>{currency}{totalExposure.toFixed(1)}M</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Total supplier exposure at risk</div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "High-risk suppliers", value: String(highRisk.length), color: "#fca5a5" },
                { label: "Contracts at risk", value: String(contractsAtRisk.length), color: "#fde68a" },
                { label: "Under observation", value: String(underObservation.length), color: "#c4b5fd" },
                ...(clientMode === "generic" && tariffExposed.length > 0
                  ? [{ label: "Tariff-exposed", value: String(tariffExposed.length), color: "#fb923c" }]
                  : []),
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4">
        <KpiCardV2
          label="Total Exposure at Risk" value={`${currency}${totalExposure.toFixed(1)}M`}
          sub="Across all active suppliers" accent="var(--risk)"
          trend={-3.2} trendSuffix="%" trendHigherIsBetter={false}
          sparkData={exposureSparkData}
        />
        <KpiCardV2
          label="High-Risk Suppliers" value={String(highRisk.length)}
          sub="Risk score ≥ 65" accent="var(--risk)"
          trend={1} trendSuffix="" trendHigherIsBetter={false}
          icon="⚠️"
        />
        <KpiCardV2
          label="Contract Value at Risk" value={`${currency}${contractValueAtRisk.toFixed(1)}M`}
          sub="Renegotiation or pending renewal" accent="var(--warn)"
          trend={-8} trendSuffix="%" trendHigherIsBetter={false}
        />
        <KpiCardV2
          label="Observation Windows" value={String(underObservation.length)}
          sub="Active 90-day monitoring" accent="var(--info)"
          icon="👁"
        />
        <KpiCardV2
          label="Portfolio Avg Risk" value={String(avgRiskNow)}
          sub="12-month trend across all suppliers"
          accent={avgRiskNow >= 65 ? "var(--risk)" : avgRiskNow >= 45 ? "var(--warn)" : "var(--ok)"}
          trend={avgRiskDelta} trendSuffix=" pts" trendHigherIsBetter={false}
          sparkData={avgRiskTrend}
        />
      </div>

      {/* Tariff Exposure Banner — US mode only */}
      {clientMode === "generic" && tariffExposed.length > 0 && (
        <div className="card" style={{ borderLeft: "4px solid #f97316", background: "rgba(249,115,22,.04)" }}>
          <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#f97316", marginBottom: 4 }}>
                🏛 Tariff Exposure — {tariffExposed.length} Supplier{tariffExposed.length > 1 ? "s" : ""} Affected
              </div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Section 301 and additional US tariffs apply to goods sourced from these suppliers. Estimated annual incremental cost: <b style={{ color: "#f97316" }}>{currency}{tariffAnnualImpact.toFixed(1)}M</b>. Review sourcing strategy and contract cost-pass-through clauses.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tariffExposed.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setRoute("supplier", { id: s.id })}
                    style={{ cursor: "pointer", background: "var(--surface)", border: "1px solid rgba(249,115,22,.3)", borderRadius: 8, padding: "6px 12px", fontSize: 12 }}
                  >
                    <b>{s.name}</b>
                    <span className="muted" style={{ marginLeft: 6 }}>
                      {s.countryCode === "CN" ? "High · Sec. 301" : "Medium · Monitor"}
                    </span>
                    <span style={{ marginLeft: 8, color: "#f97316", fontWeight: 700 }}>
                      {currency}{(s.spend ?? 0).toFixed(1)}M spend
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#f97316" }}>{currency}{tariffAnnualImpact.toFixed(1)}M</div>
              <div className="muted" style={{ fontSize: 11 }}>est. annual tariff cost</div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Distress Signals */}
      {(() => {
        const distressed = suppliers
          .filter(s => s.financialHealth && s.financialHealth.score < 55)
          .sort((a, b) => (a.financialHealth!.score) - (b.financialHealth!.score))
          .slice(0, 4);
        if (!distressed.length) return null;
        const criticalFlags = distressed.flatMap(s =>
          (s.financialHealth?.flags ?? [])
            .filter(f => f.severity === "critical")
            .slice(0, 1)
            .map(f => ({ supplier: s.name, flag: f, id: s.id }))
        );
        return (
          <div className="card" style={{ borderLeft: "4px solid var(--risk)" }}>
            <div className="row" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0 }}>Financial Distress Signals</h2>
                <div className="card-sub" style={{ marginBottom: 0 }}>Balance sheet intelligence — early indicators of supplier financial stress</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--risk)", background: "rgba(217,48,37,.1)", padding: "3px 9px", borderRadius: 5 }}>
                {distressed.length} suppliers flagged
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 14 }}>
              {distressed.map(s => {
                const fh = s.financialHealth!;
                const scoreColor = fh.score < 30 ? "var(--risk)" : "var(--warn)";
                const scoreBg = fh.score < 30 ? "rgba(217,48,37,.08)" : "rgba(208,128,0,.08)";
                return (
                  <div key={s.id}
                    onClick={() => setRoute("supplier", { id: s.id })}
                    style={{ cursor: "pointer", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: scoreBg, border: `2px solid ${scoreColor}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{fh.score}</span>
                      <span style={{ fontSize: 8, color: scoreColor, fontWeight: 700, textTransform: "uppercase" }}>score</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                        {fh.flags.filter(f => f.severity === "critical").length} critical · {fh.flags.filter(f => f.severity === "warn").length} watch
                      </div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1, fontVariantNumeric: "tabular-nums" }}>
                        CCC {fh.cccTrend[fh.cccTrend.length - 1]}d · {fh.netDebtEbitda[fh.netDebtEbitda.length - 1].toFixed(1)}× ND/EBITDA
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {criticalFlags.length > 0 && (
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Critical flags</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {criticalFlags.map((cf, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, alignItems: "flex-start" }}>
                      <span style={{ color: "var(--risk)", flexShrink: 0 }}>⚠</span>
                      <span><b style={{ color: "var(--text)" }}>{cf.supplier}:</b> <span style={{ color: "var(--muted)" }}>{cf.flag.text}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid-32">
        {/* Financial Risk Priority */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>Financial Risk Priority</h2>
              <div className="card-sub" style={{ marginBottom: 0 }}>Suppliers requiring executive attention</div>
            </div>
            <Badge variant="risk">{highRisk.length} critical</Badge>
          </div>
          <div className="list" style={{ marginTop: 0 }}>
            {suppliers
              .filter((s) => (s.risk ?? 0) >= 50)
              .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
              .slice(0, 5)
              .map((s) => (
                <div key={s.id} className="item" onClick={() => setRoute("supplier", { id: s.id })} style={{ cursor: "pointer", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Risk bar indicator */}
                    <div style={{ width: 4, height: 40, borderRadius: 2, background: (s.risk ?? 0) >= 65 ? "var(--risk)" : "var(--warn)", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>
                        {currency}{(s.exposure ?? 0).toFixed(1)}M exposure · {s.category} · Tier {s.tier}
                      </div>
                      <div style={{ marginTop: 5 }}>
                        <HeatBar value={s.risk ?? 0} max={100} showLabel={false} height={5} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className={`risk-pill ${riskPillClass(s.risk ?? 0)}`}>{s.risk}</div>
                      <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>risk score</div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="card">
          <h2>Portfolio Risk Distribution</h2>
          <div className="card-sub">Supplier portfolio breakdown by risk band</div>
          <div className="chart-row" style={{ marginTop: 16 }}>
            <MiniDonut
              segments={riskBands.map(b => ({ value: b.count, color: b.color }))}
              size={110}
              thickness={22}
              label={String(suppliers.length)}
              sublabel="suppliers"
            />
            <div className="chart-legend">
              {riskBands.map(b => (
                <div key={b.label} className="chart-legend-item">
                  <LegendDot color={b.color} label={b.label} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" style={{ margin: "16px 0 12px" }} />
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
            Exposure by Category
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {exposureCategories.map(c => (
              <div key={c.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span>{c.name}</span>
                </div>
                <HeatBar value={c.pct} max={100} height={7} />
              </div>
            ))}
          </div>
          <div className="note">Index derived from spend weighting and credit risk scores.</div>
        </div>
      </div>

      {/* Spend Concentration + Delivery & Quality */}
      <div className="grid-32">
        {/* Spend Concentration */}
        <div className="card">
          <h2>Spend Concentration</h2>
          <div className="card-sub">Portfolio spend by supplier — dependency distribution</div>
          {(() => {
            const totalSpend = suppliers.reduce((sum, s) => sum + (s.spend ?? 0), 0);
            const top = [...suppliers].filter(s => s.spend).sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0)).slice(0, 6);
            const top3Pct = top.slice(0, 3).reduce((sum, s) => sum + (s.spend ?? 0), 0) / totalSpend * 100;
            const maxSpend = top[0]?.spend ?? 1;
            return (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 14 }}>
                  {top.map((s, i) => {
                    const pct = ((s.spend ?? 0) / totalSpend) * 100;
                    const barPct = ((s.spend ?? 0) / maxSpend) * 100;
                    const barColor = pct > 20 ? "var(--risk)" : pct > 14 ? "var(--warn)" : "var(--accent)";
                    return (
                      <div key={s.id} onClick={() => setRoute("supplier", { id: s.id })} style={{ cursor: "pointer" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                          <span style={{ fontWeight: i < 2 ? 650 : 500, color: "var(--text)" }}>{s.name}</span>
                          <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
                            {currency}{(s.spend ?? 0).toFixed(1)}M <b style={{ color: "var(--text)", marginLeft: 4 }}>{pct.toFixed(1)}%</b>
                          </span>
                        </div>
                        <div style={{ height: 6, background: "var(--surface)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${barPct}%`, background: barColor, borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 14, paddingTop: 12, display: "flex", gap: 20 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>Total spend</div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{currency}{totalSpend.toFixed(1)}M</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 2 }}>Top 3 concentration</div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums", color: top3Pct > 60 ? "var(--risk)" : top3Pct > 45 ? "var(--warn)" : "var(--ok)" }}>{top3Pct.toFixed(0)}%</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Delivery & Quality Performance */}
        <div className="card">
          <h2>Delivery & Quality Performance</h2>
          <div className="card-sub">On-time delivery and defect rate vs. SLA thresholds</div>
          {(() => {
            const perf = [...suppliers]
              .filter(s => s.onTime != null || s.qualityPPM != null)
              .sort((a, b) => {
                const scoreA = (a.onTime ?? 100) - (a.qualityPPM ?? 0) / 30;
                const scoreB = (b.onTime ?? 100) - (b.qualityPPM ?? 0) / 30;
                return scoreA - scoreB;
              })
              .slice(0, 7);
            const belowOTD = perf.filter(s => (s.onTime ?? 100) < 95).length;
            const belowPPM = perf.filter(s => (s.qualityPPM ?? 0) > 150).length;
            return (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 56px 72px", gap: 8, fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", paddingBottom: 6, borderBottom: "1px solid var(--line)", marginBottom: 2 }}>
                  <span>Supplier</span>
                  <span style={{ textAlign: "right" }}>OTD</span>
                  <span style={{ textAlign: "right" }}>PPM</span>
                </div>
                {perf.map(s => {
                  const otd = s.onTime ?? 100;
                  const ppm = s.qualityPPM ?? 0;
                  const otdColor = otd >= 95 ? "var(--ok)" : otd >= 90 ? "var(--warn)" : "var(--risk)";
                  const ppmColor = ppm <= 150 ? "var(--ok)" : ppm <= 250 ? "var(--warn)" : "var(--risk)";
                  return (
                    <div key={s.id} onClick={() => setRoute("supplier", { id: s.id })}
                      style={{ display: "grid", gridTemplateColumns: "1fr 56px 72px", gap: 8, fontSize: 12, padding: "7px 0", borderBottom: "1px solid var(--line)", cursor: "pointer", alignItems: "center" }}>
                      <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                      <span style={{ textAlign: "right", fontWeight: 700, color: otdColor, fontVariantNumeric: "tabular-nums" }}>{otd}%</span>
                      <span style={{ textAlign: "right", fontWeight: 700, color: ppmColor, fontVariantNumeric: "tabular-nums" }}>{ppm.toLocaleString()}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, flexWrap: "wrap" }}>
                  {belowOTD > 0 && <span style={{ color: "var(--warn)", fontWeight: 600 }}>{belowOTD} supplier{belowOTD > 1 ? "s" : ""} below 95% OTD</span>}
                  {belowPPM > 0 && <span style={{ color: "var(--warn)", fontWeight: 600 }}>{belowPPM} above 150 PPM</span>}
                  {belowOTD === 0 && belowPPM === 0 && <span style={{ color: "var(--ok)", fontWeight: 600 }}>All suppliers within thresholds</span>}
                </div>
                <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>Thresholds: OTD ≥ 95% · PPM ≤ 150</div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Recovery Time Risk */}
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Recovery Time Risk</h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>Production halt exposure — inventory buffer vs. time to qualify an alternative</div>
          </div>
        </div>
        {(() => {
          const profiles = clientMode === "generic" ? RECOVERY_PROFILES_US : RECOVERY_PROFILES;
          const items = suppliers
            .filter(s => profiles[s.id])
            .map(s => ({ s, rp: profiles[s.id], gap: profiles[s.id].timeToRecover - profiles[s.id].timeToSurvive }))
            .sort((a, b) => b.gap - a.gap);
          if (!items.length) return null;
          const maxTTR = Math.max(...items.map(i => i.rp.timeToRecover));
          const criticalGaps = items.filter(i => i.gap > 60 && !i.rp.alternativeQualified).length;
          return (
            <div>
              {criticalGaps > 0 && (
                <div style={{ background: "rgba(217,48,37,.06)", border: "1px solid rgba(217,48,37,.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "var(--risk)", fontWeight: 600 }}>
                  ⚠ {criticalGaps} solo-sourced supplier{criticalGaps > 1 ? "s" : ""} with &gt;60-day unhedged production halt risk
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {items.map(({ s, rp, gap }) => {
                  const ttsPct = (rp.timeToSurvive / maxTTR) * 100;
                  const gapPct = (Math.max(gap, 0) / maxTTR) * 100;
                  const gapColor = gap > 60 ? "var(--risk)" : gap > 30 ? "var(--warn)" : "var(--ok)";
                  const gapBg = gap > 60 ? "rgba(217,48,37,.2)" : gap > 30 ? "rgba(208,128,0,.15)" : "rgba(13,148,102,.1)";
                  return (
                    <div key={s.id} onClick={() => setRoute("supplier", { id: s.id })} style={{ cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12, flexWrap: "wrap", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 650 }}>{s.name}</span>
                          {!rp.alternativeQualified && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--risk)", background: "rgba(217,48,37,.08)", padding: "1px 5px", borderRadius: 3 }}>Solo sourced</span>
                          )}
                          {rp.alternativeQualified && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ok)", background: "rgba(13,148,102,.08)", padding: "1px 5px", borderRadius: 3 }}>Alt. qualified</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--muted)" }}>
                          <span>Buffer <b style={{ color: "var(--ok)", fontVariantNumeric: "tabular-nums" }}>{rp.timeToSurvive}d</b></span>
                          <span>TTR <b style={{ color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>{rp.timeToRecover}d</b></span>
                          {gap > 0 && <span style={{ fontWeight: 700, color: gapColor }}>Gap <span style={{ fontVariantNumeric: "tabular-nums" }}>{gap}d</span></span>}
                        </div>
                      </div>
                      <div style={{ height: 10, background: "var(--surface)", borderRadius: 5, display: "flex", overflow: "hidden" }}>
                        <div style={{ width: `${ttsPct}%`, height: "100%", background: "var(--ok)", borderRadius: gap > 0 ? "5px 0 0 5px" : 5 }} />
                        {gap > 0 && <div style={{ width: `${gapPct}%`, height: "100%", background: gapBg, borderRight: `2px solid ${gapColor}` }} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "var(--ok)" }} /><span style={{ color: "var(--muted)" }}>Inventory buffer (TTS)</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: "rgba(217,48,37,.2)", border: "1px solid var(--risk)" }} /><span style={{ color: "var(--muted)" }}>Production halt gap</span></div>
                <span style={{ color: "var(--muted)" }}>TTR = days to qualify alternative · Gap = confirmed halt if supplier fails today</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Contracts Table */}
      <div className="card">
        <h2>Contracts Requiring Attention</h2>
        <div className="card-sub">Renewals and renegotiations in progress</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Supplier</th><th>Contract</th><th>Value</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {contractsAtRisk.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.supplierName}</b></td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.title}</td>
                  <td>{c.value}</td>
                  <td>{c.expires}</td>
                  <td><Badge variant={c.status === "Under Renegotiation" ? "risk" : "warn"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Recent Alerts</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PulseDot color="var(--risk)" />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{platformAlerts.length} active</span>
          </div>
        </div>
        <div className="timeline">
          {platformAlerts.map((a, i) => (
            <div key={a.id} className="timeline-item">
              <div className="timeline-track">
                <div className="timeline-dot" style={{ background: a.type === "risk" ? "var(--risk)" : a.type === "contract" ? "var(--warn)" : "var(--info)" }} />
                {i < platformAlerts.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-body">
                <div
                  className="alert-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => setRoute("supplier", { id: a.supplierId })}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Badge variant={alertBadgeClass(a.type)}>{a.type.toUpperCase()}</Badge>
                      <span className="muted" style={{ fontSize: 11 }}>{a.date}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>{a.text}</div>
                  </div>
                  <span style={{ color: "var(--muted)", flexShrink: 0 }}>›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Procurement Dashboard ─────────────────────────────────────────────────────
function ProcurementDashboard() {
  const { setRoute, currency, platformContracts, platformCrisisRooms, platformShipments, platformAlerts } = useApp();
  const suppliers = useSuppliers();

  const renewalsDue = platformContracts.filter((c) => ["Pending Renewal", "Under Renegotiation"].includes(c.status));
  const lowOnTime = suppliers.filter((s) => s.onTime != null && s.onTime < 95);
  const openCrisis = platformCrisisRooms.filter((c) => c.status === "Open");
  const atRiskShipments = platformShipments.filter((s) => s.status !== "On Track");

  // Derive operational priority items dynamically from current platform suppliers
  const stateOrder: Record<string, number> = { "ESCALATED": 0, "MITIGATION IN PROGRESS": 1, "UNDER OBSERVATION": 2 };
  const opItems = suppliers
    .filter((s) => s.riskState && s.riskState !== "STABLE")
    .sort((a, b) => (stateOrder[a.riskState ?? ""] ?? 3) - (stateOrder[b.riskState ?? ""] ?? 3))
    .slice(0, 5)
    .map((s) => {
      const latestAlert = s.alerts?.[0]?.text;
      const observation = s.observation ? `Observation Day ${s.observation.day}/${s.observation.total} — ` : "";
      const meta = latestAlert ?? `${observation}Risk score ${s.risk} · ${s.riskState?.toLowerCase()}`;
      const isEscalated = s.riskState === "ESCALATED";
      const isMitigation = s.riskState === "MITIGATION IN PROGRESS";
      return {
        id: s.id,
        label: s.name,
        meta,
        badge: isEscalated ? "Escalated" : isMitigation ? "Mitigation" : "Observation",
        cls: (isEscalated ? "risk" : "warn") as "risk" | "warn" | "info",
        urgent: isEscalated,
      };
    });
  const urgentCount = opItems.filter((p) => p.urgent).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hero Banner */}
      <div className="hero-card">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <PulseDot color="#fbbf24" size={10} />
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: ".05em", textTransform: "uppercase" }}>Operations Status</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{renewalsDue.length}</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Contract renewals requiring action</div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                { label: "Crisis rooms open", value: String(openCrisis.length), color: "#fca5a5" },
                { label: "Shipments at risk", value: String(atRiskShipments.length), color: "#fde68a" },
                { label: "Delivery rate <95%", value: String(lowOnTime.length), color: "#c4b5fd" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <KpiCardV2 label="Contract Renewals Due" value={String(renewalsDue.length)} sub="Within 90 days" accent="var(--warn)" trend={2} trendSuffix="" trendHigherIsBetter={false} icon="📄" />
        <KpiCardV2 label="On-Time Rate <95%" value={String(lowOnTime.length)} sub="Suppliers below threshold" accent="var(--warn)" icon="⏱" />
        <KpiCardV2 label="Active Crisis Rooms" value={String(openCrisis.length)} sub="Requiring action" accent="var(--risk)" icon="🚨" />
        <KpiCardV2 label="Shipments at Risk" value={String(atRiskShipments.length)} sub="Delayed or customs hold" accent="var(--risk)" trend={-1} trendSuffix="" trendHigherIsBetter={false} />
      </div>

      <div className="grid-32">
        {/* Operational Priority */}
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>Operational Priority</h2>
              <div className="card-sub" style={{ marginBottom: 0 }}>Suppliers needing procurement action now</div>
            </div>
            <Badge variant="risk">{urgentCount} urgent</Badge>
          </div>
          <div className="timeline">
            {opItems.map((p, i) => (
              <div key={p.id} className="timeline-item">
                <div className="timeline-track">
                  <div className="timeline-dot" style={{ background: p.urgent ? "var(--risk)" : p.cls === "warn" ? "var(--warn)" : "var(--info)" }} />
                  {i < opItems.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-body">
                  <div className="alert-item" style={{ cursor: "pointer" }} onClick={() => setRoute("supplier", { id: p.id })}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{p.label}</span>
                        {p.urgent && <span style={{ fontSize: 10, fontWeight: 700, color: "var(--risk)", background: "rgba(220,38,38,.1)", padding: "1px 6px", borderRadius: 999 }}>URGENT</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 12 }}>{p.meta}</div>
                      <div style={{ marginTop: 5 }}><Badge variant={p.cls}>{p.badge}</Badge></div>
                    </div>
                    <span style={{ color: "var(--muted)", flexShrink: 0, marginTop: 4 }}>›</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment Tracker */}
        <div className="card">
          <h2>Shipment Tracker</h2>
          <div className="card-sub">Active inbound shipments</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {platformShipments.map((s) => {
              const isOk = s.status === "On Track";
              const isRisk = s.status === "Customs Hold" || s.status === "Delayed";
              const color = isRisk ? "var(--risk)" : isOk ? "var(--ok)" : "var(--warn)";
              return (
                <div key={s.id} className="box" style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: color, minHeight: 32, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span className="mono" style={{ fontSize: 11 }}>{s.id}</span>
                        <Badge variant={isRisk ? "risk" : isOk ? "ok" : "warn"}>{s.status}</Badge>
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                        {s.origin} → {s.destination} · ETA {s.eta}
                        {s.delayDays ? <span style={{ color: "var(--risk)", fontWeight: 700 }}> · +{s.delayDays}d delay</span> : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contracts Pipeline */}
      <div className="card">
        <h2>Contract Renewals Pipeline</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Supplier</th><th>Contract</th><th>Value</th><th>Expires</th><th>Auto-Renew</th><th>Status</th></tr>
            </thead>
            <tbody>
              {platformContracts.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.supplierName}</b></td>
                  <td className="mono" style={{ fontSize: 12 }}>{c.title}</td>
                  <td>{c.value}</td>
                  <td>{c.expires}</td>
                  <td>{c.autoRenew ? <Badge variant="ok">Yes</Badge> : <Badge variant="muted-b">No</Badge>}</td>
                  <td><Badge variant={c.status === "Under Renegotiation" ? "risk" : c.status === "Pending Renewal" ? "warn" : "ok"}>{c.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Analyst Dashboard ─────────────────────────────────────────────────────────
function AnalystDashboard() {
  const { setRoute, currency, platformAlerts, clientMode } = useApp();
  const suppliers = useSuppliers();

  const avgRisk = suppliers.length
    ? Math.round(suppliers.reduce((s, x) => s + (x.risk ?? 0), 0) / suppliers.length)
    : 0;
  const csdddNonCompliant = suppliers.filter((s) => s.esg && !["Compliant"].includes(String(s.esg.csdddStatus)));
  const uflpaNonCompliant = suppliers.filter((s) => s.esg?.uflpaStatus && !["Compliant", "N/A"].includes(String(s.esg.uflpaStatus)));
  const highSpend = suppliers.filter((s) => (s.spend ?? 0) >= 10);
  const elevatedDPS = suppliers.filter((s) => (s.risk ?? 0) >= 50);

  const riskBands = [
    { label: "Low (0–34)",    count: suppliers.filter((s) => (s.risk ?? 0) < 35).length,                                    color: "#16a34a" },
    { label: "Med (35–64)",   count: suppliers.filter((s) => (s.risk ?? 0) >= 35 && (s.risk ?? 0) < 65).length,           color: "#d97706" },
    { label: "High (65+)",    count: suppliers.filter((s) => (s.risk ?? 0) >= 65).length,                                   color: "#dc2626" },
  ];

  const avgSparkData = [38, 40, 41, 39, 43, 44, 42, 45, avgRisk];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Hero Banner */}
      <div className="hero-card">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <PulseDot color="#a5b4fc" size={10} />
            <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: ".05em", textTransform: "uppercase" }}>Risk Intelligence Dashboard</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{avgRisk}</div>
              <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Portfolio average risk score</div>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[
                clientMode === "generic"
                  ? { label: "UFLPA non-compliant", value: String(uflpaNonCompliant.length), color: "#fca5a5" }
                  : { label: "CSDDD non-compliant", value: String(csdddNonCompliant.length), color: "#fca5a5" },
                { label: "Elevated DPS (≥50)", value: String(elevatedDPS.length), color: "#fde68a" },
                { label: "High-spend suppliers", value: String(highSpend.length), color: "#c4b5fd" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-4">
        <KpiCardV2 label="Average Risk Score" value={String(avgRisk)} sub="Across all suppliers" accent={avgRisk >= 65 ? "var(--risk)" : avgRisk >= 45 ? "var(--warn)" : "var(--ok)"} trend={3} trendSuffix="" trendHigherIsBetter={false} sparkData={avgSparkData} />
        <KpiCardV2
          label={clientMode === "generic" ? "UFLPA Non-Compliant" : "CSDDD Non-Compliant"}
          value={clientMode === "generic" ? String(uflpaNonCompliant.length) : String(csdddNonCompliant.length)}
          sub="Suppliers requiring action" accent="var(--risk)" icon="🌿"
        />
        <KpiCardV2 label="High-Spend Suppliers" value={String(highSpend.length)} sub={`Annual spend ≥ ${currency}10M`} accent="var(--accent)" icon="💰" />
        <KpiCardV2 label="Elevated DPS" value={String(elevatedDPS.length)} sub="Risk score ≥ 50" accent="var(--warn)" trend={1} trendSuffix="" trendHigherIsBetter={false} />
      </div>

      <div className="grid-32">
        {/* Risk Signal Analysis */}
        <div className="card">
          <h2>Risk Signal Analysis</h2>
          <div className="card-sub">Suppliers sorted by composite risk indicators</div>
          <div className="list" style={{ marginTop: 0 }}>
            {suppliers
              .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
              .map((s) => {
                const sparkValues = s.ratios
                  ? [s.ratios.currentRatio * 30, s.ratios.netProfitMargin * 200, 50, (s.risk ?? 0)]
                  : [40, 45, 50, (s.risk ?? 0)];
                const col = (s.risk ?? 0) >= 65 ? "#dc2626" : (s.risk ?? 0) >= 40 ? "#d97706" : "#16a34a";
                return (
                  <div key={s.id} className="item" onClick={() => setRoute("supplier", { id: s.id })} style={{ cursor: "pointer", padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 4, height: 40, borderRadius: 2, background: col, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>
                          {s.ratios
                            ? `D/E ${s.ratios.debtToEquity.toFixed(2)} · Margin ${(s.ratios.netProfitMargin * 100).toFixed(1)}% · CR ${s.ratios.currentRatio.toFixed(2)}`
                            : `On-time ${s.onTime ?? "—"}% · PPM ${s.qualityPPM ?? "—"}`}
                        </div>
                        <div style={{ marginTop: 5 }}>
                          <HeatBar value={s.risk ?? 0} max={100} showLabel={false} height={4} />
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        <Sparkline data={sparkValues} color={col} height={22} width={55} filled={false} />
                        <div className={`risk-pill ${riskPillClass(s.risk ?? 0)}`}>{s.risk ?? "—"}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Risk Distribution + ESG */}
        <div className="card">
          <h2>Risk Distribution</h2>
          <div className="card-sub">Portfolio breakdown by risk band</div>

          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 8px" }}>
            <RiskGauge value={avgRisk} size={150} />
          </div>

          <div className="chart-row" style={{ marginTop: 16 }}>
            <MiniDonut
              segments={riskBands.map(b => ({ value: b.count, color: b.color }))}
              size={90}
              thickness={18}
              label={String(suppliers.length)}
              sublabel="total"
            />
            <div className="chart-legend">
              {riskBands.map(b => (
                <div key={b.label} className="chart-legend-item">
                  <LegendDot color={b.color} label={b.label} />
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{b.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="divider" style={{ margin: "14px 0 10px" }} />
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>
            {clientMode === "generic" ? "UFLPA Compliance Status" : "ESG CSDDD Status"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {suppliers.filter((s) => s.esg).map((s) => {
              const status = clientMode === "generic"
                ? (s.esg!.uflpaStatus ?? "N/A")
                : s.esg!.csdddStatus;
              const variant = status === "Compliant" ? "ok" as const
                : status === "Non-Compliant" ? "risk" as const
                : status === "Under Review" ? "risk" as const
                : status === "N/A" ? "muted-b" as const
                : "warn" as const;
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 12 }}>{s.name}</span>
                  <Badge variant={variant}>{status}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Recent Alerts</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PulseDot color="var(--risk)" />
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{platformAlerts.length} active</span>
          </div>
        </div>
        <div className="timeline">
          {platformAlerts.map((a, i) => (
            <div key={a.id} className="timeline-item">
              <div className="timeline-track">
                <div className="timeline-dot" style={{ background: a.type === "risk" ? "var(--risk)" : a.type === "contract" ? "var(--warn)" : "var(--info)" }} />
                {i < platformAlerts.length - 1 && <div className="timeline-line" />}
              </div>
              <div className="timeline-body">
                <div className="alert-item" style={{ cursor: "pointer" }} onClick={() => setRoute("supplier", { id: a.supplierId })}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <Badge variant={alertBadgeClass(a.type)}>{a.type.toUpperCase()}</Badge>
                      <span className="muted" style={{ fontSize: 11 }}>{a.date}</span>
                    </div>
                    <div style={{ fontSize: 13 }}>{a.text}</div>
                  </div>
                  <span style={{ color: "var(--muted)", flexShrink: 0 }}>›</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard (role router) ──────────────────────────────────────────────
export function Dashboard() {
  const { role } = useApp();
  if (role === "CFO") return <CFODashboard />;
  if (role === "Procurement") return <ProcurementDashboard />;
  return <AnalystDashboard />;
}
