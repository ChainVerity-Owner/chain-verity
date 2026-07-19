import { Supplier, SeriesPoint, Recommendation, MCResult, RecoveryProfile, AltmanZResult } from "@/types";

/**
 * Altman Z'-Score (1995 private-firm variant).
 *
 * Uses book equity instead of market cap, so it works for both public and
 * private companies without requiring a live market price.
 *
 * Z' = 0.717·X1 + 0.847·X2 + 3.107·X3 + 0.420·X4 + 0.998·X5
 *
 *   X1 = Working Capital / Total Assets
 *   X2 = Retained Earnings / Total Assets
 *   X3 = EBIT / Total Assets  (approximated: net income / (1 − 0.25 effective tax) / assets)
 *   X4 = Book Equity / Total Liabilities  (= 1 / D/E ratio)
 *   X5 = Revenue / Total Assets
 *
 * Zone thresholds (Altman 1995):
 *   Z' > 2.9  → Safe
 *   1.23 < Z' ≤ 2.9  → Gray
 *   Z' ≤ 1.23  → Distress
 *
 * Insolvency probability: logistic p = 1/(1+exp(1.41·(Z'−0.25))),
 * calibrated so p ≈ 0.5% at Z'=4.0 and p ≈ 20% at Z'=1.23.
 *
 * Returns null when balance-sheet fields are absent from ratios.
 */
export function computeAltmanZ(s: Supplier): AltmanZResult | null {
  const r = s.ratios;
  if (
    !r ||
    r.totalAssets == null ||
    r.retainedEarnings == null ||
    r.annualRevenue == null ||
    r.workingCapital == null
  ) return null;

  const ta = r.totalAssets;
  if (ta <= 0) return null;

  const x1 = r.workingCapital / ta;
  const x2 = r.retainedEarnings / ta;
  // EBIT approximated from net income grossed up for 25% effective tax rate
  const ebit = r.netProfitMargin * r.annualRevenue / 0.75;
  const x3 = ebit / ta;
  // Book equity / total liabilities = 1 / D/E  (D/E = total debt ÷ equity)
  const x4 = r.debtToEquity > 0 ? 1 / r.debtToEquity : 10;
  const x5 = r.annualRevenue / ta;

  const z = 0.717 * x1 + 0.847 * x2 + 3.107 * x3 + 0.420 * x4 + 0.998 * x5;
  const zone: AltmanZResult["zone"] = z > 2.9 ? "safe" : z > 1.23 ? "gray" : "distress";
  // Logistic mapping calibrated to Altman empirical zone boundaries
  const insolvencyProbability = Math.min(0.95, Math.max(0.002, 1 / (1 + Math.exp(1.41 * (z - 0.25)))));

  return { z: +z.toFixed(2), zone, insolvencyProbability: +insolvencyProbability.toFixed(4) };
}

/**
 * Compute on-time delivery rate (0–100) from completed shipment history.
 *
 * Filters to Delivered shipments for the given supplier within the trailing
 * windowDays, then counts those where actualDeliveryDate ≤ scheduledDate.
 * Returns null when no completed shipments exist in the window.
 */
export function computeOnTime(
  supplierId: string,
  shipments: import("@/types").Shipment[],
  windowDays = 90,
): number | null {
  const cutoffMs = Date.now() - windowDays * 86_400_000;
  const completed = shipments.filter(
    (s) =>
      s.supplierId === supplierId &&
      s.status === "Delivered" &&
      s.actualDeliveryDate != null &&
      s.scheduledDate != null &&
      new Date(s.actualDeliveryDate).getTime() >= cutoffMs,
  );
  if (completed.length === 0) return null;
  const onTime = completed.filter(
    (s) =>
      s.customerAccepted === true ||
      new Date(s.actualDeliveryDate!) <= new Date(s.scheduledDate!),
  ).length;
  return Math.round((onTime / completed.length) * 100);
}

// Regional lead-time baselines (days). Used for display context — whether a
// supplier is above peer norm — rather than as a pass/fail threshold.
export const LEAD_TIME_BASELINE: Record<string, number> = {
  NA: 12,
  EU: 22,
  APAC: 40,
};
const LEAD_TIME_DRIFT_THRESHOLD = 0.15; // 15% quarter-on-quarter growth = warning

export interface LeadTimeDriftResult {
  driftPct: number;      // fractional, e.g. 0.22 = +22% from oldest to newest quarter
  worsening: boolean;    // true when drift exceeds threshold
  baseline: number;      // regional peer baseline in days
  latest: number;        // most recent quarter average in days
  aboveBaseline: boolean;
}

