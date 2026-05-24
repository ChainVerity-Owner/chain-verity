"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { CRISIS_ROOMS, suppliersAll } from "@/lib/data";
import { CrisisRoom, CrisisAction, EventSeverity } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";

function severityVariant(s: EventSeverity) {
  if (s === "critical") return "risk" as const;
  if (s === "high") return "warn" as const;
  return "info" as const;
}

function statusVariant(s: string) {
  if (s === "Open") return "risk" as const;
  if (s === "Contained") return "warn" as const;
  return "ok" as const;
}

function RoomCard({ room, onSelect, selected }: { room: CrisisRoom; onSelect: () => void; selected: boolean }) {
  const { setRoute, crisisActionOverrides } = useApp();
  const done = room.actions.filter((a) => (a.id in crisisActionOverrides ? crisisActionOverrides[a.id] : a.done)).length;
  const total = room.actions.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      className="card"
      style={{
        border: selected ? "2px solid var(--accent)" : undefined,
        cursor: "pointer",
      }}
      onClick={onSelect}
    >
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div className="inline" style={{ marginBottom: 6 }}>
            <Badge variant={severityVariant(room.severity)}>{room.severity.toUpperCase()}</Badge>
            <Badge variant={statusVariant(room.status)}>{room.status}</Badge>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{room.title}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
            Opened {room.openedDate} · Owner: {room.owner}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--risk)" }}>{room.estimatedExposure}</div>
          <div className="muted" style={{ fontSize: 11 }}>Est. exposure</div>
        </div>
      </div>

      <div className="row" style={{ marginBottom: 6 }}>
        <span style={{ fontSize: 12 }}>Actions: {done}/{total} complete</span>
        <span className="mono" style={{ fontSize: 12 }}>{pct}%</span>
      </div>
      <div className="progress" style={{ height: 6 }}>
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "var(--ok)" : pct >= 50 ? "var(--warn)" : "var(--risk)",
          }}
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Affected suppliers</div>
        <div className="inline">
          {room.affectedSupplierIds.map((id) => {
            const s = suppliersAll.find((x) => x.id === id);
            return s ? (
              <span
                key={id}
                className="badge info"
                style={{ fontSize: 11, padding: "2px 8px", cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); setRoute("supplier", { id }); }}
              >
                {s.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
    </div>
  );
}

export function CrisisResponse() {
  const { crisisActionOverrides, toggleCrisisAction } = useApp();
  const [selectedId, setSelectedId] = useState<string>(CRISIS_ROOMS[0].id);
  const selected = CRISIS_ROOMS.find((r) => r.id === selectedId)!;

  function isActionDone(action: CrisisAction): boolean {
    return action.id in crisisActionOverrides ? crisisActionOverrides[action.id] : action.done;
  }

  const open = CRISIS_ROOMS.filter((r) => r.status === "Open").length;
  const totalExposure = CRISIS_ROOMS.reduce((sum, r) => {
    return sum + parseFloat(r.estimatedExposure.replace("$", "").replace("M", ""));
  }, 0);
  const totalActions = CRISIS_ROOMS.flatMap((r) => r.actions);
  const pending = totalActions.filter((a) => !isActionDone(a)).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Open Crisis Rooms" value={String(open)} sub={`${CRISIS_ROOMS.length} total`} />
        <KpiCard label="Total Exposure" value={`$${totalExposure.toFixed(1)}M`} sub="Across active crises" />
        <KpiCard label="Pending Actions" value={String(pending)} sub="Across all rooms" />
        <KpiCard label="Affected Suppliers" value={String(new Set(CRISIS_ROOMS.flatMap((r) => r.affectedSupplierIds)).size)} sub="Unique suppliers" />
      </div>

      <div className="callout warn" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span>
          <b>{open} active crisis rooms</b> — {pending} actions pending assignment or completion.
          {" "}Estimated combined exposure: <b style={{ color: "var(--risk)" }}>${totalExposure.toFixed(1)}M</b>
        </span>
      </div>

      {/* Room list + detail */}
      <div className="grid-2" style={{ gridTemplateColumns: "1fr 1.4fr", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 2 }}>
            Crisis Rooms
          </div>
          {CRISIS_ROOMS.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selectedId === room.id}
              onSelect={() => setSelectedId(room.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div className="card" style={{ position: "sticky", top: 70 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <div>
              <div className="inline" style={{ marginBottom: 4 }}>
                <Badge variant={severityVariant(selected.severity)}>{selected.severity.toUpperCase()}</Badge>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
              </div>
              <h2 style={{ margin: 0 }}>{selected.title}</h2>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Opened {selected.openedDate} · Owner: {selected.owner}
              </div>
            </div>
          </div>

          <div className="divider" />

          <div className="kv" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}>
            <div className="box">
              Estimated Exposure
              <b style={{ color: "var(--risk)" }}>{selected.estimatedExposure}</b>
            </div>
            <div className="box">
              Affected Parts
              <b style={{ fontSize: 11 }}>{selected.affectedParts.slice(0, 2).join(", ")}{selected.affectedParts.length > 2 ? ` +${selected.affectedParts.length - 2} more` : ""}</b>
            </div>
          </div>

          <div className="divider" />

          <div className="row" style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Action Tracker</div>
            <span className="muted" style={{ fontSize: 11 }}>Click an action to toggle</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selected.actions.map((action) => {
              const done = isActionDone(action);
              return (
                <div
                  key={action.id}
                  className="item"
                  style={{
                    cursor: "pointer",
                    background: done ? "#f0fdf4" : "#fefce8",
                    borderColor: done ? "#bbf7d0" : "#fde68a",
                    opacity: done ? 0.85 : 1,
                  }}
                  onClick={() => toggleCrisisAction(action.id)}
                >
                  <div className="row" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>
                          {done ? "✓" : "○"}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: done ? 400 : 600, textDecoration: done ? "line-through" : "none", color: done ? "var(--muted)" : "inherit" }}>
                            {action.text}
                          </div>
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                            {action.owner} · Due: {action.due}
                          </div>
                        </div>
                      </div>
                    </div>
                    {done
                      ? <Badge variant="ok" style={{ fontSize: 10, padding: "2px 7px", flexShrink: 0 }}>Done</Badge>
                      : <Badge variant="warn" style={{ fontSize: 10, padding: "2px 7px", flexShrink: 0 }}>Pending</Badge>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
