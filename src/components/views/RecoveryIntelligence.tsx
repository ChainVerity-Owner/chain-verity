"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeatBar } from "@/components/ui/Charts";
import { InfoTip } from "@/components/ui/InfoTip";
import type { RecoveryProfile, Supplier } from "@/types";
import type { RiskAppetite } from "@/context/AppContext";

// ── Recovery action thresholds by appetite ─────────────────────────────────────
const THRESHOLDS: Record<RiskAppetite, { ttrGap: number; stockShortfall: number }> = {
  Conservative: { ttrGap: 0,  stockShortfall: 0  },
  Moderate:     { ttrGap: 15, stockShortfall: 10 },
  Aggressive:   { ttrGap: 30, stockShortfall: 20 },
};

// Labels and language scaled to appetite — avoids panic language for companies that accept more risk
const URGENCY_LABEL: Record<RiskAppetite, { critical: string; priority: string; monitor: string }> = {
  Conservative: { critical: "CRITICAL",       priority: "ACTION REQUIRED", monitor: "REVIEW" },
  Moderate:     { critical: "HIGH PRIORITY",  priority: "ACTION REQUIRED", monitor: "MONITOR" },
  Aggressive:   { critical: "MONITOR",        priority: "LOW PRIORITY",    monitor: "FOR AWARENESS" },
};

const URGENCY_VARIANT: Record<RiskAppetite, { critical: "risk" | "warn" | "obs"; priority: "risk" | "warn" | "obs"; monitor: "risk" | "warn" | "obs" }> = {
  Conservative: { critical: "risk", priority: "warn", monitor: "obs" },
  Moderate:     { critical: "warn", priority: "warn", monitor: "obs" },
  Aggressive:   { critical: "obs",  priority: "obs",  monitor: "obs" },
};

interface RecoveryAction {
  title: string;
  desc: string;
  urgency: "critical" | "priority" | "monitor";
  action: string;
  supplierId: string;
}

function generateActions(
  profiles: [string, RecoveryProfile][],
  suppliers: Supplier[],
  appetite: RiskAppetite,
): RecoveryAction[] {
  const { ttrGap: gapThreshold, stockShortfall: stockThreshold } = THRESHOLDS[appetite];
  const actions: RecoveryAction[] = [];

  for (const [id, p] of profiles) {
    const s = suppliers.find((x) => x.id === id);
    if (!s) continue;
    const gap = p.timeToRecover - p.timeToSurvive;
    const shortfall = p.safetyStockRecommendation - p.inventoryBufferDays;

    // TTR gap with no qualified alternative — two distinct actions at different urgency tiers
    if (gap > gapThreshold && !p.alternativeQualified) {
      const urgency: "critical" | "priority" | "monitor" =
        gap > gapThreshold + 60 ? "critical" : gap > gapThreshold + 20 ? "priority" : "monitor";
      const verb = appetite === "Conservative" ? "Immediately increase" : appetite === "Moderate" ? "Increase" : "Review";
      actions.push({
        title: `Safety Stock — ${s.name}`,
        desc: `${verb} safety stock to ${p.safetyStockRecommendation} days. Current buffer (${p.inventoryBufferDays}d) leaves a +${gap}d exposure window with no qualified alternative. Estimated cost: ${s.spend ? `~${(p.estimatedStockIncreaseCostM).toFixed(1)}M` : "TBC"}.`,
        urgency,
        action: "Raise PO",
        supplierId: id,
      });
      // Qualification is always a separate, lower-urgency action
      actions.push({
        title: `Qualify Alternative — ${s.name}`,
        desc: `No qualified backup exists. TTR of ${p.timeToRecover}d vs TTS of ${p.timeToSurvive}d leaves a +${gap}d gap. ${appetite === "Conservative" ? "Initiate qualification immediately." : appetite === "Moderate" ? "Begin qualification process." : "Identify and assess candidates."}`,
        urgency: urgency === "critical" ? "priority" : "monitor",
        action: "Start Qualification",
        supplierId: id,
      });
    }

    // Safety stock shortfall below threshold (without the no-alt condition)
    if (shortfall > stockThreshold && p.alternativeQualified) {
      actions.push({
        title: `Buffer Review — ${s.name}`,
        desc: `Current stock (${p.inventoryBufferDays}d) is ${shortfall}d below the ${p.safetyStockRecommendation}d recommendation. ${appetite === "Aggressive" ? "No immediate action required — qualified alternative exists." : "Review PO schedule to build toward recommendation."}`,
        urgency: "monitor",
        action: "Review PO Schedule",
        supplierId: id,
      });
    }
  }

  // Sort: critical → priority → monitor, then by gap size descending
  const order = { critical: 0, priority: 1, monitor: 2 };
  return actions.sort((a, b) => order[a.urgency] - order[b.urgency]).slice(0, 6);
}