export function computeLeadTimeDrift(s: Supplier): LeadTimeDriftResult | null {
  const trend = s.leadTimeTrend;
  if (!trend || trend.length < 2) return null;
  const first = trend[0];
  const last = trend[trend.length - 1];
  if (first <= 0) return null;
  const driftPct = (last - first) / first;
  const region = s.region ?? "EU";
  const baseline = LEAD_TIME_BASELINE[region] ?? LEAD_TIME_BASELINE.EU;
  return {
    driftPct: +driftPct.toFixed(3),
    worsening: driftPct > LEAD_TIME_DRIFT_THRESHOLD,
    baseline,
    latest: last,
    aboveBaseline: last > baseline,
  };
}

/**
 * Compute the R Score overall (1–10) from the five resiliency dimensions.
 *
 * Weights:
 *   Performance   30%  — derived from onTime + qualityPPM (live observable data)
 *                        falls back to the stored performance value if present
 *   Continuity    25%  — assessed BCP coverage
 *   Network       20%  — assessed sub-tier mapping depth
 *   Maturity      15%  — assessed SCRM program maturity
 *   Transparency  10%  — assessed data-sharing willingness
 *
 * Returns null when no resiliency record exists.
 */
export function computeResiliency(s: Supplier): number | null {
  const r = s.resiliency;
  if (!r) return null;

  // Performance: derive from live OTIF + PPM data; use assessed override if stored
  let perf: number;
  if (r.performance != null) {
    perf = r.performance;
  } else {
    const ot = s.onTime ?? 90;
    const otScore = ot >= 98 ? 9.5 : ot >= 95 ? 8.0 : ot >= 92 ? 6.5 : ot >= 90 ? 5.5 : ot >= 85 ? 3.5 : 2.0;
    const ppm = s.qualityPPM ?? 300;
    const ppmScore = ppm <= 75 ? 9.5 : ppm <= 150 ? 8.0 : ppm <= 250 ? 6.5 : ppm <= 400 ? 5.0 : ppm <= 600 ? 3.5 : 2.0;
    perf = (otScore + ppmScore) / 2;
  }

  const overall =
    r.transparency * 0.10 +
    r.network      * 0.20 +
    r.continuity   * 0.25 +
    perf           * 0.30 +
    r.maturity     * 0.15;

  return +Math.min(10, Math.max(1, overall)).toFixed(2);
}

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

    // Quick ratio penalises more harshly than CR — illiquid inventory doesn't save you
    const qr = s.ratios.quickRatio;
    const qrR = qr == null ? crR : qr >= 1.5 ? 5 : qr >= 1.0 ? 20 : qr >= 0.8 ? 42 : qr >= 0.6 ? 65 : qr >= 0.4 ? 82 : 93;

    const de = s.ratios.debtToEquity;
    const deR = de <= 0.5 ? 5 : de <= 0.8 ? 18 : de <= 1.2 ? 38 : de <= 1.5 ? 58 : de <= 2.0 ? 75 : 90;

    const pm = s.ratios.netProfitMargin;
    const pmR = pm >= 0.15 ? 5 : pm >= 0.10 ? 18 : pm >= 0.07 ? 35 : pm >= 0.05 ? 55 : pm >= 0.0 ? 72 : 90;

    // Gross margin: early-warning signal of pricing/cost pressure upstream of net margin
    const gm = s.ratios.grossMargin;
    const gmR = gm == null ? pmR : gm >= 0.40 ? 5 : gm >= 0.28 ? 20 : gm >= 0.18 ? 40 : gm >= 0.10 ? 62 : gm >= 0.0 ? 78 : 92;

    // OCF margin: catches profit-without-cash (accruals divergence from cash generation)
    const ocf = s.ratios.operatingCashFlowMargin;
    const ocfR = ocf == null ? pmR : ocf >= 0.12 ? 5 : ocf >= 0.07 ? 20 : ocf >= 0.04 ? 40 : ocf >= 0.0 ? 65 : ocf >= -0.05 ? 82 : 93;

    // Liquidity: QR is more conservative than CR — weight it higher when available
    const liquidityR = qr != null ? crR * 0.40 + qrR * 0.60 : crR;

    // Profitability: average whichever margin metrics are present
    const profitParts = [pmR, ...(gm != null ? [gmR] : []), ...(ocf != null ? [ocfR] : [])];
    const profitR = profitParts.reduce((a, b) => a + b, 0) / profitParts.length;

    const finR = (liquidityR + deR + profitR) / 3;
    score += finR * 0.30;
    weight += 0.30;
  }

  // ── 2. Credit Risk (25%) ────────────────────────────────────────
  if (s.creditRisk) {
    const fr = s.creditRisk.friskScore;
    const frR = fr >= 9 ? 5 : fr >= 8 ? 15 : fr >= 7 ? 28 : fr >= 6 ? 44 : fr >= 5 ? 58 : fr >= 4 ? 70 : fr >= 3 ? 82 : 92;

    // Prefer Altman Z-derived insolvency probability when balance-sheet data is present;
    // fall back to the externally-attributed stored value
    const altman = computeAltmanZ(s);
    const ip = altman ? altman.insolvencyProbability : s.creditRisk.insolvencyProbability;
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
  const rScore = computeResiliency(s);
  if (rScore != null) {
    score += Math.min(100, ((10 - rScore) / 9) * 100) * 0.15;
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
  let f = 20; // default when no ratios
  if (s.ratios) {
    const r = s.ratios;
    // Liquidity: use quick ratio when available (more conservative)
    const liq = r.quickRatio != null
      ? (r.quickRatio < 0.6 ? 28 : r.quickRatio < 0.8 ? 20 : r.currentRatio < 1 ? 18 : 10)
      : (r.currentRatio < 1 ? 25 : 10);
    const lev = r.debtToEquity > 1.5 ? 22 : 8;
    // Gross margin as primary margin signal; fall back to net margin
    const margin = r.grossMargin != null
      ? (r.grossMargin < 0.10 ? 24 : r.grossMargin < 0.18 ? 18 : r.grossMargin < 0.28 ? 10 : 5)
      : (r.netProfitMargin < 0.05 ? 20 : 5);
    f = liq + lev + margin;
  }
  const onTimePenalty = (s.onTime ?? 100) < 90 ? 18 : 5;
  const ppmPenalty = (s.qualityPPM ?? 0) > 300 ? 18 : 5;
  const op = (onTimePenalty + ppmPenalty) / 2;
  const dep = (s.exposure ?? 0) > 10 ? 22 : 9;
  return Math.min(95, Math.round(f * 0.40 + op * 0.30 + dep * 0.30));
}

// ── Monte Carlo helpers ───────────────────────────────────────────────────────

// Box-Muller normal sample
function randn(mean: number, sd: number): number {
  const u = Math.max(1e-10, Math.random());
  const v = Math.random();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Triangular distribution draw (inverse CDF)
function triangular(min: number, mode: number, max: number): number {
  const u = Math.random();
  const fc = (mode - min) / (max - min);
  if (u < fc) return min + Math.sqrt(u * (max - min) * (mode - min));
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode));
}

