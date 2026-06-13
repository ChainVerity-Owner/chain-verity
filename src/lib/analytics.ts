import { Supplier, SeriesPoint, Recommendation, MCResult } from "@/types";

/**
 * Composite risk score (0–100).
 *
 * Weights:
 *   Financial health   30%  (current ratio, D/E, net profit margin)
 *   Credit risk        25%  (FRISK score, insolvency probability)
 *   ESG                15%  (inverse of ESG score)
 *   Resiliency         15%  (inverse of resiliency overall, 1–10 scale)
 *   Operational        15%  (on-time delivery, quality PPM)
 *
 * Missing components are skipped and the remaining weights renormalised.
 * A baseline spend/exposure concentration premium is added on top.
 */
export function computeRisk(s: Supplier): number {
  let score = 0;
  let weight = 0;

  // ── 1. Financial Health (30%) ───────────────────────────────────
  if (s.ratios) {
    const cr = s.ratios.currentRatio;
    const crR = cr >= 2.0 ? 5 : cr >= 1.5 ? 18 : cr >= 1.2 ? 35 : cr >= 1.0 ? 55 : cr >= 0.8 ? 75 : 90;

    const de = s.ratios.debtToEquity;
    const deR = de <= 0.5 ? 5 : de <= 0.8 ? 18 : de <= 1.2 ? 38 : de <= 1.5 ? 58 : de <= 2.0 ? 75 : 90;

    const pm = s.ratios.netProfitMargin;
    const pmR = pm >= 0.15 ? 5 : pm >= 0.10 ? 18 : pm >= 0.07 ? 35 : pm >= 0.05 ? 55 : pm >= 0.0 ? 72 : 90;

    score += ((crR + deR + pmR) / 3) * 0.30;
    weight += 0.30;
  }

  // ── 2. Credit Risk (25%) ────────────────────────────────────────
  if (s.creditRisk) {
    const fr = s.creditRisk.friskScore;
    const frR = fr >= 9 ? 5 : fr >= 8 ? 15 : fr >= 7 ? 28 : fr >= 6 ? 44 : fr >= 5 ? 58 : fr >= 4 ? 70 : fr >= 3 ? 82 : 92;

    const ip = s.creditRisk.insolvencyProbability;
    const ipR = ip <= 0.005 ? 5 : ip <= 0.01 ? 15 : ip <= 0.03 ? 32 : ip <= 0.06 ? 52 : ip <= 0.12 ? 70 : ip <= 0.18 ? 85 : 93;

    score += (frR * 0.6 + ipR * 0.4) * 0.25;
    weight += 0.25;
  }

  // ── 3. ESG (15%) — lower ESG = higher risk ──────────────────────
  if (s.esg) {
    score += (100 - s.esg.score) * 0.15;
    weight += 0.15;
  }

  // ── 4. Resiliency (15%) — lower score = higher risk ─────────────
  if (s.resiliency) {
    score += Math.min(100, ((10 - s.resiliency.overall) / 9) * 100) * 0.15;
    weight += 0.15;
  }

  // ── 5. Operational (15%) ────────────────────────────────────────
  const ot = s.onTime;
  const otR = ot == null ? 50 : ot >= 98 ? 5 : ot >= 95 ? 18 : ot >= 92 ? 35 : ot >= 90 ? 52 : ot >= 85 ? 70 : 85;

  const ppm = s.qualityPPM;
  const ppmR = ppm == null ? 50 : ppm <= 75 ? 5 : ppm <= 150 ? 20 : ppm <= 250 ? 40 : ppm <= 400 ? 60 : ppm <= 600 ? 78 : 90;

  score += ((otR + ppmR) / 2) * 0.15;
  weight += 0.15;

  // Normalise for missing components
  const base = weight > 0 ? score / weight : 50;

  // ── Concentration premium (spend / exposure) ─────────────────────
  const expPremium = (s.exposure ?? 0) > 8 ? 6 : (s.exposure ?? 0) > 5 ? 3 : 0;
  const spendPremium = (s.spend ?? 0) > 15 ? 3 : 0;

  return Math.round(Math.min(99, Math.max(5, base + expPremium + spendPremium)));
}

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function last12Q(): string[] {
  const now = new Date();
  let y = now.getFullYear();
  let q = Math.floor(now.getMonth() / 3) + 1;
  const labels: string[] = [];
  for (let i = 0; i < 12; i++) {
    labels.unshift(y + "-Q" + q);
    if (--q === 0) { q = 4; y--; }
  }
  return labels;
}

