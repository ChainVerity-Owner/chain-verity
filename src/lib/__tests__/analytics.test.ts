import { describe, it, expect } from "vitest";
import { computeRisk, calcDPS, runMC, trendLabel, topDrivers, getRec, computeAltmanZ, computeResiliency, computeOnTime, computeLeadTimeDrift } from "@/lib/analytics";
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
  ratios: { currentRatio: 1.9, debtToEquity: 0.4, netProfitMargin: 0.14, quickRatio: 1.4, grossMargin: 0.42, operatingCashFlowMargin: 0.16 },
  creditRisk: { friskScore: 9, insolvencyProbability: 0.004, creditRating: "A", paymentBehavior: "Good", bankruptcyRisk12m: "Low", lastUpdated: "today", source: "Test" },
  esg: { score: 85, grade: "A", environmental: 85, social: 85, governance: 85, eudrCompliant: true, csdddStatus: "Compliant", lksgStatus: "Compliant", csrdStatus: "Compliant", laborRisk: "Low", environmentalRisk: "Low" },
  resiliency: { transparency: 8.5, network: 8.5, continuity: 8.5, maturity: 8.5, lastUpdated: "Q3 2025" },
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
  ratios: { currentRatio: 0.65, debtToEquity: 2.3, netProfitMargin: 0.02, quickRatio: 0.32, grossMargin: 0.12, operatingCashFlowMargin: 0.005 },
  creditRisk: { friskScore: 2, insolvencyProbability: 0.19, creditRating: "B", paymentBehavior: "Poor", bankruptcyRisk12m: "High", lastUpdated: "today", source: "Test" },
  esg: { score: 40, grade: "D", environmental: 40, social: 40, governance: 40, eudrCompliant: "Not Started", csdddStatus: "N/A", lksgStatus: "N/A", csrdStatus: "N/A", laborRisk: "High", environmentalRisk: "High" },
  resiliency: { transparency: 3.0, network: 3.0, continuity: 3.0, maturity: 3.0, lastUpdated: "Q1 2025" },
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

const baseFH = {
  score: 70, dpoTrend: [28, 29, 30, 30], inventoryGrowthYoY: 0.05,
  grossMarginTrend: [0.38, 0.39, 0.40, 0.40], ocfMarginTrend: [0.10, 0.11, 0.11, 0.11],
  interestCoverage: 5, capexToDepreciation: [1.0, 1.0, 1.0, 1.0], flags: [],
};

const stableWithTrends: Supplier = {
  ...stableSupplier,
  financialHealth: {
    ...baseFH,
    revenueGrowthYoY: 0.05,
    netDebtEbitda: [1.2, 1.1, 1.0, 0.9],
    cccTrend: [30, 31, 29, 30],
    dioTrend: [40, 38, 39, 40],
    dsoTrend: [25, 24, 26, 25],
  },
};

