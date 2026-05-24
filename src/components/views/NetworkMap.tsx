"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";
import { riskStateClass, riskStateLabel } from "@/lib/utils";

// Static n-tier relationship map
const NETWORK_EDGES: { parentId: string; childId: string; material: string; criticalPart: string }[] = [
  { parentId: "pg", childId: "sup-b", material: "Chemical feedstock", criticalPart: "Resin compound RC-200" },
  { parentId: "pg", childId: "sup-003", material: "Titanium precursor", criticalPart: "Ti alloy TA-4412" },
  { parentId: "sup-001", childId: "sup-002", material: "Precision machined parts", criticalPart: "Precision Part PP-44" },
  { parentId: "sup-001", childId: "sup-003", material: "Raw alloy stock", criticalPart: "Ti alloy TA-4800" },
  { parentId: "sup-a", childId: "sup-005", material: "Polymer precursor", criticalPart: "Base polymer BP-11" },
  { parentId: "sup-b", childId: "sup-005", material: "Steel reinforcement", criticalPart: "Steel rod SR-40" },
];

const SITES = [
  { supplierId: "pg", name: "Meridian Houston Plant", city: "Houston, TX", country: "USA", risk: 58, criticalParts: ["Resin RP-44", "Resin RP-61"] },
  { supplierId: "sup-a", name: "Borealis Singapore Hub", city: "Singapore", country: "SGP", risk: 78, criticalParts: ["Base polymer BP-11", "BP-22"] },
  { supplierId: "sup-001", name: "Halsted Peoria Facility", city: "Peoria, IL", country: "USA", risk: 78, criticalParts: ["Connector Asm C-220", "PCB PA-08"] },
  { supplierId: "sup-b", name: "Apex Frankfurt Plant", city: "Frankfurt", country: "DEU", risk: 41, criticalParts: ["Component CP-118"] },
  { supplierId: "sup-002", name: "Osaka Precision Yokohama", city: "Yokohama", country: "JPN", risk: 41, criticalParts: ["Precision Part PP-44"] },
  { supplierId: "sup-003", name: "Chimera Incheon Works", city: "Incheon", country: "KOR", risk: 62, criticalParts: ["Ti Alloy TA-4412", "TA-4800"] },
  { supplierId: "sup-004", name: "Vantage Antwerp Hub", city: "Antwerp", country: "BEL", risk: 22, criticalParts: ["Logistics SLA"] },
  { supplierId: "sup-005", name: "Durban Steel Durban", city: "Durban", country: "ZAF", risk: 71, criticalParts: ["Steel Rod SR-40", "Base polymer BP-11"] },
];

function riskColor(r: number) {
  return r >= 70 ? "var(--risk)" : r >= 50 ? "var(--warn)" : "var(--ok)";
}

