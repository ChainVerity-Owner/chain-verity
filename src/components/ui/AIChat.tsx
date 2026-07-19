"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Supplier } from "@/types";
import { computeResiliency } from "@/lib/analytics";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Rich context builder — mode-aware, full portfolio ─────────────────────────
function buildContext(
  route: string,
  params: Record<string, string>,
  suppliers: Supplier[],
  platformData: {
    crisisRooms: { id: string; title: string; severity: string; status: string; estimatedExposure: string; actions: { done: boolean }[]; affectedParts: string[] }[];
    events: { title: string; severity: string; category: string; status: string; estimatedImpact?: string; leadTimeExtension?: string }[];
    contracts: { title: string; type: string; supplierName: string; value: string; expires: string; status: string; autoRenew: boolean; noticeDays: number; renegotiationWindowDays: number; financialTriggerClause: boolean; performanceTriggerClause: boolean; forceMajeureClause: boolean; priceIndexationClause: boolean; tariffPassThroughClause: boolean }[];
    alerts: { supplierId: string; text: string; type: string; date: string }[];
    recoveryProfiles: Record<string, { safetyStockRecommendation: number; inventoryBufferDays: number; estimatedStockIncreaseCostM: number; additionalStorageM3: number }>;
    inventoryBudgetM: number;
    warehouseAvailableM3: number;
  },
  currency: string,
  role: string
): string {
  const lines: string[] = [
    `Current view: ${route}`,
    `User role: ${role}`,
    `Currency: ${currency}`,
  ];

  // Portfolio summary
  const highRisk = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const medRisk  = suppliers.filter((s) => (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65);
  const totalExposure = suppliers.reduce((a, s) => a + (s.exposure ?? 0), 0);
  const avgRisk = suppliers.length
    ? Math.round(suppliers.reduce((a, s) => a + (s.risk ?? 0), 0) / suppliers.length)
    : 0;

  lines.push(`\n## Portfolio Summary`);
  lines.push(`Total suppliers: ${suppliers.length} | High risk (≥65): ${highRisk.length} | Medium (45–64): ${medRisk.length}`);
  lines.push(`Total exposure at risk: ${currency}${totalExposure.toFixed(1)}M | Portfolio avg risk score: ${avgRisk}`);

  // All suppliers ranked by risk
  lines.push(`\n## All Suppliers (ranked by risk)`);
  for (const s of [...suppliers].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))) {
    const frisk  = s.creditRisk?.friskScore != null ? `FRISK ${s.creditRisk.friskScore}/10` : "";
    const margin = s.ratios?.netProfitMargin != null ? `Margin ${(s.ratios.netProfitMargin * 100).toFixed(1)}%` : "";
    const cr     = s.ratios?.currentRatio != null ? `CR ${s.ratios.currentRatio.toFixed(2)}` : "";
    const de     = s.ratios?.debtToEquity != null ? `D/E ${s.ratios.debtToEquity.toFixed(2)}` : "";
    lines.push(
      `${s.name} (${s.countryCode ?? s.region}): Risk ${s.risk ?? "—"} | ${s.riskState ?? "STABLE"} | ` +
      `Spend ${currency}${(s.spend ?? 0).toFixed(1)}M | Exposure ${currency}${(s.exposure ?? 0).toFixed(1)}M | ` +
      [frisk, de, cr, margin].filter(Boolean).join(" | ") +
      ` | OTIF ${s.onTime ?? "—"}% | PPM ${s.qualityPPM ?? "—"}`
    );
  }

  // Active crisis rooms
  const openRooms = platformData.crisisRooms.filter((r) => r.status === "Open");
  if (openRooms.length > 0) {
    lines.push(`\n## Open Crisis Rooms`);
    for (const r of openRooms) {
      const pending = r.actions.filter((a) => !a.done).length;
      lines.push(`${r.title}: ${r.severity.toUpperCase()} | Exposure ${r.estimatedExposure} | ${pending} actions pending`);
      if (r.affectedParts.length > 0) lines.push(`  Parts at risk: ${r.affectedParts.slice(0, 3).join(", ")}`);
    }
  }

  // Active events
  const activeEvents = platformData.events.filter((e) => e.status === "Active");
  if (activeEvents.length > 0) {
    lines.push(`\n## Active Disruption Events`);
    for (const e of activeEvents.slice(0, 5)) {
      lines.push(
        `${e.title}: ${e.severity.toUpperCase()} ${e.category}` +
        (e.estimatedImpact ? ` | ${e.estimatedImpact}` : "") +
        (e.leadTimeExtension ? ` | +${e.leadTimeExtension} lead time` : "")
      );
    }
  }

  // All contracts with full terms context
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  lines.push(`\n## Contract Portfolio`);
  lines.push(`Today's date: ${todayStr} (use this for all date calculations)`);
  for (const c of platformData.contracts) {
    const expiry = new Date(c.expires);
    const daysToExpiry = Math.round((expiry.getTime() - today.getTime()) / 86400000);
    const windowOpens = new Date(expiry);
    windowOpens.setDate(windowOpens.getDate() - c.renegotiationWindowDays);
    const inWindow = today >= windowOpens;
    const noticeDeadline = new Date(expiry);
    noticeDeadline.setDate(noticeDeadline.getDate() - c.noticeDays);
    const noticePassed = today >= noticeDeadline;

    const triggers: string[] = [];
    if (c.financialTriggerClause)     triggers.push("financial-trigger");
    if (c.performanceTriggerClause)   triggers.push("performance-trigger");
    if (c.forceMajeureClause)         triggers.push("force-majeure");
    if (c.priceIndexationClause)      triggers.push("price-indexation");
    if (c.tariffPassThroughClause)    triggers.push("tariff-pass-through");

    const windowNote = inWindow
      ? `RENEGOTIATION WINDOW OPEN (opened ${Math.round((today.getTime() - windowOpens.getTime()) / 86400000)}d ago)`
      : `renegotiation window opens in ${Math.round((windowOpens.getTime() - today.getTime()) / 86400000)}d`;
    const noticeNote = noticePassed
      ? `NOTICE PERIOD PASSED (${c.noticeDays}d notice was due)`
      : `notice deadline in ${Math.round((noticeDeadline.getTime() - today.getTime()) / 86400000)}d`;

    lines.push(
      `${c.title} [${c.type}] (${c.supplierName}): ${c.value} | Expires ${c.expires} (${daysToExpiry}d) | ${c.status} | auto-renew: ${c.autoRenew}` +
      ` | ${windowNote} | ${noticeNote}` +
      (triggers.length ? ` | clauses: ${triggers.join(", ")}` : " | no trigger clauses")
    );
  }

  // Recent alerts
  if (platformData.alerts.length > 0) {
    lines.push(`\n## Recent Alerts`);
    for (const a of platformData.alerts.slice(0, 5)) {
      const sup = suppliers.find((s) => s.id === a.supplierId);
      lines.push(`[${a.type.toUpperCase()}] ${sup?.name ?? a.supplierId}: ${a.text} (${a.date})`);
    }
  }

  // Inventory safety stock feasibility
  const totalStockCostM  = Object.values(platformData.recoveryProfiles).reduce((a, p) => a + p.estimatedStockIncreaseCostM, 0);
  const totalStorageM3   = Object.values(platformData.recoveryProfiles).reduce((a, p) => a + p.additionalStorageM3, 0);
  lines.push(`\n## Safety Stock Investment Feasibility`);
  lines.push(`Company inventory budget available: ${currency}${platformData.inventoryBudgetM.toFixed(1)}M | Warehouse capacity available: ${platformData.warehouseAvailableM3}m³`);
  lines.push(`Total cost to implement all recommended safety stock increases: ${currency}${totalStockCostM.toFixed(1)}M | Total additional space required: ${totalStorageM3}m³`);
  lines.push(`Budget status: ${totalStockCostM <= platformData.inventoryBudgetM ? "FEASIBLE" : "EXCEEDS BUDGET"} | Space status: ${totalStorageM3 <= platformData.warehouseAvailableM3 ? "FEASIBLE" : "EXCEEDS CAPACITY"}`);
  const needsIncrease = Object.entries(platformData.recoveryProfiles).filter(([, p]) => p.safetyStockRecommendation > p.inventoryBufferDays);
  for (const [id, p] of needsIncrease) {
    const sup = suppliers.find((s) => s.id === id);
    if (sup) lines.push(`  ${sup.name}: needs +${p.safetyStockRecommendation - p.inventoryBufferDays}d | cost ${currency}${p.estimatedStockIncreaseCostM.toFixed(1)}M${p.additionalStorageM3 > 0 ? ` | ${p.additionalStorageM3}m³ storage` : " | no storage needed"}`);
  }

  // Deep context when viewing a specific supplier
  if (route === "supplier" && params.id) {
    const s = suppliers.find((x) => x.id === params.id);
    if (s) {
      lines.push(`\n## Currently Viewing: ${s.name}`);
      lines.push(`Tier ${s.tier} | ${s.category} | ${s.region} | ${s.countryCode ?? ""}`);
      if (s.ratios) {
        lines.push(`Financials: D/E ${s.ratios.debtToEquity.toFixed(2)} | Net margin ${(s.ratios.netProfitMargin * 100).toFixed(1)}% | Current ratio ${s.ratios.currentRatio.toFixed(2)}`);
      }
      if (s.creditRisk) {
        lines.push(`Credit: FRISK ${s.creditRisk.friskScore}/10 | Rating ${s.creditRisk.creditRating} | Insolvency 12m ${(s.creditRisk.insolvencyProbability * 100).toFixed(1)}% | Payment behavior ${s.creditRisk.paymentBehavior}`);
      }
      if (s.esg) {
        lines.push(`ESG: Score ${s.esg.score}/100 Grade ${s.esg.grade} | Labor risk ${s.esg.laborRisk} | Environmental ${s.esg.environmentalRisk}`);
        if (s.esg.uflpaStatus) {
          lines.push(`US Compliance: UFLPA ${s.esg.uflpaStatus} | SEC Scope 3 ${s.esg.scope3Status ?? "—"} | Conflict Minerals ${s.esg.conflictMineralsStatus ?? "—"}`);
        } else {
          lines.push(`EU Compliance: CSDDD ${s.esg.csdddStatus} | CSRD ${s.esg.csrdStatus} | LkSG ${s.esg.lksgStatus} | EUDR ${s.esg.eudrCompliant}`);
        }
      }
      if (s.resiliency) {
        lines.push(`Resiliency: ${(computeResiliency(s) ?? 0).toFixed(1)}/10 | Transparency ${s.resiliency.transparency} | Continuity ${s.resiliency.continuity} | SCRM Maturity ${s.resiliency.maturity}`);
      }
      if (s.alerts && s.alerts.length > 0) {
        lines.push(`Supplier alerts: ${s.alerts.slice(0, 3).map((a) => a.text).join(" | ")}`);
      }
      if (s.timeline && s.timeline.length > 0) {
        lines.push(`Recent events: ${s.timeline.slice(-2).map((e) => `${e.date}: ${e.text}`).join(" | ")}`);
      }
    }
  }

  return lines.join("\n");
}

