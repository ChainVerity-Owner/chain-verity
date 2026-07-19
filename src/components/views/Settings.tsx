"use client";

import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { DATA_FEEDS } from "@/lib/data";
import { InfoTip } from "@/components/ui/InfoTip";

const NOTIFICATIONS = [
  { key: "emailRisk", label: "Email alerts on risk escalation" },
  { key: "slackContracts", label: "Slack alerts for contract renewals" },
  { key: "weeklyDigest", label: "Weekly digest report" },
];

const APPETITE_OPTIONS: { value: "Conservative" | "Moderate" | "Aggressive"; label: string; desc: string; color: string }[] = [
  {
    value: "Conservative",
    label: "Conservative",
    desc: "Flag any TTR gap or safety stock shortfall. Recommended for critical-component or single-source-heavy portfolios.",
    color: "var(--risk)",
  },
  {
    value: "Moderate",
    label: "Moderate",
    desc: "Flag gaps >15 days, unqualified alternatives, and shortfalls >10 days. Balances resilience with working capital.",
    color: "var(--warn)",
  },
  {
    value: "Aggressive",
    label: "Aggressive",
    desc: "Flag only gaps >30 days with no qualified alternative. Accepts short-term exposure in exchange for lower inventory cost.",
    color: "var(--ok)",
  },
];

type Provenance = "Proprietary" | "Licensed" | "Public" | "Customer";

const PROVENANCE_STYLE: Record<Provenance, { color: string; desc: string }> = {
  Proprietary: { color: "#0e7490", desc: "Chain Verity's own models and signal engine — not available elsewhere" },
  Licensed:    { color: "#4f46e5", desc: "Commercially licensed third-party data, redistributed under agreement" },
  Public:      { color: "#16a34a", desc: "Open / government data, independently refreshed and validated" },
  Customer:    { color: "#a16207", desc: "Your own systems and uploads — never shared outside your tenant" },
};

const DATA_SOURCES: { name: string; type: string; status: string; lastSync: string; recordCount: string; provenance: Provenance }[] = [
  { name: "Chain Verity Signal Engine", type: "Risk Signals", status: "Active", lastSync: "Real-time", recordCount: "38 proprietary indicators", provenance: "Proprietary" },
  { name: "SAP S/4HANA", type: "ERP", status: "Active", lastSync: "4 minutes ago", recordCount: "1,247 supplier records", provenance: "Customer" },
  { name: "Dun & Bradstreet", type: "Credit Risk", status: "Active", lastSync: "6 hours ago", recordCount: "50 suppliers monitored", provenance: "Licensed" },
  { name: "Reuters / Dow Jones", type: "News Intelligence", status: "Active", lastSync: "12 minutes ago", recordCount: "400+ languages", provenance: "Licensed" },
  { name: "GLEIF", type: "Legal Entity", status: "Active", lastSync: "1 day ago", recordCount: "50 LEIs verified", provenance: "Public" },
  { name: "UN Comtrade", type: "Trade Data", status: "Active", lastSync: "Annual · cached 24h", recordCount: "Export concentration", provenance: "Public" },
  { name: "NASA EONET / USGS / NWS", type: "Disruption Events", status: "Active", lastSync: "Real-time", recordCount: "Quakes, storms, alerts", provenance: "Public" },
  { name: "GDELT Project", type: "News Events", status: "Active", lastSync: "15 min", recordCount: "Global media monitoring", provenance: "Public" },
  { name: "Companies House", type: "Corporate Registry", status: "Active", lastSync: "2 days ago", recordCount: "UK entity verification", provenance: "Public" },
  { name: "Manual CSV Import", type: "Supplementary", status: "Active", lastSync: "5 days ago", recordCount: "8 custom fields", provenance: "Customer" },
];

