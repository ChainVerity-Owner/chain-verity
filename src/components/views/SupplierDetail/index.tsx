"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { buildCR, buildDE, buildPM, buildOCF, buildEB } from "@/lib/analytics";
import { getRec } from "@/lib/analytics";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LineChart } from "@/components/ui/LineChart";
import { ActionCard } from "./ActionCard";
import { DPSCard } from "./DPSCard";
import { CreditRiskCard } from "./CreditRiskCard";
import { ResiliencyCard } from "./ResiliencyCard";
import { ESGCard } from "./ESGCard";
import { moneyM, fmt2, fmtPct, downloadStub, riskStateClass } from "@/lib/utils";

export function SupplierDetail() {
  const { params, setSimulatedEscalation, simulatedEscalation } = useApp();
  const s = suppliersAll.find((x) => x.id === params.id) || suppliersAll[0];
  const [obsNote, setObsNote] = useState({ text: "Risk cannot be closed manually. All approvals determine closure.", color: "var(--muted)" });

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{s.name}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              Tier {s.tier ?? "—"} · {s.category || "Uncategorized"} · {s.region || "—"}
              {s.duns ? ` · DUNS ${s.duns}` : ""}
            </div>
            <div className="inline" style={{ marginTop: 8 }}>
              {s.data && <Badge variant="info">Confidence: <b>{s.data.confidence}</b></Badge>}
              {s.data && <Badge variant="muted-b">{s.data.updatedLabel}</Badge>}
              {typeof s.risk === "number" && (
                <Badge variant={s.risk >= 70 ? "risk" : s.risk >= 50 ? "warn" : "ok"}>
                  Risk score: <b>{s.risk}</b>
                </Badge>
              )}
            </div>
          </div>
          <Badge variant={rsCls}>{s.riskState || "STABLE"}</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-4">
        <KpiCard label="Spend (Annual)" value={moneyM(s.spend)} sub="Current run rate" />
        <KpiCard label="Exposure at Risk" value={moneyM(s.exposure)} sub="Working capital impact" />
        <KpiCard label="On-Time Rate" value={(s.onTime || "—") + (s.onTime ? "%" : "")} sub="Last 90 days" />
        <KpiCard label="Quality (PPM)" value={String(s.qualityPPM || "—")} sub="Defects per million" />
      </div>

      {/* Action */}
      <ActionCard supplier={s} />

      {/* DPS */}
      <DPSCard supplier={s} />

      {/* Ratios */}
      {s.ratios && (
        <div className="card">
          <h2>Financial Ratios (Latest Filing)</h2>
          <div className="kv">
            <div className="box">
              Debt / Equity
              <b>
                {fmt2(s.ratios.debtToEquity)}
                {s.ratios.debtToEquity > 1.5 && <span style={{ color: "var(--warn)" }}> ⚠ elevated</span>}
              </b>
            </div>
            <div className="box">
              Net Profit Margin
              <b>
                {fmtPct(s.ratios.netProfitMargin)}
                {s.ratios.netProfitMargin < 0.05 && <span style={{ color: "var(--warn)" }}> ⚠ trigger</span>}
              </b>
            </div>
            <div className="box">
              Current Ratio
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

      {/* Credit Risk */}
      <CreditRiskCard supplier={s} />

      {/* Resiliency */}
      <ResiliencyCard supplier={s} />

      {/* ESG */}
      <ESGCard supplier={s} />

      {/* Charts */}
      <LineChart series={buildCR(s)} label="Current Ratio Trend" formatY={(v) => v.toFixed(2)} higherIsBetter />
      <LineChart series={buildDE(s)} label="Debt-to-Equity Trend" formatY={(v) => v.toFixed(2)} higherIsBetter={false} />
      <LineChart series={buildPM(s)} label="Net Profit Margin Trend" formatY={(v) => v.toFixed(1) + "%"} higherIsBetter />
      <LineChart series={buildOCF(s)} label="Operating Cash Flow Trend" formatY={(v) => "$" + v.toFixed(1) + "M"} higherIsBetter />
      <LineChart series={buildEB(s)} label="EBITDA Trend" formatY={(v) => "$" + v.toFixed(1) + "M"} higherIsBetter />

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
    </div>
  );
}