// ── Suggested questions — contextual per view AND role ────────────────────────
function getSuggestedQuestions(
  route: string,
  params: Record<string, string>,
  suppliers: Supplier[],
  crisisRooms: { title: string; status: string }[],
  events: { title: string; status: string }[],
  clientMode: string,
  role: string
): string[] {
  const isUS      = clientMode === "generic";
  const escalated = suppliers.filter((s) => s.riskState === "ESCALATED");
  const highRisk  = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const openRooms = crisisRooms.filter((r) => r.status === "Open");
  const activeEvts = events.filter((e) => e.status === "Active");
  const topRisk   = escalated[0] ?? highRisk[0];

  // ── Supplier detail ────────────────────────────────────────────────────────
  if (route === "supplier" && params.id) {
    const s = suppliers.find((x) => x.id === params.id);
    if (s) {
      if (role === "CFO") return [
        `What is the P&L impact if ${s.name} disrupts for 4 weeks — revenue at risk, margin hit, and cash flow?`,
        `Does ${s.name}'s insolvency probability and FRISK score warrant a credit exposure reserve this quarter?`,
        `What is the total cost of dependency on ${s.name} versus qualifying a second source?`,
        `How should I brief the board on ${s.name}'s risk trajectory over the last 12 months?`,
      ];
      if (role === "Procurement") return [
        `${s.name} is ${s.riskState ?? "on watch"} — what are the three most important actions I should take this week?`,
        `What contractual levers do I have with ${s.name} — performance clauses, step-in rights, or dual-source requirements?`,
        `${s.name} supplies single-sourced parts — how long to qualify an alternative and what's the process?`,
        `Should I increase safety stock for ${s.name} now, or wait for the next review cycle?`,
      ];
      // Analyst
      return [
        `What is driving ${s.name}'s risk score of ${s.risk} — break down the contributing factors?`,
        `How has ${s.name}'s financial health trended over the last 4 quarters and what does it signal?`,
        `Run the Monte Carlo simulation for ${s.name} — what does the 95th percentile exposure look like?`,
        `How does ${s.name}'s lead time trend compare to its peer baseline and what's the drift rate?`,
      ];
    }
  }

  // ── Crisis ─────────────────────────────────────────────────────────────────
  if (route === "crisis") {
    const room1 = openRooms[0];
    if (role === "CFO") return [
      room1 ? `What is the total financial exposure across all open crisis rooms and which threatens earnings most?` : `Which scenario poses the greatest earnings risk this quarter?`,
      `What contingency reserves should I approve given the current open crisis situations?`,
      isUS ? `If the Flex Ltd. and Zhonghe crises both escalate, what is the combined worst-case EBITDA impact?`
           : room1 ? `What is the P&L impact if ${room1.title} is not resolved within 30 days?` : `What financial controls should be in place during an active supply crisis?`,
      `Which crisis room is closest to triggering a material disclosure obligation?`,
    ];
    if (role === "Procurement") return [
      room1 ? `What are the immediate sourcing actions to contain ${room1.title}?` : `What procurement playbook applies to the current crisis situations?`,
      isUS ? `What's the fastest path to resolving the Zhonghe UFLPA detention and restoring supply?`
           : `Which crisis room needs an emergency dual-source qualification started today?`,
      `Which affected parts can be bridged with safety stock and which need emergency spot buys?`,
      `Which suppliers have the capacity to absorb demand if a disrupted source goes offline?`,
    ];
    // Analyst
    return [
      room1 ? `Walk me through the exposure calculation and action status for ${room1.title}.` : `Map the open crisis rooms by severity and estimated days to resolution.`,
      `What is the probability each open crisis escalates to production stoppage within 30 days?`,
      `Which crisis room has the most incomplete actions and what's blocking progress?`,
      `How do the current crises compare to historical disruption events in terms of severity and recovery time?`,
    ];
  }

  // ── Live events ────────────────────────────────────────────────────────────
  if (route === "events") {
    const evt1 = activeEvts[0];
    if (role === "CFO") return [
      evt1 ? `What is the earnings exposure from "${evt1.title}" — give me a number and a confidence range.` : `Which active events pose material financial risk this quarter?`,
      isUS ? `How do the US–China tariff escalations affect our total landed cost by supplier category?`
           : `Which active events could trigger a profit warning if they persist beyond 60 days?`,
      `Rank the active events by estimated financial impact and likelihood of escalation.`,
      `Which events should I flag to the board audit committee this week?`,
    ];
    if (role === "Procurement") return [
      evt1 ? `"${evt1.title}" is active — what are my immediate sourcing options and who do I call first?` : `Which active events require a procurement response today?`,
      isUS ? `Which suppliers are exposed to the ILA port slowdown and what rerouting options exist?`
           : `Which active events are extending supplier lead times and by how much?`,
      `Which affected suppliers have contractual force majeure clauses I can invoke?`,
      `What spot-buy or emergency qualification actions should I initiate in the next 48 hours?`,
    ];
    // Analyst
    return [
      evt1 ? `Trace the full supply chain impact of "${evt1.title}" — which suppliers, parts, and product lines are affected?` : `Map all active events to affected suppliers and calculate compound exposure.`,
      `Which events are trending toward escalation based on lead time extension and supplier response?`,
      `Are any two active events creating a compound risk on the same supplier or product line?`,
      `How long have the current active events been running and what's the historical average resolution time?`,
    ];
  }

  // ── ESG ────────────────────────────────────────────────────────────────────
  if (route === "esg") {
    if (role === "CFO") return isUS ? [
      `Which suppliers represent the highest UFLPA regulatory risk and what is the potential customs exposure?`,
      `What is the board-level ESG summary — grade distribution, compliance gaps, and reputational risk?`,
      `Which ESG non-compliance issues could affect our access to ESG-linked financing or insurance?`,
      `Quantify the financial risk of our worst-rated ESG supplier being debarred or sanctioned.`,
    ] : [
      `Which ESG exposure is most likely to affect our credit rating or financing terms this year?`,
      `What is the board-level ESG summary — grade distribution, worst performers, and regulatory gaps?`,
      `Which suppliers' CSDDD or CSRD non-compliance creates a direct legal liability for us?`,
      `Quantify the reputational and financial risk of our lowest-rated ESG supplier.`,
    ];
    if (role === "Procurement") return isUS ? [
      `Which suppliers are at highest UFLPA enforcement risk and what evidence packs do I need ready?`,
      `Which suppliers have outstanding Scope 3 or Conflict Minerals gaps that I need to remediate before year-end?`,
      `What should I include in the next supplier RFI to close our UFLPA due diligence gaps?`,
      `Which supplier ESG improvement plans are overdue and what actions should I escalate?`,
    ] : [
      `Which suppliers are non-compliant with CSDDD or LkSG and what remediation steps should I request?`,
      `Which suppliers need an ESG improvement plan initiated before the next audit cycle?`,
      `What due diligence evidence should I require from my highest ESG-risk suppliers?`,
      `Which EUDR compliance gaps are still open and which suppliers are at risk of disqualification?`,
    ];
    // Analyst
    return isUS ? [
      `Score and rank all suppliers by UFLPA enforcement risk — which three are most exposed?`,
      `Which suppliers have the largest gap between their reported ESG score and observable compliance status?`,
      `Map all Conflict Minerals non-compliance gaps by supplier, tier, and affected product line.`,
      `Which ESG risk signals have deteriorated most since the last assessment cycle?`,
    ] : [
      `Score and rank all suppliers by ESG risk — which have deteriorated most since the last cycle?`,
      `Which suppliers have the largest gap between their reported ESG score and actual compliance status?`,
      `Map all CSDDD and CSRD gaps by supplier and identify which require immediate escalation.`,
      `Which regulatory compliance deadlines are we at risk of missing and what's the exposure?`,
    ];
  }

  // ── Analytics ──────────────────────────────────────────────────────────────
  if (route === "analytics") {
    if (role === "CFO") return isUS ? [
      `Which suppliers have deteriorating Altman Z-Scores — and what's the combined credit exposure if two fail?`,
      `How much of our supply chain spend is exposed to Section 301 tariffs — give me an annualised cost?`,
      `What does our portfolio risk distribution look like versus the industrial automation benchmark?`,
      `Which three suppliers represent the highest concentration of unhedged financial exposure?`,
    ] : [
      `Which suppliers have the most deteriorating financial health and what's the combined P&L exposure?`,
      `What does our portfolio risk distribution look like versus the industry benchmark?`,
      `Which suppliers represent the highest concentration of unhedged financial exposure?`,
      `What is the worst-case 12-month scenario for our supply chain and what does it cost?`,
    ];
    if (role === "Procurement") return isUS ? [
      `Which suppliers are showing lead time creep above 15% — and which of those are single-sourced?`,
      `Which supplier financial trends should trigger a dual-source qualification conversation now?`,
      `Which of my high-spend suppliers have a current ratio below 1.0 and what's the payment risk?`,
      `Which suppliers have improving OTIF trends and could qualify for preferred supplier status?`,
    ] : [
      `Which supplier financial trends should trigger a dual-source qualification conversation now?`,
      `Which of my high-spend suppliers have a current ratio below 1.0 — what's the payment risk?`,
      `Which suppliers are showing lead time creep above 15% and are also single-sourced?`,
      `Which suppliers have improving OTIF and financial health and could warrant increased spend allocation?`,
    ];
    // Analyst
    return isUS ? [
      `Which supplier has the most deteriorating Altman Z-Score trajectory and what is the insolvency probability?`,
      `Run a scenario where tariffs increase 10% — which suppliers breach their DPS threshold first?`,
      `Which suppliers have simultaneous deterioration in gross margin, OCF margin, and DPO — flag compound stress?`,
      `Compare lead time drift rates across APAC suppliers — which are outliers against their regional baseline?`,
    ] : [
      `Which supplier has the most deteriorating Altman Z-Score and what does the insolvency probability model show?`,
      `Which suppliers have simultaneous deterioration in gross margin, OCF margin, and DPO — compound stress signals?`,
      `Compare lead time drift across EU suppliers against their regional baseline — which are outliers?`,
      `Which suppliers are improving on all three key metrics — OTIF, DPS, and financial health score?`,
    ];
  }

  // ── Contracts ──────────────────────────────────────────────────────────────
  if (route === "contracts") {
    if (role === "CFO") return isUS ? [
      `Which contract renewals carry the highest financial risk if delayed past their expiry date?`,
      `Which contracts lack force majeure or tariff pass-through clauses — what's our unhedged exposure?`,
      `What is the total contracted spend at risk across contracts expiring in the next 90 days?`,
      `Which suppliers have deteriorating financials and upcoming renewals — where should I seek tighter terms?`,
    ] : [
      `Which contract renewals carry the highest financial risk if delayed?`,
      `What is the total contracted spend at risk across contracts expiring in the next 90 days?`,
      `Which contracts lack performance trigger or termination-for-cause clauses we should add at renewal?`,
      `Which suppliers have deteriorating financials and upcoming renewals where we can seek tighter terms?`,
    ];
    if (role === "Procurement") return isUS ? [
      isUS ? `The Haynes International alloy contract expires soon — what leverage do I have and what should I push for?` : `Which contract renewals are most urgent and what are my negotiation priorities?`,
      `Which contracts should have dual-source requirements, OTIF penalty clauses, or lead time SLAs added at renewal?`,
      `Draft talking points for renegotiating the Flex Ltd. EMS framework — focus on tariff risk and lead time guarantees.`,
      `Which of my suppliers are underperforming against contracted OTIF targets right now?`,
    ] : [
      `Which contract renewals are most urgent and what should I push for in each negotiation?`,
      `Which contracts should have performance trigger clauses, OTIF penalties, or dual-source requirements added?`,
      `Draft talking points for my next supplier renegotiation — focus on lead time and quality SLAs.`,
      `Which suppliers are currently underperforming against their contracted OTIF or quality targets?`,
    ];
    // Analyst
    return isUS ? [
      `Map all contracts expiring in the next 6 months against their supplier risk scores — which are the priority renewals?`,
      `Which contracts have no OTIF or quality performance data to benchmark renewal terms against?`,
      `Which suppliers are underperforming against contracted lead time SLAs — give me the gap in days?`,
      `Identify contracts where the contracted value has grown beyond the supplier's financial capacity to deliver.`,
    ] : [
      `Map all contracts expiring in the next 6 months against supplier risk scores — which are priority renewals?`,
      `Which contracts have no performance data to benchmark renewal terms against?`,
      `Which suppliers are underperforming against contracted OTIF or lead time SLAs — show me the gaps?`,
      `Which contracts are with financially stressed suppliers where we should consider restructuring terms?`,
    ];
  }

  // ── Recovery ───────────────────────────────────────────────────────────────
  if (route === "recovery") {
    if (role === "CFO") return isUS ? [
      `Which product line is most exposed to a sole-source failure — and what is the revenue at risk per week of stoppage?`,
      `What is the cost of increasing safety stock to cover the top 3 single-sourced sole-sourced parts?`,
      `If Zhonghe is disqualified, what is the total financial impact including qualification costs and lost production?`,
      `Which recovery scenarios require a capital allocation decision from me this quarter?`,
    ] : [
      `Which product line is most exposed to a single-source failure and what is the revenue at risk per week?`,
      `What is the working capital cost of increasing safety stock across our top 5 sole and single-sourced parts?`,
      `Which recovery scenarios require a capital allocation decision from me this quarter?`,
      `What is the business case for qualifying a second source for our most critical sole-sourced component?`,
    ];
    if (role === "Procurement") return isUS ? [
      `Which single-sourced parts should I start qualification for a second source this quarter — ranked by risk?`,
      `What safety stock levels should I set for Flex Ltd. and Zhonghe given their current lead time trends?`,
      `If Zhonghe Precision is fully disqualified, what is the fastest path to qualifying an alternative precision connector?`,
      `Which sole-sourced parts have no qualification path — and what design-change conversations should I initiate?`,
    ] : [
      `Which single-sourced parts should I start second-source qualification for this quarter — ranked by risk?`,
      `What safety stock levels should I set for each high-risk supplier given their current lead time trends?`,
      `Which sole-sourced parts have no qualification path and require a design-change conversation?`,
      `Which suppliers' time-to-survive is shorter than their time-to-recover — those are my immediate priorities?`,
    ];
    // Analyst
    return isUS ? [
      `For each sole and single-sourced part, what is the gap between time-to-survive and time-to-recover?`,
      `Which product lines have compounding risk — a sole-sourced part AND a financially stressed supplier?`,
      `Model the safety stock cost vs disruption cost trade-off for the top 3 single-sourced components.`,
      `How has the sole/single-source count changed over the last 4 quarters — are we improving our resilience?`,
    ] : [
      `For each sole and single-sourced part, what is the gap between time-to-survive and time-to-recover?`,
      `Which product lines have compounding risk — a sole-sourced part AND a financially stressed supplier?`,
      `Model the safety stock cost vs disruption cost trade-off for the top 3 single-sourced components.`,
      `Which suppliers have lead time drift above 15% and are also single-sourced — compound vulnerability?`,
    ];
  }

  // ── Dashboard default ──────────────────────────────────────────────────────
  if (role === "CFO") return isUS ? [
    topRisk ? `${topRisk.name} is ${topRisk.riskState ?? "high risk"} — what is the P&L impact and what decision do I need to make?` : `What are the top three supply chain risks to our earnings this quarter?`,
    `What is the total unhedged financial exposure across escalated and high-risk suppliers?`,
    openRooms.length > 0 ? `How much combined exposure is tied up in the ${openRooms.length} open crisis room${openRooms.length > 1 ? "s" : ""} — and which requires my sign-off?` : `Which supplier scenario poses the greatest risk of a material earnings impact this quarter?`,
    `How does our current supply chain risk compare to last quarter — are we improving or deteriorating?`,
  ] : [
    topRisk ? `${topRisk.name} is ${topRisk.riskState ?? "high risk"} — what is the P&L impact and what decision do I need to make?` : `What are the top three supply chain risks to our earnings this quarter?`,
    `What is the total unhedged financial exposure across escalated and high-risk suppliers?`,
    openRooms.length > 0 ? `What is the combined exposure across ${openRooms.length} open crisis room${openRooms.length > 1 ? "s" : ""} and which requires my approval?` : `Which supplier is most likely to trigger a profit warning if it disrupts this quarter?`,
    `How does our supply chain risk profile compare to the industry benchmark?`,
  ];

  if (role === "Procurement") return isUS ? [
    topRisk ? `${topRisk.name} is escalated — what are the three most important procurement actions I should take today?` : `Which suppliers need procurement intervention this week?`,
    isUS ? `Which single-sourced parts have both a financially stressed supplier AND increasing lead times — my highest-priority qualifications?` : `Which single-sourced parts need a second-source qualification started this quarter?`,
    activeEvts.length > 0 ? `${activeEvts.length} disruption event${activeEvts.length > 1 ? "s are" : " is"} active — which require an immediate sourcing response from me?` : `Which suppliers have OTIF below target and what's the corrective action?`,
    `Which contracts expiring in the next 90 days need me to start renegotiation prep now?`,
  ] : [
    topRisk ? `${topRisk.name} is escalated — what are the three most important procurement actions I should take today?` : `Which suppliers need procurement intervention this week?`,
    `Which single-sourced parts need a second-source qualification started this quarter?`,
    activeEvts.length > 0 ? `${activeEvts.length} disruption event${activeEvts.length > 1 ? "s are" : " is"} active — which require an immediate sourcing response?` : `Which suppliers have OTIF below target and what's the corrective action?`,
    `Which contracts expiring in the next 90 days need renegotiation prep started now?`,
  ];

  // Analyst default
  return isUS ? [
    topRisk ? `Break down the risk score components for ${topRisk.name} — what's driving it and what's the trend?` : `Which supplier has the most deteriorating risk trajectory over the last 90 days?`,
    `Which suppliers show simultaneous deterioration in OTIF, lead time trend, and financial health — compound signals?`,
    activeEvts.length > 0 ? `Map the ${activeEvts.length} active event${activeEvts.length > 1 ? "s" : ""} to affected suppliers and calculate compound exposure across the portfolio.` : `Which suppliers are most likely to breach a risk threshold in the next 30 days based on trend data?`,
    `Run the Monte Carlo simulation across the top three escalated suppliers — what does the 95th percentile look like?`,
  ] : [
    topRisk ? `Break down the risk score components for ${topRisk.name} — what's driving it and what's the trend?` : `Which supplier has the most deteriorating risk trajectory over the last 90 days?`,
    `Which suppliers show simultaneous deterioration in OTIF, lead time trend, and financial health?`,
    activeEvts.length > 0 ? `Map the ${activeEvts.length} active event${activeEvts.length > 1 ? "s" : ""} to affected suppliers and calculate compound portfolio exposure.` : `Which suppliers are most likely to breach a risk threshold in the next 30 days?`,
    `Which suppliers have improving Altman Z-Scores and OTIF — candidates for reduced monitoring frequency?`,
  ];
}

