"use client";

import { Supplier } from "@/types";
import { computeResiliency } from "@/lib/analytics";
import { InfoTip } from "@/components/ui/InfoTip";

interface ResiliencyCardProps {
  supplier: Supplier;
}

function scoreColor(v: number) {
  if (v >= 7.5) return "var(--ok)";
  if (v >= 5) return "var(--warn)";
  return "var(--risk)";
}

const DIM_TIPS: Record<string, string> = {
  Transparency:    "Willingness to share data about sub-tier suppliers, financial health, and operational capacity. Higher scores indicate greater data-sharing maturity.",
  Network:         "Depth of sub-tier supply chain mapping — how well-understood the extended supply chain is beyond Tier 1. Low scores indicate unknown Tier 2/3 dependencies.",
  Continuity:      "Business continuity plan (BCP) coverage — whether the supplier has documented, tested recovery plans for key disruption scenarios including natural disaster, fire, and cyber.",
  Performance:     "Operational delivery track record — on-time in full (OTIF) history, quality PPM trend, and contractual SLA compliance over the past 12 months.",
  "SCRM Maturity": "Supply Chain Risk Management program maturity — how sophisticated and embedded the supplier's own risk management processes are, including board-level oversight.",
};

function ScoreDim({ label, value, derived }: { label: string; value: number; derived?: boolean }) {
  const col = scoreColor(value);
  return (
    <div className="box">
      <div className="muted" style={{ fontSize: 11, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        {DIM_TIPS[label] && <InfoTip text={DIM_TIPS[label]} width={220} />}
        {derived && (
          <span style={{ fontSize: 9, background: "var(--accent)", color: "#fff", borderRadius: 3, padding: "1px 4px", fontWeight: 700, letterSpacing: ".02em" }}>
            LIVE
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{value.toFixed(1)}</div>
      <div className="progress" style={{ marginTop: 6, height: 4 }}>
        <div className="progress-fill" style={{ width: `${(value / 10) * 100}%`, background: col }} />
      </div>
    </div>
  );
}

// Derive Performance score from live OTIF + PPM — mirrors computeResiliency logic
function derivePerformance(s: Supplier): { score: number; derived: boolean } {
  if (s.resiliency?.performance != null) return { score: s.resiliency.performance, derived: false };
  const ot = s.onTime ?? 90;
  const otScore = ot >= 98 ? 9.5 : ot >= 95 ? 8.0 : ot >= 92 ? 6.5 : ot >= 90 ? 5.5 : ot >= 85 ? 3.5 : 2.0;
  const ppm = s.qualityPPM ?? 300;
  const ppmScore = ppm <= 75 ? 9.5 : ppm <= 150 ? 8.0 : ppm <= 250 ? 6.5 : ppm <= 400 ? 5.0 : ppm <= 600 ? 3.5 : 2.0;
  return { score: (otScore + ppmScore) / 2, derived: true };
}

export function ResiliencyCard({ supplier }: ResiliencyCardProps) {
  const { resiliency: r } = supplier;
  if (!r) return null;

  const overall = computeResiliency(supplier) ?? 5;
  const { score: perfScore, derived: perfDerived } = derivePerformance(supplier);
  const col = scoreColor(overall);
  const label = overall >= 7.5 ? "Resilient" : overall >= 5 ? "Moderate" : "Fragile";

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Resiliency Score</h2>
            <InfoTip
              text="5-dimension composite score. Weights: Performance 30% · Continuity 25% · Network 20% · SCRM Maturity 15% · Transparency 10%. Performance is computed live from OTIF and quality PPM data; other dimensions are quarterly-assessed values. Scored 1–10; below 5 indicates fragile supply continuity."
              width={270}
            />
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Assessed dimensions updated {r.lastUpdated} · Performance derived from live OTIF/PPM
          </div>
        </div>
        <div className="dps-hero" style={{ minWidth: 160 }}>
          <div>
            <div className="dps-label">R Score</div>
            <div className="dps-score" style={{ fontSize: 36, color: col }}>{overall.toFixed(1)}</div>
            <div className="muted" style={{ fontSize: 10 }}>out of 10</div>
          </div>
          <div className={`dps-pill ${overall >= 7.5 ? "low" : overall >= 5 ? "med" : "high"}`}>
            {label.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        <ScoreDim label="Transparency" value={r.transparency} />
        <ScoreDim label="Network" value={r.network} />
        <ScoreDim label="Continuity" value={r.continuity} />
        <ScoreDim label="Performance" value={perfScore} derived={perfDerived} />
        <ScoreDim label="SCRM Maturity" value={r.maturity} />
      </div>

      <div className="note" style={{ marginTop: 10 }}>
        Weights: Performance 30% (OTIF + PPM) · Continuity 25% (BCP) · Network 20% (sub-tier mapping) · SCRM Maturity 15% · Transparency 10% (data sharing).
        {perfDerived && " Performance marked LIVE — computed from on-time delivery and quality PPM rather than a quarterly assessment."}
      </div>
    </div>
  );
}