export function NetworkMap() {
  const { setRoute } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");

  const tiers = [1, 2, 3];
  const tier1 = suppliersAll.filter((s) => s.tier === 1);
  const tier2 = suppliersAll.filter((s) => s.tier === 2);
  const tier3 = suppliersAll.filter((s) => s.tier === 3);

  const selectedSupplier = selectedId ? suppliersAll.find((s) => s.id === selectedId) : null;
  const upstreams = NETWORK_EDGES.filter((e) => e.childId === selectedId).map((e) => ({
    edge: e,
    supplier: suppliersAll.find((s) => s.id === e.parentId),
  }));
  const downstreams = NETWORK_EDGES.filter((e) => e.parentId === selectedId).map((e) => ({
    edge: e,
    supplier: suppliersAll.find((s) => s.id === e.childId),
  }));

  const highRiskNodes = suppliersAll.filter((s) => (s.risk || 0) >= 70).length;
  const totalSites = SITES.length;
  const totalParts = SITES.reduce((a, s) => a + s.criticalParts.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Mapped Suppliers" value={String(suppliersAll.length)} sub="Across all tiers" />
        <KpiCard label="Production Sites" value={String(totalSites)} sub="Globally mapped" />
        <KpiCard label="Critical Parts" value={String(totalParts)} sub="Under coverage" />
        <KpiCard label="High-Risk Nodes" value={String(highRiskNodes)} sub="Risk score ≥ 70" />
      </div>

      {/* Tier grid */}
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Supply Chain Network — N-Tier Map</h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              Click any supplier node to explore upstream and downstream dependencies.
            </div>
          </div>
          <div className="tabs">
            {["all", "1", "2", "3"].map((t) => (
              <button
                key={t}
                className={`tab ${tierFilter === t ? "active" : ""}`}
                onClick={() => setTierFilter(t)}
              >
                {t === "all" ? "All Tiers" : `Tier ${t}`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
          {tiers.map((tier) => {
            const suppliers = suppliersAll.filter(
              (s) => s.tier === tier && (tierFilter === "all" || String(s.tier) === tierFilter)
            );
            if (tierFilter !== "all" && String(tier) !== tierFilter) return null;
            return (
              <div key={tier}>
                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                  Tier {tier} — {["Direct", "Sub-tier", "Raw material"][tier - 1]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {suppliers.length === 0 && (
                    <div className="muted" style={{ fontSize: 12 }}>No suppliers at this tier</div>
                  )}
                  {suppliers.map((s) => {
                    const isSelected = selectedId === s.id;
                    const col = riskColor(s.risk || 0);
                    return (
                      <div
                        key={s.id}
                        className="item"
                        style={{
                          border: isSelected ? `2px solid var(--accent)` : undefined,
                          background: isSelected ? "#eff6ff" : undefined,
                        }}
                        onClick={() => setSelectedId(isSelected ? null : s.id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.region} · {s.category}</div>
                        <div className="inline" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: col }}>Risk {s.risk}</span>
                          <Badge variant={riskStateClass(s.riskState, s.risk) as any} style={{ fontSize: 10, padding: "2px 7px" }}>
                            {riskStateLabel(s.riskState, s.risk)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dependency panel */}
      {selectedSupplier && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedSupplier.name} — Dependency Map</h2>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Tier {selectedSupplier.tier} · {selectedSupplier.category} · {selectedSupplier.region}
              </div>
            </div>
            <button className="btn primary" onClick={() => setRoute("supplier", { id: selectedSupplier.id })}>
              Open Supplier
            </button>
          </div>

          <div className="grid-2">
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Upstream (supplies TO this supplier)
              </div>
              {upstreams.length === 0
                ? <div className="muted" style={{ fontSize: 12 }}>No mapped upstream dependencies</div>
                : upstreams.map(({ edge, supplier }) => supplier && (
                  <div key={edge.parentId} className="box" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Material: {edge.material}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Critical part: {edge.criticalPart}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(supplier.risk || 0) }}>
                        Risk {supplier.risk}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Downstream (receives FROM this supplier)
              </div>
              {downstreams.length === 0
                ? <div className="muted" style={{ fontSize: 12 }}>No mapped downstream dependencies</div>
                : downstreams.map(({ edge, supplier }) => supplier && (
                  <div key={edge.childId} className="box" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Material: {edge.material}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Critical part: {edge.criticalPart}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(supplier.risk || 0) }}>
                        Risk {supplier.risk}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Sites */}
          <div className="divider" />
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Production Sites</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SITES.filter((s) => s.supplierId === selectedSupplier.id).map((site, i) => (
              <div key={i} className="box">
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600 }}>{site.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{site.city} · {site.country}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: riskColor(site.risk) }}>Risk {site.risk}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className="muted" style={{ fontSize: 11 }}>Critical parts: </span>
                  <span style={{ fontSize: 11 }}>{site.criticalParts.join(", ")}</span>
                </div>
              </div>
            ))}
            {SITES.filter((s) => s.supplierId === selectedSupplier.id).length === 0 && (
              <div className="muted" style={{ fontSize: 12 }}>No sites mapped for this supplier.</div>
            )}
          </div>
        </div>
      )}

      {/* All sites table */}
      <div className="card">
        <h2>All Mapped Sites</h2>
        <div className="card-sub">Global production site coverage across the supply network.</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Country</th>
                <th>Risk</th>
                <th>Critical Parts</th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((site, i) => {
                const supplier = suppliersAll.find((s) => s.id === site.supplierId);
                return (
                  <tr key={i}>
                    <td><b>{site.name}</b></td>
                    <td>
                      <span
                        style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => setRoute("supplier", { id: site.supplierId })}
                      >
                        {supplier?.name}
                      </span>
                    </td>
                    <td>{site.city}</td>
                    <td className="mono">{site.country}</td>
                    <td style={{ color: riskColor(site.risk), fontWeight: 700 }}>{site.risk}</td>
                    <td style={{ fontSize: 12 }}>{site.criticalParts.join(", ")}</td>
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
