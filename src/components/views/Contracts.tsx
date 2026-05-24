"use client";

import { useApp } from "@/context/AppContext";
import { CONTRACTS } from "@/lib/data";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function contractStatusVariant(status: string) {
  if (status === "Active") return "ok" as const;
  if (status === "Pending Renewal") return "warn" as const;
  if (status === "Under Renegotiation") return "obs" as const;
  return "muted-b" as const;
}

const STATUS_TRANSITIONS: Record<string, string> = {
  "Pending Renewal": "Under Renegotiation",
  "Under Renegotiation": "Active",
};

const STATUS_ACTION_LABEL: Record<string, string> = {
  "Pending Renewal": "Initiate Renewal",
  "Under Renegotiation": "Mark Resolved",
};

export function Contracts() {
  const { setRoute, contractStatuses, updateContractStatus } = useApp();

  const contracts = CONTRACTS.map((c) => ({
    ...c,
    status: contractStatuses[c.id] ?? c.status,
  }));

  const total = contracts.length;
  const expiring90 = contracts.filter((c) => {
    const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
    return days > 0 && days < 90;
  }).length;
  const renegotiating = contracts.filter((c) => c.status === "Under Renegotiation").length;
  const autoRenewCount = contracts.filter((c) => c.autoRenew).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Total Contracts" value={String(total)} sub="Active portfolio" />
        <KpiCard label="Expiring in 90d" value={String(expiring90)} sub={expiring90 > 0 ? "Action required" : "None due"} />
        <KpiCard label="Under Renegotiation" value={String(renegotiating)} sub={renegotiating > 0 ? contracts.find((c) => c.status === "Under Renegotiation")?.supplierName ?? "" : "None active"} />
        <KpiCard label="Auto-renewal Enabled" value={String(autoRenewCount)} sub="Review recommended" />
      </div>

      <div className="card">
        <h2>Contract Register</h2>
        <div className="card-sub">Renewal governance and milestone tracking.</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>Supplier</th>
                <th>Type</th>
                <th>Expires</th>
                <th>Value</th>
                <th>Status</th>
                <th>Auto-renew</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
                const urgent = days < 90 && days > 0;
                const nextStatus = STATUS_TRANSITIONS[c.status];
                const actionLabel = STATUS_ACTION_LABEL[c.status];
                return (
                  <tr key={c.id}>
                    <td><b>{c.title}</b></td>
                    <td>{c.supplierName}</td>
                    <td>{c.type}</td>
                    <td style={{ color: urgent ? "var(--warn)" : "inherit" }}>
                      {c.expires}
                      {urgent && (
                        <Badge variant="warn" className="ml-2" style={{ fontSize: 10, marginLeft: 6 }}>
                          {days}d
                        </Badge>
                      )}
                    </td>
                    <td>{c.value}</td>
                    <td><Badge variant={contractStatusVariant(c.status)}>{c.status}</Badge></td>
                    <td>
                      {c.autoRenew
                        ? <Badge variant="info">Yes</Badge>
                        : <span className="muted">No</span>
                      }
                    </td>
                    <td>
                      <div className="inline" style={{ gap: 6 }}>
                        {nextStatus && actionLabel && (
                          <button
                            className="btn primary"
                            style={{ fontSize: 12 }}
                            onClick={() => updateContractStatus(c.id, nextStatus)}
                          >
                            {actionLabel}
                          </button>
                        )}
                        <button className="btn" style={{ fontSize: 12 }} onClick={() => setRoute("supplier", { id: c.supplierId })}>
                          Supplier
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
