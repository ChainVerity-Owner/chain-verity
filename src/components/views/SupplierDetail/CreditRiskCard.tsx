"use client";

import { Supplier } from "@/types";
import { computeAltmanZ } from "@/lib/analytics";
import { Badge } from "@/components/ui/Badge";
import { InfoTip } from "@/components/ui/InfoTip";

interface CreditRiskCardProps {
  supplier: Supplier;
}

function friskColor(score: number) {
  if (score <= 2) return "var(--risk)";
  if (score <= 4) return "var(--warn)";
  return "var(--ok)";
}

function bankruptcyVariant(r: string) {
  if (r === "Critical") return "risk" as const;
  if (r === "High") return "risk" as const;
  if (r === "Moderate") return "warn" as const;
  return "ok" as const;
}

function paymentVariant(p: string) {
  if (p === "Poor") return "risk" as const;
  if (p === "Moderate") return "warn" as const;
  return "ok" as const;
}

const zoneColor = { safe: "var(--ok)", gray: "var(--warn)", distress: "var(--risk)" } as const;
const zoneLabel = { safe: "Safe zone", gray: "Gray zone", distress: "Distress zone" } as const;

export function CreditRiskCard({ supplier }: CreditRiskCardProps) {
  const { creditRisk: cr } = supplier;
  if (!cr) return null;

  const altman = computeAltmanZ(supplier);
  const insolvencyPct = (cr.insolvencyProbability * 100).toFixed(1);
  const derivedPct = altman ? (altman.insolvencyProbability * 100).toFixed(1) : null;
  const friskBarWidth = (cr.friskScore / 10) * 100;

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Credit Risk Assessment <InfoTip text="Third-party credit risk evaluation combining FRISK® score (1–10, lower = higher bankruptcy risk), insolvency probability, credit rating, and payment behavior. FRISK scores of 1–3 indicate the highest-risk decile — statistically 10× more likely to file for bankruptcy within 12 months." width={260} /></h2>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Source: {cr.source} · Updated {cr.lastUpdated}
          </div>
        </div>
        <Badge variant={bankruptcyVariant(cr.bankruptcyRisk12m)} style={{ fontSize: 13, fontWeight: 700 }}>
          {cr.bankruptcyRisk12m} Bankruptcy Risk
        </Badge>
      </div>

      <div className="kv">
        <div className="box">
          <div className="muted" style={{ fontSize: 11, marginBottom: 4, display: "flex", alignItems: "center" }}>
            FRISK® Score
            <InfoTip text="Proprietary score (1–10) from CreditRiskMonitor. Scores of 1–3 signal high bankruptcy risk within 12 months; 8–10 signal low risk. Derived from financial ratios, credit agency ratings, and crowdsourced analyst sentiment. 96% accuracy in predicting public company bankruptcy." width={240} />
            <span style={{ fontSize: 10, marginLeft: 6 }}>(1–10, lower = higher risk)</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: friskColor(cr.friskScore), letterSpacing: "-.03em" }}>{cr.friskScore}</div>
          <div className="progress" style={{ marginTop: 6, height: 6 }}>
            <div className="progress-fill" style={{ width: `${friskBarWidth}%`, background: friskColor(cr.friskScore) }} />
          </div>
        </div>
        <div className="box">
          <div className="muted" style={{ fontSize: 11, marginBottom: 4, display: "flex", alignItems: "center" }}>
            Insolvency Probability
            <InfoTip text="Statistical likelihood (0–100%) that this company becomes insolvent within 12 months. Derived from financial statement analysis, payment behavior, and credit bureau data. Above 10% warrants immediate review." width={230} />
            <span style={{ fontSize: 10, marginLeft: 6 }}>(12-month)</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: cr.insolvencyProbability > 0.1 ? "var(--risk)" : cr.insolvencyProbability > 0.05 ? "var(--warn)" : "var(--ok)", letterSpacing: "-.03em" }}>
            {insolvencyPct}%
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            {cr.insolvencyProbability > 0.1 ? "Elevated — review immediately" : cr.insolvencyProbability > 0.05 ? "Moderate — active monitoring" : "Within normal range"}
          </div>
        </div>
        <div className="box">
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>Credit Rating</div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-.03em" }}>{cr.creditRating}</div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>Public rating agency</div>
        </div>
        <div className="box">
          Payment Behavior
          <b><Badge variant={paymentVariant(cr.paymentBehavior)} style={{ marginTop: 4 }}>{cr.paymentBehavior}</Badge></b>
        </div>
        <div className="box">
          12-Month Bankruptcy Risk
          <b><Badge variant={bankruptcyVariant(cr.bankruptcyRisk12m)} style={{ marginTop: 4 }}>{cr.bankruptcyRisk12m}</Badge></b>
        </div>
        <div className="box">
          Data Source
          <b style={{ fontSize: 12 }}>{cr.source}</b>
        </div>
      </div>
      {altman && (
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--surface)", borderRadius: 8, border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Altman Z&#x2032;-Score</span>
            <InfoTip text="Altman Z'-Score (1995 private-firm variant): Z' = 0.717·(Working Capital/Assets) + 0.847·(Retained Earnings/Assets) + 3.107·(EBIT/Assets) + 0.420·(Book Equity/Liabilities) + 0.998·(Revenue/Assets). Safe zone: Z' > 2.9 · Gray zone: 1.23–2.9 · Distress: < 1.23. Insolvency probability is logistic-mapped from Z', calibrated to Altman's empirical zone boundaries. EBIT approximated as net income ÷ 0.75 (25% effective tax rate)." width={280} />
            <Badge variant={altman.zone === "safe" ? "ok" : altman.zone === "gray" ? "warn" : "risk"} style={{ fontSize: 11 }}>
              {zoneLabel[altman.zone]}
            </Badge>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>Z&#x2032; Score</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: zoneColor[altman.zone] }}>{altman.z.toFixed(2)}</div>
            </div>
            <div>
              <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>Derived insolvency probability</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-.03em", color: zoneColor[altman.zone] }}>{derivedPct}%</div>
              {derivedPct !== insolvencyPct && (
                <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{cr.source} attributes {insolvencyPct}%</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div className="muted" style={{ fontSize: 11, marginBottom: 6 }}>Zone scale</div>
              <div style={{ position: "relative", height: 10, borderRadius: 5, background: "linear-gradient(to right, var(--risk) 0%, var(--warn) 40%, var(--ok) 100%)" }}>
                {/* Marker at current Z', clamped to 0–5 range for display */}
                <div style={{
                  position: "absolute", top: -3, width: 4, height: 16, borderRadius: 2,
                  background: "var(--text)", transform: "translateX(-50%)",
                  left: `${Math.min(98, Math.max(2, (altman.z / 5) * 100))}%`,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 4, color: "var(--muted)" }}>
                <span>0 · Distress</span><span>1.23</span><span>2.9</span><span>5+</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="note">
        FRISK® score methodology: financial statement ratios + bond agency ratings + crowdsourced financial professional sentiment.
        96% accuracy for predicting public company bankruptcy within 12 months (CreditRiskMonitor methodology).
        Insolvency probability sourced from Coface DRA where applicable.
        {altman && " Altman Z'-Score computed from balance-sheet data; EBIT approximated from net margin."}
      </div>
    </div>
  );
}