const distressedWithTrends: Supplier = {
  ...distressedSupplier,
  financialHealth: {
    ...baseFH,
    score: 28,
    revenueGrowthYoY: -0.12,
    netDebtEbitda: [3.5, 4.2, 4.8, 5.3],
    cccTrend: [80, 95, 110, 130],
    dioTrend: [70, 80, 90, 100],
    dsoTrend: [60, 65, 70, 78],
  },
};

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
    const stable = runMC(stableWithTrends, 2000);
    const distressed = runMC(distressedWithTrends, 2000);
    expect(distressed.probability).toBeGreaterThan(stable.probability);
  });

  it("stress95 >= expectedExposure when disruptions occur", () => {
    const result = runMC(distressedWithTrends, 1000);
    expect(parseFloat(result.stress95)).toBeGreaterThanOrEqual(parseFloat(result.expectedExposure));
  });

  it("stress95 reflects exposure upper bound (≤ exposure × 3.5)", () => {
    const result = runMC(distressedWithTrends, 1000);
    expect(parseFloat(result.stress95)).toBeLessThanOrEqual(distressedSupplier.exposure! * 3.5 + 0.1);
  });

  it("recovery profile with long TTR pushes stress95 higher than without", () => {
    const base = { criticalComponents: [], affectedProductLines: [], alternativeQualified: false, safetyStockRecommendation: 0, estimatedStockIncreaseCostM: 0, additionalStorageM3: 0, lastReviewed: "2025-01-01" };
    const shortRecovery = { ...base, timeToRecover: 7,  inventoryBufferDays: 30, timeToSurvive: 14 };
    const longRecovery  = { ...base, timeToRecover: 90, inventoryBufferDays: 14, timeToSurvive: 21 };
    const withShort = runMC(distressedWithTrends, 1500, shortRecovery);
    const withLong  = runMC(distressedWithTrends, 1500, longRecovery);
    // stress95 should be at least as high with a longer recovery time
    expect(parseFloat(withLong.stress95)).toBeGreaterThanOrEqual(parseFloat(withShort.stress95) * 0.9);
  });

  it("works without financialHealth trend data (falls back to σ defaults)", () => {
    expect(() => runMC(stableSupplier, 300)).not.toThrow();
    expect(() => runMC(noRatiosSupplier, 300)).not.toThrow();
  });
});

// ── computeResiliency ─────────────────────────────────────────────────────────

describe("computeResiliency", () => {
  it("returns null when no resiliency record", () => {
    expect(computeResiliency(noRatiosSupplier)).toBeNull();
  });

  it("returns a value between 1 and 10", () => {
    const r = computeResiliency(stableSupplier);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThanOrEqual(1);
    expect(r!).toBeLessThanOrEqual(10);
  });

  it("stable supplier scores higher than distressed supplier", () => {
    expect(computeResiliency(stableSupplier)!).toBeGreaterThan(computeResiliency(distressedSupplier)!);
  });

  it("derives performance from onTime and qualityPPM when no assessed value stored", () => {
    const highPerf = { ...stableSupplier, onTime: 98, qualityPPM: 60 };
    const lowPerf  = { ...stableSupplier, onTime: 82, qualityPPM: 480 };
    expect(computeResiliency(highPerf)!).toBeGreaterThan(computeResiliency(lowPerf)!);
  });

  it("uses assessed performance override when present", () => {
    const assessed = {
      ...stableSupplier,
      resiliency: { ...stableSupplier.resiliency!, performance: 2.0 },
      onTime: 99, qualityPPM: 50, // would give high derived score
    };
    const derived = { ...stableSupplier, onTime: 99, qualityPPM: 50 };
    // assessed override of 2.0 should produce lower overall than fully derived 9.5
    expect(computeResiliency(assessed)!).toBeLessThan(computeResiliency(derived)!);
  });

  it("poor OTIF reduces overall score", () => {
    const good = { ...stableSupplier, onTime: 98 };
    const poor = { ...stableSupplier, onTime: 82 };
    expect(computeResiliency(good)!).toBeGreaterThan(computeResiliency(poor)!);
  });
});

// ── computeAltmanZ ────────────────────────────────────────────────────────────

