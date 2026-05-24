"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { GLOBAL_ALERTS, suppliersAll } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";

type FilterType = "All" | "risk" | "contract" | "logistics" | "observation" | "info";

export function Alerts() {
  const { setRoute, dismissedAlerts, dismissAlert } = useApp();
  const [filter, setFilter] = useState<FilterType>("All");

  const all = [
    ...GLOBAL_ALERTS.map((a) => ({ ...a, scope: "global" })),
    ...suppliersAll.flatMap((s) =>
      (s.alerts || []).map((al) => ({ ...al, supplierId: s.id, scope: "supplier" }))
    ),
  ];

  const visible = all.filter((a) => {
    if (dismissedAlerts[a.id]) return false;
    if (filter === "All") return true;
    return a.type === filter;
  });

  const dismissed = all.filter((a) => dismissedAlerts[a.id]).length;

  function badgeVariant(type: string) {
    if (type === "risk") return "risk" as const;
    if (type === "contract") return "warn" as const;
    return "info" as const;
  }

  const filterTypes: FilterType[] = ["All", "risk", "contract", "logistics", "observation", "info"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Alerts Center</h2>
            <div className="card-sub" style={{ marginTop: 2 }}>Unified feed from all suppliers and system events.</div>
          </div>
          <div className="inline" style={{ flexWrap: "wrap" }}>
            {filterTypes.map((f) => (
              <button
                key={f}
                className={`btn${filter === f ? " primary" : ""}`}
                style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? `All (${all.filter(a => !dismissedAlerts[a.id]).length})` : f}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="note" style={{ textAlign: "center", padding: "24px 0" }}>
            {filter === "All"
              ? "All alerts dismissed."
              : `No active ${filter} alerts.`}
          </div>
        ) : (
          <div className="list">
            {visible.map((a, i) => (
              <div key={`${a.id}-${i}`} className="item">
                <div className="row" style={{ alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div className="inline" style={{ gap: 6, marginBottom: 4 }}>
                      <Badge variant={badgeVariant(a.type)}>{a.type.toUpperCase()}</Badge>
                      <Badge variant="muted-b">{a.scope}</Badge>
                    </div>
                    <div>{a.text}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{a.date || ""}</div>
                  </div>
                  <div className="inline" style={{ flexShrink: 0, gap: 6 }}>
                    <button
                      className="btn"
                      style={{ fontSize: 12 }}
                      onClick={() => setRoute("supplier", { id: a.supplierId })}
                    >
                      Open →
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: 12, color: "var(--muted)" }}
                      onClick={() => dismissAlert(a.id)}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {dismissed > 0 && (
          <div className="note" style={{ marginTop: 8 }}>
            {dismissed} alert{dismissed !== 1 ? "s" : ""} dismissed this session.
          </div>
        )}
      </div>
    </div>
  );
}
