"use client";

import { useApp } from "@/context/AppContext";
import { GLOBAL_ALERTS } from "@/lib/data";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const NOW = "Updated: 3 days ago";

const priorityItems = [
  { label: "Meridian Chemicals", id: "pg", meta: "Renegotiation-first · ratios present · Observation day 47/90", badge: "Under Observation", cls: "obs" as const },
  { label: "Borealis Plastics", id: "sup-a", meta: "High risk · credit downgrade", badge: "High Risk", cls: "risk" as const },
  { label: "Halsted Manufacturing", id: "sup-001", meta: "Contract renewal in 45 days", badge: "Contract Event", cls: "warn" as const },
  { label: "Chimera Alloys", id: "sup-003", meta: "Quality defect spike · Tier 3", badge: "Quality Alert", cls: "warn" as const },
];

const riskCategories = [
  { name: "Raw Materials", pct: 72, color: "var(--risk)" },
  { name: "Components", pct: 54, color: "var(--warn)" },
  { name: "Logistics", pct: 28, color: "var(--ok)" },
  { name: "Services", pct: 18, color: "var(--ok)" },
];

export function Dashboard() {
  const { setRoute } = useApp();

  function alertBadgeClass(type: string) {
    if (type === "risk") return "risk" as const;
    if (type === "contract") return "warn" as const;
    return "info" as const;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Working Capital at Risk" value="$23.4M" sub={NOW} />
        <KpiCard label="Exposure Pending Validation" value="$11.2M" sub={NOW} />
        <KpiCard label="Under Renegotiation" value="6 suppliers" sub={NOW} />
        <KpiCard label="Under Observation" value="4 suppliers" sub={NOW} />
      </div>

      <div className="grid-32">
        <div className="card">
          <h2>Priority Items</h2>
          <div className="card-sub">Highest-attention suppliers, sorted by urgency.</div>
          <div className="list">
            {priorityItems.map((p) => (
              <div key={p.id} className="item" onClick={() => setRoute("supplier", { id: p.id })}>
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.label}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{p.meta}</div>
                  </div>
                  <Badge variant={p.cls}>{p.badge}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2>Risk by Category</h2>
          <div className="card-sub">System-assigned, not user-editable.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {riskCategories.map((c) => (
              <div key={c.name}>
                <div className="row" style={{ marginBottom: 5 }}>
                  <span>{c.name}</span>
                  <span className="mono" style={{ color: c.color }}>{c.pct}</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: `${c.pct}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
          <div className="note">Categories derived from spend classification and contract tagging.</div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Alerts</h2>
        <div className="card-sub">Click any alert to open the supplier.</div>
        <div className="list">
          {GLOBAL_ALERTS.map((a) => (
            <div key={a.id} className="item" onClick={() => setRoute("supplier", { id: a.supplierId })}>
              <div className="row">
                <div>
                  <Badge variant={alertBadgeClass(a.type)}>{a.type.toUpperCase()}</Badge>
                  <div style={{ marginTop: 5 }}>{a.text}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{a.date}</div>
                </div>
                <span style={{ color: "var(--muted)" }}>›</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
