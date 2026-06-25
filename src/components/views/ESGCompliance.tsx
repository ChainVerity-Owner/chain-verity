"use client";

import { useApp, useSuppliers } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { KpiCard } from "@/components/ui/Card";
import { InfoTip } from "@/components/ui/InfoTip";

type ComplianceStatus = string | boolean;

function complianceVariant(s: ComplianceStatus) {
  if (s === true || s === "Compliant" || s === "Reported") return "ok" as const;
  if (s === "In Progress" || s === "Under Review") return "warn" as const;
  if (s === false || s === "Non-Compliant" || s === "Not Started") return "risk" as const;
  return "muted-b" as const;
}

function complianceLabel(s: ComplianceStatus): string {
  if (s === true) return "Compliant";
  if (s === false || s === "Not Started") return "Not Started";
  return String(s);
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
  const { setRoute, clientMode, platformCertifications } = useApp();
  const suppliers = useSuppliers();
  const isWB = clientMode === "wb";

  const withESG = suppliers.filter((s) => s.esg);
  const avgESG = withESG.length ? Math.round(withESG.reduce((a, s) => a + (s.esg?.score || 0), 0) / withESG.length) : 0;
  const highLaborRisk = withESG.filter((s) => s.esg?.laborRisk === "High").length;

  // Mode-specific compliance KPIs
  const primaryCompliant = isWB
    ? withESG.filter((s) => s.esg!.csdddStatus === "Compliant").length
    : withESG.filter((s) => s.esg!.uflpaStatus === "Compliant").length;
  const primaryNonCompliant = isWB
    ? withESG.filter((s) => s.esg!.csdddStatus === "Non-Compliant").length
    : withESG.filter((s) => s.esg!.uflpaStatus === "Non-Compliant").length;
  const primaryLabel = isWB ? "CSDDD Compliant" : "UFLPA Compliant";
  const nonCompliantLabel = isWB ? "Non-Compliant" : "UFLPA Non-Compliant";

  // Compliance columns for the matrix
  const complianceCols = isWB
    ? [
        { key: "csdddStatus", label: "CSDDD" },
        { key: "lksgStatus",  label: "LkSG" },
        { key: "eudrCompliant", label: "EUDR" },
        { key: "csrdStatus",  label: "CSRD" },
      ]
    : [
        { key: "uflpaStatus",            label: "UFLPA" },
        { key: "scope3Status",           label: "SEC Scope 3" },
        { key: "conflictMineralsStatus", label: "Conflict Minerals" },
        { key: "csrdStatus",             label: "CSRD" },
      ];

  // Regulatory timeline
  const regulatoryItems = isWB
    ? [
        { reg: "EU CSDDD",             deadline: "Q4 2025",         scope: "Companies >500 employees · Tier 1 + 2 supplier due diligence", urgency: "risk" as const },
        { reg: "EU EUDR",              deadline: "Q4 2025",         scope: "Deforestation regulation · Applies to 7 key commodities", urgency: "risk" as const },
        { reg: "German LkSG",          deadline: "Ongoing",         scope: "Supply chain act · Human rights / environment · All companies >1,000 FTE", urgency: "warn" as const },
        { reg: "EU CSRD",              deadline: "FY2025 reporting", scope: "Sustainability reporting directive · Large companies + listed SMEs", urgency: "warn" as const },
        { reg: "US SEC Climate Disclosure", deadline: "FY2026",    scope: "Large accelerated filers · Scope 1 + 2 mandatory", urgency: "info" as const },
      ]
    : [
        { reg: "UFLPA Enforcement",        deadline: "Active Now",       scope: "CBP presumption of forced labor for Xinjiang-linked goods · All importers", urgency: "risk" as const },
        { reg: "SEC Climate Disclosure",   deadline: "FY2026",           scope: "Large accelerated filers · Scope 1 & 2 mandatory; Scope 3 if material", urgency: "risk" as const },
        { reg: "Conflict Minerals (1502)", deadline: "Annual Filing",    scope: "Dodd-Frank — disclosure of tin, tantalum, tungsten, gold from DRC region", urgency: "warn" as const },
        { reg: "CHIPS Act Traceability",   deadline: "FY2025",           scope: "Semiconductor supply chain documentation for federal contract eligibility", urgency: "warn" as const },
        { reg: "CSRD (EU export markets)", deadline: "FY2026",           scope: "EU directive applies to US companies exporting to EU if >€150M EU revenue", urgency: "info" as const },
      ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid-4">
        <KpiCard label="Avg. ESG Score" value={`${avgESG}/100`} sub="Portfolio weighted" />
        <KpiCard label={primaryLabel} value={`${primaryCompliant}/${withESG.length}`} sub="Suppliers" />
        <KpiCard label={nonCompliantLabel} value={String(primaryNonCompliant)} sub="Immediate action required" />
        <KpiCard label="High Labor Risk" value={String(highLaborRisk)} sub="Suppliers flagged" />
      </div>

      {/* Regulatory compliance matrix */}
      <div className="card">
        <h2>Regulatory Compliance Matrix<InfoTip text="Supplier-by-supplier status across key EU and international frameworks: EUDR, CSRD, CSDDD, LkSG. Non-compliant suppliers may face import restrictions or procurement disqualification." width={260} /></h2>
        <div className="card-sub">
          {isWB
            ? "Status across CSDDD, LkSG, EUDR, and CSRD frameworks · Powered by Prewave-equivalent monitoring"
            : "Status across UFLPA, SEC Scope 3, Conflict Minerals, and CSRD frameworks · Powered by Chain Verity intelligence"}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>ESG Score</th>
                <th>Grade</th>
                {complianceCols.map((c) => <th key={c.key}>{c.label}</th>)}
                <th>Labor Risk</th>
                <th>Env. Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {withESG.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.name}</b><div className="muted" style={{ fontSize: 10 }}>Tier {s.tier} · {s.region}</div></td>
                  <td>
                    <div style={{ fontWeight: 700, color: gradeColor(s.esg!.grade) }}>{s.esg!.score}</div>
                    <ScoreBar value={s.esg!.score} color={gradeColor(s.esg!.grade)} />
                  </td>
                  <td><span style={{ fontWeight: 800, fontSize: 15, color: gradeColor(s.esg!.grade) }}>{s.esg!.grade}</span></td>
                  {complianceCols.map((col) => {
                    const val = ((s.esg as unknown) as Record<string, ComplianceStatus>)[col.key] ?? "N/A";
                    return (
                      <td key={col.key}>
                        <Badge variant={complianceVariant(val)} style={{ fontSize: 10, padding: "2px 7px" }}>
                          {complianceLabel(val)}
                        </Badge>
                      </td>
                    );
                  })}
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
        <h2>ESG Score Breakdown<InfoTip text="Portfolio ESG scores from Prewave, broken down by Environmental, Social, and Governance pillars. Low scores indicate non-financial risks including regulatory, reputational, and operational exposure." width={260} /></h2>
        <div className="card-sub">Environmental · Social · Governance pillars per supplier</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {withESG.sort((a, b) => (b.esg?.score || 0) - (a.esg?.score || 0)).map((s) => (
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
                  { label: "Social",        value: s.esg!.social,        color: "#2563eb" },
                  { label: "Governance",    value: s.esg!.governance,    color: "#7c3aed" },
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

      {/* Regulatory deadline tracker */}
      <div className="card">
        <h2>Regulatory Deadline Tracker<InfoTip text="Upcoming compliance milestones sorted by proximity. Suppliers missing key deadlines may require remediation plans, contract clauses, or procurement review." width={240} /></h2>
        <div className="card-sub">Key compliance enforcement dates affecting your supply chain</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {regulatoryItems.map((item) => (
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
        <div className="note">
          {isWB
            ? "Compliance status sourced from Prewave-equivalent multilingual regulatory monitoring across 400+ languages."
            : "Compliance status sourced from CBP UFLPA Entity List, SEC EDGAR, and supply chain intelligence feeds."}
        </div>
      </div>

      {/* Certification tracker */}
      <div className="card">
        <h2>Certification Tracker<InfoTip text="Status of quality, safety, and environmental certifications across the supplier base. Expired or expiring certifications (ISO 9001, PED, IATF 16949) may affect procurement eligibility or regulatory approval." width={240} /></h2>
        <div className="card-sub">
          {isWB
            ? "ISO, IATF, and quality certifications across the supply base · expiry calendar view"
            : "ISO, AS9100D, ITAR, NADCAP, and C-TPAT certifications · expiry calendar view"}
        </div>
        {(() => {
          const allCerts = Object.entries(platformCertifications).flatMap(([supplierId, certs]) =>
            certs.map((c) => ({ ...c, supplierId, supplierName: suppliers.find((s) => s.id === supplierId)?.name ?? supplierId }))
          );
          const expired = allCerts.filter((c) => c.status === "Expired").length;
          const expiringSoon = allCerts.filter((c) => c.status === "Expiring Soon").length;
          const valid = allCerts.filter((c) => c.status === "Valid").length;

          function certVariant(status: string) {
            if (status === "Valid") return "ok" as const;
            if (status === "Expiring Soon" || status === "In Renewal") return "warn" as const;
            if (status === "Expired") return "risk" as const;
            return "muted-b" as const;
          }

          return (
            <>
              <div style={{ display: "flex", gap: 16, marginTop: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { count: valid,        label: "Valid",         color: "var(--ok)"   },
                  { count: expiringSoon, label: "Expiring Soon", color: "var(--warn)" },
                  { count: expired,      label: "Expired",       color: "var(--risk)" },
                ].map(({ count, label, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: color, display: "inline-block" }} />
                    <span style={{ fontSize: 13 }}><b style={{ color }}>{count}</b> {label}</span>
                  </div>
                ))}
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Supplier</th><th>Certification</th><th>Standard</th>
                      <th>Issuer</th><th>Issued</th><th>Expires</th><th>Status</th><th>Scope</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCerts
                      .sort((a, b) => {
                        const order: Record<string, number> = { Expired: 0, "Expiring Soon": 1, "In Renewal": 2, Valid: 3 };
                        return (order[a.status] ?? 4) - (order[b.status] ?? 4);
                      })
                      .map((c, i) => (
                        <tr key={i} style={
                          c.status === "Expired" ? { background: "rgba(220,38,38,.04)" }
                          : c.status === "Expiring Soon" ? { background: "rgba(217,119,6,.04)" }
                          : undefined
                        }>
                          <td>
                            <span style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                              onClick={() => setRoute("supplier", { id: c.supplierId })}>
                              {c.supplierName}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{c.name}</td>
                          <td className="mono" style={{ fontSize: 12 }}>{c.standard}</td>
                          <td style={{ fontSize: 12, color: "var(--muted)" }}>{c.issuer}</td>
                          <td style={{ fontSize: 12 }}>{c.issued}</td>
                          <td style={{ fontSize: 12, fontWeight: c.status !== "Valid" ? 700 : 400, color: c.status === "Expired" ? "var(--risk)" : c.status === "Expiring Soon" ? "var(--warn)" : "inherit" }}>
                            {c.expires}
                          </td>
                          <td><Badge variant={certVariant(c.status)} style={{ fontSize: 10 }}>{c.status}</Badge></td>
                          <td style={{ fontSize: 11, color: "var(--muted)" }}>{c.scope ?? "—"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
        <div className="note" style={{ marginTop: 10 }}>
          Certification data sourced from issuing bodies and supplier self-declarations · auto-refreshed quarterly.
          Expired certifications require immediate remediation before next audit.
        </div>
      </div>
    </div>
  );
}
