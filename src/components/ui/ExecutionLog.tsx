"use client";

// ERP write-back log for briefing decision queues.
// When an executive resolves a decision, the action is pushed to the connected
// ERP/P2P system — this component shows that round-trip so the loop visibly closes.

export interface ExecEntry {
  id: string;
  title: string;
  system: string;      // e.g. "SAP S/4HANA", "Coupa"
  action: string;      // e.g. "PO amendment queued", "Payment terms hold applied"
  ref: string;         // ERP-side document reference
  status: "queued" | "synced";
  at: string;          // display timestamp
}

export function ExecutionLog({ entries }: { entries: ExecEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
      {entries.map((e) => (
        <div key={e.id} style={{
          display: "flex", alignItems: "center", gap: 10,
          border: "1px solid var(--line)", borderRadius: 8,
          background: "var(--card)", padding: "9px 12px", fontSize: 12,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            background: e.status === "synced" ? "var(--ok)" : "var(--warn)",
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 700 }}>{e.title}</span>
            <span className="muted" style={{ marginLeft: 8 }}>{e.action} · {e.system}</span>
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{e.ref}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, flexShrink: 0, padding: "2px 8px", borderRadius: 9999,
            color: e.status === "synced" ? "var(--ok)" : "var(--warn)",
            background: e.status === "synced" ? "rgba(22,163,74,.1)" : "rgba(217,119,6,.1)",
          }}>
            {e.status === "synced" ? "SYNCED" : "QUEUED"}
          </span>
          <span className="muted" style={{ fontSize: 11, flexShrink: 0 }}>{e.at}</span>
        </div>
      ))}
    </div>
  );
}
