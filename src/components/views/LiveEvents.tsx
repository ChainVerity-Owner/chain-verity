"use client";

import { useState, useEffect } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { EventCategory, EventSeverity, LiveEvent } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { KpiCardV2 } from "@/components/ui/Card";
import { PulseDot } from "@/components/ui/Charts";
import { InfoTip } from "@/components/ui/InfoTip";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  natural_disaster: "Natural Disaster",
  geopolitical: "Geopolitical",
  logistics: "Logistics",
  labor: "Labor",
  financial: "Financial",
  regulatory: "Regulatory",
  cyber: "Cyber",
  quality: "Quality",
};

function severityVariant(s: EventSeverity) {
  if (s === "critical") return "risk" as const;
  if (s === "high") return "warn" as const;
  if (s === "medium") return "info" as const;
  return "muted-b" as const;
}

function statusVariant(s: string) {
  if (s === "Active") return "risk" as const;
  if (s === "Monitoring") return "warn" as const;
  return "ok" as const;
}

function shipmentStatusVariant(s: string) {
  if (s === "Customs Hold" || s === "Delayed") return "risk" as const;
  if (s === "At Risk") return "warn" as const;
  return "ok" as const;
}

export function LiveEvents() {
  const { setRoute, platformEvents, platformShipments, currency } = useApp();
  const suppliers = useSuppliers();
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");
  const [eonetEvents, setEonetEvents] = useState<LiveEvent[]>([]);
  const [eonetStatus, setEonetStatus] = useState<"loading" | "live" | "error">("loading");

  useEffect(() => {
    fetch("/api/eonet")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) {
          setEonetEvents(data as LiveEvent[]);
          setEonetStatus("live");
        } else {
          setEonetStatus("error");
        }
      })
      .catch(() => setEonetStatus("error"));
  }, []);

  const allEvents = [...eonetEvents, ...platformEvents];

  // Only show events where at least one affected supplier is mapped
  const mappedEvents = allEvents.filter((e) =>
    e.affectedSupplierIds?.some((id) => suppliers.find((s) => s.id === id))
  );

  const filtered = mappedEvents.filter((e) => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (sevFilter !== "all" && e.severity !== sevFilter) return false;
    return true;
  });

  const active = mappedEvents.filter((e) => e.status === "Active").length;
  const critical = mappedEvents.filter((e) => e.severity === "critical").length;
  const delayedShipments = platformShipments.filter((s) => s.delayDays && s.delayDays > 0).length;
  const totalExposure = platformShipments.filter((s) => s.delayDays).reduce((sum, s) => {
    return sum + parseFloat(s.value.replace(/[^0-9.]/g, ""));
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCardV2 label="Active Events" value={String(active)} sub="Requiring attention" accent="var(--risk)" icon="🔴" trend={2} trendSuffix="" trendHigherIsBetter={false} />
        <KpiCardV2 label="Critical Severity" value={String(critical)} sub="Immediate action needed" accent="var(--risk)" icon="🚨" />
        <KpiCardV2 label="Delayed Shipments" value={String(delayedShipments)} sub="Across all carriers" accent="var(--warn)" icon="🚢" />
        <KpiCardV2 label="Shipment Value at Risk" value={`${currency}${totalExposure.toFixed(1)}M`} sub="Delayed or at-risk cargo" accent="var(--warn)" />
      </div>

      {/* Event feed */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Live Disruption Events<InfoTip text="Real-time disruption events from Everstream Analytics — natural disasters, geopolitical events, labour actions, logistics disruptions. Severity reflects the affected suppliers' combined exposure in your portfolio." width={240} /></h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              AI-monitored across 150+ risk categories · 400+ languages · Sourced from media, regulatory, and logistics feeds
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: eonetStatus === "live" ? "var(--ok)" : eonetStatus === "loading" ? "var(--warn)" : "var(--muted)" }} />
              <span className="muted" style={{ fontSize: 11 }}>
                {eonetStatus === "live"
                  ? `NASA EONET: ${eonetEvents.length} active natural events · refreshed 15 min`
                  : eonetStatus === "loading"
                  ? "Fetching NASA EONET events…"
                  : "NASA EONET unavailable — showing curated events"}
              </span>
            </div>
          </div>
          <div className="inline">
            <select className="tb-select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="all">Category: All</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select className="tb-select" value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}>
              <option value="all">Severity: All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <div className="timeline">
          {filtered.map((ev, idx) => {
            const affected = ev.affectedSupplierIds
              .map((id) => suppliers.find((s) => s.id === id)?.name)
              .filter(Boolean);
            const isActive = ev.status === "Active";
            const isCritical = ev.severity === "critical";
            const dotColor = isCritical ? "#dc2626" : ev.severity === "high" ? "#d97706" : ev.severity === "medium" ? "#2563eb" : "#6b7280";

            const isLive = !!(ev as { isLive?: boolean }).isLive;
            return (
              <div key={ev.id} className="timeline-item">
                <div className="timeline-track">
                  <div style={{ position: "relative", width: 14, height: 14, marginTop: 3, flexShrink: 0 }}>
                    {isActive && <span className="pulse-dot-el" style={{ position: "absolute", inset: -3, borderRadius: "50%", display: "block", background: dotColor, opacity: 0.2 }} />}
                    <PulseDot color={dotColor} size={14} />
                  </div>
                  {idx < filtered.length - 1 && <div className="timeline-line" style={{ marginTop: 4 }} />}
                </div>
                <div className="timeline-body">
                  <div style={{
                    border: "1px solid var(--line)",
                    borderLeft: `3px solid ${dotColor}`,
                    borderRadius: 12,
                    background: "var(--surface)",
                    padding: "12px 14px",
                    transition: "background .1s",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
                          <Badge variant={severityVariant(ev.severity)}>{ev.severity.toUpperCase()}</Badge>
                          <Badge variant="muted-b">{CATEGORY_LABELS[ev.category as EventCategory] ?? ev.category}</Badge>
                          <Badge variant={statusVariant(ev.status)}>{ev.status}</Badge>
                          {isLive && (
                            <span style={{ fontSize: 9, fontWeight: 800, color: "var(--ok)", letterSpacing: ".06em", border: "1px solid var(--ok)", borderRadius: 4, padding: "1px 5px" }}>
                              ● LIVE
                            </span>
                          )}
                          <span className="muted" style={{ fontSize: 11 }}>{ev.region} · {ev.date}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{ev.title}</div>
                        <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{ev.detail}</div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                          {ev.estimatedImpact && (
                            <div style={{ background: "rgba(220,38,38,.06)", border: "1px solid rgba(220,38,38,.15)", borderRadius: 8, padding: "4px 10px", fontSize: 12 }}>
                              <span className="muted">Impact: </span>
                              <b style={{ color: "var(--risk)" }}>{ev.estimatedImpact}</b>
                            </div>
                          )}
                          {ev.leadTimeExtension && (
                            <div style={{ background: "rgba(217,119,6,.06)", border: "1px solid rgba(217,119,6,.15)", borderRadius: 8, padding: "4px 10px", fontSize: 12 }}>
                              <span className="muted">Lead time: </span>
                              <b>+{ev.leadTimeExtension}</b>
                            </div>
                          )}
                          {ev.predictedEnd && (
                            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, padding: "4px 10px", fontSize: 12 }}>
                              <span className="muted">Est. end: </span>
                              <b>{ev.predictedEnd}</b>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ minWidth: 160, flexShrink: 0, borderLeft: "1px solid var(--line)", paddingLeft: 12 }}>
                        <div className="muted" style={{ fontSize: 11, marginBottom: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Affected</div>
                        {affected.length === 0
                          ? <span className="muted" style={{ fontSize: 12 }}>None mapped</span>
                          : affected.map((name, i) => (
                              <div
                                key={i}
                                style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", cursor: "pointer", marginBottom: 3, display: "flex", alignItems: "center", gap: 4 }}
                                onClick={() => setRoute("supplier", { id: ev.affectedSupplierIds[i] })}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: dotColor, display: "inline-block", flexShrink: 0 }} />
                                {name} →
                              </div>
                            ))
                        }
                        <div className="muted" style={{ fontSize: 10, marginTop: 6 }}>Source: {ev.source}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment tracker */}
      <div className="card">
        <h2>Shipment Intelligence<InfoTip text="In-transit shipment status across your supplier network, powered by project44. Tracks estimated arrival, delay risk, and customs status for high-value and critical-component shipments." width={240} /></h2>
        <div className="card-sub">Live tracking across active lanes · Delay risk and ETA forecasting</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shipment</th>
                <th>Supplier</th>
                <th>Route</th>
                <th>Carrier</th>
                <th>ETA</th>
                <th>Delay</th>
                <th>Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {platformShipments.map((sh) => {
                const supplier = suppliers.find((s) => s.id === sh.supplierId);
                return (
                  <tr key={sh.id}>
                    <td className="mono">{sh.id}</td>
                    <td>
                      <span
                        style={{ fontWeight: 600, color: "var(--accent)", cursor: "pointer" }}
                        onClick={() => setRoute("supplier", { id: sh.supplierId })}
                      >
                        {supplier?.name || sh.supplierId}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{sh.origin} → {sh.destination}</td>
                    <td style={{ fontSize: 12 }}>{sh.carrier}</td>
                    <td style={{ fontSize: 12 }}>{sh.eta}</td>
                    <td>
                      {sh.delayDays
                        ? <span style={{ color: "var(--risk)", fontWeight: 700 }}>+{sh.delayDays}d</span>
                        : <span className="muted">—</span>}
                    </td>
                    <td>{sh.value}</td>
                    <td><Badge variant={shipmentStatusVariant(sh.status)}>{sh.status}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="note">Demo data. In production: integrated with TMS, carrier APIs, and port authority feeds.</div>
      </div>
    </div>
  );
}
