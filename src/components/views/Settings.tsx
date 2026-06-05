"use client";

import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { DATA_FEEDS } from "@/lib/data";

const NOTIFICATIONS = [
  { key: "emailRisk", label: "Email alerts on risk escalation" },
  { key: "slackContracts", label: "Slack alerts for contract renewals" },
  { key: "weeklyDigest", label: "Weekly digest report" },
];

export function Settings() {
  const { notificationSettings, toggleNotification, riskThresholds, setRiskThreshold } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <h2>Settings</h2>
        <div className="card-sub">Platform configuration for your organization.</div>
        <div className="divider" />

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
        <h2>ERP Integration Hub</h2>
        <div className="card-sub">Connect Chain Verity to your enterprise systems for automated data synchronisation</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16 }}>
          {[
            { name: "SAP S/4HANA", logo: "🏢", status: "Connected", desc: "Procurement orders, spend data, vendor master", color: "var(--ok)" },
            { name: "Coupa", logo: "🛒", status: "Connected", desc: "PO management, invoicing, contract data", color: "var(--ok)" },
            { name: "Oracle Fusion", logo: "🔶", status: "Pending", desc: "ERP financial data, supplier payments", color: "var(--warn)" },
            { name: "SAP Ariba", logo: "🌐", status: "Not Connected", desc: "Sourcing, supplier qualification, contracts", color: "var(--muted)" },
            { name: "Salesforce", logo: "☁️", status: "Not Connected", desc: "Supplier contact management, CRM sync", color: "var(--muted)" },
            { name: "Microsoft Teams", logo: "💬", status: "Connected", desc: "Crisis room notifications, alert escalation", color: "var(--ok)" },
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
              </div>
            </div>
          ))}
        </div>
        <div className="note" style={{ marginTop: 10 }}>
          ERP integrations use OAuth 2.0 and REST APIs. Data is encrypted in transit (TLS 1.3) and at rest (AES-256).
        </div>
      </div>

      {/* Data Feed Health Panel */}
      <div className="card">
        <h2>Live Data Feed Status</h2>
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
