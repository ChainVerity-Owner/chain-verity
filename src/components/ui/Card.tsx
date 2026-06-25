import { ReactNode } from "react";
import { Sparkline, TrendPill } from "./Charts";
import { InfoTip } from "./InfoTip";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return <div className={`card ${className}`}>{children}</div>;
}

interface KpiCardProps {
  label: string;
  value: string;
  sub: string;
  tip?: string;
}

export function KpiCard({ label, value, sub, tip }: KpiCardProps) {
  return (
    <div className="card">
      <div className="kpi-label" style={{ display: "flex", alignItems: "center" }}>
        {label}
        {tip && <InfoTip text={tip} width={220} />}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

// ── Enhanced KPI card with accent stripe, trend, and optional sparkline ────────
interface KpiCardV2Props {
  label: string;
  value: string;
  sub: string;
  accent?: string;          // CSS color, e.g. "var(--risk)"
  trend?: number;           // +/- number
  trendSuffix?: string;
  trendHigherIsBetter?: boolean;
  sparkData?: number[];
  icon?: string;            // emoji icon
  info?: string;            // tooltip text
}

export function KpiCardV2({ label, value, sub, accent, trend, trendSuffix = "%", trendHigherIsBetter, sparkData, icon, info }: KpiCardV2Props) {
  return (
    <div className="kpi-v2" style={{ "--kpi-accent": accent ?? "var(--accent)" } as React.CSSProperties}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="kpi-v2-label">{label}{info && <InfoTip text={info} width={220} />}</div>
        {icon && <span style={{ fontSize: 18, lineHeight: 1, marginTop: 1 }}>{icon}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div className="kpi-v2-value">{value}</div>
        {sparkData && (
          <div style={{ paddingBottom: 4 }}>
            <Sparkline data={sparkData} color={accent ?? "var(--accent)"} height={26} width={60} />
          </div>
        )}
      </div>
      <div className="kpi-v2-footer">
        <span className="kpi-v2-sub">{sub}</span>
        {trend !== undefined && (
          <TrendPill value={trend} suffix={trendSuffix} higherIsBetter={trendHigherIsBetter} />
        )}
      </div>
    </div>
  );
}