function riskColor(days: number, threshold: number) {
  if (days <= threshold * 0.4) return "var(--risk)";
  if (days <= threshold * 0.7) return "var(--warn)";
  return "var(--ok)";
}

export function RecoveryIntelligence() {
  const { setRoute, platformRecoveryProfiles, platformProductLines, platformInventoryBudgetM, platformWarehouseAvailableM3, riskAppetite, currency } = useApp();
  const suppliers = useSuppliers();
  const [selectedLine, setSelectedLine] = useState(platformProductLines[0]?.id ?? "");

  const profiles = Object.entries(platformRecoveryProfiles);
  const minTTS = profiles.length ? Math.min(...profiles.map(([, p]) => p.timeToSurvive)) : 0;
  const maxTTR = profiles.length ? Math.max(...profiles.map(([, p]) => p.timeToRecover)) : 0;
  const soloSourced = platformProductLines.flatMap((pl) =>
    pl.bomItems.filter((b) => b.sourcingType !== "multi")
  ).length;
  const unqualifiedAlt = profiles.filter(([, p]) => !p.alternativeQualified).length;

  const selectedProductLine = platformProductLines.find((pl) => pl.id === selectedLine) ?? platformProductLines[0];

  const recoveryActions = generateActions(profiles, suppliers, riskAppetite);

  // Aggregate cost and storage needed to bring all suppliers to recommended safety stock level
  const totalStockCostM   = profiles.reduce((a, [, p]) => a + p.estimatedStockIncreaseCostM, 0);
  const totalStorageM3    = profiles.reduce((a, [, p]) => a + p.additionalStorageM3, 0);
  const budgetFeasible    = totalStockCostM <= platformInventoryBudgetM;
  const storageFeasible   = totalStorageM3  <= platformWarehouseAvailableM3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div className="grid-4">
        <KpiCardV2
          label="Lowest Time to Survive"
          value={`${minTTS}d`}
          sub="Days before line stops"
          accent="var(--risk)"
          icon="⏱"
          info="The shortest Time-to-Survive (TTS) across all suppliers — the number of days of existing safety stock before a production line halt occurs if this supplier fails today. This is your most urgent recovery window."
        />
        <KpiCardV2
          label="Longest Recovery Time"
          value={`${maxTTR}d`}
          sub="Days to qualify alternative"
          accent="var(--warn)"
          icon="🔄"
          info="The longest Time-to-Recover (TTR) across all suppliers — the number of days required to qualify and onboard a replacement supplier for the hardest-to-source component. Where TTR exceeds TTS, there is a production gap that requires pre-emptive action."
        />
        <KpiCardV2
          label="Sole / Single-Sourced"
          value={String(soloSourced)}
          sub="No or one qualified supplier"
          accent="var(--risk)"
          icon="🔗"
          info="Suppliers or components with no qualified alternative source. Sole-sourced items create a single point of failure — a disruption cannot be mitigated through switching until a new supplier is fully qualified, which typically takes 60–180 days."
        />
        <KpiCardV2
          label="No Qualified Alternative"
          value={String(unqualifiedAlt)}
          sub="Suppliers without backup"
          accent="var(--warn)"
          icon="⚠️"
          info="Suppliers for whom a potential alternative exists but has not yet been through the full qualification process. These represent latent risk — an alternative is identified but cannot be activated without completing audits, certifications, or trial runs."
        />
      </div>

      {/* Inventory feasibility banner */}
      <div className="card" style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Safety Stock Feasibility</span>
            <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>
              Cost and space to bring all suppliers to recommended buffer levels
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Total investment needed</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: budgetFeasible ? "var(--ok)" : "var(--risk)" }}>
                {currency}{totalStockCostM.toFixed(1)}M
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>of {currency}{platformInventoryBudgetM.toFixed(1)}M available</div>
            </div>
            <div style={{ width: 1, background: "var(--line)" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>Warehouse space needed</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: storageFeasible ? "var(--ok)" : "var(--risk)" }}>
                {totalStorageM3}m³
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>of {platformWarehouseAvailableM3}m³ available</div>
            </div>
            <div style={{ width: 1, background: "var(--line)" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4, justifyContent: "center" }}>
              <Badge variant={budgetFeasible ? "ok" : "risk"}>
                {budgetFeasible ? "Cash feasible" : "Exceeds cash budget"}
              </Badge>
              <Badge variant={storageFeasible ? "ok" : "risk"}>
                {storageFeasible ? "Space feasible" : "Exceeds warehouse capacity"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* TTR / TTS table */}
      <div className="card">
        <h2>Time-to-Survive & Time-to-Recover<InfoTip text="TTS is days of inventory buffer before production stops if a supplier fails. TTR is days to qualify and onboard an alternative. A gap (TTR > TTS) means confirmed production halt. Solo-sourced suppliers with large gaps represent the highest continuity risk." width={260} /></h2>
        <div className="card-sub">
          Business continuity gap analysis · TTR gap = TTR − TTS (positive = at-risk window)
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Category</th>
                <th>Inventory Buffer</th>
                <th>Time to Survive</th>
                <th>Time to Recover</th>
                <th>TTR Gap</th>
                <th>Alt. Qualified?</th>
                <th>Safety Stock Rec.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {profiles
                .map(([id, p]) => {
                  const supplier = suppliers.find((s) => s.id === id);
                  if (!supplier) return null;
                  const gap = p.timeToRecover - p.timeToSurvive;
                  return { id, p, supplier, gap };
                })
                .filter(Boolean)
                .sort((a, b) => b!.gap - a!.gap)
                .map((row) => {
                  if (!row) return null;
                  const { id, p, supplier, gap } = row;
                  return (
                    <tr key={id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{supplier.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          Tier {supplier.tier} · {supplier.region}
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>{supplier.category}</td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {p.inventoryBufferDays}d
                        </div>
                        <HeatBar
                          value={p.inventoryBufferDays}
                          max={60}
                          height={4}
                          showLabel={false}
                        />
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: riskColor(p.timeToSurvive, 30),
                          }}
                        >
                          {p.timeToSurvive}d
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--info)" }}>
                          {p.timeToRecover}d
                        </span>
                      </td>
                      <td>
                        <Badge
                          variant={
                            gap > 30 ? "risk" : gap > 0 ? "warn" : "ok"
                          }
                        >
                          {gap > 0 ? `+${gap}d` : `${gap}d`}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          variant={p.alternativeQualified ? "ok" : "risk"}
                        >
                          {p.alternativeQualified ? "Yes" : "No"}
                        </Badge>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              p.safetyStockRecommendation >
                              p.inventoryBufferDays
                                ? "var(--warn)"
                                : "var(--ok)",
                          }}
                        >
                          {p.safetyStockRecommendation}d
                        </span>
                        {p.safetyStockRecommendation >
                          p.inventoryBufferDays && (
                          <div style={{ marginTop: 3 }}>
                            <div style={{ fontSize: 10, color: "var(--warn)", fontWeight: 600 }}>
                              ⚠ increase needed
                            </div>
                            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>
                              {currency}{p.estimatedStockIncreaseCostM.toFixed(1)}M
                              {p.additionalStorageM3 > 0 && ` · ${p.additionalStorageM3}m³`}
                            </div>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{ fontSize: 12 }}
                          onClick={() =>
                            setRoute("supplier", { id: supplier.id })
                          }
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOM / Part-level risk */}
      <div className="card">
        <div className="row" style={{ marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>BOM — Part-Level Risk Explorer<InfoTip text="Bill of Materials decomposed to the component level, with each part scored for supply risk. Highlights solo-sourced items, long-lead-time components, and parts from high-risk suppliers. Prioritize safety stock and dual-sourcing investments here." width={260} /></h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              Bill of Materials risk by product line · solo-sourced parts highlighted
            </div>
          </div>
          <div className="tabs">
            {platformProductLines.map((pl) => (
              <button
                key={pl.id}
                className={`tab ${selectedLine === pl.id ? "active" : ""}`}
                onClick={() => setSelectedLine(pl.id)}
              >
                {pl.name}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 14,
            padding: "10px 14px",
            background: "var(--surface)",
            borderRadius: 10,
          }}
        >
          <div>
            <span className="muted" style={{ fontSize: 12 }}>Model: </span>
            <b style={{ fontSize: 13 }}>{selectedProductLine.model}</b>
          </div>
          <div>
            <span className="muted" style={{ fontSize: 12 }}>Annual volume: </span>
            <b style={{ fontSize: 13 }}>
              {selectedProductLine.annualVolume.toLocaleString()} units
            </b>
          </div>
          <div>
            <span className="muted" style={{ fontSize: 12 }}>BOM items: </span>
            <b style={{ fontSize: 13 }}>{selectedProductLine.bomItems.length}</b>
          </div>
          <div>
            <span className="muted" style={{ fontSize: 12 }}>Sole/single-sourced: </span>
            <b
              style={{
                fontSize: 13,
                color:
                  selectedProductLine.bomItems.filter((b) => b.sourcingType !== "multi")
                    .length > 0
                    ? "var(--risk)"
                    : "var(--ok)",
              }}
            >
              {selectedProductLine.bomItems.filter((b) => b.sourcingType !== "multi").length}
            </b>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Part Number</th>
                <th>Part Name</th>
                <th>Supplier</th>
                <th>Qty</th>
                <th>Unit Cost</th>
                <th>Lead Time</th>
                <th>Sourcing</th>
                <th>Part Risk</th>
              </tr>
            </thead>
            <tbody>
              {selectedProductLine.bomItems
                .sort((a, b) => b.riskScore - a.riskScore)
                .map((item) => {
                  const supplier = suppliers.find(
                    (s) => s.id === item.supplierId
                  );
                  return (
                    <tr
                      key={item.partNumber}
                      style={
                        item.sourcingType !== "multi"
                          ? { background: "rgba(220,38,38,.04)" }
                          : undefined
                      }
                    >
                      <td className="mono" style={{ fontSize: 12 }}>
                        {item.partNumber}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {item.partName}
                      </td>
                      <td>
                        {supplier ? (
                          <span
                            style={{
                              color: "var(--accent)",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                            onClick={() =>
                              setRoute("supplier", { id: supplier.id })
                            }
                          >
                            {supplier.name}
                          </span>
                        ) : (
                          <span className="muted">Unknown</span>
                        )}
                      </td>
                      <td>{item.quantity}</td>
                      <td>€{item.unitCost.toFixed(2)}</td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: item.leadTimeDays > 60 ? "var(--risk)" : item.leadTimeDays > 30 ? "var(--warn)" : "inherit",
                        }}>
                          {item.leadTimeDays}d
                        </span>
                      </td>
                      <td>
                        {item.sourcingType === "sole" ? (
                          <Badge variant="risk">Sole</Badge>
                        ) : item.sourcingType === "single" ? (
                          <Badge variant="warn">Single</Badge>
                        ) : (
                          <Badge variant="ok">Multi</Badge>
                        )}
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <HeatBar
                            value={item.riskScore}
                            max={100}
                            height={6}
                            showLabel={false}
                          />
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color:
                                item.riskScore >= 70
                                  ? "var(--risk)"
                                  : item.riskScore >= 40
                                  ? "var(--warn)"
                                  : "var(--ok)",
                              minWidth: 28,
                            }}
                          >
                            {item.riskScore}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recovery actions */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
          <h2 style={{ margin: 0 }}>
            Recommended Recovery Actions
            <InfoTip text="Actions are generated from TTR gaps, safety stock shortfalls, and sourcing posture — filtered and prioritized according to your organization's risk appetite. Change appetite in Settings." width={260} />
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>Risk appetite:</span>
            <Badge variant={riskAppetite === "Conservative" ? "risk" : riskAppetite === "Moderate" ? "warn" : "ok"}>
              {riskAppetite}
            </Badge>
          </div>
        </div>
        <div className="card-sub" style={{ marginBottom: 14 }}>
          {riskAppetite === "Conservative"
            ? "Showing all gaps — any TTR gap or stock shortfall is flagged."
            : riskAppetite === "Moderate"
            ? "Showing gaps >15 days and shortfalls >10 days."
            : "Showing only critical gaps >30 days with no qualified alternative."}
        </div>

        {recoveryActions.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No actions required</div>
            <div className="muted" style={{ fontSize: 12 }}>
              All TTR gaps and stock shortfalls are within your {riskAppetite.toLowerCase()} risk appetite thresholds.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {recoveryActions.map((rec, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: 14,
                  background: "var(--surface)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Badge variant={URGENCY_VARIANT[riskAppetite][rec.urgency]} style={{ marginBottom: 8, alignSelf: "flex-start" }}>
                  {URGENCY_LABEL[riskAppetite][rec.urgency]}
                </Badge>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{rec.title}</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 12, flex: 1 }}>
                  {rec.desc}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn primary" style={{ fontSize: 12 }}>{rec.action}</button>
                  <button
                    className="btn"
                    style={{ fontSize: 12 }}
                    onClick={() => setRoute("supplier", { id: rec.supplierId })}
                  >
                    View Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="note" style={{ marginTop: 12 }}>
          Actions calibrated to <b>{riskAppetite}</b> risk appetite · adjust in Settings to surface more or fewer actions.
        </div>
      </div>
    </div>
  );
}
