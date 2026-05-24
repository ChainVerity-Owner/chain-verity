"use client";

import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";

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
    </div>
  );
}
