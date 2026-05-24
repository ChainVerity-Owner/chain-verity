"use client";

import { Supplier } from "@/types";

interface ResiliencyCardProps {
  supplier: Supplier;
}

function scoreColor(v: number) {
  if (v >= 7.5) return "var(--ok)";
  if (v >= 5) return "var(--warn)";
  return "var(--risk)";
}

function ScoreDim({ label, value }: { label: string; value: number }) {
  const col = scoreColor(value);
  return (
    <div className="box">
      <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{value.toFixed(1)}</div>
      <div className="progress" style={{ marginTop: 6, height: 4 }}>
        <div className="progress-fill" style={{ width: `${(value / 10) * 100}%`, background: col }} />
      </div>
    </div>
  );
}

export function ResiliencyCard({ supplier }: ResiliencyCardProps) {
  const { resiliency: r } = supplier;
  if (!r) return null;

  const col = scoreColor(r.overall);
  const label = r.overall >= 7.5 ? "Resilient" : r.overall >= 5 ? "Moderate" : "Fragile";

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Resiliency Score</h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            5-dimension composite score · Updated {r.lastUpdated} · Resilinc R Score methodology
          </div>
        </div>
        <div className="dps-hero" style={{ minWidth: 160 }}>
          <div>
            <div className="dps-label">R Score</div>
            <div className="dps-score" style={{ fontSize: 36, color: col }}>{r.overall.toFixed(1)}</div>
            <div className="muted" style={{ fontSize: 10 }}>out of 10</div>
          </div>
          <div className={`dps-pill ${r.overall >= 7.5 ? "low" : r.overall >= 5 ? "med" : "high"}`}>
            {label.toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        <ScoreDim label="Transparency" value={r.transparency} />
        <ScoreDim label="Network" value={r.network} />
        <ScoreDim label="Continuity" value={r.continuity} />
        <ScoreDim label="Performance" value={r.performance} />
        <ScoreDim label="SCRM Maturity" value={r.maturity} />
      </div>

      <div className="note" style={{ marginTop: 10 }}>
        R Score components: Transparency (data sharing), Network (multi-tier mapping depth), Continuity (BCP coverage), Performance (OTIF/quality history), SCRM Maturity (program capability). Quarterly update cadence.
      </div>
    </div>
  );
}
