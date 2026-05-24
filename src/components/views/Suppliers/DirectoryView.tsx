"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { suppliersDirectory } from "@/lib/data";

export function DirectoryView() {
  const { setRoute } = useApp();
  const [term, setTerm] = useState("");
  const [tier, setTier] = useState("all");
  const [region, setRegion] = useState("all");
  const [risk, setRisk] = useState("all");

  const filtered = useMemo(() => {
    return suppliersDirectory.filter((s) => {
      if (term && !(s.name || "").toLowerCase().includes(term.toLowerCase())) return false;
      if (tier !== "all" && String(s.tier) !== tier) return false;
      if (region !== "all" && s.region !== region) return false;
      if (risk === "high" && (s.risk || 0) < 70) return false;
      if (risk === "low" && (s.risk || 0) >= 70) return false;
      return true;
    });
  }, [term, tier, region, risk]);

  function riskColor(r: number) {
    return r >= 70 ? "var(--risk)" : r >= 50 ? "var(--warn)" : "var(--ok)";
  }

  return (
    <div className="card">
      <div className="inline" style={{ marginBottom: 12, gap: 8 }}>
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
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
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
            {filtered.map((s) => (
              <tr key={s.id}>
                <td><b>{s.name}</b></td>
                <td>{s.tier}</td>
                <td>{s.region}</td>
                <td className="mono">{s.duns}</td>
                <td style={{ color: riskColor(s.risk || 0), fontWeight: 600 }}>{s.risk}</td>
                <td>${s.spend}M</td>
                <td>${s.exposure}M</td>
                <td>{s.onTime}%</td>
                <td>
                  <button className="btn primary" onClick={() => setRoute("supplier", { id: s.id })}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