export function trendLabel(series: SeriesPoint[], hi = true): string {
  if (!series || series.length < 2) return "Stable";
  const d = series[series.length - 1].value - series[0].value;
  if (Math.abs(d) < 0.08) return "Stable";
  return (d > 0) === hi ? "Improving" : "Deteriorating";
}

function buildSeries(
  s: Supplier,
  key: string,
  base: [number, number],
  range: number,
  pin?: (s: Supplier) => number | null
): SeriesPoint[] {
  const seed = hashSeed(String(s.id || s.name || "s") + "|" + key);
  const rnd = mulberry32(seed);
  const r01 = Math.max(0, Math.min(1, (s.risk || 50) / 100));
  let v = base[0] + (1 - r01) * (base[1] - base[0]) + (rnd() - 0.5) * range;
  const series: SeriesPoint[] = [];
  const labels = last12Q();
  for (let i = 0; i < 12; i++) {
    v += (rnd() - 0.5) * range * 0.5;
    v = Math.max(base[0] * 0.3, Math.min(base[1] * 1.5, v));
    series.push({ label: labels[i], value: +v.toFixed(2) });
  }
  if (pin) {
    const p = pin(s);
    if (p != null) series[series.length - 1].value = p;
  }
  return series;
}

export const buildCR = (s: Supplier) => buildSeries(s, "cr", [0.5, 2.5], 0.18, (s) => s.ratios?.currentRatio ?? null);
export const buildDE = (s: Supplier) => buildSeries(s, "de", [0.3, 2.8], 0.22, (s) => s.ratios?.debtToEquity ?? null);
export const buildPM = (s: Supplier) => buildSeries(s, "pm", [2, 28], 2.5, (s) => s.ratios?.netProfitMargin != null ? s.ratios.netProfitMargin * 100 : null);
export const buildOCF = (s: Supplier) => buildSeries(s, "ocf", [-5, 80], 8, () => null);
export const buildEB = (s: Supplier) => buildSeries(s, "eb", [-10, 90], 9, () => null);

export function calcDPS(s: Supplier): number {
  const f = s.ratios
    ? (s.ratios.currentRatio < 1 ? 25 : 10) + (s.ratios.debtToEquity > 1.5 ? 22 : 8) + (s.ratios.netProfitMargin < 0.05 ? 20 : 5)
    : 20;
  // Fixed: separate variables to avoid operator precedence issue
  const onTimePenalty = (s.onTime ?? 100) < 90 ? 18 : 5;
  const ppmPenalty = (s.qualityPPM ?? 0) > 300 ? 18 : 5;
  const op = (onTimePenalty + ppmPenalty) / 2;
  const dep = (s.exposure ?? 0) > 10 ? 22 : 9;
  // Fixed: weights sum to 1.0 (financial 40%, operational 30%, dependency 30%)
  return Math.min(95, Math.round(f * 0.40 + op * 0.30 + dep * 0.30));
}

export function runMC(s: Supplier, iter = 5000): MCResult {
  // Base probability from deterministic DPS, with ±8% stochastic variance per iteration
  const baseProbability = calcDPS(s) / 100;
  let cnt = 0;
  const exps: number[] = [];
  for (let i = 0; i < iter; i++) {
    const jitter = (Math.random() - 0.5) * 0.16;
    const p = Math.max(0.02, Math.min(0.95, baseProbability + jitter));
    if (Math.random() < p) {
      cnt++;
      exps.push((s.exposure || 5) * (1 + Math.random() * 1.5));
    }
  }
  exps.sort((a, b) => a - b);
  return {
    probability: Math.round((cnt / iter) * 100),
    expectedExposure: exps.length ? (exps.reduce((a, b) => a + b, 0) / exps.length).toFixed(1) : "0",
    stress95: exps.length ? exps[Math.floor(exps.length * 0.95)].toFixed(1) : "0",
  };
}

