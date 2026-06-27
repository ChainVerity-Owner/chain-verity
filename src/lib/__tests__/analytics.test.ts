import { describe, it, expect } from "vitest";
import { computeRisk, calcDPS, runMC, trendLabel, topDrivers, getRec } from "@/lib/analytics";
import type { Supplier, SeriesPoint } from "@/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const stableSupplier: Supplier = {
  id: "stable",
  name: "Stable Co",
  countryCode: "DE",
  region: "EU",
  tier: 1,
  category: "Components",
  riskState: "STABLE",
  spend: 5,
  exposure: 2,
  risk: 0,
  onTime: 98,
  qualityPPM: 75,
  ratios: { currentRatio: 1.9, debtToEquity: 0.4, netProfitMargin: 0.14 },
  creditRisk: { friskScore: 9, insolvencyProbability: 0.004, creditRating: "A", paymentBehavior: "Good", bankruptcyRisk12m: "Low", lastUpdated: "today", source: "Test" },
  esg: { score: 85, grade: "A", environmental: 85, social: 85, governance: 85, eudrCompliant: true, csdddStatus: "Compliant", lksgStatus: "Compliant", csrdStatus: "Compliant", laborRisk: "Low", environmentalRisk: "Low" },
  resiliency: { overall: 8.5, transparency: 8.5, network: 8.5, continuity: 8.5, performance: 8.5, maturity: 8.5, lastUpdated: "Q3 2025" },
  alerts: [],
  riskHistory: [],
  data: { updatedLabel: "today", confidence: "HIGH" },
};

const distressedSupplier: Supplier = {
  id: "distressed",
  name: "Distressed Ltd",
  countryCode: "IT",
  region: "EU",
  tier: 1,
  category: "Components",
  riskState: "ESCALATED",
  spend: 20,
  exposure: 12,
  risk: 0,
  onTime: 82,
  qualityPPM: 420,
  ratios: { currentRatio: 0.65, debtToEquity: 2.3, netProfitMargin: 0.02 },
  creditRisk: { friskScore: 2, insolvencyProbability: 0.19, creditRating: "B", paymentBehavior: "Poor", bankruptcyRisk12m: "High", lastUpdated: "today", source: "Test" },
  esg: { score: 40, grade: "D", environmental: 40, social: 40, governance: 40, eudrCompliant: "Not Started", csdddStatus: "N/A", lksgStatus: "N/A", csrdStatus: "N/A", laborRisk: "High", environmentalRisk: "High" },
  resiliency: { overall: 3.0, transparency: 3.0, network: 3.0, continuity: 3.0, performance: 3.0, maturity: 3.0, lastUpdated: "Q1 2025" },
  alerts: [],
  riskHistory: [],
  data: { updatedLabel: "today", confidence: "LOW" },
};

const noRatiosSupplier: Supplier = {
  id: "noratios",
  name: "No Ratios Inc",
  countryCode: "CN",
  region: "APAC",
  tier: 2,
  category: "Electronics",
  riskState: "STABLE",
  spend: 3,
  exposure: 1,
  risk: 0,
  onTime: 95,
  qualityPPM: 120,
  ratios: undefined,
  alerts: [],
  riskHistory: [],
  data: { updatedLabel: "today", confidence: "MEDIUM" },
};

// ── computeRisk ───────────────────────────────────────────────────────────────

describe("computeRisk", () => {
  it("returns a score in the clamped 5–99 range", () => {
    expect(computeRisk(stableSupplier)).toBeGreaterThanOrEqual(5);
    expect(computeRisk(stableSupplier)).toBeLessThanOrEqual(99);
    expect(computeRisk(distressedSupplier)).toBeGreaterThanOrEqual(5);
    expect(computeRisk(distressedSupplier)).toBeLessThanOrEqual(99);
  });

  it("stable supplier scores lower than distressed supplier", () => {
    expect(computeRisk(stableSupplier)).toBeLessThan(computeRisk(distressedSupplier));
  });

  it("distressed supplier scores above 70", () => {
    expect(computeRisk(distressedSupplier)).toBeGreaterThan(70);
  });

  it("stable supplier scores below 30", () => {
    expect(computeRisk(stableSupplier)).toBeLessThan(30);
  });

  it("handles missing ratios without throwing", () => {
    expect(() => computeRisk(noRatiosSupplier)).not.toThrow();
  });

  it("returns integer scores", () => {
    const score = computeRisk(stableSupplier);
    expect(Number.isInteger(score)).toBe(true);
  });

  it("applies concentration premium for high exposure", () => {
    const lowExposure = { ...stableSupplier, exposure: 1 };
    const highExposure = { ...stableSupplier, exposure: 9 };
    expect(computeRisk(highExposure)).toBeGreaterThan(computeRisk(lowExposure));
  });

  it("applies spend premium for high spend", () => {
    const lowSpend = { ...stableSupplier, spend: 5 };
    const highSpend = { ...stableSupplier, spend: 18 };
    expect(computeRisk(highSpend)).toBeGreaterThan(computeRisk(lowSpend));
  });

  it("is deterministic — same inputs produce same score", () => {
    expect(computeRisk(stableSupplier)).toBe(computeRisk(stableSupplier));
    expect(computeRisk(distressedSupplier)).toBe(computeRisk(distressedSupplier));
  });
});

// ── calcDPS ───────────────────────────────────────────────────────────────────

