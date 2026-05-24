"use client";

import { useApp } from "@/context/AppContext";
import { Supplier } from "@/types";
import { getRec } from "@/lib/analytics";
import { buildDE, buildPM, buildOCF } from "@/lib/analytics";
import { Badge } from "@/components/ui/Badge";

interface ActionCardProps {
  supplier: Supplier;
}

export function ActionCard({ supplier }: ActionCardProps) {
  const { simulatedEscalation, openModal } = useApp();
  const rec = getRec(supplier, simulatedEscalation);

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
    </div>
  );
}
