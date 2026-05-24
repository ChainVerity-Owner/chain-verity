"use client";

import { suppliersAll, CONTRACTS } from "@/lib/data";
import { getRec } from "@/lib/analytics";
import { downloadStub } from "@/lib/utils";

function buildExecutiveSummary(): string {
  const top5 = [...suppliersAll]
    .filter((s) => typeof s.risk === "number")
    .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
    .slice(0, 5);

  const lines = [
    "CHAIN VERITY — EXECUTIVE RISK SUMMARY",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "TOP 5 SUPPLIERS BY RISK SCORE",
    "─────────────────────────────",
  ];
  for (const s of top5) {
    const rec = getRec(s, {});
    lines.push(`${s.name} (Tier ${s.tier ?? "—"}, ${s.region ?? "—"})`);
    lines.push(`  Risk Score: ${s.risk ?? "—"} | State: ${s.riskState ?? "STABLE"}`);
    lines.push(`  Spend: $${((s.spend ?? 0) / 1e6).toFixed(1)}M | Exposure: $${((s.exposure ?? 0) / 1e6).toFixed(1)}M`);
    lines.push(`  Recommended Action: ${rec.action}`);
    lines.push(`  Reason: ${rec.reason}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildFinancialHealth(): string {
  const lines = [
    "CHAIN VERITY — SUPPLIER FINANCIAL HEALTH REPORT",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
  ];
  for (const s of suppliersAll) {
    lines.push(`${s.name}`);
    if (s.ratios) {
      lines.push(`  D/E Ratio:          ${s.ratios.debtToEquity.toFixed(2)}${s.ratios.debtToEquity > 1.5 ? " ⚠ ELEVATED" : ""}`);
      lines.push(`  Net Profit Margin:  ${(s.ratios.netProfitMargin * 100).toFixed(1)}%${s.ratios.netProfitMargin < 0.05 ? " ⚠ TRIGGER" : ""}`);
      lines.push(`  Current Ratio:      ${s.ratios.currentRatio.toFixed(2)}${s.ratios.currentRatio < 1.0 ? " ⚠ BELOW 1.0" : ""}`);
    } else {
      lines.push("  Financial data: not available");
    }
    if (s.creditRisk) {
      lines.push(`  FRISK Score:        ${s.creditRisk.friskScore}/10 | Insolvency 12m: ${(s.creditRisk.insolvencyProbability * 100).toFixed(0)}%`);
      lines.push(`  Credit Rating:      ${s.creditRisk.creditRating} | Bankruptcy Risk: ${s.creditRisk.bankruptcyRisk12m}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function buildContractRenewalPipeline(): string {
  const lines = [
    "CHAIN VERITY — CONTRACT RENEWAL PIPELINE",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "CONTRACT REGISTER",
    "─────────────────",
  ];
  for (const c of CONTRACTS) {
    const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
    const urgency = days < 30 ? "URGENT" : days < 60 ? "60d" : days < 90 ? "90d" : "OK";
    lines.push(`${c.title} — ${c.supplierName}`);
    lines.push(`  Type: ${c.type} | Value: ${c.value}`);
    lines.push(`  Expires: ${c.expires} (${days}d) [${urgency}]`);
    lines.push(`  Status: ${c.status} | Auto-renew: ${c.autoRenew ? "Yes" : "No"}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildObservationStatus(): string {
  const observed = suppliersAll.filter((s) => s.observation);
  const lines = [
    "CHAIN VERITY — OBSERVATION WINDOW STATUS",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
  ];
  if (observed.length === 0) {
    lines.push("No suppliers currently in observation.");
  }
  for (const s of observed) {
    const obs = s.observation!;
    lines.push(`${s.name}`);
    lines.push(`  Progress: Day ${obs.day} of ${obs.total} (${obs.progressPct}%)`);
    lines.push(`  Checklist:`);
    lines.push(`    Contract executed: ${s.checklist?.contractExecuted ? "✓ Yes" : "Pending"}`);
    lines.push(`    Ops stable:        ${s.checklist?.opsStable ? "✓ Yes" : "Pending"}`);
    lines.push(`    Finance recovery:  ${s.checklist?.financeRecovery ? "✓ Yes" : "Pending"}`);
    if (s.timeline && s.timeline.length > 0) {
      lines.push(`  Recent events:`);
      s.timeline.slice(-3).forEach((e) => lines.push(`    ${e.date} — ${e.text}`));
    }
    lines.push("");
  }
  return lines.join("\n");
}

const reports = [
  {
    title: "Executive Risk Summary",
    desc: "Top 5 suppliers by disruption probability, recommended actions, and estimated downside.",
    file: "executive_risk_summary.txt",
    generate: buildExecutiveSummary,
  },
  {
    title: "Supplier Financial Health Report",
    desc: "Full ratio and trend analysis for all governed suppliers.",
    file: "financial_health.txt",
    generate: buildFinancialHealth,
  },
  {
    title: "Contract Renewal Pipeline",
    desc: "Contracts expiring in 30/60/90 days with recommended actions and approval owners.",
    file: "contract_renewals.txt",
    generate: buildContractRenewalPipeline,
  },
  {
    title: "Observation Window Status",
    desc: "Progress on all suppliers in active observation periods.",
    file: "observation_status.txt",
    generate: buildObservationStatus,
  },
];

export function Reports() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <h2>Reports</h2>
        <div className="card-sub">
          Exportable decision narratives for procurement, finance, and executive stakeholders.
        </div>
        <div className="list">
          {reports.map((r) => (
            <div key={r.file} className="item">
              <div className="row">
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.desc}</div>
                </div>
                <button className="btn primary" onClick={() => downloadStub(r.file, r.generate())}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