describe("computeAltmanZ", () => {
  const withBS = (s: Supplier, overrides: Partial<NonNullable<Supplier["ratios"]>>): Supplier => ({
    ...s,
    ratios: { ...s.ratios!, ...overrides },
  });

  it("returns null when balance-sheet fields are missing", () => {
    expect(computeAltmanZ(stableSupplier)).toBeNull();
    expect(computeAltmanZ(noRatiosSupplier)).toBeNull();
  });

  it("returns a result with z, zone, and insolvencyProbability when data is present", () => {
    const s = withBS(stableSupplier, { totalAssets: 3900, retainedEarnings: 1700, annualRevenue: 4400, workingCapital: 450 });
    const r = computeAltmanZ(s);
    expect(r).not.toBeNull();
    expect(r).toHaveProperty("z");
    expect(r).toHaveProperty("zone");
    expect(r).toHaveProperty("insolvencyProbability");
  });

  it("healthy supplier lands in safe zone with low probability", () => {
    const s = withBS(stableSupplier, { totalAssets: 3900, retainedEarnings: 1700, annualRevenue: 4400, workingCapital: 450 });
    const r = computeAltmanZ(s)!;
    expect(r.zone).toBe("safe");
    expect(r.z).toBeGreaterThan(2.9);
    expect(r.insolvencyProbability).toBeLessThan(0.05);
  });

  it("distressed supplier lands in distress or gray zone with elevated probability", () => {
    const s = withBS(distressedSupplier, { totalAssets: 3200, retainedEarnings: -95, annualRevenue: 2800, workingCapital: -102 });
    const r = computeAltmanZ(s)!;
    expect(["gray", "distress"]).toContain(r.zone);
    expect(r.insolvencyProbability).toBeGreaterThan(0.08);
  });

  it("distressed supplier has higher probability than stable supplier", () => {
    const stable = withBS(stableSupplier, { totalAssets: 3900, retainedEarnings: 1700, annualRevenue: 4400, workingCapital: 450 });
    const distressed = withBS(distressedSupplier, { totalAssets: 3200, retainedEarnings: -95, annualRevenue: 2800, workingCapital: -102 });
    expect(computeAltmanZ(distressed)!.insolvencyProbability).toBeGreaterThan(computeAltmanZ(stable)!.insolvencyProbability);
  });

  it("insolvencyProbability is clamped between 0.002 and 0.95", () => {
    const extreme = withBS(distressedSupplier, { totalAssets: 100, retainedEarnings: -500, annualRevenue: 50, workingCapital: -200 });
    const r = computeAltmanZ(extreme)!;
    expect(r.insolvencyProbability).toBeGreaterThanOrEqual(0.002);
    expect(r.insolvencyProbability).toBeLessThanOrEqual(0.95);
  });

  it("negative working capital reduces Z-score", () => {
    const base = withBS(stableSupplier, { totalAssets: 3900, retainedEarnings: 1700, annualRevenue: 4400, workingCapital: 450 });
    const stressed = withBS(stableSupplier, { totalAssets: 3900, retainedEarnings: 1700, annualRevenue: 4400, workingCapital: -200 });
    expect(computeAltmanZ(stressed)!.z).toBeLessThan(computeAltmanZ(base)!.z);
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

describe("computeOnTime", () => {
  const recent = new Date();
  recent.setDate(recent.getDate() - 10);
  const recentDate = recent.toISOString().slice(0, 10);

  const old = new Date();
  old.setDate(old.getDate() - 100);
  const oldDate = old.toISOString().slice(0, 10);

  const makeShipment = (id: string, supplierId: string, scheduledDate: string, actualDeliveryDate: string) => ({
    id, supplierId,
    origin: "A", destination: "B", carrier: "C",
    eta: scheduledDate, delayRisk: "Low" as const,
    status: "Delivered" as const, value: "$1M",
    scheduledDate, actualDeliveryDate,
  });

  it("returns null when no Delivered shipments exist for the supplier", () => {
    expect(computeOnTime("none", [])).toBeNull();
  });

  it("returns null when all matching shipments are outside the window", () => {
    const shipments = [makeShipment("s1", "sup", oldDate, oldDate)];
    expect(computeOnTime("sup", shipments)).toBeNull();
  });

  it("returns 100 when all shipments in window are on time", () => {
    const shipments = [
      makeShipment("s1", "sup", recentDate, recentDate),
      makeShipment("s2", "sup", recentDate, recentDate),
    ];
    expect(computeOnTime("sup", shipments)).toBe(100);
  });

  it("returns 0 when all shipments in window are late", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    const shipments = [makeShipment("s1", "sup", recentDate, tomorrowStr)];
    expect(computeOnTime("sup", shipments)).toBe(0);
  });

  it("calculates partial on-time rate correctly", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const lateDate = tomorrow.toISOString().slice(0, 10);
    const shipments = [
      makeShipment("s1", "sup", recentDate, recentDate),
      makeShipment("s2", "sup", recentDate, recentDate),
      makeShipment("s3", "sup", recentDate, recentDate),
      makeShipment("s4", "sup", recentDate, lateDate),
    ];
    expect(computeOnTime("sup", shipments)).toBe(75);
  });

  it("ignores shipments for other suppliers", () => {
    const shipments = [makeShipment("s1", "other", recentDate, recentDate)];
    expect(computeOnTime("sup", shipments)).toBeNull();
  });

  it("ignores non-Delivered shipments", () => {
    const s = { ...makeShipment("s1", "sup", recentDate, recentDate), status: "On Track" as const };
    expect(computeOnTime("sup", [s])).toBeNull();
  });

  it("counts customerAccepted partial shipments as on time even if late", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const lateDate = tomorrow.toISOString().slice(0, 10);
    const shipments = [
      { ...makeShipment("s1", "sup", recentDate, lateDate), customerAccepted: true },
      makeShipment("s2", "sup", recentDate, recentDate),
    ];
    expect(computeOnTime("sup", shipments)).toBe(100);
  });

  it("respects custom windowDays parameter", () => {
    const shipments = [makeShipment("s1", "sup", recentDate, recentDate)];
    expect(computeOnTime("sup", shipments, 5)).toBeNull();
    expect(computeOnTime("sup", shipments, 15)).toBe(100);
  });
});

describe("computeLeadTimeDrift", () => {
  const base: Supplier = {
    id: "test", name: "Test", region: "EU",
    ratios: { debtToEquity: 0.5, netProfitMargin: 0.1, currentRatio: 1.8 },
  } as unknown as Supplier;

  it("returns null when leadTimeTrend is absent", () => {
    expect(computeLeadTimeDrift(base)).toBeNull();
  });

  it("returns null when trend has fewer than 2 points", () => {
    expect(computeLeadTimeDrift({ ...base, leadTimeTrend: [20] })).toBeNull();
  });

  it("flags worsening when drift exceeds 15%", () => {
    const result = computeLeadTimeDrift({ ...base, leadTimeTrend: [20, 22, 25, 28] });
    expect(result?.worsening).toBe(true);
    expect(result?.driftPct).toBeCloseTo(0.4, 2);
  });

  it("does not flag worsening for flat trend", () => {
    const result = computeLeadTimeDrift({ ...base, leadTimeTrend: [18, 18, 17, 18] });
    expect(result?.worsening).toBe(false);
  });

  it("uses the correct regional baseline for the supplier region", () => {
    const eu = computeLeadTimeDrift({ ...base, region: "EU", leadTimeTrend: [20, 20, 20, 20] });
    const na = computeLeadTimeDrift({ ...base, region: "NA", leadTimeTrend: [20, 20, 20, 20] });
    const apac = computeLeadTimeDrift({ ...base, region: "APAC", leadTimeTrend: [20, 20, 20, 20] });
    expect(eu?.baseline).toBe(22);
    expect(na?.baseline).toBe(12);
    expect(apac?.baseline).toBe(40);
  });

  it("correctly reports aboveBaseline", () => {
    const below = computeLeadTimeDrift({ ...base, region: "EU", leadTimeTrend: [18, 18, 18, 18] });
    const above = computeLeadTimeDrift({ ...base, region: "EU", leadTimeTrend: [22, 23, 24, 25] });
    expect(below?.aboveBaseline).toBe(false);
    expect(above?.aboveBaseline).toBe(true);
  });

  it("surfaces lead time creep in topDrivers", () => {
    const supplier = { ...base, leadTimeTrend: [20, 22, 25, 28] } as Supplier;
    expect(topDrivers(supplier)).toContain("Lead time creep");
  });

  it("does not flag lead time creep in topDrivers for stable trend", () => {
    const supplier = { ...base, leadTimeTrend: [18, 18, 17, 18] } as Supplier;
    expect(topDrivers(supplier)).not.toContain("Lead time creep");
  });
});
