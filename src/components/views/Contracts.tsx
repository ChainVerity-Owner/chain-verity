"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { KpiCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";

interface ContractAnalysis {
  riskLevel: string;
  summary: string;
  keyRisks: { clause: string; risk: string; severity: string }[];
  missingClauses: string[];
  recommendations: string[];
  favourable: string[];
}

function riskLevelVariant(r: string) {
  if (r === "Critical") return "risk" as const;
  if (r === "High") return "risk" as const;
  if (r === "Medium") return "warn" as const;
  return "ok" as const;
}

function ContractAIModal({ contract, onClose }: { contract: import("@/types").Contract; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalysis() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractTitle: contract.title,
          contractType: contract.type,
          supplierName: contract.supplierName,
          expires: contract.expires,
          value: contract.value,
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Analysis unavailable. Ensure ANTHROPIC_API_KEY is configured.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, maxWidth: 640, width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>AI Contract Intelligence</div>
            <div className="muted" style={{ fontSize: 12 }}>{contract.title} · {contract.supplierName}</div>
          </div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚖️</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Analyse contract for risk clauses</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              Claude AI will review this contract for missing clauses, force majeure gaps, pricing risks, and SLA enforcement.
            </div>
            <button className="btn primary" onClick={runAnalysis}>Run Analysis</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="muted" style={{ fontSize: 13 }}>Analysing contract clauses…</div>
          </div>
        )}

        {error && (
          <div style={{ color: "var(--risk)", fontSize: 13, padding: "12px 0" }}>{error}</div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700 }}>Overall Risk:</span>
              <Badge variant={riskLevelVariant(result.riskLevel)}>{result.riskLevel}</Badge>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{result.summary}</div>

            {result.keyRisks.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Key Risk Clauses</div>
                {result.keyRisks.map((r, i) => (
                  <div key={i} style={{ background: "var(--surface)", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{r.clause}</span>
                      <Badge variant={riskLevelVariant(r.severity)} style={{ fontSize: 10 }}>{r.severity}</Badge>
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>{r.risk}</div>
                  </div>
                ))}
              </div>
            )}

            {result.missingClauses.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Missing Clauses</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.missingClauses.map((c, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(220,38,38,.1)", color: "var(--risk)", border: "1px solid rgba(220,38,38,.2)" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {result.recommendations.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Recommendations</div>
                <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  {result.recommendations.map((r, i) => (
                    <li key={i} style={{ fontSize: 12, lineHeight: 1.5 }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.favourable.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--ok)" }}>Favourable Clauses</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.favourable.map((c, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(22,163,74,.1)", color: "var(--ok)", border: "1px solid rgba(22,163,74,.2)" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="note">AI analysis powered by Claude · for reference only. Always consult legal counsel.</div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const { setRoute, contractStatuses, updateContractStatus, platformContracts } = useApp();
  const [aiContract, setAiContract] = useState<typeof platformContracts[0] | null>(null);

  const contracts = platformContracts.map((c) => ({
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
      {aiContract && <ContractAIModal contract={aiContract} onClose={() => setAiContract(null)} />}
      <div className="grid-4">
        <KpiCard label="Total Contracts" value={String(total)} sub="Active portfolio" />
        <KpiCard label="Expiring in 90d" value={String(expiring90)} sub={expiring90 > 0 ? "Action required" : "None due"} />
        <KpiCard label="Under Renegotiation" value={String(renegotiating)} sub={renegotiating > 0 ? contracts.find((c) => c.status === "Under Renegotiation")?.supplierName ?? "" : "None active"} />
        <KpiCard label="Auto-renewal Enabled" value={String(autoRenewCount)} sub="Review recommended" />
      </div>

      <div className="card">
        <h2>Contract Register<InfoTip text="Full register of supplier contracts including MSAs, LTAs, and spot agreements. Tracks value, expiry, status, and auto-renewal flags. Contracts in renegotiation or nearing expiry are surfaced first." width={240} /></h2>
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
                        <button className="btn" style={{ fontSize: 12 }} onClick={() => setAiContract(c)}>
                          AI Analysis
                        </button>
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
