"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { LIVE_EVENTS, SHIPMENTS, suppliersAll } from "@/lib/data";
import { EventCategory, EventSeverity } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";

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
  const { setRoute } = useApp();
  const [catFilter, setCatFilter] = useState<string>("all");
  const [sevFilter, setSevFilter] = useState<string>("all");

  const filtered = LIVE_EVENTS.filter((e) => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (sevFilter !== "all" && e.severity !== sevFilter) return false;
    return true;
  });

  const active = LIVE_EVENTS.filter((e) => e.status === "Active").length;
  const critical = LIVE_EVENTS.filter((e) => e.severity === "critical").length;
  const delayedShipments = SHIPMENTS.filter((s) => s.delayDays && s.delayDays > 0).length;
  const totalExposure = SHIPMENTS.filter((s) => s.delayDays).reduce((sum, s) => {
    return sum + parseFloat(s.value.replace("$", "").replace("M", ""));
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Active Events" value={String(active)} sub="Requiring attention" />
        <KpiCard label="Critical Severity" value={String(critical)} sub="Immediate action needed" />
        <KpiCard label="Delayed Shipments" value={String(delayedShipments)} sub="Across all carriers" />
        <KpiCard label="Shipment Value at Risk" value={`$${totalExposure.toFixed(1)}M`} sub="Delayed or at-risk cargo" />
      </div>

      {/* Event feed */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Live Disruption Events</h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              AI-monitored across 150+ risk categories · 400+ languages · Sourced from media, regulatory, and logistics feeds
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((ev) => {
            const affected = ev.affectedSupplierIds
              .map((id) => suppliersAll.find((s) => s.id === id)?.name)
              .filter(Boolean);
            return (
              <div key={ev.id} className="item" style={{ cursor: "default" }}>
                <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div className="inline" style={{ marginBottom: 6 }}>
                      <Badge variant={severityVariant(ev.severity)}>{ev.severity.toUpperCase()}</Badge>
                      <Badge variant="muted-b">{CATEGORY_LABELS[ev.category]}</Badge>
                      <Badge variant={statusVariant(ev.status)}>{ev.status}</Badge>
                      <span className="muted" style={{ fontSize: 11 }}>{ev.region} · {ev.date}</span>
                    </div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{ev.title}</div>
                    <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>{ev.detail}</div>
                    <div className="inline" style={{ gap: 14 }}>
                      {ev.estimatedImpact && (
                        <span style={{ fontSize: 12 }}>
                          <span className="muted">Impact: </span>
                          <b style={{ color: "var(--risk)" }}>{ev.estimatedImpact}</b>
                        </span>
                      )}
                      {ev.leadTimeExtension && (
                        <span style={{ fontSize: 12 }}>
                          <span className="muted">Lead time: </span>
                          <b>+{ev.leadTimeExtension}</b>
                        </span>
                      )}
                      {ev.predictedEnd && (
                        <span style={{ fontSize: 12 }}>
                          <span className="muted">Est. end: </span>
                          <b>{ev.predictedEnd}</b>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ minWidth: 180, flexShrink: 0 }}>
                    <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Affected suppliers</div>
                    {affected.length === 0
                      ? <span className="muted" style={{ fontSize: 12 }}>None mapped</span>
                      : affected.map((name, i) => (
                          <div
                            key={i}
                            style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", cursor: "pointer", marginBottom: 2 }}
                            onClick={() => {
                              const id = ev.affectedSupplierIds[i];
                              setRoute("supplier", { id });
                            }}
                          >
                            {name} →
                          </div>
                        ))
                    }
                    <div className="muted" style={{ fontSize: 10, marginTop: 6 }}>Source: {ev.source}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipment tracker */}
      <div className="card">
        <h2>Shipment Intelligence</h2>
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
              {SHIPMENTS.map((sh) => {
                const supplier = suppliersAll.find((s) => s.id === sh.supplierId);
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
