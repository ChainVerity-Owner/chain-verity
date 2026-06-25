"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { suppliersAll, suppliersAllUS, CONTRACTS, CONTRACTS_US } from "@/lib/data";
import { getRec } from "@/lib/analytics";
import { downloadStub } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// Client mode: ?client=wb shows Worcester Bosch branding in reports.
// Default (no param) shows generic branding for all other audiences.
function getClientMode(): "wb" | "generic" {
  if (typeof window === "undefined") return "generic";
  return new URLSearchParams(window.location.search).get("client") === "wb"
    ? "wb"
    : "generic";
}

// Returns the correct suppliers and contracts for the current mode
function getPlatformData() {
  const mode = getClientMode();
  return {
    suppliers: mode === "wb" ? suppliersAll : suppliersAllUS,
    contracts: mode === "wb" ? CONTRACTS : CONTRACTS_US,
    currency:  mode === "wb" ? "£" : "$",
    company:   mode === "wb" ? "Worcester Bosch Group" : "Meridian Industrial Group",
  };
}

async function imgToDataUri(src: string): Promise<string> {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

async function openHtmlReport(title: string, bodyHtml: string) {
  const mode = getClientMode();
  const [wbLogo, cvLogo] = await Promise.all([
    mode === "wb" ? imgToDataUri("/wb-logo.png") : Promise.resolve(""),
    imgToDataUri("/logo-report.png"),
  ]);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Chain Verity</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: #111827; background: #fff; padding: 40px; max-width: 900px; margin: 0 auto; }
  @media print { body { padding: 20px; } .no-print { display: none !important; } }
  header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 3px solid ${mode === "wb" ? "#003087" : "#1e293b"}; margin-bottom: 28px; }
  h1 { font-size: 22px; font-weight: 800; color: ${mode === "wb" ? "#003087" : "#1e293b"}; margin-bottom: 4px; }
  .meta { text-align: right; font-size: 11px; color: #6b7280; }
  h2 { font-size: 15px; font-weight: 700; color: #1e3a5f; margin: 24px 0 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .supplier-block { background: #f9fafb; border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; border-left: 4px solid #2563eb; }
  .supplier-block.high { border-color: #dc2626; }
  .supplier-block.medium { border-color: #d97706; }
  .supplier-block.low { border-color: #16a34a; }
  .supplier-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .kv { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
  .kv-item { background: #fff; border-radius: 6px; padding: 8px 10px; border: 1px solid #e5e7eb; }
  .kv-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: .05em; font-weight: 600; margin-bottom: 2px; }
  .kv-value { font-size: 13px; font-weight: 700; color: #111827; }
  .kv-value.risk { color: #dc2626; }
  .kv-value.warn { color: #d97706; }
  .kv-value.ok { color: #16a34a; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
  .badge.risk { background: #fee2e2; color: #dc2626; }
  .badge.warn { background: #fef3c7; color: #d97706; }
  .badge.ok { background: #dcfce7; color: #16a34a; }
  .badge.obs { background: #dbeafe; color: #1d4ed8; }
  .action-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 12px 14px; margin-top: 8px; font-size: 12px; }
  .action-box strong { color: #1e3a5f; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; }
  td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
  tr:last-child td { border-bottom: none; }
  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #003087; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.2); }
  .print-btn:hover { background: #002060; }
  footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer-right { text-align: right; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<header>
  <div>
    ${mode === "wb"
      ? (wbLogo ? `<img src="${wbLogo}" alt="Worcester Bosch" style="height:52px;display:block">` : `<span style="font-size:20px;font-weight:900;color:#003087">Worcester Bosch</span>`)
      : `<span style="font-size:18px;font-weight:800;color:#1e293b;letter-spacing:-.02em">Supply Chain Risk Intelligence</span>`
    }
  </div>
  <div class="meta">
    <div style="font-weight:700;font-size:14px;color:#111827;margin-bottom:4px;">${title}</div>
    <div>Generated: ${new Date().toLocaleDateString(mode === "wb" ? "en-GB" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</div>
    <div style="margin-top:2px;color:#ED1C2E;font-weight:600;">Confidential — Internal Use Only</div>
  </div>
</header>
${bodyHtml}
<footer>
  ${cvLogo ? `<img src="${cvLogo}" alt="Chain Verity" style="height:22px;opacity:.85">` : `<span style="font-size:12px;font-weight:700;color:#6b7280">Chain Verity</span>`}
  <div class="footer-right">
    <div>Powered by Chain Verity · Supply Chain Risk Intelligence</div>
    <div>© ${new Date().getFullYear()} ${mode === "wb" ? "Worcester Bosch Group" : "Meridian Industrial Group"} · Confidential</div>
  </div>
</footer>
<button class="print-btn no-print" onclick="window.print()">🖨 Print / Save as PDF</button>
</body>
</html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function buildExecutiveSummary(): string {
  const { suppliers, currency } = getPlatformData();
  const top5 = [...suppliers]
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
    lines.push(`  Spend: ${currency}${(s.spend ?? 0).toFixed(1)}M | Exposure: ${currency}${(s.exposure ?? 0).toFixed(1)}M`);
    lines.push(`  Recommended Action: ${rec.action}`);
    lines.push(`  Reason: ${rec.reason}`);
    lines.push("");
  }
  return lines.join("\n");
}

function buildFinancialHealth(): string {
  const { suppliers } = getPlatformData();
  const lines = [
    "CHAIN VERITY — SUPPLIER FINANCIAL HEALTH REPORT",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
  ];
  for (const s of suppliers) {
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
  const { contracts } = getPlatformData();
  const lines = [
    "CHAIN VERITY — CONTRACT RENEWAL PIPELINE",
    `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    "",
    "CONTRACT REGISTER",
    "─────────────────",
  ];
  for (const c of contracts) {
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
  const { suppliers } = getPlatformData();
  const observed = suppliers.filter((s) => s.observation);
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

function buildExecutiveSummaryHtml(): string {
  const { suppliers, currency } = getPlatformData();
  const top5 = [...suppliers]
    .filter((s) => typeof s.risk === "number")
    .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
    .slice(0, 5);
  const rows = top5.map((s) => {
    const rec = getRec(s, {});
    const riskClass = (s.risk ?? 0) >= 65 ? "high" : (s.risk ?? 0) >= 45 ? "medium" : "low";
    const stateBadge = s.riskState?.includes("ESCALATED") ? "risk" : s.riskState?.includes("OBSERVATION") ? "obs" : s.riskState?.includes("MITIGATION") ? "warn" : "ok";
    return `<div class="supplier-block ${riskClass}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div class="supplier-name">${s.name}</div>
        <span class="badge ${stateBadge}">${s.riskState || "STABLE"}</span>
      </div>
      <div class="kv">
        <div class="kv-item"><div class="kv-label">Risk Score</div><div class="kv-value ${riskClass === "high" ? "risk" : riskClass === "medium" ? "warn" : "ok"}">${s.risk}</div></div>
        <div class="kv-item"><div class="kv-label">Annual Spend</div><div class="kv-value">${currency}${(s.spend ?? 0).toFixed(1)}M</div></div>
        <div class="kv-item"><div class="kv-label">Exposure at Risk</div><div class="kv-value ${(s.exposure ?? 0) > 5 ? "risk" : "warn"}">${currency}${(s.exposure ?? 0).toFixed(1)}M</div></div>
      </div>
      <div class="action-box"><strong>Recommended Action:</strong> ${rec.action}<br><strong>Reason:</strong> ${rec.reason}</div>
    </div>`;
  }).join("");
  return `<h1>Executive Risk Summary</h1><h2>Top Suppliers by Risk Score</h2>${rows}`;
}

function buildFinancialHealthHtml(): string {
  const { suppliers } = getPlatformData();
  const rows = suppliers.map((s) => {
    if (!s.ratios && !s.creditRisk) return "";
    const deClass = s.ratios && s.ratios.debtToEquity > 1.5 ? "risk" : "ok";
    const marginClass = s.ratios && s.ratios.netProfitMargin < 0.05 ? "risk" : "ok";
    const crClass = s.ratios && s.ratios.currentRatio < 1.0 ? "risk" : "ok";
    return `<div class="supplier-block">
      <div class="supplier-name">${s.name} <span style="font-weight:400;font-size:12px;color:#6b7280">Tier ${s.tier ?? "—"} · ${s.region ?? "—"}</span></div>
      <div class="kv">
        ${s.ratios ? `
        <div class="kv-item"><div class="kv-label">D/E Ratio</div><div class="kv-value ${deClass}">${s.ratios.debtToEquity.toFixed(2)}${s.ratios.debtToEquity > 1.5 ? " ⚠" : ""}</div></div>
        <div class="kv-item"><div class="kv-label">Net Profit Margin</div><div class="kv-value ${marginClass}">${(s.ratios.netProfitMargin * 100).toFixed(1)}%${s.ratios.netProfitMargin < 0.05 ? " ⚠" : ""}</div></div>
        <div class="kv-item"><div class="kv-label">Current Ratio</div><div class="kv-value ${crClass}">${s.ratios.currentRatio.toFixed(2)}${s.ratios.currentRatio < 1.0 ? " ⚠" : ""}</div></div>
        ` : ""}
        ${s.creditRisk ? `
        <div class="kv-item"><div class="kv-label">FRISK Score</div><div class="kv-value ${s.creditRisk.friskScore <= 3 ? "risk" : s.creditRisk.friskScore <= 6 ? "warn" : "ok"}">${s.creditRisk.friskScore}/10</div></div>
        <div class="kv-item"><div class="kv-label">Credit Rating</div><div class="kv-value">${s.creditRisk.creditRating}</div></div>
        <div class="kv-item"><div class="kv-label">Bankruptcy Risk</div><div class="kv-value ${s.creditRisk.bankruptcyRisk12m === "High" || s.creditRisk.bankruptcyRisk12m === "Critical" ? "risk" : "ok"}">${s.creditRisk.bankruptcyRisk12m}</div></div>
        ` : ""}
      </div>
    </div>`;
  }).join("");
  return `<h1>Supplier Financial Health Report</h1><h2>Financial Ratios & Credit Risk</h2>${rows}`;
}

function buildContractRenewalHtml(): string {
  const { contracts } = getPlatformData();
  const sorted = [...contracts].sort((a, b) => new Date(a.expires).getTime() - new Date(b.expires).getTime());
  const tableRows = sorted.map((c) => {
    const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
    const urgency = days < 30 ? "URGENT" : days < 60 ? "60 days" : days < 90 ? "90 days" : "OK";
    const urgencyClass = days < 30 ? "risk" : days < 60 ? "warn" : "ok";
    return `<tr>
      <td>${c.title}</td>
      <td>${c.supplierName}</td>
      <td>${c.type}</td>
      <td>${c.value}</td>
      <td>${c.expires}</td>
      <td><span class="badge ${urgencyClass}">${urgency}</span></td>
      <td>${c.status}</td>
    </tr>`;
  }).join("");
  return `<h1>Contract Renewal Pipeline</h1>
  <h2>Contract Register</h2>
  <table>
    <thead><tr><th>Contract</th><th>Supplier</th><th>Type</th><th>Value</th><th>Expires</th><th>Urgency</th><th>Status</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>`;
}

function buildObservationHtml(): string {
  const { suppliers } = getPlatformData();
  const observed = suppliers.filter((s) => s.observation);
  if (!observed.length) return `<h1>Observation Window Status</h1><p style="color:#6b7280;margin-top:16px">No suppliers currently in observation.</p>`;
  const blocks = observed.map((s) => {
    const obs = s.observation!;
    const timelineRows = (s.timeline ?? []).slice(-4).map((e) =>
      `<tr><td style="color:#6b7280;font-size:11px;white-space:nowrap">${e.date}</td><td>${e.text}</td></tr>`
    ).join("");
    return `<div class="supplier-block obs" style="border-color:#2563eb">
      <div class="supplier-name">${s.name}</div>
      <div class="kv">
        <div class="kv-item"><div class="kv-label">Day</div><div class="kv-value">${obs.day} of ${obs.total}</div></div>
        <div class="kv-item"><div class="kv-label">Progress</div><div class="kv-value">${obs.progressPct}%</div></div>
        <div class="kv-item"><div class="kv-label">Contract</div><div class="kv-value ${s.checklist?.contractExecuted ? "ok" : "warn"}">${s.checklist?.contractExecuted ? "✓ Executed" : "Pending"}</div></div>
      </div>
      ${timelineRows ? `<table style="margin-top:10px"><tbody>${timelineRows}</tbody></table>` : ""}
    </div>`;
  }).join("");
  return `<h1>Observation Window Status</h1>${blocks}`;
}

function buildBoardPackHtml(): string {
  const { suppliers, contracts, currency } = getPlatformData();
  const highRisk = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const medRisk = suppliers.filter((s) => (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65);
  const avgRisk = suppliers.length ? Math.round(suppliers.reduce((a, s) => a + (s.risk ?? 0), 0) / suppliers.length) : 0;
  const totalExposure = suppliers.reduce((a, s) => a + (s.exposure ?? 0), 0);
  const top3 = [...suppliers].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0)).slice(0, 3);

  const riskBar = (pct: number, color: string) =>
    `<div style="display:inline-block;width:${Math.round(pct)}%;height:10px;background:${color};border-radius:3px;vertical-align:middle"></div>`;

  const supplierRows = top3.map((s) => {
    const rec = getRec(s, {});
    const col = (s.risk ?? 0) >= 65 ? "#dc2626" : (s.risk ?? 0) >= 45 ? "#d97706" : "#16a34a";
    return `<tr>
      <td><b>${s.name}</b></td>
      <td style="color:${col};font-weight:800;font-size:16px">${s.risk ?? "—"}</td>
      <td>${riskBar(s.risk ?? 0, col)}</td>
      <td>${currency}${(s.exposure ?? 0).toFixed(1)}M</td>
      <td style="font-weight:600;color:#1e3a5f">${rec.action}</td>
    </tr>`;
  }).join("");

  const contractRows = contracts.filter((c) => ["Under Renegotiation", "Pending Renewal"].includes(c.status))
    .map((c) => `<tr><td>${c.supplierName}</td><td class="mono">${c.title}</td><td>${c.value}</td><td>${c.expires}</td><td><span class="badge ${c.status === "Under Renegotiation" ? "risk" : "warn"}">${c.status}</span></td></tr>`)
    .join("");

  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
      ${[
        ["Total Exposure", `${currency}${totalExposure.toFixed(1)}M`, "#dc2626"],
        ["High-Risk Suppliers", String(highRisk.length), "#dc2626"],
        ["Medium-Risk Suppliers", String(medRisk.length), "#d97706"],
        ["Portfolio Avg Risk Score", String(avgRisk), avgRisk >= 65 ? "#dc2626" : avgRisk >= 45 ? "#d97706" : "#16a34a"],
      ].map(([l, v, c]) => `<div class="kv-item" style="text-align:center"><div class="kv-label">${l}</div><div class="kv-value" style="font-size:22px;color:${c}">${v}</div></div>`).join("")}
    </div>

    <h2>Top 3 Suppliers Requiring Attention</h2>
    <table>
      <thead><tr><th>Supplier</th><th>Risk</th><th>Score</th><th>Exposure</th><th>Recommended Action</th></tr></thead>
      <tbody>${supplierRows}</tbody>
    </table>

    <h2 style="margin-top:24px">Contracts Requiring Action</h2>
    ${contractRows ? `<table><thead><tr><th>Supplier</th><th>Contract</th><th>Value</th><th>Expires</th><th>Status</th></tr></thead><tbody>${contractRows}</tbody></table>` : "<p>No contracts requiring immediate action.</p>"}

    <h2 style="margin-top:24px">Board Recommendation</h2>
    <div class="action-box">
      <strong>Immediate priorities for executive attention:</strong>
      <ol style="margin-top:8px;padding-left:20px;line-height:1.8">
        ${top3.map((s) => `<li><b>${s.name}</b> — ${getRec(s, {}).reason}</li>`).join("")}
      </ol>
    </div>
  `;
}

const reports = [
  {
    title: "Board 1-Pager",
    desc: "Single-page executive summary for board packs — portfolio KPIs, top 3 risks, contract exposure, and recommendations.",
    file: "board_pack.txt",
    generate: () => "Board 1-Pager — open HTML version for formatted output.",
    generateHtml: buildBoardPackHtml,
    aiPrompt: () => { const { suppliers, currency } = getPlatformData(); return `Write a concise 3-paragraph board-level summary of our supply chain risk position. Lead with the most urgent financial risk, cover contract exposure, and close with recommended board actions. Be direct and use executive language. Data: Top suppliers by risk: ${suppliers.slice(0,3).map(s => `${s.name} risk ${s.risk}`).join(", ")}. Total exposure ${currency}${suppliers.reduce((a,s)=>a+(s.exposure??0),0).toFixed(1)}M.`; },
  },
  {
    title: "Executive Risk Summary",
    desc: "Top 5 suppliers by disruption probability, recommended actions, and estimated downside.",
    file: "executive_risk_summary.txt",
    generate: buildExecutiveSummary,
    generateHtml: buildExecutiveSummaryHtml,
    aiPrompt: () => `Write a concise executive narrative for this supply chain risk summary. Focus on the 2-3 most urgent issues and what leadership should do. Use professional tone. Data:\n\n${buildExecutiveSummary()}`,
  },
  {
    title: "Supplier Financial Health Report",
    desc: "Full ratio and trend analysis for all governed suppliers.",
    file: "financial_health.txt",
    generate: buildFinancialHealth,
    generateHtml: buildFinancialHealthHtml,
    aiPrompt: () => `Write a concise financial health narrative for our supply chain team. Highlight suppliers with elevated D/E ratios, low margins, or bankruptcy risk. Recommend 2-3 specific actions. Data:\n\n${buildFinancialHealth()}`,
  },
  {
    title: "Contract Renewal Pipeline",
    desc: "Contracts expiring in 30/60/90 days with recommended actions and approval owners.",
    file: "contract_renewals.txt",
    generate: buildContractRenewalPipeline,
    generateHtml: buildContractRenewalHtml,
    aiPrompt: () => `Write a brief contract renewal briefing for procurement leadership. Prioritize urgent renewals and flag any at-risk contracts. Data:\n\n${buildContractRenewalPipeline()}`,
  },
  {
    title: "Observation Window Status",
    desc: "Progress on all suppliers in active observation periods.",
    file: "observation_status.txt",
    generate: buildObservationStatus,
    generateHtml: buildObservationHtml,
    aiPrompt: () => `Write a status update narrative for suppliers currently in observation windows. Summarize progress and flag any that need escalation. Data:\n\n${buildObservationStatus()}`,
  },
];

interface ReportItemProps {
  r: (typeof reports)[0];
}

function ReportItem({ r }: ReportItemProps) {
  const [loading, setLoading] = useState(false);
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function buildModal(result: string) {
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

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button
            className="btn"
            style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => {
              const win = window.open("", "_blank");
              if (!win) return;
              win.document.write(`<!DOCTYPE html><html><head><title>${r.title} — AI Narrative</title><style>
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
                <div class="title">${r.title}</div>
                <div class="meta">AI-generated narrative &nbsp;·&nbsp; Chain Verity</div>
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

  async function handleNarrate() {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: r.aiPrompt() }] }),
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
      }
      setModalContent(buildModal(acc));
    } catch {
      setModalContent(buildModal("Failed to generate narrative. Check ANTHROPIC_API_KEY."));
    } finally {
      setLoading(false);
      setModalOpen(true);
    }
  }

  return (
    <>
      {modalOpen && modalContent && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{ background: "var(--card)", borderRadius: 14, boxShadow: "0 24px 64px rgba(0,0,0,.25)", width: "100%", maxWidth: 680, maxHeight: "80vh", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>AI-generated narrative</div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "16px 20px", overflowY: "auto" }}>{modalContent}</div>
          </div>
        </div>
      )}
      <div className="item" style={{ flexDirection: "column", gap: 10 }}>
        <div className="row">
          <div>
            <div style={{ fontWeight: 600 }}>{r.title}</div>
            <div className="muted" style={{ fontSize: 12 }}>{r.desc}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button className="btn ai" onClick={handleNarrate} disabled={loading}>
              {loading ? "Generating…" : "AI Narrate"}
            </button>
            <button className="btn primary" onClick={() => void openHtmlReport(r.title, r.generateHtml())}>
              Open Report ↗
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

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
            <ReportItem key={r.file} r={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