// Population standard deviation of an array
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = arr.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

// Per-trial DPS computed from drawn inputs — mirrors calcDPS structure
function trialDPS(
  cr: number, qr: number | null, de: number, gm: number | null, pm: number,
  onTime: number, ppm: number, exposure: number,
): number {
  const liq = qr != null
    ? (qr < 0.6 ? 28 : qr < 0.8 ? 20 : cr < 1 ? 18 : 10)
    : (cr < 1 ? 25 : 10);
  const lev = de > 1.5 ? 22 : 8;
  const margin = gm != null
    ? (gm < 0.10 ? 24 : gm < 0.18 ? 18 : gm < 0.28 ? 10 : 5)
    : (pm < 0.05 ? 20 : 5);
  const f = liq + lev + margin;
  const op = ((onTime < 90 ? 18 : 5) + (ppm > 300 ? 18 : 5)) / 2;
  const dep = exposure > 10 ? 22 : 9;
  return Math.min(95, Math.max(1, f * 0.40 + op * 0.30 + dep * 0.30));
}

/**
 * Monte Carlo disruption simulation — 5,000 iterations by default.
 *
 * Each iteration draws stochastic inputs from distributions parameterised by
 * the supplier's actual trend data, recomputes DPS from those drawn values,
 * then runs a Bernoulli disruption trial at that per-iteration probability.
 *
 * Input distributions:
 *   currentRatio            Normal(μ, σ)  σ derived from CCC trend volatility
 *   quickRatio              Normal(μ, σ)  σ proportional to CR σ (more conservative liquidity)
 *   debtToEquity            Normal(μ, σ)  σ derived from Net Debt/EBITDA trend volatility
 *   grossMargin             Normal(μ, σ)  σ derived from grossMarginTrend when available
 *   netProfitMargin         Normal(μ, σ)  σ derived from revenue growth signal
 *   onTime                  Normal(μ, 3.5%) fixed operational variance
 *   qualityPPM              Normal(μ, 20% of μ) fixed quality variance
 *
 * Exposure impact (when disrupted):
 *   Triangular(0.4x, 1.0x, ttrFactor·x) — mode at full exposure,
 *   max scaled by recovery-time-to-survive ratio if recovery profile provided.
 */
