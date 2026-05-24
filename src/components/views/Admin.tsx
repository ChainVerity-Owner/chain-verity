"use client";

import { Badge } from "@/components/ui/Badge";

const integrations = [
  { name: "SAP S/4HANA", desc: "Purchase orders, supplier master data", status: "Connected", variant: "ok" as const },
  { name: "Oracle Fusion", desc: "Financial ratios, invoicing data", status: "Connected", variant: "ok" as const },
  { name: "Dun & Bradstreet", desc: "DUNS, credit scores, company data", status: "Connected", variant: "ok" as const },
  { name: "Bloomberg Finance", desc: "Public company filings and market data", status: "Pending auth", variant: "warn" as const },
  { name: "Custom ERP Connector", desc: "Bespoke on-prem integration via REST", status: "Not configured", variant: "muted-b" as const },
];

export function Admin() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <h2>Admin</h2>
        <div className="card-sub">User management, integrations, and governance settings.</div>
        <div className="kv">
          <div className="box">Total users<b>14</b></div>
          <div className="box">Active integrations<b>3 of 8</b></div>
          <div className="box">Data sources<b>SAP, Oracle, Manual</b></div>
          <div className="box">Last sync<b>3 days ago</b></div>
          <div className="box">Audit log entries<b>2,841</b></div>
          <div className="box">Environment<b>Demo (Pilot)</b></div>
        </div>

        <div className="divider" />
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Integrations</div>
        <div className="list">
          {integrations.map((int) => (
            <div key={int.name} className="item">
              <div className="row">
                <div>
                  <b>{int.name}</b>
                  <div className="muted" style={{ fontSize: 12 }}>{int.desc}</div>
                </div>
                <Badge variant={int.variant}>{int.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
