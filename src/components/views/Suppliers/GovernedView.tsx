"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Sparkline } from "@/components/ui/Charts";
import { riskStateClass, riskStateLabel } from "@/lib/utils";
import { ROLE_PERMS } from "@/lib/roles";
import { topDrivers, calcDPS } from "@/lib/analytics";

const COUNTRY_RISK: Record<string, { tier: "Low" | "Medium" | "High"; label: string }> = {
  DE: { tier: "Low",    label: "🟢 DE" },
  DK: { tier: "Low",    label: "🟢 DK" },
  NL: { tier: "Low",    label: "🟢 NL" },
  CH: { tier: "Low",    label: "🟢 CH" },
  IT: { tier: "Medium", label: "🟡 IT" },
  US: { tier: "Low",    label: "🟢 US" },
  GB: { tier: "Low",    label: "🟢 GB" },
  CN: { tier: "High",   label: "🔴 CN" },
  TW: { tier: "High",   label: "🔴 TW" },
  SG: { tier: "Medium", label: "🟡 SG" },
  VN: { tier: "Medium", label: "🟡 VN" },
  MX: { tier: "Low",    label: "🟢 MX" },
};

interface CompareModalProps {
  ids: string[];
  onClose: () => void;
}

function CompareModal({ ids, onClose }: CompareModalProps) {
  const suppliers = useSuppliers();
  const { currency } = useApp();
  const pair = ids.map((id) => suppliers.find((s) => s.id === id)).filter(Boolean) as ReturnType<typeof useSuppliers>;
  if (pair.length < 2) return null;
  const [a, b] = pair;

  const riskColor = (r?: number) => (r ?? 0) >= 65 ? "#dc2626" : (r ?? 0) >= 45 ? "#d97706" : "#16a34a";

  const rows: { label: string; va: string; vb: string; highlight?: boolean }[] = [
    { label: "Risk Score",         va: String(a.risk ?? "—"),                    vb: String(b.risk ?? "—"),                    highlight: true },
    { label: "DPS",                va: `${calcDPS(a)}%`,                          vb: `${calcDPS(b)}%` },
    { label: "Tier",               va: `Tier ${a.tier ?? "—"}`,                  vb: `Tier ${b.tier ?? "—"}` },
    { label: "Category",           va: a.category ?? "—",                         vb: b.category ?? "—" },
    { label: "Annual Spend",       va: a.spend != null ? `${currency}${a.spend}M` : "—",   vb: b.spend != null ? `${currency}${b.spend}M` : "—" },
    { label: "Exposure at Risk",   va: a.exposure != null ? `${currency}${a.exposure}M` : "—", vb: b.exposure != null ? `${currency}${b.exposure}M` : "—" },
    { label: "On-Time %",          va: a.onTime != null ? `${a.onTime}%` : "—",  vb: b.onTime != null ? `${b.onTime}%` : "—" },
    { label: "Quality PPM",        va: String(a.qualityPPM ?? "—"),              vb: String(b.qualityPPM ?? "—") },
    { label: "Current Ratio",      va: a.ratios ? a.ratios.currentRatio.toFixed(2) : "—",   vb: b.ratios ? b.ratios.currentRatio.toFixed(2) : "—" },
    { label: "Debt/Equity",        va: a.ratios ? a.ratios.debtToEquity.toFixed(2) : "—",   vb: b.ratios ? b.ratios.debtToEquity.toFixed(2) : "—" },
    { label: "Net Margin",         va: a.ratios ? `${(a.ratios.netProfitMargin*100).toFixed(1)}%` : "—", vb: b.ratios ? `${(b.ratios.netProfitMargin*100).toFixed(1)}%` : "—" },
    { label: "FRISK Score",        va: a.creditRisk ? String(a.creditRisk.friskScore) : "—", vb: b.creditRisk ? String(b.creditRisk.friskScore) : "—" },
    { label: "Credit Rating",      va: a.creditRisk?.creditRating ?? "—",        vb: b.creditRisk?.creditRating ?? "—" },
    { label: "ESG Score",          va: a.esg ? String(a.esg.score) : "—",        vb: b.esg ? String(b.esg.score) : "—" },
    { label: "Resiliency Score",   va: a.resiliency ? String(a.resiliency.overall) : "—", vb: b.resiliency ? String(b.resiliency.overall) : "—" },
    { label: "Risk State",         va: a.riskState ?? "STABLE",                  vb: b.riskState ?? "STABLE" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={onClose}>
      <div style={{
        background: "var(--surface)", borderRadius: 16, width: "100%", maxWidth: 700,
        maxHeight: "85vh", overflow: "auto",
        boxShadow: "0 24px 60px rgba(0,0,0,.25)",
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>Supplier Comparison</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}>×</button>
        </div>

        {/* Supplier names */}
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 1fr", gap: 0 }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", background: "var(--bg)" }} />
          {pair.map((s) => (
            <div key={s.id} style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", textAlign: "center" }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.countryCode} · {s.category}</div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 20, color: riskColor(s.risk) }}>{s.risk ?? "—"}</span>
                <span className="muted" style={{ fontSize: 10, marginLeft: 4 }}>risk score</span>
              </div>
            </div>
          ))}

          {/* Rows */}
          {rows.map((row, i) => (
            <>
              <div key={`l-${i}`} style={{
                padding: "9px 16px", borderBottom: "1px solid var(--line)",
                fontSize: 12, fontWeight: 600, color: "var(--fg-muted)",
                background: i % 2 === 0 ? "var(--bg)" : "var(--surface)",
              }}>
                {row.label}
              </div>
              {[row.va, row.vb].map((v, j) => (
                <div key={`v-${i}-${j}`} style={{
                  padding: "9px 16px", borderBottom: "1px solid var(--line)",
                  borderLeft: "1px solid var(--line)",
                  fontSize: 13, fontWeight: row.highlight ? 700 : 400,
                  textAlign: "center",
                  background: i % 2 === 0 ? "var(--bg)" : "var(--surface)",
                  color: row.highlight
                    ? riskColor(j === 0 ? a.risk : b.risk)
                    : "inherit",
                }}>
                  {v}
                </div>
              ))}
            </>
          ))}
        </div>

        <div style={{ padding: "12px 20px", display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid var(--line)" }}>
          <div className="muted" style={{ fontSize: 11, alignSelf: "center" }}>
            {(a.risk ?? 0) !== (b.risk ?? 0) && (
              <span>
                <b style={{ color: riskColor(Math.min(a.risk ?? 0, b.risk ?? 0)) }}>
                  {(a.risk ?? 0) < (b.risk ?? 0) ? a.name : b.name}
                </b> has lower risk by {Math.abs((a.risk ?? 0) - (b.risk ?? 0))} points
              </span>
            )}
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export function GovernedView() {
  const { setRoute, archiveSupplier, unarchiveSupplier, deleteSupplier, archivedIds, customSuppliers, role, riskThresholds, currency } = useApp();
  const canEdit = ROLE_PERMS.canEditSuppliers(role);
  const [showArchived, setShowArchived] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const suppliers = useSuppliers(showArchived);
  const customIds = new Set(customSuppliers.map((s) => s.id));
  const archivedCount = Object.keys(archivedIds).length;

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 2 ? [...prev, id] : [prev[1], id]
    );
  }

  return (
    <>
      {showCompare && compareIds.length === 2 && (
        <CompareModal ids={compareIds} onClose={() => setShowCompare(false)} />
      )}
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            Click a supplier to open the governed workflow. Check two suppliers to compare side-by-side.
          </div>
          <div className="inline">
            {compareIds.length === 2 && (
              <button className="btn primary" style={{ fontSize: 12 }} onClick={() => setShowCompare(true)}>
                Compare ({compareIds.length})
              </button>
            )}
            {compareIds.length > 0 && (
              <button className="btn" style={{ fontSize: 12 }} onClick={() => setCompareIds([])}>
                Clear
              </button>
            )}
            {archivedCount > 0 && (
              <button className="btn" style={{ whiteSpace: "nowrap", fontSize: 12 }} onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
              </button>
            )}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Name</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Country Risk</th>
                <th>Spend</th>
                <th>Exposure</th>
                <th>DPS</th>
                <th>Risk Score (12m)</th>
                <th>Risk Drivers</th>
                <th>Risk State</th>
                <th>Freshness</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const isArchived = !!archivedIds[s.id];
                const isCustom = customIds.has(s.id);
                const cr = s.countryCode ? COUNTRY_RISK[s.countryCode] : undefined;
                const riskColor = (s.risk ?? 0) >= 65 ? "#dc2626" : (s.risk ?? 0) >= 45 ? "#d97706" : "#16a34a";
                const isCompared = compareIds.includes(s.id);
                const drivers = topDrivers(s);
                const dps = calcDPS(s);
                const dpsColor = dps >= 55 ? "#dc2626" : dps >= 35 ? "#d97706" : "#16a34a";

                // Threshold breach detection
                const breaches: string[] = [];
                if ((s.risk ?? 0) >= riskThresholds.highRisk) breaches.push(`Risk ≥ ${riskThresholds.highRisk}`);
                if (s.ratios && s.ratios.currentRatio < riskThresholds.currentRatio) breaches.push(`CR < ${riskThresholds.currentRatio}`);
                if (s.ratios && s.ratios.debtToEquity > riskThresholds.deRatio) breaches.push(`D/E > ${riskThresholds.deRatio}`);

                return (
                  <tr key={s.id} style={{ opacity: isArchived ? 0.45 : 1, background: isCompared ? "rgba(37,99,235,.04)" : undefined }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isCompared}
                        onChange={() => toggleCompare(s.id)}
                        title="Add to comparison"
                        style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <b>{s.name}</b>
                        {isArchived && <span className="muted" style={{ fontSize: 11 }}>(archived)</span>}
                        {breaches.length > 0 && (
                          <span
                            title={`Threshold breached: ${breaches.join(", ")}`}
                            style={{
                              fontSize: 9, fontWeight: 800, letterSpacing: ".04em",
                              color: "var(--warn)", border: "1px solid var(--warn)",
                              borderRadius: 4, padding: "1px 4px", cursor: "help",
                            }}
                          >
                            ⚠ THRESHOLD
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{s.tier ?? "—"}</td>
                    <td>{s.category || "—"} <span className="muted">({s.categoryConfidence || "—"})</span></td>
                    <td>
                      {cr ? (
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5,
                          background: cr.tier === "High" ? "rgba(220,38,38,.1)" : cr.tier === "Medium" ? "rgba(217,119,6,.1)" : "rgba(22,163,74,.1)",
                          color: cr.tier === "High" ? "var(--risk)" : cr.tier === "Medium" ? "var(--warn)" : "var(--ok)",
                        }}>
                          {cr.label} · {cr.tier}
                        </span>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {s.spend != null ? `${currency}${s.spend}M` : <span className="muted">—</span>}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                      {s.exposure != null ? `${currency}${s.exposure}M` : <span className="muted">—</span>}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 13, color: dpsColor }} title="Disruption Probability Score">
                        {dps}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {s.riskHistory && s.riskHistory.length > 1 && (
                          <Sparkline data={s.riskHistory} color={riskColor} width={60} height={22} filled={false} />
                        )}
                        <span
                          style={{ fontWeight: 700, fontSize: 13, color: riskColor, cursor: "help" }}
                          title={`Risk ${s.risk ?? "—"} · Drivers: ${drivers.join(" · ")}`}
                        >
                          {s.risk ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {drivers.slice(0, 2).map((d) => (
                          <span key={d} style={{
                            fontSize: 10, padding: "1px 5px", borderRadius: 4,
                            background: "rgba(220,38,38,.07)", color: "var(--risk)",
                            fontWeight: 600, whiteSpace: "nowrap",
                          }}>
                            {d}
                          </span>
                        ))}
                        {drivers[0] === "Stable indicators" && (
                          <span style={{ fontSize: 10, color: "var(--ok)", fontWeight: 600 }}>Stable indicators</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge variant={riskStateClass(s.riskState, s.risk) as any}>
                        {riskStateLabel(s.riskState, s.risk)}
                      </Badge>
                    </td>
                    <td className="muted" style={{ fontSize: 12 }}>{s.data?.updatedLabel || "—"}</td>
                    <td>
                      <div className="inline" style={{ gap: 6, flexWrap: "nowrap" }}>
                        {!isArchived && (
                          <button className="btn" onClick={() => setRoute("supplier", { id: s.id })}>Open</button>
                        )}
                        {canEdit && (isArchived ? (
                          <button className="btn" style={{ fontSize: 12 }} onClick={() => unarchiveSupplier(s.id)}>Restore</button>
                        ) : (
                          <button className="btn" style={{ fontSize: 12, color: "var(--muted)" }} onClick={() => archiveSupplier(s.id)}>Archive</button>
                        ))}
                        {canEdit && isCustom && (
                          <button className="btn" style={{ fontSize: 12, color: "var(--risk)" }}
                            onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteSupplier(s.id); }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
