"use client";

import { SeriesPoint } from "@/types";
import { trendLabel } from "@/lib/analytics";

interface LineChartProps {
  series: SeriesPoint[];
  label: string;
  formatY: (v: number) => string;
  higherIsBetter?: boolean;
}

export function LineChart({ series, label, formatY, higherIsBetter = true }: LineChartProps) {
  const vals = series.map((d) => d.value);
  const mn = Math.min(...vals);
  const mx = Math.max(...vals);
  const pad = (mx - mn) * 0.18 || 1;
  const yMin = mn - pad;
  const yMax = mx + pad;

  const W = 560, H = 200, L = 52, R = 12, T = 16, B = 32;
  const iw = W - L - R, ih = H - T - B;

  const xPos = (i: number) => L + (i / (series.length - 1)) * iw;
  const yPos = (v: number) => T + (1 - (v - yMin) / (yMax - yMin || 1)) * ih;

  let pathD = "";
  series.forEach((pt, i) => {
    const px = xPos(i).toFixed(1);
    const py = yPos(pt.value).toFixed(1);
    pathD += (i === 0 ? "M" : "L") + px + "," + py + " ";
  });

  const cur = series[series.length - 1].value;
  const start = series[0].value;
  const delta = +(cur - start).toFixed(2);
  const tl = trendLabel(series, higherIsBetter);
  const tc = tl === "Improving" ? "var(--ok)" : tl === "Deteriorating" ? "var(--risk)" : "var(--muted)";

  const gridYs = [0, 0.25, 0.5, 0.75, 1];
  const zeroY = yPos(0);
  const hasZeroCrossing = yMin < 0 && yMax > 0;

  const labelIndices = [0, 5, 11];

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: "0 0 2px" }}>{label}</h2>
          <div className="muted">Past 3 years (quarterly)</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="muted" style={{ fontSize: 11 }}>Latest</div>
          <div style={{ fontSize: 17, fontWeight: 800 }}>
            {formatY(cur)}{" "}
            <span className="muted" style={{ fontSize: 11 }}>
              {delta >= 0 ? `(+${formatY(Math.abs(delta))})` : `(−${formatY(Math.abs(delta))})`}
            </span>
          </div>
          <div style={{ fontSize: 11, color: tc }}>{tl}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, overflow: "hidden" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
          {gridYs.map((f) => (
            <line
              key={f}
              x1={L} y1={(T + f * ih).toFixed(1)}
              x2={W - R} y2={(T + f * ih).toFixed(1)}
              stroke="rgba(17,24,39,.07)"
            />
          ))}
          {hasZeroCrossing && (
            <line
              x1={L} y1={zeroY.toFixed(1)}
              x2={W - R} y2={zeroY.toFixed(1)}
              stroke="rgba(17,24,39,.15)"
            />
          )}
          <path d={pathD.trim()} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" />
          {series.map((pt, i) => (
            <circle key={i} cx={xPos(i).toFixed(1)} cy={yPos(pt.value).toFixed(1)} r="3" fill="var(--accent)">
              <title>{pt.label}: {formatY(pt.value)}</title>
            </circle>
          ))}
          {[yMin, (yMin + yMax) / 2, yMax].map((v, i) => (
            <text key={i} x={L - 8} y={(yPos(v) + 4).toFixed(1)} textAnchor="end" fontSize="11" fill="rgba(17,24,39,.5)">
              {formatY(v)}
            </text>
          ))}
          {series.map((pt, i) => {
            if (!labelIndices.includes(i)) return null;
            return (
              <text key={i} x={xPos(i).toFixed(1)} y={H - 8} textAnchor="middle" fontSize="11" fill="rgba(17,24,39,.5)">
                {pt.label}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="note">Demo data. In production: sourced from filings (public) or model-derived estimates (private).</div>
    </div>
  );
}