// ── Proactive insights — things Vero noticed without being asked ──────────────
function buildProactiveInsights(
  suppliers: Supplier[],
  currency: string,
): { icon: string; text: string; severity: "critical" | "warn" | "info" }[] {
  const insights: { icon: string; text: string; severity: "critical" | "warn" | "info" }[] = [];

  // Sub-tier concentration: multiple Tier 1 suppliers in the same country
  const tier1 = suppliers.filter(s => s.tier === 1);
  const countryCounts: Record<string, string[]> = {};
  for (const s of tier1) {
    if (!s.countryCode) continue;
    if (!countryCounts[s.countryCode]) countryCounts[s.countryCode] = [];
    countryCounts[s.countryCode].push(s.name);
  }
  const concentrated = Object.entries(countryCounts).filter(([, names]) => names.length >= 2);
  if (concentrated.length > 0) {
    const [cc, names] = concentrated[0];
    const countryName: Record<string, string> = { CN: "China", DE: "Germany", US: "United States", IT: "Italy", NL: "Netherlands", GB: "United Kingdom", JP: "Japan", KR: "South Korea" };
    insights.push({
      icon: "🔗",
      text: `${names.length} of your Tier 1 suppliers (${names.slice(0, 2).join(", ")}) are concentrated in ${countryName[cc] ?? cc}. A single-country disruption creates compound exposure.`,
      severity: "warn",
    });
  }

  // Suppliers with rapidly deteriorating risk trajectory
  const deteriorating = suppliers.filter(s =>
    s.riskHistory && s.riskHistory.length >= 4 &&
    s.riskHistory[s.riskHistory.length - 1] > s.riskHistory[s.riskHistory.length - 4] + 10
  );
  if (deteriorating.length > 0) {
    const s = deteriorating[0];
    const delta = s.riskHistory![s.riskHistory!.length - 1] - s.riskHistory![s.riskHistory!.length - 4];
    insights.push({
      icon: "📈",
      text: `${s.name}'s risk score rose +${delta} points in 3 months. At this trajectory it breaches the escalation threshold in ~6 weeks.`,
      severity: s.riskState === "ESCALATED" ? "critical" : "warn",
    });
  }

  // High spend + low OTIF — possible contractual penalty
  const lowOtifHighSpend = suppliers
    .filter(s => (s.onTime ?? 100) < 90 && (s.spend ?? 0) > 8)
    .sort((a, b) => (b.spend ?? 0) - (a.spend ?? 0));
  if (lowOtifHighSpend.length > 0) {
    const s = lowOtifHighSpend[0];
    insights.push({
      icon: "⏱",
      text: `${s.name} (${currency}${s.spend?.toFixed(1)}M spend) has OTIF of ${s.onTime}% — below the 92% contracted threshold. A performance penalty clause may be invokable.`,
      severity: "warn",
    });
  }

  // Lead time creep across multiple suppliers
  const leadTimeCreep = suppliers.filter(s =>
    s.leadTimeTrend && s.leadTimeTrend.length >= 3 &&
    s.leadTimeTrend[s.leadTimeTrend.length - 1] > s.leadTimeTrend[0] * 1.2
  );
  if (leadTimeCreep.length > 1) {
    const s = leadTimeCreep[0];
    insights.push({
      icon: "🚢",
      text: `${leadTimeCreep.length} suppliers show lead time creep >20% over 4 quarters. ${s.name}: ${s.leadTimeTrend![0]}d → ${s.leadTimeTrend![s.leadTimeTrend!.length - 1]}d.`,
      severity: "info",
    });
  }

  return insights.slice(0, 3);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AIChat() {
  const {
    route, params, role, currency, clientMode,
    platformCrisisRooms, platformEvents, platformContracts, platformAlerts,
    platformRecoveryProfiles, platformInventoryBudgetM, platformWarehouseAvailableM3,
  } = useApp();
  const suppliers = useSuppliers();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const getContext = useCallback(() => buildContext(
    route, params, suppliers,
    { crisisRooms: platformCrisisRooms, events: platformEvents, contracts: platformContracts, alerts: platformAlerts, recoveryProfiles: platformRecoveryProfiles, inventoryBudgetM: platformInventoryBudgetM, warehouseAvailableM3: platformWarehouseAvailableM3 },
    currency, role
  ), [route, params, suppliers, platformCrisisRooms, platformEvents, platformContracts, platformAlerts, platformRecoveryProfiles, platformInventoryBudgetM, platformWarehouseAvailableM3, currency, role]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMsg: Message = { role: "user", content: msg };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context: getContext() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Something went wrong. Check that ANTHROPIC_API_KEY is configured." };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, getContext]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clear() {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }

  const suggested = getSuggestedQuestions(route, params, suppliers, platformCrisisRooms, platformEvents, clientMode, role);
  const openRoomCount = platformCrisisRooms.filter((r) => r.status === "Open").length;
  const proactiveInsights = buildProactiveInsights(suppliers, currency);

  return (
    <>
      <button className="ai-chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Open AI assistant" title="AI Assistant">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Ask Vero</span>
      </button>

      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Vero <span style={{ fontWeight: 400, opacity: 0.6 }}>· AI Agent</span></div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Expert supply chain analyst · full portfolio context</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {messages.length > 0 && (
                <button className="ai-chat-clear" onClick={clear} title="Clear chat">Clear</button>
              )}
              <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          {/* Messages / empty state */}
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div style={{ padding: "12px 14px 0" }}>
                {proactiveInsights.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--accent)", marginBottom: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                      Vero noticed
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {proactiveInsights.map((ins, i) => (
                        <div
                          key={i}
                          onClick={() => send(`Tell me more about this: ${ins.text}`)}
                          style={{
                            display: "flex", gap: 8, alignItems: "flex-start",
                            background: ins.severity === "critical" ? "rgba(232,64,64,.07)" : ins.severity === "warn" ? "rgba(245,158,11,.07)" : "rgba(0,184,212,.06)",
                            border: `1px solid ${ins.severity === "critical" ? "rgba(232,64,64,.2)" : ins.severity === "warn" ? "rgba(245,158,11,.2)" : "rgba(0,184,212,.18)"}`,
                            borderRadius: 7, padding: "8px 10px", cursor: "pointer",
                            transition: "opacity .12s",
                          }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = ".8"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        >
                          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
                          <span style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.45 }}>{ins.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Suggested questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggested.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      style={{
                        textAlign: "left", background: "var(--surface)",
                        border: "1px solid var(--line)", borderRadius: 8,
                        padding: "8px 11px", fontSize: 12, cursor: "pointer",
                        color: "var(--fg)", lineHeight: 1.45,
                        transition: "border-color .12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "9px 11px", background: "rgba(37,99,235,.06)", border: "1px solid rgba(37,99,235,.15)", borderRadius: 8, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                  I have full context on your {suppliers.length} suppliers
                  {openRoomCount > 0 ? `, ${openRoomCount} open crisis rooms` : ""}
                  {platformEvents.filter(e => e.status === "Active").length > 0 ? `, and ${platformEvents.filter(e => e.status === "Active").length} active events` : ""}
                  . Ask anything.
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`ai-chat-msg ${m.role}`}>
                <div className="ai-chat-bubble">
                  {m.role === "assistant"
                    ? m.content
                      ? <ReactMarkdown>{m.content}</ReactMarkdown>
                      : streaming ? <span className="ai-typing">▋</span> : ""
                    : m.content}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Ask about suppliers, risks, contracts, compliance…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={streaming}
            />
            <button
              className="ai-chat-send"
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              aria-label="Send"
            >
              {streaming ? "…" : "↑"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
