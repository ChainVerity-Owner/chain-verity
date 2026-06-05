"use client";

import { Supplier } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";
import { useApp } from "@/context/AppContext";

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

const COMPLIANCE_TIPS: Record<string, string> = {
  CSDDD: "EU Corporate Sustainability Due Diligence Directive — requires large companies to identify, prevent, and address adverse human rights and environmental impacts across their supply chains. Full enforcement from 2026.",
  LkSG: "German Supply Chain Due Diligence Act (Lieferkettensorgfaltspflichtengesetz) — requires companies with 1,000+ employees in Germany to conduct due diligence on human rights and environmental risks in their global supply chains.",
  EUDR: "EU Deforestation Regulation — prohibits products linked to deforestation or forest degradation from EU markets. Affects timber, palm oil, soy, cocoa, beef, coffee, and rubber supply chains.",
  CSRD: "EU Corporate Sustainability Reporting Directive — requires large companies to report on climate risk, supply chain impacts, and social factors using standardised European Sustainability Reporting Standards (ESRS).",
};

const US_COMPLIANCE_TIPS: Record<string, string> = {
  UFLPA: "Uyghur Forced Labor Prevention Act — US law (2022) that presumes goods with Xinjiang-region supply chain connections are made with forced labor. Non-compliant shipments are detained by CBP at US ports.",
  "SEC Scope 3": "SEC Climate Disclosure Rule — requires public companies to report Scope 3 supply chain emissions. In Progress = supplier has begun measuring but not yet reported.",
  "Conflict Minerals": "Dodd-Frank Section 1502 — requires US public companies to disclose use of conflict minerals (tin, tantalum, tungsten, gold) sourced from the DRC or adjoining countries.",
};

export function ESGCard({ supplier }: ESGCardProps) {
  const { clientMode } = useApp();
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

      {/* Regulatory compliance — EU or US depending on clientMode */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Regulatory Compliance</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {(clientMode === "wb"
          ? ([
              { label: "CSDDD", value: esg.csdddStatus as ComplianceValue },
              { label: "LkSG",  value: esg.lksgStatus as ComplianceValue },
              { label: "EUDR",  value: esg.eudrCompliant as ComplianceValue },
              { label: "CSRD",  value: esg.csrdStatus as ComplianceValue },
            ])
          : ([
              { label: "UFLPA",             value: (esg.uflpaStatus ?? "N/A") as ComplianceValue },
              { label: "SEC Scope 3",       value: (esg.scope3Status ?? "N/A") as ComplianceValue },
              { label: "Conflict Minerals", value: (esg.conflictMineralsStatus ?? "N/A") as ComplianceValue },
              { label: "CSRD",              value: "N/A" as ComplianceValue },
            ])
        ).map((item) => (
          <div key={item.label} className="box" style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {item.label}
              <InfoTip
                text={(clientMode === "wb" ? COMPLIANCE_TIPS : US_COMPLIANCE_TIPS)[item.label] ?? ""}
                width={240}
              />
            </div>
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