export function topDrivers(s: Supplier): string[] {
  const d: string[] = [];
  if ((s.ratios?.currentRatio ?? 2) < 1) d.push("Liquidity tightness");
  if ((s.ratios?.debtToEquity ?? 0) > 1.5) d.push("High leverage");
  if ((s.onTime ?? 100) < 90) d.push("Delivery volatility");
  if ((s.qualityPPM ?? 0) > 300) d.push("Quality instability");
  if ((s.exposure ?? 0) > 10) d.push("High dependency");
  return d.length ? d.slice(0, 3) : ["Stable indicators"];
}

export function getRec(s: Supplier, simulatedEscalation: Record<string, boolean>): Recommendation {
  if (simulatedEscalation[s.id]) {
    return {
      action: "Find secondary source",
      reason: "Observation failed (simulated). System escalated to ensure continuity.",
      guidance: [
        "Qualify alternate supplier for critical SKUs.",
        "Increase OTIF monitoring for 90 days.",
        "Adjust safety stock while second source ramps.",
      ],
    };
  }

  const curr = s.ratios?.currentRatio ?? null;
  const dToE = s.ratios?.debtToEquity ?? null;
  const margin = s.ratios?.netProfitMargin ?? null;
  const risk = s.risk || 0;

  const deS = buildDE(s), pmS = buildPM(s), ocfS = buildOCF(s);
  const delta = (ser: SeriesPoint[]) => ser && ser.length >= 2 ? ser[ser.length - 1].value - ser[0].value : null;
  const deD = delta(deS), pmD = delta(pmS), ocfD = delta(ocfS);
  const latOcf = ocfS ? ocfS[ocfS.length - 1].value : null;

  const liqT = curr != null && curr < 1.0;
  const levH = dToE != null && dToE > 0.9;
  const deW = deD != null && deD > 0.25;
  const pmW = (pmD != null && pmD < -2) || (margin != null && margin < 0.05);
  const ocfW = (latOcf != null && latOcf < 0) || (ocfD != null && ocfD < -5);

  // Hard ratio/risk failures — escalate regardless of score
  if (risk >= 70 || (liqT && (levH || deW)) || (pmW && ocfW)) {
    return {
      action: "Find secondary source",
      reason: "Combined risk signals and deteriorating 3-year trends increase disruption probability.",
      guidance: [
        "Qualify and contract alternate supplier for critical SKUs.",
        "Increase inspection and OTIF monitoring frequency for 90 days.",
        "Adjust safety stock targets while second source ramps.",
        "Escalate to procurement and finance for credit exposure review.",
      ],
    };
  }

  // Low-risk stable suppliers: require concrete ratio evidence, not just synthetic trend noise
  const hasConcreteRatioRisk = liqT || levH || (margin != null && margin < 0.05);
  const multipleTrendSignals = [deW, pmW, ocfW].filter(Boolean).length >= 2;
  const meetsRenegotiationBar = risk >= 50
    ? (hasConcreteRatioRisk || deW || pmW)
    : (hasConcreteRatioRisk || multipleTrendSignals);

  if (meetsRenegotiationBar) {
    return {
      action: "Renegotiation of contract",
      reason: "Trend signals indicate financial stress building. Use commercial terms to reduce disruption risk.",
      guidance: [
        "Negotiate payment terms that reduce cash exposure.",
        "Add performance triggers to existing contract.",
        "Request quarterly financial reporting from supplier.",
        "Pre-qualify backup supplier as contingency.",
      ],
    };
  }

  return {
    action: "No recommended changes",
    reason: "Financial trends and operational metrics are within acceptable thresholds.",
    guidance: [
      "Continue standard monitoring cadence.",
      "Review at next scheduled supplier business review.",
    ],
  };
}