export function runMC(s: Supplier, iter = 5000, recoveryProfile?: RecoveryProfile): MCResult {
  const fh = s.financialHealth;

  // Current point estimates (means)
  const cr  = s.ratios?.currentRatio              ?? 1.2;
  const qr  = s.ratios?.quickRatio                ?? null;
  const de  = s.ratios?.debtToEquity              ?? 1.0;
  const gm  = s.ratios?.grossMargin               ?? null;
  const pm  = s.ratios?.netProfitMargin           ?? 0.05;
  const ot  = s.onTime                            ?? 90;
  const ppm = s.qualityPPM                        ?? 200;
  const exp = s.exposure                          ?? 5;

  // Volatility (σ) derived from trend data — more data = tighter, well-calibrated σ
  // CCC trend captures working capital instability → proxy for CR/QR volatility
  const σCR = fh?.cccTrend?.length
    ? Math.max(0.05, (stdDev(fh.cccTrend) / Math.max(1, fh.cccTrend[fh.cccTrend.length - 1])) * cr * 0.55)
    : cr * 0.10;
  // QR is more volatile than CR (excludes inventory buffer), so scale up slightly
  const σQR = qr != null ? σCR * 1.2 : 0;

  // Net Debt/EBITDA spread → leverage trajectory uncertainty → DE volatility
  const σDE = fh?.netDebtEbitda?.length
    ? Math.max(0.08, stdDev(fh.netDebtEbitda) * 0.13)
    : de * 0.12;

  // Gross margin trend volatility — direct signal of pricing/cost spread
  const σGM = fh?.grossMarginTrend?.length
    ? Math.max(0.01, stdDev(fh.grossMarginTrend) * 1.2)
    : gm != null ? Math.max(0.02, Math.abs(fh?.revenueGrowthYoY ?? 0) * 0.3 + 0.015) : 0;

  // Revenue growth magnitude → uncertainty in future net margin
  const σPM = fh
    ? Math.max(0.012, Math.abs(fh.revenueGrowthYoY ?? 0) * 0.45 + 0.01)
    : 0.018;

  // Exposure impact upper bound — scaled by how long recovery takes vs. buffer
  const ttrFactor = recoveryProfile
    ? Math.min(3.5, (recoveryProfile.timeToRecover / Math.max(1, recoveryProfile.inventoryBufferDays)) * 0.65)
    : 1.8;

  // ── Simulation loop ───────────────────────────────────────────────────────
  let disruptions = 0;
  const impacts: number[] = [];

  for (let i = 0; i < iter; i++) {
    // Draw inputs from their distributions
    const drawnCR  = Math.max(0.2,  Math.min(4.0,   randn(cr,  σCR)));
    const drawnQR  = qr != null ? Math.max(0.1, Math.min(3.5, randn(qr, σQR))) : null;
    const drawnDE  = Math.max(0,    Math.min(5.0,   randn(de,  σDE)));
    const drawnGM  = gm != null ? Math.max(-0.2, Math.min(0.9, randn(gm, σGM))) : null;
    const drawnPM  = Math.max(-0.3, Math.min(0.5,   randn(pm,  σPM)));
    const drawnOT  = Math.max(50,   Math.min(100,   randn(ot,  3.5)));
    const drawnPPM = Math.max(0,    Math.min(2000,  randn(ppm, ppm * 0.20)));

    // Per-trial disruption probability from re-computed DPS
    const p = trialDPS(drawnCR, drawnQR, drawnDE, drawnGM, drawnPM, drawnOT, drawnPPM, exp) / 100;

    if (Math.random() < p) {
      disruptions++;
      // Financial impact: triangular — partial disruption to extended recovery scenario
      impacts.push(triangular(exp * 0.4, exp, exp * ttrFactor));
    }
  }

  impacts.sort((a, b) => a - b);
  const mean = impacts.length
    ? impacts.reduce((a, b) => a + b, 0) / impacts.length
    : 0;
  const p95 = impacts.length
    ? impacts[Math.floor(impacts.length * 0.95)]
    : 0;

  return {
    probability:      Math.round((disruptions / iter) * 100),
    expectedExposure: mean.toFixed(1),
    stress95:         p95.toFixed(1),
  };
}

export function topDrivers(s: Supplier): string[] {
  const d: string[] = [];
  if ((s.ratios?.currentRatio ?? 2) < 1) d.push("Liquidity tightness");
  if ((s.ratios?.debtToEquity ?? 0) > 1.5) d.push("High leverage");
  if ((s.onTime ?? 100) < 90) d.push("Delivery volatility");
  if ((s.qualityPPM ?? 0) > 300) d.push("Quality instability");
  if ((s.exposure ?? 0) > 10) d.push("High dependency");
  if (computeLeadTimeDrift(s)?.worsening) d.push("Lead time creep");
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
