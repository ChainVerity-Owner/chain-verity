"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { PulseDot, MiniDonut } from "@/components/ui/Charts";
import { InfoTip } from "@/components/ui/InfoTip";

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
            <h2 style={{ margin: 0 }}>Alert Feed<InfoTip text="Consolidated alert stream from all connected data feeds — credit monitors, ESG platforms, logistics networks, and regulatory databases. Alerts are deduplicated and ranked by potential supply impact." width={240} /></h2>
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

      <AlertDelivery />
    </div>
  );
}

// ── Delivery ──────────────────────────────────────────────────────────────────
// Alerts that never leave the platform are just a list. This shows the round-trip:
// matched signal → email + Slack → acknowledgement, and the rules that keep it
// from becoming noise.

function AlertDelivery() {
  const { currency, clientMode } = useApp();
  const isWB = clientMode === "wb";

  const site = isWB ? "Rehau AG · Rehau, DE" : "Trident Microsystems · Fremont, CA";
  const supplier = isWB ? "Rehau AG" : "Trident Microsystems";
  const secondary = isWB ? "DB Schenker · Duisburg, DE" : "Halsted Peoria · Peoria, IL";
  const secondaryNote = isWB
    ? "EU EONET · flooding on the Rhine corridor · inbound shipments may slip 2–4 days"
    : "NWS · Winter Storm Warning · inbound shipments may slip 2–4 days";

  return (
    <div className="grid-2">
      {/* Email */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>
            M5.4 earthquake 38 km from {supplier}
          </div>
          <div className="muted mono" style={{ fontSize: 11, marginTop: 3 }}>
            alerts@chainverity.ai → head.procurement · today 14:22
          </div>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 11 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8,
            border: "1px solid color-mix(in srgb, var(--risk) 34%, transparent)",
            background: "color-mix(in srgb, var(--risk) 7%, var(--card))",
          }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--risk)", flexShrink: 0 }} />
            <div style={{ fontSize: 12 }}>
              <b>1 supplier within 100 km</b> · 4 within 400 km
              <div className="muted mono" style={{ fontSize: 10, marginTop: 2 }}>USGS · us7000n4xk · 14:18</div>
            </div>
          </div>
          <div className="kv">
            <div className="box">Nearest site<b>{site}</b></div>
            <div className="box">Spend exposed<b>{currency}3.6M</b></div>
            <div className="box">Sole-sourced parts<b style={{ color: "var(--risk)" }}>2 · TTR 90d vs TTS 22d</b></div>
          </div>
          <div className="inline">
            <button className="btn primary" style={{ fontSize: 12 }}>Open supplier</button>
            <button className="btn" style={{ fontSize: 12 }}>Acknowledge</button>
            <button className="btn" style={{ fontSize: 12 }}>Mute 24h</button>
          </div>
          <div className="muted" style={{ fontSize: 11 }}>
            Sent because severity ≥ High and this supplier is on your Tier 1 watchlist. One email per
            supplier per event.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Slack */}
        <div className="card">
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, background: "var(--accent)", color: "#fff",
              display: "grid", placeItems: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>CV</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                Chain Verity
                <span className="mono" style={{ fontSize: 9, fontWeight: 600, color: "var(--muted)", border: "1px solid var(--line)", borderRadius: 3, padding: "1px 4px", marginLeft: 6 }}>APP</span>
                <span className="muted" style={{ fontSize: 11, marginLeft: 6, fontWeight: 400 }}>14:22</span>
              </div>
              <div style={{ fontSize: 13, marginTop: 2 }}>2 new supply-risk signals matched to your suppliers.</div>
              <div style={{ borderLeft: "3px solid var(--risk)", paddingLeft: 11, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>M5.4 earthquake — {isWB ? "Rehau, DE" : "Fremont, CA"}</div>
                <div className="muted" style={{ fontSize: 11 }}>{supplier} · 38 km · {currency}3.6M spend · 2 sole-sourced parts</div>
              </div>
              <div style={{ borderLeft: "3px solid var(--warn)", paddingLeft: 11, marginTop: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{isWB ? "Flood warning" : "Winter Storm Warning"} — {secondary}</div>
                <div className="muted" style={{ fontSize: 11 }}>{secondaryNote}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="card">
          <h2>Delivery rules <InfoTip width={260} text="Alert products die from day-one noise. Only high-severity matches interrupt; everything else batches into a morning digest, and unmatched sector signals are logged without being sent." /></h2>
          <div className="card-sub">Built to be ignorable</div>
          <div className="kv" style={{ marginTop: 10 }}>
            <div className="box">Dedupe key<b>supplier + event</b></div>
            <div className="box">Immediate send<b>severity ≥ High</b></div>
            <div className="box">Everything else<b>08:00 digest</b></div>
            <div className="box">Proximity radius<b>800 km</b></div>
            <div className="box">Unmatched sector signals<b>logged, not sent</b></div>
            <div className="box">Unenriched suppliers<b style={{ color: "var(--ok)" }}>still matched</b></div>
          </div>
          <div className="note" style={{ marginTop: 11 }}>
            <b>Note the last row.</b> Proximity matching runs off site coordinates, so suppliers with no
            registry match still get real alerts. It is the one capability the evidence gap does not touch.
          </div>
        </div>
      </div>
    </div>
  );
}
