"use client";

import { useApp } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { calcDPS, trendLabel, buildDE, buildPM, buildOCF, getRec } from "@/lib/analytics";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function Analytics() {
  const { simulatedEscalation } = useApp();

  function trendVariant(t: string) {
    if (t === "Improving") return "ok" as const;
    if (t === "Deteriorating") return "risk" as const;
    return "muted-b" as const;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Avg. DPS (Portfolio)" value="42%" sub="Across 8 governed suppliers" />
        <KpiCard label="High-risk Suppliers" value="2" sub="Risk score ≥ 70" />
        <KpiCard label="Estimated Downside" value="$8.3M" sub="95th pct stress case" />
        <KpiCard label="Mitigated Exposure" value="$5.1M" sub="Through renegotiation actions" />
      </div>

      <div className="card">
        <h2>Portfolio Risk Breakdown</h2>
        <div className="card-sub">Disruption probability by supplier.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
          {suppliersAll.slice(0, 6).map((s) => {
            const dps = calcDPS(s);
            const col = dps >= 55 ? "var(--risk)" : dps >= 30 ? "var(--warn)" : "var(--ok)";
            return (
              <div key={s.id}>
                <div className="row" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.name}</span>
                  <span className="mono" style={{ color: col }}>{dps}%</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${dps}%`, background: col }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>What-If Scenario Modeling</h2>
        <div className="card-sub">Disruption what-if (risk), not demand forecasting.</div>
        <div className="kv">
          <div className="box">
            Scenario: Lose Tier-1 supplier
            <b>Impact: +$14.2M exposure</b>
            <span className="muted" style={{ fontSize: 12 }}>Ramp time: 90 days · Confidence: Medium</span>
          </div>
          <div className="box">
            Scenario: Port congestion +14 days
            <b>Impact: +$2.8M delay costs</b>
            <span className="muted" style={{ fontSize: 12 }}>Probability: 28% · 3 affected routes</span>
          </div>
          <div className="box">
            Scenario: Supplier liquidity crisis
            <b>Impact: +$4.6M at risk</b>
            <span className="muted" style={{ fontSize: 12 }}>Current ratio trigger: &lt; 1.0</span>
          </div>
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          Scenario outputs are illustrative. In production, calibrated using live financial feeds and Monte Carlo models.
        </div>
      </div>

      <div className="card">
        <h2>Portfolio Trend Signals</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>D/E Trend</th>
                <th>Margin Trend</th>
                <th>OCF Trend</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {suppliersAll.slice(0, 5).map((s) => {
                const de = trendLabel(buildDE(s), false);
                const pm = trendLabel(buildPM(s), true);
                const ocf = trendLabel(buildOCF(s), true);
                const rec = getRec(s, simulatedEscalation);
                return (
                  <tr key={s.id}>
                    <td><b>{s.name}</b></td>
                    <td><Badge variant={trendVariant(de)}>{de}</Badge></td>
                    <td><Badge variant={trendVariant(pm)}>{pm}</Badge></td>
                    <td><Badge variant={trendVariant(ocf)}>{ocf}</Badge></td>
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
