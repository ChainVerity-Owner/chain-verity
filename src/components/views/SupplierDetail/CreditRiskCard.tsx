"use client";

import { Supplier } from "@/types";
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

export function CreditRiskCard({ supplier }: CreditRiskCardProps) {
  const { creditRisk: cr } = supplier;
  if (!cr) return null;

  const insolvencyPct = (cr.insolvencyProbability * 100).toFixed(1);
  const friskBarWidth = (cr.friskScore / 10) * 100;

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Credit Risk Assessment</h2>
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
            <InfoTip text="Statistical likelihood (0–100%) that this company becomes insolvent within 12 months. Derived from financial statement analysis, payment behaviour, and credit bureau data. Above 10% warrants immediate review." width={230} />
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
      <div className="note">
        FRISK® score methodology: financial statement ratios + bond agency ratings + crowdsourced financial professional sentiment.
        96% accuracy for predicting public company bankruptcy within 12 months (CreditRiskMonitor methodology).
        Insolvency probability sourced from Coface DRA where applicable.
      </div>
    </div>
  );
}
