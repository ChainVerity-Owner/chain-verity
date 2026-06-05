"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { PulseDot, MiniDonut } from "@/components/ui/Charts";

type FilterType = "All" | "risk" | "contract" | "logistics" | "observation" | "info";

const SEV_COLOR: Record<string, string> = {
  risk: "#dc2626",
  contract: "#d97706",
  logistics: "#2563eb",
  observation: "#7c3aed",
  info: "#2563eb",
};

export function Alerts() {
  const { setRoute, dismissedAlerts, dismissAlert, platformAlerts } = useApp();
  const suppliers = useSuppliers();
  const [filter, setFilter] = useState<FilterType>("All");

  const all = [
    ...platformAlerts.map((a) => ({ ...a, scope: "global" })),
    ...suppliers.flatMap((s) =>
      (s.alerts || []).map((al) => ({ ...al, supplierId: s.id, scope: "supplier" }))
    ),
  ];

  const visible = all.filter((a) => {
    if (dismissedAlerts[a.id]) return false;
    if (filter === "All") return true;
    return a.type === filter;
  });

  const dismissed = all.filter((a) => dismissedAlerts[a.id]).length;
  const activeCount = all.filter((a) => !dismissedAlerts[a.id]).length;

  function badgeVariant(type: string) {
    if (type === "risk") return "risk" as const;
    if (type === "contract") return "warn" as const;
    return "info" as const;
  }

  const filterTypes: FilterType[] = ["All", "risk", "contract", "logistics", "observation", "info"];

  // Counts by type for the donut chart
  const typeCounts = filterTypes.slice(1).map(t => ({
    type: t,
    count: all.filter(a => !dismissedAlerts[a.id] && a.type === t).length,
    color: SEV_COLOR[t] ?? "#6b7280",
  })).filter(t => t.count > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Summary card */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "stretch" }}>
        <div className="hero-card">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <PulseDot color="#f87171" size={10} />
              <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.85, letterSpacing: ".05em", textTransform: "uppercase" }}>Alert Center</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>{activeCount}</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Active alerts across all suppliers and system events</div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
              {[
                { label: "Risk", count: all.filter(a => !dismissedAlerts[a.id] && a.type === "risk").length, color: "#fca5a5" },
                { label: "Contract", count: all.filter(a => !dismissedAlerts[a.id] && a.type === "contract").length, color: "#fde68a" },
                { label: "Logistics", count: all.filter(a => !dismissedAlerts[a.id] && a.type === "logistics").length, color: "#a5b4fc" },
              ].map(s => (
                <div key={s.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {typeCounts.length > 0 && (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px", gap: 18 }}>
            <MiniDonut
              segments={typeCounts.map(t => ({ value: t.count, color: t.color }))}
              size={100}
              thickness={20}
              label={String(activeCount)}
              sublabel="active"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {typeCounts.map(t => (
                <div key={t.type} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: t.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{t.type}</span>
                  <span style={{ fontWeight: 700, marginLeft: "auto", paddingLeft: 8 }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alerts Feed */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Alert Feed</h2>
            <div className="card-sub" style={{ marginTop: 2, marginBottom: 0 }}>Unified feed from all suppliers and system events.</div>
          </div>
          <div className="inline" style={{ flexWrap: "wrap" }}>
            {filterTypes.map((f) => (
              <button
                key={f}
                className={`btn${filter === f ? " primary" : ""}`}
                style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? `All (${activeCount})` : f}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="note" style={{ textAlign: "center", padding: "24px 0" }}>
            {filter === "All" ? "All alerts dismissed." : `No active ${filter} alerts.`}
          </div>
        ) : (
          <div className="timeline">
            {visible.map((a, i) => {
              const sevColor = SEV_COLOR[a.type] ?? "var(--info)";
              const isRisk = a.type === "risk";
              return (
                <div key={`${a.id}-${i}`} className="timeline-item">
                  <div className="timeline-track">
                    <div style={{ position: "relative", width: 14, height: 14, marginTop: 3, flexShrink: 0 }}>
                      <PulseDot color={sevColor} size={14} />
                    </div>
                    {i < visible.length - 1 && <div className="timeline-line" style={{ marginTop: 4 }} />}
                  </div>
                  <div className="timeline-body">
                    <div style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      border: "1px solid var(--line)",
                      borderLeft: `3px solid ${sevColor}`,
                      borderRadius: 12,
                      background: "var(--surface)",
                      padding: "12px 14px",
                      transition: "background .1s",
                      cursor: "pointer",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 5, alignItems: "center" }}>
                          <Badge variant={badgeVariant(a.type)}>{a.type.toUpperCase()}</Badge>
                          <Badge variant="muted-b">{a.scope}</Badge>
                          <span className="muted" style={{ fontSize: 11 }}>{a.date || ""}</span>
                        </div>
                        <div style={{ fontSize: 13, lineHeight: 1.45 }}>{a.text}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0, alignItems: "flex-end" }}>
                        <button
                          className="btn primary"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={(e) => { e.stopPropagation(); setRoute("supplier", { id: a.supplierId }); }}
                        >
                          Open →
                        </button>
                        <button
                          className="btn"
                          style={{ fontSize: 12, padding: "4px 10px", color: "var(--muted)" }}
                          onClick={(e) => { e.stopPropagation(); dismissAlert(a.id); }}
                          title="Dismiss"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {dismissed > 0 && (
          <div className="note" style={{ marginTop: 10 }}>
            {dismissed} alert{dismissed !== 1 ? "s" : ""} dismissed this session.
          </div>
        )}
      </div>
    </div>
  );
}
