"use client";

import { Supplier } from "@/types";
import { Badge } from "@/components/ui/Badge";

interface ESGCardProps {
  supplier: Supplier;
}

type ComplianceValue = "Compliant" | "In Progress" | "Non-Compliant" | "N/A" | true | false | "Not Started";

function complianceVariant(s: ComplianceValue) {
  if (s === true || s === "Compliant") return "ok" as const;
  if (s === "In Progress") return "warn" as const;
  return "risk" as const;
}

function complianceLabel(s: ComplianceValue): string {
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

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress" style={{ height: 4, marginTop: 4 }}>
      <div className="progress-fill" style={{ width: `${value}%`, background: color }} />
    </div>
  );
}

export function ESGCard({ supplier }: ESGCardProps) {
  const { esg } = supplier;
  if (!esg) return null;

  const gc = gradeColor(esg.grade);

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>ESG & Compliance</h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            360° supplier score · Prewave-equivalent monitoring · Last audit: {esg.lastAudit || "Not available"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: gc, letterSpacing: "-.03em", lineHeight: 1 }}>
            {esg.score}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: gc }}>Grade {esg.grade}</div>
        </div>
      </div>

      {/* Dimension bars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
        {[
          { label: "Environmental", value: esg.environmental, color: "#16a34a" },
          { label: "Social", value: esg.social, color: "#2563eb" },
          { label: "Governance", value: esg.governance, color: "#7c3aed" },
        ].map((d) => (
          <div key={d.label} className="box">
            <div className="row" style={{ marginBottom: 4 }}>
              <span className="muted" style={{ fontSize: 11 }}>{d.label}</span>
              <span style={{ fontWeight: 700, color: d.color }}>{d.value}</span>
            </div>
            <ScoreBar value={d.value} color={d.color} />
            {d.label === "Environmental" && esg.carbonFootprint && (
              <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>CO₂: {esg.carbonFootprint}</div>
            )}
          </div>
        ))}
      </div>

      {/* Regulatory compliance */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Regulatory Compliance</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "CSDDD", value: esg.csdddStatus },
          { label: "LkSG", value: esg.lksgStatus },
          { label: "EUDR", value: esg.eudrCompliant },
          { label: "CSRD", value: esg.csrdStatus },
        ].map((item) => (
          <div key={item.label} className="box" style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>{item.label}</div>
            <Badge variant={complianceVariant(item.value as ComplianceValue)} style={{ fontSize: 10, padding: "2px 8px" }}>
              {complianceLabel(item.value as ComplianceValue)}
            </Badge>
          </div>
        ))}
      </div>

      {/* Risk flags */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Risk Flags</div>
      <div className="inline">
        <div className="box" style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px" }}>
          <span className="muted" style={{ fontSize: 12 }}>Labor Risk:</span>
          <Badge variant={esg.laborRisk === "High" ? "risk" : esg.laborRisk === "Medium" ? "warn" : "ok"}>
            {esg.laborRisk}
          </Badge>
        </div>
        <div className="box" style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 12px" }}>
          <span className="muted" style={{ fontSize: 12 }}>Environmental Risk:</span>
          <Badge variant={esg.environmentalRisk === "High" ? "risk" : esg.environmentalRisk === "Medium" ? "warn" : "ok"}>
            {esg.environmentalRisk}
          </Badge>
        </div>
      </div>

      <div className="note" style={{ marginTop: 10 }}>
        ESG scores monitored continuously across 150+ risk categories in 400+ languages. Regulatory compliance derived from filings, media, and government databases.
      </div>
    </div>
  );
}