export function Settings() {
  const { notificationSettings, toggleNotification, riskThresholds, setRiskThreshold, riskAppetite, setRiskAppetite } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Connected Data Sources */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <h2 style={{ marginBottom: 2 }}>Connected Data Sources <InfoTip text="Live integrations feeding supplier data into Chain Verity. Each source is polled on its own cadence; a red status means the last pull failed or is overdue. Reconnect from the Manage Integrations panel." /></h2>
            <div className="card-sub">10 of 10 sources active · Last full sync 12 min ago</div>
          </div>
          <button
            className="btn"
            style={{ fontSize: 12, whiteSpace: "nowrap", flexShrink: 0, marginTop: 2 }}
          >
            Manage Integrations
          </button>
        </div>
        <div className="divider" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {DATA_SOURCES.map((src) => (
            <div
              key={src.name}
              style={{
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: "12px 14px",
                background: "var(--surface)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--ok)", flexShrink: 0 }} />
                  <span style={{ fontWeight: 700, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {src.name}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ok)",
                    background: "color-mix(in srgb, var(--ok) 12%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--ok) 30%, transparent)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    flexShrink: 0,
                  }}
                >
                  {src.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--accent)",
                    background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                    border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontWeight: 600,
                  }}
                >
                  {src.type}
                </span>
                <span
                  title={PROVENANCE_STYLE[src.provenance].desc}
                  style={{
                    fontSize: 10,
                    color: PROVENANCE_STYLE[src.provenance].color,
                    background: `color-mix(in srgb, ${PROVENANCE_STYLE[src.provenance].color} 10%, var(--surface))`,
                    border: `1px solid color-mix(in srgb, ${PROVENANCE_STYLE[src.provenance].color} 30%, transparent)`,
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontWeight: 700,
                  }}
                >
                  {src.provenance}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span className="muted" style={{ fontSize: 11 }}>Last sync: {src.lastSync}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--muted)",
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {src.recordCount}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {(Object.keys(PROVENANCE_STYLE) as Provenance[]).map((p) => (
            <div key={p} style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 11 }}>
              <span style={{ fontWeight: 700, color: PROVENANCE_STYLE[p].color }}>{p}</span>
              <span className="muted">{PROVENANCE_STYLE[p].desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Settings <InfoTip text="Platform-wide configuration. Risk appetite controls alert thresholds and recovery action urgency. Notification preferences govern which events generate alerts and how they are delivered." /></h2>
        <div className="card-sub">Platform configuration for your organization.</div>
        <div className="divider" />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Risk appetite</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Sets the threshold at which recovery actions are surfaced and what urgency level is assigned.
              A Conservative posture surfaces more actions with stronger language; Aggressive surfaces only critical gaps.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {APPETITE_OPTIONS.map((opt) => {
                const selected = riskAppetite === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setRiskAppetite(opt.value)}
                    style={{
                      border: `2px solid ${selected ? opt.color : "var(--line)"}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      background: selected ? `color-mix(in srgb, ${opt.color} 8%, var(--surface))` : "var(--surface)",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: opt.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: selected ? opt.color : "var(--text)" }}>
                        {opt.label}
                      </span>
                      {selected && <span style={{ fontSize: 10, marginLeft: "auto", color: opt.color, fontWeight: 700 }}>ACTIVE</span>}
                    </div>
                    <div className="muted" style={{ fontSize: 11, lineHeight: 1.5 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Risk thresholds</div>
            <div className="kv">
              <div className="box">
                High risk trigger (score ≥)
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={riskThresholds.highRisk}
                  onChange={(e) => setRiskThreshold("highRisk", Number(e.target.value))}
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    width: 64,
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    padding: "3px 8px",
                    background: "var(--bg)",
                    color: "var(--text)",
                    marginTop: 4,
                  }}
                />
              </div>
              <div className="box">
                Current ratio alert (&lt;)
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={riskThresholds.currentRatio}
                  onChange={(e) => setRiskThreshold("currentRatio", Number(e.target.value))}
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    width: 64,
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    padding: "3px 8px",
                    background: "var(--bg)",
                    color: "var(--text)",
                    marginTop: 4,
                  }}
                />
              </div>
              <div className="box">
                D/E alert threshold (&gt;)
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={riskThresholds.deRatio}
                  onChange={(e) => setRiskThreshold("deRatio", Number(e.target.value))}
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    width: 64,
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    padding: "3px 8px",
                    background: "var(--bg)",
                    color: "var(--text)",
                    marginTop: 4,
                  }}
                />
              </div>
            </div>
            <div className="note" style={{ marginTop: 6 }}>
              Threshold changes take effect immediately for all supplier assessments.
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Notifications</div>
            <div className="list">
              {NOTIFICATIONS.map(({ key, label }) => {
                const enabled = notificationSettings[key] ?? false;
                return (
                  <div key={key} className="item">
                    <div className="row">
                      <span>{label}</span>
                      <button
                        className={`btn${enabled ? " primary" : ""}`}
                        style={{ fontSize: 12, minWidth: 72 }}
                        onClick={() => toggleNotification(key)}
                      >
                        {enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Data governance</div>
            <div className="kv">
              <div className="box">Category classification<b>System-locked</b></div>
              <div className="box">Data refresh cadence<b>Every 48h</b></div>
              <div className="box">Retention policy<b>7 years</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* ERP Integration Hub */}
      <div className="card">
        <h2>ERP Integration Hub <InfoTip text="Connect Chain Verity to your enterprise systems. Connected sources push spend, PO, and vendor master data in — and bidirectional connectors accept actions out: decisions approved in Chain Verity write back as PO amendments, workflow tasks, and budget releases in the source system." /></h2>
        <div className="card-sub">Bidirectional integration — data in, approved actions written back out</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
          {[
            { name: "SAP S/4HANA", logo: "🏢", status: "Connected", desc: "Procurement orders, spend data, vendor master", color: "var(--ok)", direction: "Data in · Actions out" },
            { name: "Coupa", logo: "🛒", status: "Connected", desc: "PO management, invoicing, contract data", color: "var(--ok)", direction: "Data in · Actions out" },
            { name: "Oracle Fusion", logo: "🔶", status: "Pending", desc: "ERP financial data, supplier payments", color: "var(--warn)", direction: "Data in" },
            { name: "SAP Ariba", logo: "🌐", status: "Not Connected", desc: "Sourcing, supplier qualification, contracts", color: "var(--muted)", direction: "Data in · Actions out" },
            { name: "Salesforce", logo: "☁️", status: "Not Connected", desc: "Supplier contact management, CRM sync", color: "var(--muted)", direction: "Data in" },
            { name: "Microsoft Teams", logo: "💬", status: "Connected", desc: "Crisis room notifications, alert escalation", color: "var(--ok)", direction: "Actions out" },
          ].map((erp, i) => (
            <div key={i} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 16, background: "var(--surface)", display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{erp.logo}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{erp.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: erp.color }}>
                    {erp.status === "Connected" ? "✓ " : erp.status === "Pending" ? "⏳ " : "○ "}{erp.status}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>{erp.desc}</div>
                <span style={{
                  display: "inline-block", marginTop: 6, fontSize: 10, fontWeight: 700,
                  color: "var(--accent)", background: "color-mix(in srgb, var(--accent) 10%, var(--surface))",
                  border: "1px solid color-mix(in srgb, var(--accent) 25%, transparent)",
                  borderRadius: 4, padding: "2px 7px",
                }}>
                  {erp.direction}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          ERP integrations use OAuth 2.0 and REST APIs. Data is encrypted in transit (TLS 1.3) and at rest (AES-256).
          Decisions approved in a briefing write back to the connected system automatically — see the execution log on the CFO/CPO Briefing.
        </div>
      </div>

      {/* Data Feed Health Panel */}
      <div className="card">
        <h2>Live Data Feed Status <InfoTip text="Real-time status of external data providers — commodity prices, geopolitical risk indices, weather disruption feeds, and credit bureau data. A stale feed degrades risk score accuracy until the next successful pull." /></h2>
        <div className="card-sub">External data provider connections · refresh cadence and last update</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
          {DATA_FEEDS.map((feed, i) => (
            <div key={i} className="item" style={{ cursor: "default" }}>
              <div className="row">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700 }}>{feed.name}</span>
                      <span className="mono" style={{ fontSize: 10, background: "var(--surface)", padding: "2px 6px", borderRadius: 4 }}>{feed.shortName}</span>
                      <Badge
                        variant={feed.type === "Financial" ? "info" : feed.type === "ESG" ? "ok" : feed.type === "Events" ? "warn" : feed.type === "Logistics" ? "obs" : "muted-b"}
                        style={{ fontSize: 10 }}
                      >
                        {feed.type}
                      </Badge>
                    </div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Last refreshed: {feed.lastRefreshed} · {feed.recordsUpdated.toLocaleString()} records updated
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: feed.status === "Live" ? "var(--ok)" : feed.status === "Delayed" ? "var(--warn)" : "var(--risk)" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: feed.status === "Live" ? "var(--ok)" : feed.status === "Delayed" ? "var(--warn)" : "var(--risk)" }}>
                    {feed.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          Data feeds auto-refresh on scheduled intervals. Contact your Chain Verity account manager to add new data providers.
        </div>
      </div>
    </div>
  );
}
