"use client";

import { useState, useMemo } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { ROLE_PERMS } from "@/lib/roles";
import { ProvenanceChip } from "@/components/ui/ProvenanceChip";
import { coverage, supplierProvenance } from "@/lib/data/provenance";

export function DirectoryView() {
  const { setRoute, archiveSupplier, unarchiveSupplier, deleteSupplier, archivedIds, customSuppliers, role, currency } = useApp();
  const canEdit = ROLE_PERMS.canEditSuppliers(role);
  const [showArchived, setShowArchived] = useState(false);
  const allSuppliers = useSuppliers(showArchived);
  const customIds = new Set(customSuppliers.map((s) => s.id));
  const archivedCount = Object.keys(archivedIds).length;
  const [term, setTerm] = useState("");
  const [tier, setTier] = useState("all");
  const [region, setRegion] = useState("all");
  const [risk, setRisk] = useState("all");
  const [evidence, setEvidence] = useState("all");

  const cov = useMemo(() => coverage(allSuppliers), [allSuppliers]);

  const filtered = useMemo(() => {
    return allSuppliers.filter((s) => {
      if (term && !(s.name || "").toLowerCase().includes(term.toLowerCase())) return false;
      if (tier !== "all" && String(s.tier) !== tier) return false;
      if (region !== "all" && s.region !== region) return false;
      if (risk === "high" && (s.risk || 0) < 70) return false;
      if (risk === "low" && (s.risk || 0) >= 70) return false;
      if (evidence !== "all" && supplierProvenance(s) !== evidence) return false;
      return true;
    });
  }, [allSuppliers, term, tier, region, risk, evidence]);

  function riskColor(r: number) {
    return r >= 70 ? "var(--risk)" : r >= 50 ? "var(--warn)" : "var(--ok)";
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12 }}>
      <div className="inline" style={{ gap: 8, flexWrap: "wrap", flex: 1 }}>
        <input
          className="tb-input"
          placeholder="Search name…"
          style={{ minWidth: 180 }}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <select className="tb-select" value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="all">Tier: All</option>
          <option value="1">Tier 1</option>
          <option value="2">Tier 2</option>
          <option value="3">Tier 3</option>
        </select>
        <select className="tb-select" value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="all">Region: All</option>
          <option value="NA">NA</option>
          <option value="EU">EU</option>
          <option value="APAC">APAC</option>
        </select>
        <select className="tb-select" value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="all">Risk: All</option>
          <option value="high">High (≥70)</option>
          <option value="low">Low (&lt;70)</option>
        </select>
        <select className="tb-select" value={evidence} onChange={(e) => setEvidence(e.target.value)}>
          <option value="all">Evidence: All</option>
          <option value="verified">Verified</option>
          <option value="corroborated">Corroborated</option>
          <option value="inferred">Review-accepted</option>
          <option value="unenriched">Unenriched ({cov.counts.unenriched})</option>
        </select>
      </div>
        {archivedCount > 0 && (
          <button className="btn" style={{ whiteSpace: "nowrap", fontSize: 12 }} onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : `Show archived (${archivedCount})`}
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Evidence</th>
              <th>Tier</th>
              <th>Region</th>
              <th>DUNS</th>
              <th>Risk</th>
              <th>Spend</th>
              <th>Exposure</th>
              <th>On-Time</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isArchived = !!archivedIds[s.id];
              const isCustom = customIds.has(s.id);
              const prov = supplierProvenance(s);
              const isUnenriched = prov === "unenriched";
              return (
                <tr key={s.id} style={{ opacity: isArchived ? 0.45 : 1 }}>
                  <td><b>{s.name}</b>{isArchived && <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>(archived)</span>}</td>
                  <td><ProvenanceChip provenance={prov} /></td>
                  <td>{s.tier}</td>
                  <td>{s.region}</td>
                  <td className="mono">{s.duns ?? <span className="muted" style={{ opacity: .6 }}>—</span>}</td>
                  <td style={isUnenriched ? { color: "var(--muted)", opacity: .6 } : { color: riskColor(s.risk || 0), fontWeight: 600 }}>
                    {isUnenriched ? "—" : s.risk}
                  </td>
                  <td>{currency}{s.spend}M</td>
                  <td>{isUnenriched ? <span className="muted" style={{ opacity: .6 }}>—</span> : `${currency}${s.exposure}M`}</td>
                  <td>{s.onTime}%</td>
                  <td>
                    <div className="inline" style={{ gap: 6, flexWrap: "nowrap" }}>
                      {!isArchived && (
                        <button className="btn primary" onClick={() => setRoute("supplier", { id: s.id })}>Open</button>
                      )}
                      {canEdit && (isArchived ? (
                        <button className="btn" style={{ fontSize: 12 }} onClick={() => unarchiveSupplier(s.id)}>Restore</button>
                      ) : (
                        <button className="btn" style={{ fontSize: 12, color: "var(--muted)" }} onClick={() => archiveSupplier(s.id)}>Archive</button>
                      ))}
                      {canEdit && isCustom && (
                        <button
                          className="btn"
                          style={{ fontSize: 12, color: "var(--risk)" }}
                          onClick={() => { if (confirm(`Delete ${s.name}?`)) deleteSupplier(s.id); }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 10 }}>
        A dash means unknown, never inferred. Unenriched suppliers carry no risk score because there is
        no sourced financial data behind them.
      </div>
    </div>
  );
}