describe("calcDPS", () => {
  it("returns a value between 0 and 95", () => {
    expect(calcDPS(stableSupplier)).toBeGreaterThanOrEqual(0);
    expect(calcDPS(stableSupplier)).toBeLessThanOrEqual(95);
    expect(calcDPS(distressedSupplier)).toBeGreaterThanOrEqual(0);
    expect(calcDPS(distressedSupplier)).toBeLessThanOrEqual(95);
  });

  it("distressed supplier has higher DPS than stable", () => {
    expect(calcDPS(distressedSupplier)).toBeGreaterThan(calcDPS(stableSupplier));
  });

  it("handles missing ratios", () => {
    expect(() => calcDPS(noRatiosSupplier)).not.toThrow();
  });

  it("high exposure increases DPS", () => {
    const low = { ...stableSupplier, exposure: 1 };
    const high = { ...stableSupplier, exposure: 15 };
    expect(calcDPS(high)).toBeGreaterThan(calcDPS(low));
  });

  it("poor on-time delivery increases DPS", () => {
    const good = { ...stableSupplier, onTime: 98 };
    const bad = { ...stableSupplier, onTime: 80 };
    expect(calcDPS(bad)).toBeGreaterThan(calcDPS(good));
  });
});

// ── runMC ─────────────────────────────────────────────────────────────────────

describe("runMC", () => {
  it("returns probability, expectedExposure, and stress95", () => {
    const result = runMC(stableSupplier, 500);
    expect(result).toHaveProperty("probability");
    expect(result).toHaveProperty("expectedExposure");
    expect(result).toHaveProperty("stress95");
  });

  it("probability is between 0 and 100", () => {
    const result = runMC(distressedSupplier, 500);
    expect(result.probability).toBeGreaterThanOrEqual(0);
    expect(result.probability).toBeLessThanOrEqual(100);
  });

  it("distressed supplier has higher disruption probability than stable", () => {
    const stable = runMC(stableSupplier, 1000);
    const distressed = runMC(distressedSupplier, 1000);
    expect(distressed.probability).toBeGreaterThan(stable.probability);
  });

  it("stress95 >= expectedExposure when disruptions occur", () => {
    const result = runMC(distressedSupplier, 500);
    expect(parseFloat(result.stress95)).toBeGreaterThanOrEqual(parseFloat(result.expectedExposure));
  });
});

// ── trendLabel ────────────────────────────────────────────────────────────────

describe("trendLabel", () => {
  it("returns Stable for flat series", () => {
    const series: SeriesPoint[] = [
      { label: "Q1", value: 1.5 },
      { label: "Q2", value: 1.52 },
    ];
    expect(trendLabel(series)).toBe("Stable");
  });

  it("returns Improving when higher is better and value rises", () => {
    const series: SeriesPoint[] = [
      { label: "Q1", value: 1.0 },
      { label: "Q4", value: 1.5 },
    ];
    expect(trendLabel(series, true)).toBe("Improving");
  });

  it("returns Deteriorating when higher is better and value falls", () => {
    const series: SeriesPoint[] = [
      { label: "Q1", value: 1.5 },
      { label: "Q4", value: 1.0 },
    ];
    expect(trendLabel(series, true)).toBe("Deteriorating");
  });

  it("inverts direction when higher is bad (hi=false)", () => {
    const series: SeriesPoint[] = [
      { label: "Q1", value: 1.0 },
      { label: "Q4", value: 1.5 },
    ];
    expect(trendLabel(series, false)).toBe("Deteriorating");
  });

  it("handles short or missing series gracefully", () => {
    expect(trendLabel([])).toBe("Stable");
    expect(trendLabel([{ label: "Q1", value: 1.0 }])).toBe("Stable");
  });
});

// ── topDrivers ────────────────────────────────────────────────────────────────

describe("topDrivers", () => {
  it("returns stable indicators for a healthy supplier", () => {
    const drivers = topDrivers(stableSupplier);
    expect(drivers).toEqual(["Stable indicators"]);
  });

  it("identifies liquidity tightness", () => {
    const s = { ...stableSupplier, ratios: { ...stableSupplier.ratios!, currentRatio: 0.8 } };
    expect(topDrivers(s)).toContain("Liquidity tightness");
  });

  it("identifies high leverage", () => {
    const s = { ...stableSupplier, ratios: { ...stableSupplier.ratios!, debtToEquity: 2.0 } };
    expect(topDrivers(s)).toContain("High leverage");
  });

  it("identifies delivery volatility", () => {
    const s = { ...stableSupplier, onTime: 85 };
    expect(topDrivers(s)).toContain("Delivery volatility");
  });

  it("returns at most 3 drivers", () => {
    const drivers = topDrivers(distressedSupplier);
    expect(drivers.length).toBeLessThanOrEqual(3);
  });
});

// ── getRec ────────────────────────────────────────────────────────────────────

describe("getRec", () => {
  it("returns no change recommendation for stable supplier", () => {
    const rec = getRec(stableSupplier, {});
    expect(rec.action).toBe("No recommended changes");
  });

  it("escalates when simulated escalation flag is set", () => {
    const rec = getRec(stableSupplier, { stable: true });
    expect(rec.action).toBe("Find secondary source");
  });

  it("escalates for high-risk distressed supplier", () => {
    const highRisk = { ...distressedSupplier, risk: 75 };
    const rec = getRec(highRisk, {});
    expect(rec.action).toBe("Find secondary source");
  });

  it("includes guidance steps for every recommendation", () => {
    const rec = getRec(distressedSupplier, {});
    expect(rec.guidance.length).toBeGreaterThan(0);
  });

  it("returns a reason string for every recommendation", () => {
    const stable = getRec(stableSupplier, {});
    const distressed = getRec(distressedSupplier, {});
    expect(typeof stable.reason).toBe("string");
    expect(typeof distressed.reason).toBe("string");
  });
});
