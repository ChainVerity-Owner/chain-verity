"use client";

import { useApp } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";

type ComplianceStatus = "Compliant" | "In Progress" | "Non-Compliant" | "N/A" | true | false | "Not Started";

function complianceVariant(s: ComplianceStatus) {
  if (s === true || s === "Compliant") return "ok" as const;
  if (s === "In Progress") return "warn" as const;
  if (s === false || s === "Non-Compliant" || s === "Not Started") return "risk" as const;
  return "muted-b" as const;
}

function complianceLabel(s: ComplianceStatus): string {
  if (s === true) return "Compliant";
  if (s === false || s === "Not Started") return "Not Started";
  return s;
}

function gradeColor(g: string) {
  if (g === "A") return "var(--ok)";
  if (g === "B") return "#2563eb";
  if (g === "C") return "var(--warn)";
  return "var(--risk)";
}

function ScoreBar({ value, max = 100, color = "var(--accent)" }: { value: number; max?: number; color?: string }) {
  return (
    <div className="progress" style={{ height: 4, marginTop: 4 }}>
      <div className="progress-fill" style={{ width: `${(value / max) * 100}%`, background: color }} />
    </div>
  );
}

export function ESGCompliance() {
  const { setRoute } = useApp();

  const withESG = suppliersAll.filter((s) => s.esg);
  const compliant = withESG.filter((s) => s.esg!.csdddStatus === "Compliant").length;
  const nonCompliant = withESG.filter((s) => s.esg!.csdddStatus === "Non-Compliant").length;
  const avgESG = Math.round(withESG.reduce((a, s) => a + (s.esg?.score || 0), 0) / withESG.length);
  const highLaborRisk = withESG.filter((s) => s.esg?.laborRisk === "High").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Avg. ESG Score" value={`${avgESG}/100`} sub="Portfolio weighted" />
        <KpiCard label="CSDDD Compliant" value={`${compliant}/${withESG.length}`} sub="Suppliers" />
        <KpiCard label="Non-Compliant" value={String(nonCompliant)} sub="Immediate action required" />
        <KpiCard label="High Labor Risk" value={String(highLaborRisk)} sub="Suppliers flagged" />
      </div>

      {/* Regulatory compliance matrix */}
      <div className="card">
        <h2>Regulatory Compliance Matrix</h2>
        <div className="card-sub">
          Status across CSDDD, LkSG, EUDR, and CSRD frameworks · Powered by Prewave-equivalent monitoring
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>ESG Score</th>
                <th>Grade</th>
                <th>CSDDD</th>
                <th>LkSG</th>
                <th>EUDR</th>
                <th>CSRD</th>
                <th>Labor Risk</th>
                <th>Env. Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliersAll.filter((s) => s.esg).map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><div className="muted" style={{ fontSize: 10 }}>Tier {s.tier} · {s.region}</div></td>
                  <td>
                    <div style={{ fontWeight: 700, color: gradeColor(s.esg!.grade) }}>{s.esg!.score}</div>
                    <ScoreBar value={s.esg!.score} color={gradeColor(s.esg!.grade)} />
                  </td>
                  <td><span style={{ fontWeight: 800, fontSize: 15, color: gradeColor(s.esg!.grade) }}>{s.esg!.grade}</span></td>
                  <td><Badge variant={complianceVariant(s.esg!.csdddStatus)} style={{ fontSize: 10, padding: "2px 7px" }}>{complianceLabel(s.esg!.csdddStatus)}</Badge></td>
                  <td><Badge variant={complianceVariant(s.esg!.lksgStatus)} style={{ fontSize: 10, padding: "2px 7px" }}>{complianceLabel(s.esg!.lksgStatus)}</Badge></td>
                  <td><Badge variant={complianceVariant(s.esg!.eudrCompliant)} style={{ fontSize: 10, padding: "2px 7px" }}>{complianceLabel(s.esg!.eudrCompliant)}</Badge></td>
                  <td><Badge variant={complianceVariant(s.esg!.csrdStatus)} style={{ fontSize: 10, padding: "2px 7px" }}>{complianceLabel(s.esg!.csrdStatus)}</Badge></td>
                  <td><Badge variant={s.esg!.laborRisk === "High" ? "risk" : s.esg!.laborRisk === "Medium" ? "warn" : "ok"} style={{ fontSize: 10, padding: "2px 7px" }}>{s.esg!.laborRisk}</Badge></td>
                  <td><Badge variant={s.esg!.environmentalRisk === "High" ? "risk" : s.esg!.environmentalRisk === "Medium" ? "warn" : "ok"} style={{ fontSize: 10, padding: "2px 7px" }}>{s.esg!.environmentalRisk}</Badge></td>
                  <td><button className="btn" style={{ fontSize: 12 }} onClick={() => setRoute("supplier", { id: s.id })}>Open</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ESG score breakdown */}
      <div className="card">
        <h2>ESG Score Breakdown</h2>
        <div className="card-sub">Environmental · Social · Governance pillars per supplier</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {suppliersAll.filter((s) => s.esg).sort((a, b) => (b.esg?.score || 0) - (a.esg?.score || 0)).map((s) => (
            <div key={s.id} className="item" style={{ cursor: "default" }}>
              <div className="row" style={{ marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{s.name}</span>
                  <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>Tier {s.tier} · {s.region}</span>
                </div>
                <div className="inline">
                  <span style={{ fontWeight: 800, fontSize: 18, color: gradeColor(s.esg!.grade) }}>{s.esg!.score}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: gradeColor(s.esg!.grade), marginLeft: 2 }}>{s.esg!.grade}</span>
                  {s.esg!.carbonFootprint && (
                    <span className="muted" style={{ fontSize: 11 }}>CO₂: {s.esg!.carbonFootprint}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Environmental", value: s.esg!.environmental, color: "#16a34a" },
                  { label: "Social", value: s.esg!.social, color: "#2563eb" },
                  { label: "Governance", value: s.esg!.governance, color: "#7c3aed" },
                ].map((dim) => (
                  <div key={dim.label}>
                    <div className="row" style={{ marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{dim.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: dim.color }}>{dim.value}</span>
                    </div>
                    <ScoreBar value={dim.value} color={dim.color} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regulatory timeline */}
      <div className="card">
        <h2>Regulatory Deadline Tracker</h2>
        <div className="card-sub">Key compliance enforcement dates affecting your supply chain</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { reg: "EU CSDDD", deadline: "Q4 2025", scope: "Companies >500 employees · Tier 1 + 2 supplier due diligence", urgency: "risk" as const },
            { reg: "EU EUDR", deadline: "Q4 2025", scope: "Deforestation regulation · Applies to 7 key commodities", urgency: "risk" as const },
            { reg: "German LkSG", deadline: "Ongoing", scope: "Supply chain act · Human rights / environment · All companies >1,000 FTE", urgency: "warn" as const },
            { reg: "EU CSRD", deadline: "FY2025 reporting", scope: "Sustainability reporting directive · Large companies + listed SMEs", urgency: "warn" as const },
            { reg: "US SEC Climate Disclosure", deadline: "FY2026", scope: "Large accelerated filers · Scope 1 + 2 mandatory", urgency: "info" as const },
          ].map((item) => (
            <div key={item.reg} className="item" style={{ cursor: "default" }}>
              <div className="row">
                <div>
                  <div style={{ fontWeight: 700 }}>{item.reg}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{item.scope}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Badge variant={item.urgency}>{item.deadline}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="note">Compliance status sourced from Prewave-equivalent multilingual regulatory monitoring across 400+ languages.</div>
      </div>
    </div>
  );
}
