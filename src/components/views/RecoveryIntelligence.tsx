"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { HeatBar } from "@/components/ui/Charts";

function riskColor(days: number, threshold: number) {
  if (days <= threshold * 0.4) return "var(--risk)";
  if (days <= threshold * 0.7) return "var(--warn)";
  return "var(--ok)";
}

export function RecoveryIntelligence() {
  const { setRoute, platformRecoveryProfiles, platformProductLines, currency } = useApp();
  const suppliers = useSuppliers();
  const [selectedLine, setSelectedLine] = useState(platformProductLines[0]?.id ?? "");

  const profiles = Object.entries(platformRecoveryProfiles);
  const minTTS = profiles.length ? Math.min(...profiles.map(([, p]) => p.timeToSurvive)) : 0;
  const maxTTR = profiles.length ? Math.max(...profiles.map(([, p]) => p.timeToRecover)) : 0;
  const soloSourced = platformProductLines.flatMap((pl) =>
    pl.bomItems.filter((b) => b.soloSourced)
  ).length;
  const unqualifiedAlt = profiles.filter(([, p]) => !p.alternativeQualified).length;

  const selectedProductLine = platformProductLines.find((pl) => pl.id === selectedLine) ?? platformProductLines[0];

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
        />
        <KpiCardV2
          label="Longest Recovery Time"
          value={`${maxTTR}d`}
          sub="Days to qualify alternative"
          accent="var(--warn)"
          icon="🔄"
        />
        <KpiCardV2
          label="Solo-Sourced Parts"
          value={String(soloSourced)}
          sub="Single supplier dependency"
          accent="var(--risk)"
          icon="🔗"
        />
        <KpiCardV2
          label="No Qualified Alternative"
          value={String(unqualifiedAlt)}
          sub="Suppliers without backup"
          accent="var(--warn)"
          icon="⚠️"
        />
      </div>

      {/* TTR / TTS table */}
      <div className="card">
        <h2>Time-to-Survive & Time-to-Recover</h2>
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
                          <div
                            className="muted"
                            style={{ fontSize: 10, color: "var(--warn)" }}
                          >
                            ⚠ increase needed
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
            <h2 style={{ margin: 0 }}>BOM — Part-Level Risk Explorer</h2>
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
            <span className="muted" style={{ fontSize: 12 }}>Solo-sourced: </span>
            <b
              style={{
                fontSize: 13,
                color:
                  selectedProductLine.bomItems.filter((b) => b.soloSourced)
                    .length > 0
                    ? "var(--risk)"
                    : "var(--ok)",
              }}
            >
              {selectedProductLine.bomItems.filter((b) => b.soloSourced).length}
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
                <th>Solo-Sourced</th>
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
                        item.soloSourced
                          ? { background: "rgba(220,38,38,.04)" }
                          : undefined
                      }
                    >
                      <td className="mono" style={{ fontSize: 12 }}>
                        {item.partNumber}
                      </td>
                      <td style={{ fontWeight: 600, fontSize: 13 }}>
                        {item.partName}
                        {item.soloSourced && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              background: "rgba(220,38,38,.12)",
                              color: "var(--risk)",
                              borderRadius: 4,
                              padding: "1px 5px",
                            }}
                          >
                            SOLE SOURCE
                          </span>
                        )}
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
                        <span
                          style={{
                            color:
                              item.leadTimeDays > 60
                                ? "var(--risk)"
                                : item.leadTimeDays > 30
                                ? "var(--warn)"
                                : "inherit",
                            fontWeight: 600,
                          }}
                        >
                          {item.leadTimeDays}d
                        </span>
                      </td>
                      <td>
                        <Badge variant={item.soloSourced ? "risk" : "ok"}>
                          {item.soloSourced ? "Yes" : "No"}
                        </Badge>
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
        <h2>Recommended Recovery Actions</h2>
        <div className="card-sub">
          AI-generated playbook based on TTR gaps and solo-sourced parts
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            marginTop: 14,
          }}
        >
          {[
            {
              title: "Emergency Safety Stock",
              desc: "Increase SIT Group safety stock to 45 days. TTR gap of +72 days creates a critical exposure window.",
              urgency: "risk" as const,
              action: "Raise PO",
            },
            {
              title: "Qualify Alternative Supplier",
              desc: "Initiate qualification for Georg Fischer alternative — Aliaxis Group (NL) identified as viable. Lead time: 45 days.",
              urgency: "warn" as const,
              action: "Start Qualification",
            },
            {
              title: "Dual-Source Ebm-papst",
              desc: "Fan motor EBM-X3 is sole-sourced with 55-day lead time. Papst competitor ebm (UK) can be onboarded in 30 days.",
              urgency: "warn" as const,
              action: "Initiate Audit",
            },
          ].map((rec, i) => (
            <div
              key={i}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 12,
                padding: 14,
                background: "var(--surface)",
              }}
            >
              <Badge variant={rec.urgency} style={{ marginBottom: 8 }}>
                {rec.urgency === "risk" ? "CRITICAL" : "ACTION REQUIRED"}
              </Badge>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                {rec.title}
              </div>
              <div
                className="muted"
                style={{ fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}
              >
                {rec.desc}
              </div>
              <button className="btn primary" style={{ fontSize: 12 }}>
                {rec.action}
              </button>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          Recovery recommendations powered by Chain Verity AI · calibrated against recovery profiles and BOM lead times.
        </div>
      </div>
    </div>
  );
}
