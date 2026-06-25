"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { CrisisRoom, CrisisAction, EventSeverity } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/InfoTip";

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

function EarningsImpact({ room, currency }: { room: CrisisRoom; currency: string }) {
  const suppliers = useSuppliers();
  const [weeks, setWeeks] = useState(4);
  const annualSpend = room.affectedSupplierIds.reduce((sum, id) => {
    const s = suppliers.find((x) => x.id === id);
    return sum + (s?.spend ?? 0);
  }, 0);
  const weeklySpend = annualSpend / 52;
  const revenueAtRisk = weeklySpend * weeks * 2.8;
  const marginImpact = revenueAtRisk * 0.12;

  return (
    <div style={{ background: "rgba(220,38,38,.04)", border: "1px solid rgba(220,38,38,.15)", borderRadius: 10, padding: "14px 16px", marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>💷 Earnings Impact Modeller</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div className="muted" style={{ fontSize: 12 }}>Disruption duration:</div>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 4, 8, 12].map((w) => (
            <button key={w} onClick={() => setWeeks(w)} style={{
              padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
              border: "1px solid var(--line)", cursor: "pointer",
              background: weeks === w ? "var(--accent)" : "var(--surface)",
              color: weeks === w ? "white" : "var(--fg)",
            }}>{w}w</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {[
          { label: "Supply Cost Exposure", value: `${currency}${(weeklySpend * weeks).toFixed(1)}M`, sub: `${weeks}w × ${currency}${weeklySpend.toFixed(1)}M/wk` },
          { label: "Revenue at Risk",      value: `${currency}${revenueAtRisk.toFixed(1)}M`,           sub: "Supply-to-revenue multiplier 2.8×" },
          { label: "EBITDA Impact",        value: `${currency}${marginImpact.toFixed(1)}M`,             sub: "Est. 12% margin on affected revenue" },
        ].map(({ label, value, sub }) => (
          <div key={label} style={{ background: "var(--surface)", borderRadius: 8, padding: "10px 12px", border: "1px solid var(--line)" }}>
            <div className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "var(--risk)" }}>{value}</div>
            <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
      <div className="note" style={{ marginTop: 8 }}>Model assumptions: 2.8× supply-to-revenue multiplier, 12% EBITDA margin. Adjust with CFO input for board reporting.</div>
    </div>
  );
}

function RoomCard({ room, onSelect, selected }: { room: CrisisRoom; onSelect: () => void; selected: boolean }) {
  const { setRoute, crisisActionOverrides } = useApp();
  const suppliers = useSuppliers();
  const done = room.actions.filter((a) => (a.id in crisisActionOverrides ? crisisActionOverrides[a.id] : a.done)).length;
  const total = room.actions.length;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      className="card"
      style={{ border: selected ? "2px solid var(--accent)" : undefined, cursor: "pointer" }}
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
        <div className="progress-fill" style={{
          width: `${pct}%`,
          background: pct === 100 ? "var(--ok)" : pct >= 50 ? "var(--warn)" : "var(--risk)",
        }} />
      </div>

      <div style={{ marginTop: 10 }}>
        <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Affected suppliers</div>
        <div className="inline">
          {room.affectedSupplierIds.map((id) => {
            const s = suppliers.find((x) => x.id === id);
            return s ? (
              <span key={id} className="badge info"
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
  const { crisisActionOverrides, toggleCrisisAction, platformCrisisRooms, currency } = useApp();
  const suppliers = useSuppliers();
  const CRISIS_ROOMS = platformCrisisRooms;
  const [selectedId, setSelectedId] = useState<string>(CRISIS_ROOMS[0]?.id ?? "");
  const [activeView, setActiveView] = useState<"rooms" | "actions">("rooms");
  const selected = CRISIS_ROOMS.find((r) => r.id === selectedId) ?? CRISIS_ROOMS[0];

  function isActionDone(action: CrisisAction): boolean {
    return action.id in crisisActionOverrides ? crisisActionOverrides[action.id] : action.done;
  }

  const open = CRISIS_ROOMS.filter((r) => r.status === "Open").length;
  const totalExposure = CRISIS_ROOMS.reduce((sum, r) => {
    return sum + parseFloat(r.estimatedExposure.replace(/[^0-9.]/g, ""));
  }, 0);
  const totalActions = CRISIS_ROOMS.flatMap((r) => r.actions);
  const pending = totalActions.filter((a) => !isActionDone(a)).length;

  // All open actions across rooms, grouped by room
  const allOpenActions = CRISIS_ROOMS.flatMap((r) =>
    r.actions
      .filter((a) => !isActionDone(a))
      .map((a) => ({ ...a, roomTitle: r.title, roomSeverity: r.severity, roomId: r.id }))
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Open Crisis Rooms" value={String(open)} sub={`${CRISIS_ROOMS.length} total`} />
        <KpiCard label="Total Exposure" value={`${currency}${totalExposure.toFixed(1)}M`} sub="Across active crises" />
        <KpiCard label="Pending Actions" value={String(pending)} sub="Across all rooms" />
        <KpiCard label="Affected Suppliers" value={String(new Set(CRISIS_ROOMS.flatMap((r) => r.affectedSupplierIds)).size)} sub="Unique suppliers" />
      </div>

      <div className="callout warn" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>⚡</span>
        <span>
          <b>{open} active crisis rooms</b> — {pending} actions pending assignment or completion.
          {" "}Estimated combined exposure: <b style={{ color: "var(--risk)" }}>{currency}{totalExposure.toFixed(1)}M</b>
        </span>
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 2, borderBottom: "2px solid var(--line)" }}>
        {([["rooms", "Crisis Rooms"], ["actions", `Open Actions (${pending})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setActiveView(id)} style={{
            padding: "8px 16px", fontSize: 13, background: "none", border: "none",
            borderBottom: activeView === id ? "2px solid var(--accent)" : "2px solid transparent",
            marginBottom: -2, cursor: "pointer",
            fontWeight: activeView === id ? 700 : 500,
            color: activeView === id ? "var(--accent)" : "var(--muted)",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ROOMS VIEW ── */}
      {activeView === "rooms" && (
        <div className="grid-2" style={{ gridTemplateColumns: "1fr 1.4fr", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 2 }}>
              Crisis Rooms
            </div>
            {CRISIS_ROOMS.map((room) => (
              <RoomCard key={room.id} room={room} selected={selectedId === room.id} onSelect={() => setSelectedId(room.id)} />
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

            {/* Earnings Impact Modeller */}
            <EarningsImpact room={selected} currency={currency} />

            <div className="divider" style={{ margin: "14px 0" }} />

            <div className="row" style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>Action Tracker</div>
              <span className="muted" style={{ fontSize: 11 }}>Click to toggle</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selected.actions.map((action) => {
                const done = isActionDone(action);
                return (
                  <div key={action.id} className="item" style={{
                    cursor: "pointer",
                    background: done ? "#f0fdf4" : "#fefce8",
                    borderColor: done ? "#bbf7d0" : "#fde68a",
                    opacity: done ? 0.85 : 1,
                  }} onClick={() => toggleCrisisAction(action.id)}>
                    <div className="row" style={{ alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{done ? "✓" : "○"}</span>
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
      )}

      {/* ── ALL OPEN ACTIONS VIEW ── */}
      {activeView === "actions" && (
        <div className="card">
          <h2>All Open Actions<InfoTip text="Consolidated action items across all active Crisis Rooms. Each action has an assigned owner, due date, and completion status. Overdue actions are highlighted automatically." width={240} /></h2>
          <div className="card-sub">Consolidated pending action items across all crisis rooms — sorted by severity</div>
          {allOpenActions.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
              ✓ All actions complete across all crisis rooms
            </div>
          ) : (
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Due</th>
                    <th>Crisis Room</th>
                    <th>Severity</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allOpenActions.map((action) => (
                    <tr key={action.id}>
                      <td style={{ fontSize: 13, maxWidth: 320 }}>{action.text}</td>
                      <td style={{ fontSize: 12 }}>{action.owner}</td>
                      <td style={{ fontSize: 12, fontWeight: 600, color: action.due === "Ongoing" ? "var(--muted)" : "var(--warn)" }}>
                        {action.due}
                      </td>
                      <td>
                        <span
                          style={{ fontSize: 12, color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                          onClick={() => { setSelectedId(action.roomId); setActiveView("rooms"); }}
                        >
                          {action.roomTitle.length > 35 ? action.roomTitle.slice(0, 35) + "…" : action.roomTitle}
                        </span>
                      </td>
                      <td><Badge variant={severityVariant(action.roomSeverity)}>{action.roomSeverity.toUpperCase()}</Badge></td>
                      <td>
                        <button
                          className="btn"
                          style={{ fontSize: 11, padding: "3px 10px" }}
                          onClick={() => toggleCrisisAction(action.id)}
                        >
                          Mark done
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
