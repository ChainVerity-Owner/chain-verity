import { RecoveryProfile, Certification, ProductLine, CommodityPrice, Assessment, IndustryBenchmark, DataFeed } from "@/types";

// ── Recovery Profiles ─────────────────────────────────────────────────────────
export const RECOVERY_PROFILES: Record<string, RecoveryProfile> = {
  sit: { inventoryBufferDays: 18, timeToSurvive: 18, timeToRecover: 90, criticalComponents: ["Gas Control Valve GCV-2200", "Thermocouple TC-44", "SIT Gas Valve Block"], affectedProductLines: ["Greenstar 4 Life", "Greenstar 8000 Life"], alternativeQualified: false, safetyStockRecommendation: 45, lastReviewed: "Oct 2025" },
  ebm: { inventoryBufferDays: 45, timeToSurvive: 45, timeToRecover: 120, criticalComponents: ["Flue Fan FF-3000", "Variable Speed Fan VSF-2", "Air Pressure Switch APS-14"], affectedProductLines: ["Greenstar 4 Life", "Greenstar 8000 Life", "Greenwave Heat Pump"], alternativeQualified: false, safetyStockRecommendation: 60, lastReviewed: "Sep 2025" },
  aal: { inventoryBufferDays: 22, timeToSurvive: 22, timeToRecover: 75, criticalComponents: ["Flow Control Valve FCV-110", "Brass Manifold BM-44", "Pressure Regulator PR-22"], affectedProductLines: ["Greenstar 4 Life", "Greenwave Heat Pump"], alternativeQualified: false, safetyStockRecommendation: 35, lastReviewed: "Oct 2025" },
  gru: { inventoryBufferDays: 60, timeToSurvive: 60, timeToRecover: 90, criticalComponents: ["Circulation Pump UP15-14", "Pump Head Assembly PHA-3"], affectedProductLines: ["Greenstar 4 Life", "Greenstar 8000 Life"], alternativeQualified: true, safetyStockRecommendation: 45, lastReviewed: "Aug 2025" },
  dan: { inventoryBufferDays: 35, timeToSurvive: 35, timeToRecover: 60, criticalComponents: ["3-Port Zone Valve ZV-3", "Motorised Valve MV-22", "DHW Valve Assembly"], affectedProductLines: ["Greenstar 8000 Life", "Greenwave Heat Pump"], alternativeQualified: true, safetyStockRecommendation: 30, lastReviewed: "Sep 2025" },
  gfp: { inventoryBufferDays: 12, timeToSurvive: 12, timeToRecover: 45, criticalComponents: ["Stainless Pipe Fitting PF-220", "Compression Fitting CF-18", "Threaded Elbow TE-15"], affectedProductLines: ["Greenstar 4 Life", "Greenstar 8000 Life", "Greenwave Heat Pump"], alternativeQualified: false, safetyStockRecommendation: 30, lastReviewed: "Oct 2025" },
  dbs: { inventoryBufferDays: 7, timeToSurvive: 7, timeToRecover: 14, criticalComponents: ["EU-UK Freight Lanes", "Customs Brokerage", "Cross-Channel Logistics"], affectedProductLines: ["All product lines"], alternativeQualified: true, safetyStockRecommendation: 14, lastReviewed: "Oct 2025" },
  sen: { inventoryBufferDays: 28, timeToSurvive: 28, timeToRecover: 55, criticalComponents: ["Flame Sensor FS-44", "Pressure Sensor PS-12", "Temperature Sensor TS-88"], affectedProductLines: ["Greenstar 4 Life", "Greenstar 8000 Life"], alternativeQualified: false, safetyStockRecommendation: 40, lastReviewed: "Sep 2025" },
};

export const RECOVERY_PROFILES_US: Record<string, RecoveryProfile> = {
  flx: { inventoryBufferDays: 22, timeToSurvive: 22, timeToRecover: 120, criticalComponents: ["Control Board CB-3100", "Power Module PM-14", "PCB Sub-Assembly FLX-PCB-44"], affectedProductLines: ["ProControl 2000", "SensorSuite Platform"], alternativeQualified: false, safetyStockRecommendation: 45, lastReviewed: "Oct 2025" },
  zhp: { inventoryBufferDays: 14, timeToSurvive: 14, timeToRecover: 90, criticalComponents: ["Precision Connector ZHP-CONN-08", "Precision Housing ZHP-PREC-04", "PCB Connector PC-220"], affectedProductLines: ["ProControl 2000", "SensorSuite Platform"], alternativeQualified: false, safetyStockRecommendation: 60, lastReviewed: "Oct 2025" },
  hay: { inventoryBufferDays: 35, timeToSurvive: 35, timeToRecover: 60, criticalComponents: ["Nickel Alloy Rod HAY-230", "Cobalt Alloy Sheet HAY-188", "High-Temp Alloy Bar HAY-C276"], affectedProductLines: ["FlexDrive Series", "ProControl 2000"], alternativeQualified: true, safetyStockRecommendation: 45, lastReviewed: "Sep 2025" },
  eme: { inventoryBufferDays: 60, timeToSurvive: 60, timeToRecover: 45, criticalComponents: ["Control Board EMR-CB-3100", "Interface Controller EMR-INT-44"], affectedProductLines: ["ProControl 2000", "SensorSuite Platform"], alternativeQualified: true, safetyStockRecommendation: 30, lastReviewed: "Aug 2025" },
  phn: { inventoryBufferDays: 45, timeToSurvive: 45, timeToRecover: 60, criticalComponents: ["Hydraulic Module PH-HYD-220", "Seal Assembly PH-SA-14"], affectedProductLines: ["FlexDrive Series"], alternativeQualified: true, safetyStockRecommendation: 30, lastReviewed: "Sep 2025" },
  hon: { inventoryBufferDays: 28, timeToSurvive: 28, timeToRecover: 55, criticalComponents: ["Multi-Axis Sensor HON-MULTI-88", "Industrial Sensor HON-SENS-12"], affectedProductLines: ["ProControl 2000", "FlexDrive Series", "SensorSuite Platform"], alternativeQualified: false, safetyStockRecommendation: 40, lastReviewed: "Sep 2025" },
  xpo: { inventoryBufferDays: 7, timeToSurvive: 7, timeToRecover: 14, criticalComponents: ["Midwest Freight Lanes", "Last-mile Delivery Network", "Cross-dock Operations"], affectedProductLines: ["All product lines"], alternativeQualified: true, safetyStockRecommendation: 14, lastReviewed: "Oct 2025" },
  mog: { inventoryBufferDays: 30, timeToSurvive: 30, timeToRecover: 75, criticalComponents: ["Precision Drive Assembly MOG-DRV-14", "Servo Actuator MOG-SA-08"], affectedProductLines: ["FlexDrive Series"], alternativeQualified: false, safetyStockRecommendation: 35, lastReviewed: "Oct 2025" },
};

// ── Certifications ────────────────────────────────────────────────────────────
export const CERTIFICATIONS: Record<string, Certification[]> = {
  sit: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2022-03-15", expires: "2025-03-14", status: "Expiring Soon", scope: "Gas control components design & manufacture" },
    { name: "PED 2014/68/EU", standard: "PED", issuer: "TÜV Rheinland", issued: "2023-01-10", expires: "2026-01-09", status: "Valid", scope: "Pressure Equipment Directive — gas valves" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "DNV GL", issued: "2021-06-20", expires: "2024-06-19", status: "In Renewal", scope: "Environmental management" },
  ],
  ebm: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "TÜV SÜD", issued: "2023-05-01", expires: "2026-04-30", status: "Valid", scope: "EC motors and fan systems" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "TÜV SÜD", issued: "2023-05-01", expires: "2026-04-30", status: "Valid" },
    { name: "IATF 16949:2016", standard: "IATF 16949", issuer: "TÜV SÜD", issued: "2022-09-01", expires: "2025-08-31", status: "Expiring Soon", scope: "Automotive-grade quality management" },
  ],
  aal: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2020-11-01", expires: "2023-10-31", status: "Expired", scope: "Flow control & pipe systems" },
    { name: "ISO 45001:2018", standard: "ISO 45001", issuer: "Lloyd's Register", issued: "2023-02-14", expires: "2026-02-13", status: "Valid", scope: "Occupational health & safety" },
    { name: "PED 2014/68/EU", standard: "PED", issuer: "DNV GL", issued: "2022-07-01", expires: "2025-06-30", status: "Expiring Soon" },
  ],
  gru: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "DNV GL", issued: "2023-01-15", expires: "2026-01-14", status: "Valid" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "DNV GL", issued: "2023-01-15", expires: "2026-01-14", status: "Valid" },
    { name: "EN 13831", standard: "EN 13831", issuer: "TÜV Rheinland", issued: "2024-03-01", expires: "2027-02-28", status: "Valid", scope: "Closed expansion vessels" },
  ],
  dan: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "DNV GL", issued: "2022-08-01", expires: "2025-07-31", status: "Expiring Soon" },
    { name: "ISO 50001:2018", standard: "ISO 50001", issuer: "SGS", issued: "2023-04-01", expires: "2026-03-31", status: "Valid", scope: "Energy management" },
    { name: "PED 2014/68/EU", standard: "PED", issuer: "Bureau Veritas", issued: "2024-01-01", expires: "2027-01-01", status: "Valid" },
  ],
  gfp: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "SGS", issued: "2023-10-01", expires: "2026-09-30", status: "Valid" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "SGS", issued: "2023-10-01", expires: "2026-09-30", status: "Valid" },
  ],
  dbs: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2024-01-01", expires: "2027-01-01", status: "Valid", scope: "Transport & logistics operations" },
    { name: "ISO 28000:2022", standard: "ISO 28000", issuer: "Lloyd's Register", issued: "2024-06-01", expires: "2027-05-31", status: "Valid", scope: "Supply chain security management" },
    { name: "AEO-F", standard: "AEO", issuer: "HMRC / German Customs", issued: "2019-03-01", expires: "2027-03-01", status: "Valid", scope: "Authorised Economic Operator — Full" },
  ],
  sen: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "TÜV SÜD", issued: "2022-06-01", expires: "2025-05-31", status: "Expiring Soon" },
    { name: "IATF 16949:2016", standard: "IATF 16949", issuer: "TÜV SÜD", issued: "2023-02-01", expires: "2026-01-31", status: "Valid" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "TÜV SÜD", issued: "2022-06-01", expires: "2025-05-31", status: "Expiring Soon" },
  ],
};

export const CERTIFICATIONS_US: Record<string, Certification[]> = {
  eme: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2023-01-15", expires: "2026-01-14", status: "Valid", scope: "Industrial automation controls design & manufacture" },
    { name: "AS9100D:2016", standard: "AS9100D", issuer: "NSF International", issued: "2022-06-01", expires: "2025-05-31", status: "Expiring Soon", scope: "Aerospace quality management — control systems" },
    { name: "UL Listed", standard: "UL", issuer: "Underwriters Laboratories", issued: "2024-01-01", expires: "2026-12-31", status: "Valid", scope: "Electronic control assemblies for industrial use" },
  ],
  phn: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "DNV GL", issued: "2023-04-01", expires: "2026-03-31", status: "Valid" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "DNV GL", issued: "2023-04-01", expires: "2026-03-31", status: "Valid" },
    { name: "ITAR Registered", standard: "ITAR", issuer: "US Dept of State DDTC", issued: "2022-08-01", expires: "2025-08-31", status: "Expiring Soon", scope: "Hydraulic and pneumatic systems for defense" },
  ],
  hon: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "TÜV SÜD", issued: "2023-09-01", expires: "2026-08-31", status: "Valid" },
    { name: "IATF 16949:2016", standard: "IATF 16949", issuer: "TÜV SÜD", issued: "2023-09-01", expires: "2026-08-31", status: "Valid", scope: "Automotive-grade sensor manufacturing" },
    { name: "C-TPAT Certified", standard: "C-TPAT", issuer: "US Customs & Border Protection", issued: "2021-03-15", expires: "2026-03-15", status: "Valid", scope: "Customs-Trade Partnership Against Terrorism" },
  ],
  xpo: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2024-01-01", expires: "2027-01-01", status: "Valid", scope: "Freight transportation and logistics operations" },
    { name: "C-TPAT Certified", standard: "C-TPAT", issuer: "US Customs & Border Protection", issued: "2020-06-01", expires: "2026-06-01", status: "Valid", scope: "Supply chain security management" },
    { name: "ISO 28000:2022", standard: "ISO 28000", issuer: "Lloyd's Register", issued: "2024-03-01", expires: "2027-03-01", status: "Valid", scope: "Supply chain security management system" },
  ],
  hay: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "SGS", issued: "2022-11-01", expires: "2025-10-31", status: "Expiring Soon" },
    { name: "AS9100D:2016", standard: "AS9100D", issuer: "NSF International", issued: "2023-03-01", expires: "2026-02-28", status: "Valid", scope: "Specialty alloy production for aerospace applications" },
    { name: "NADCAP", standard: "NADCAP", issuer: "Performance Review Institute", issued: "2023-07-01", expires: "2025-06-30", status: "Expiring Soon", scope: "Heat treating of nickel and cobalt alloys" },
  ],
  mog: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "Bureau Veritas", issued: "2023-08-01", expires: "2026-07-31", status: "Valid" },
    { name: "AS9100D:2016", standard: "AS9100D", issuer: "Bureau Veritas", issued: "2023-08-01", expires: "2026-07-31", status: "Valid", scope: "Precision motion control for aerospace & industrial" },
    { name: "ITAR Registered", standard: "ITAR", issuer: "US Dept of State DDTC", issued: "2023-01-15", expires: "2026-01-14", status: "Valid", scope: "Defense-related precision actuation systems" },
    { name: "NADCAP", standard: "NADCAP", issuer: "Performance Review Institute", issued: "2024-01-01", expires: "2026-12-31", status: "Valid", scope: "Special processes — NDT and chemical processing" },
  ],
  flx: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "TÜV SÜD", issued: "2022-05-01", expires: "2025-04-30", status: "Expiring Soon" },
    { name: "ISO 14001:2015", standard: "ISO 14001", issuer: "TÜV SÜD", issued: "2022-05-01", expires: "2025-04-30", status: "Expiring Soon" },
    { name: "IATF 16949:2016", standard: "IATF 16949", issuer: "TÜV SÜD", issued: "2023-02-01", expires: "2026-01-31", status: "Valid", scope: "Automotive electronics manufacturing services" },
  ],
  zhp: [
    { name: "ISO 9001:2015", standard: "ISO 9001", issuer: "CQC", issued: "2020-09-01", expires: "2023-08-31", status: "Expired", scope: "Precision mechanical components" },
    { name: "RoHS Compliance", standard: "RoHS", issuer: "Self-declaration", issued: "2023-01-01", expires: "2025-12-31", status: "Expiring Soon", scope: "Restriction of hazardous substances in electronics" },
  ],
};

// ── Product Lines ─────────────────────────────────────────────────────────────
export const PRODUCT_LINES: ProductLine[] = [
  {
    id: "gs4", name: "Greenstar 4 Life", model: "GS4L-24/28/32/36", annualVolume: 85000,
    bomItems: [
      { partNumber: "GCV-2200", partName: "Gas Control Valve", supplierId: "sit", quantity: 1, unitCost: 42, leadTimeDays: 18, soloSourced: true, riskScore: 64 },
      { partNumber: "FF-3000", partName: "Flue Fan Assembly", supplierId: "ebm", quantity: 1, unitCost: 38, leadTimeDays: 45, soloSourced: true, riskScore: 41 },
      { partNumber: "FCV-110", partName: "Flow Control Valve", supplierId: "aal", quantity: 2, unitCost: 28, leadTimeDays: 22, soloSourced: false, riskScore: 76 },
      { partNumber: "UP15-14", partName: "Circulation Pump", supplierId: "gru", quantity: 1, unitCost: 55, leadTimeDays: 60, soloSourced: false, riskScore: 27 },
      { partNumber: "FS-44", partName: "Flame Sensor", supplierId: "sen", quantity: 1, unitCost: 18, leadTimeDays: 28, soloSourced: false, riskScore: 54 },
      { partNumber: "PF-220", partName: "Stainless Pipe Fitting", supplierId: "gfp", quantity: 8, unitCost: 4.5, leadTimeDays: 12, soloSourced: false, riskScore: 48 },
    ],
  },
  {
    id: "gs8", name: "Greenstar 8000 Life", model: "GS8L-30/35/40", annualVolume: 42000,
    bomItems: [
      { partNumber: "GCV-2200", partName: "Gas Control Valve", supplierId: "sit", quantity: 1, unitCost: 48, leadTimeDays: 18, soloSourced: true, riskScore: 64 },
      { partNumber: "VSF-2", partName: "Variable Speed Fan", supplierId: "ebm", quantity: 1, unitCost: 62, leadTimeDays: 45, soloSourced: true, riskScore: 41 },
      { partNumber: "ZV-3", partName: "3-Port Zone Valve", supplierId: "dan", quantity: 2, unitCost: 34, leadTimeDays: 35, soloSourced: false, riskScore: 31 },
      { partNumber: "BM-44", partName: "Brass Manifold", supplierId: "aal", quantity: 1, unitCost: 85, leadTimeDays: 22, soloSourced: false, riskScore: 76 },
      { partNumber: "PS-12", partName: "Pressure Sensor", supplierId: "sen", quantity: 2, unitCost: 24, leadTimeDays: 28, soloSourced: false, riskScore: 54 },
    ],
  },
  {
    id: "gwv", name: "Greenwave Heat Pump", model: "GWV-5/8/12/16kW", annualVolume: 18000,
    bomItems: [
      { partNumber: "MV-22", partName: "Motorised Valve", supplierId: "dan", quantity: 3, unitCost: 44, leadTimeDays: 35, soloSourced: false, riskScore: 31 },
      { partNumber: "FCV-110", partName: "Flow Control Valve", supplierId: "aal", quantity: 3, unitCost: 28, leadTimeDays: 22, soloSourced: false, riskScore: 76 },
      { partNumber: "VSF-2", partName: "Variable Speed Fan", supplierId: "ebm", quantity: 2, unitCost: 62, leadTimeDays: 45, soloSourced: true, riskScore: 41 },
      { partNumber: "CF-18", partName: "Compression Fitting", supplierId: "gfp", quantity: 12, unitCost: 3.8, leadTimeDays: 12, soloSourced: false, riskScore: 48 },
      { partNumber: "TS-88", partName: "Temperature Sensor", supplierId: "sen", quantity: 4, unitCost: 15, leadTimeDays: 28, soloSourced: false, riskScore: 54 },
    ],
  },
];

export const PRODUCT_LINES_US: ProductLine[] = [
  {
    id: "mpc", name: "ProControl 2000", model: "MPC2000-24/48/96", annualVolume: 28000,
    bomItems: [
      { partNumber: "EMR-CB-3100", partName: "Control Board Assembly", supplierId: "eme", quantity: 1, unitCost: 185, leadTimeDays: 14, soloSourced: false, riskScore: 24 },
      { partNumber: "FLX-PCB-44", partName: "PCB Sub-Assembly", supplierId: "flx", quantity: 2, unitCost: 92, leadTimeDays: 16, soloSourced: true, riskScore: 68 },
      { partNumber: "HON-SENS-12", partName: "Industrial Sensor", supplierId: "hon", quantity: 3, unitCost: 45, leadTimeDays: 10, soloSourced: false, riskScore: 46 },
      { partNumber: "ZHP-CONN-08", partName: "Precision Connector", supplierId: "zhp", quantity: 8, unitCost: 12, leadTimeDays: 21, soloSourced: true, riskScore: 78 },
    ],
  },
  {
    id: "mfd", name: "FlexDrive Series", model: "MFD-5/10/25/50HP", annualVolume: 14500,
    bomItems: [
      { partNumber: "PH-HYD-220", partName: "Hydraulic Module", supplierId: "phn", quantity: 1, unitCost: 340, leadTimeDays: 14, soloSourced: false, riskScore: 29 },
      { partNumber: "MOG-DRV-14", partName: "Precision Drive Assembly", supplierId: "mog", quantity: 1, unitCost: 480, leadTimeDays: 21, soloSourced: true, riskScore: 36 },
      { partNumber: "HON-SENS-12", partName: "Motion Sensor", supplierId: "hon", quantity: 2, unitCost: 38, leadTimeDays: 10, soloSourced: false, riskScore: 46 },
      { partNumber: "FLX-PWR-22", partName: "Power Module Assembly", supplierId: "flx", quantity: 1, unitCost: 125, leadTimeDays: 16, soloSourced: false, riskScore: 68 },
    ],
  },
  {
    id: "mss", name: "SensorSuite Platform", model: "MSS-8/16/32 Channel", annualVolume: 42000,
    bomItems: [
      { partNumber: "HON-MULTI-88", partName: "Multi-Axis Sensor", supplierId: "hon", quantity: 4, unitCost: 62, leadTimeDays: 10, soloSourced: false, riskScore: 46 },
      { partNumber: "EMR-INT-44", partName: "Interface Controller", supplierId: "eme", quantity: 1, unitCost: 95, leadTimeDays: 14, soloSourced: false, riskScore: 24 },
      { partNumber: "ZHP-PREC-04", partName: "Precision Housing", supplierId: "zhp", quantity: 4, unitCost: 18, leadTimeDays: 21, soloSourced: false, riskScore: 78 },
      { partNumber: "FLX-PROC-08", partName: "Processing Board", supplierId: "flx", quantity: 1, unitCost: 145, leadTimeDays: 16, soloSourced: true, riskScore: 68 },
    ],
  },
];

// ── Commodities ───────────────────────────────────────────────────────────────
export const COMMODITIES: CommodityPrice[] = [
  { id: "steel", name: "Steel (HRC)", unit: "tonne", currentPrice: 845, currency: "EUR", priceHistory: [740, 780, 820, 890, 920, 880, 860, 840, 845], changePercent: 0.6, trend: "Stable", volatility: "Medium", affectedCategories: ["Components", "Raw Materials"], affectedSupplierIds: ["aal", "gfp"], alert: undefined },
  { id: "copper", name: "Copper", unit: "tonne", currentPrice: 7250, currency: "EUR", priceHistory: [6800, 7200, 7450, 7800, 7650, 7500, 7200, 6950, 7250], changePercent: 4.3, trend: "Rising", volatility: "High", affectedCategories: ["Electronics", "Components"], affectedSupplierIds: ["sen", "sit", "dan"], alert: "Copper +4.3% QoQ — sensor and valve cost pressure expected" },
  { id: "aluminium", name: "Aluminium", unit: "tonne", currentPrice: 2130, currency: "EUR", priceHistory: [1980, 2050, 2100, 2200, 2180, 2120, 2080, 2050, 2130], changePercent: 3.9, trend: "Rising", volatility: "Medium", affectedCategories: ["Components"], affectedSupplierIds: ["ebm", "aal"], alert: "Aluminium rising — EC motor casing cost up ~3.9% QoQ" },
  { id: "natural-gas", name: "Natural Gas (TTF)", unit: "MWh", currentPrice: 38.4, currency: "EUR", priceHistory: [28, 32, 45, 62, 58, 42, 35, 31, 38.4], changePercent: 23.9, trend: "Rising", volatility: "High", affectedCategories: ["Components", "Logistics"], affectedSupplierIds: ["sit", "gfp", "dbs"], alert: "TTF gas +24% — energy-intensive suppliers facing margin pressure" },
  { id: "rare-earth", name: "Rare Earth Index", unit: "index", currentPrice: 158, currency: "USD", priceHistory: [130, 138, 142, 148, 162, 175, 168, 155, 158], changePercent: -4.2, trend: "Falling", volatility: "High", affectedCategories: ["Electronics"], affectedSupplierIds: ["sen", "ebm"], alert: undefined },
  { id: "stainless", name: "Stainless Steel (316L)", unit: "tonne", currentPrice: 2840, currency: "EUR", priceHistory: [2400, 2520, 2650, 2780, 2900, 2870, 2820, 2790, 2840], changePercent: 1.8, trend: "Stable", volatility: "Low", affectedCategories: ["Raw Materials", "Components"], affectedSupplierIds: ["gfp", "aal"], alert: undefined },
];

export const COMMODITIES_US: CommodityPrice[] = [
  { id: "nickel", name: "Nickel (LME)", unit: "tonne", currentPrice: 16420, currency: "USD", priceHistory: [14200, 15100, 15800, 17200, 18400, 17800, 17100, 16600, 16420], changePercent: 8.4, trend: "Rising", volatility: "High", affectedCategories: ["Raw Materials"], affectedSupplierIds: ["hay"], alert: "Nickel +8.4% YTD — Haynes International alloy input cost headwinds elevated" },
  { id: "cobalt", name: "Cobalt (LME)", unit: "tonne", currentPrice: 32800, currency: "USD", priceHistory: [28000, 29400, 31200, 34500, 36800, 35200, 34100, 33200, 32800], changePercent: 17.1, trend: "Rising", volatility: "High", affectedCategories: ["Raw Materials"], affectedSupplierIds: ["hay"], alert: "Cobalt +17% YTD — Haynes specialty alloy margin compression anticipated at next pricing review" },
  { id: "copper-us", name: "Copper (COMEX)", unit: "lb", currentPrice: 4.12, currency: "USD", priceHistory: [3.65, 3.82, 3.95, 4.20, 4.35, 4.28, 4.18, 4.08, 4.12], changePercent: 4.3, trend: "Rising", volatility: "Medium", affectedCategories: ["Electronics", "Components"], affectedSupplierIds: ["flx", "hon"], alert: "Copper +4.3% QoQ — PCB and sensor cost pressure expected at contract review" },
  { id: "rare-earth-us", name: "Rare Earth Index", unit: "index", currentPrice: 168, currency: "USD", priceHistory: [138, 144, 150, 158, 172, 185, 178, 165, 168], changePercent: -4.2, trend: "Falling", volatility: "High", affectedCategories: ["Electronics"], affectedSupplierIds: ["flx", "zhp"], alert: "⚠ Rare earth export restrictions from China — UFLPA enforcement compounds supply risk for Zhonghe" },
  { id: "semiconductors", name: "Semiconductor IC Index", unit: "index", currentPrice: 224, currency: "USD", priceHistory: [180, 188, 195, 210, 228, 240, 235, 228, 224], changePercent: 24.4, trend: "Rising", volatility: "High", affectedCategories: ["Electronics", "Sensors & Controls"], affectedSupplierIds: ["flx", "hon", "eme"], alert: "Semiconductor allocation tightening — Flex and Honeywell lead times extended 10–16 weeks" },
  { id: "henry-hub", name: "Natural Gas (Henry Hub)", unit: "MMBtu", currentPrice: 2.84, currency: "USD", priceHistory: [2.20, 2.35, 2.55, 3.10, 3.45, 3.20, 2.95, 2.88, 2.84], changePercent: 29.1, trend: "Rising", volatility: "High", affectedCategories: ["Raw Materials", "Logistics"], affectedSupplierIds: ["hay", "xpo"], alert: undefined },
];

// ── Assessments ───────────────────────────────────────────────────────────────
export const ASSESSMENTS: Assessment[] = [
  { supplierId: "sit", supplierName: "SIT Group", templateId: "fin-health", templateName: "Financial Health Check", sentDate: "Sep 15, 2025", dueDate: "Sep 30, 2025", completedDate: "Oct 02, 2025", status: "Completed", completionPct: 100, riskFlags: 4 },
  { supplierId: "aal", supplierName: "Aalberts Industries", templateId: "single-src", templateName: "Single Source Dependency Review", sentDate: "Oct 01, 2025", dueDate: "Oct 15, 2025", status: "In Progress", completionPct: 60, riskFlags: 2 },
  { supplierId: "ebm", supplierName: "Ebm-papst", templateId: "dis-rec", templateName: "Disaster Recovery Assessment", sentDate: "Oct 05, 2025", dueDate: "Oct 20, 2025", status: "Overdue", completionPct: 25, riskFlags: 0 },
  { supplierId: "gfp", supplierName: "Georg Fischer", templateId: "sub-tier", templateName: "Sub-tier Disclosure Questionnaire", sentDate: "Oct 10, 2025", dueDate: "Oct 25, 2025", status: "Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "gru", supplierName: "Grundfos", templateId: "fin-health", templateName: "Financial Health Check", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "dan", supplierName: "Danfoss", templateId: "dis-rec", templateName: "Disaster Recovery Assessment", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "dbs", supplierName: "DB Schenker", templateId: "single-src", templateName: "Single Source Dependency Review", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "sen", supplierName: "Sensata Technologies", templateId: "sub-tier", templateName: "Sub-tier Disclosure Questionnaire", status: "Not Sent", completionPct: 0, riskFlags: 0 },
];

export const ASSESSMENTS_US: Assessment[] = [
  { supplierId: "zhp", supplierName: "Zhonghe Precision", templateId: "uflpa-review", templateName: "UFLPA Compliance Review", sentDate: "Sep 28, 2025", dueDate: "Oct 10, 2025", status: "Overdue", completionPct: 15, riskFlags: 6 },
  { supplierId: "flx", supplierName: "Flex Ltd.", templateId: "fin-health", templateName: "Financial Health Check", sentDate: "Sep 22, 2025", dueDate: "Oct 05, 2025", completedDate: "Oct 08, 2025", status: "Completed", completionPct: 100, riskFlags: 3 },
  { supplierId: "hay", supplierName: "Haynes International", templateId: "fin-health", templateName: "Financial Health Check", sentDate: "Oct 01, 2025", dueDate: "Oct 20, 2025", status: "In Progress", completionPct: 55, riskFlags: 2 },
  { supplierId: "hon", supplierName: "Honeywell Sensing", templateId: "single-src", templateName: "Single Source Dependency Review", sentDate: "Oct 08, 2025", dueDate: "Oct 25, 2025", status: "Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "eme", supplierName: "Emerson Electric", templateId: "sub-tier", templateName: "Sub-tier Disclosure Questionnaire", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "phn", supplierName: "Parker Hannifin", templateId: "dis-rec", templateName: "Disaster Recovery Assessment", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "mog", supplierName: "Moog Inc.", templateId: "sub-tier", templateName: "Sub-tier Disclosure Questionnaire", status: "Not Sent", completionPct: 0, riskFlags: 0 },
  { supplierId: "xpo", supplierName: "XPO Inc.", templateId: "dis-rec", templateName: "Disaster Recovery Assessment", status: "Not Sent", completionPct: 0, riskFlags: 0 },
];

// ── Benchmarks ────────────────────────────────────────────────────────────────
export const BENCHMARKS: IndustryBenchmark[] = [
  { sector: "HVAC & Heating (Your Portfolio)", avgRiskScore: 46, avgDPS: 42, avgOnTime: 91, avgESGScore: 68, sampleSize: 8 },
  { sector: "HVAC & Heating Industry Average", avgRiskScore: 48, avgDPS: 45, avgOnTime: 93, avgESGScore: 65, sampleSize: 214 },
  { sector: "Industrial Components (EU)", avgRiskScore: 52, avgDPS: 49, avgOnTime: 91, avgESGScore: 62, sampleSize: 1840 },
  { sector: "Automotive Supply Chain", avgRiskScore: 58, avgDPS: 54, avgOnTime: 96, avgESGScore: 71, sampleSize: 3200 },
  { sector: "Logistics & Transport", avgRiskScore: 31, avgDPS: 28, avgOnTime: 97, avgESGScore: 58, sampleSize: 680 },
];

export const BENCHMARKS_US: IndustryBenchmark[] = [
  { sector: "Industrial Automation (Your Portfolio)", avgRiskScore: 44, avgDPS: 41, avgOnTime: 93, avgESGScore: 66, sampleSize: 8 },
  { sector: "Industrial Automation Industry Avg", avgRiskScore: 49, avgDPS: 46, avgOnTime: 92, avgESGScore: 64, sampleSize: 312 },
  { sector: "Electronic Manufacturing Services (EMS)", avgRiskScore: 58, avgDPS: 54, avgOnTime: 88, avgESGScore: 58, sampleSize: 840 },
  { sector: "Specialty Alloys & Materials", avgRiskScore: 52, avgDPS: 48, avgOnTime: 90, avgESGScore: 61, sampleSize: 180 },
  { sector: "Industrial Logistics (North America)", avgRiskScore: 34, avgDPS: 30, avgOnTime: 96, avgESGScore: 62, sampleSize: 520 },
];

// ── Data Feeds ────────────────────────────────────────────────────────────────
export const DATA_FEEDS: DataFeed[] = [
  { name: "Dun & Bradstreet", shortName: "D&B", type: "Financial", lastRefreshed: "2h ago", status: "Live", recordsUpdated: 3 },
  { name: "S&P Global", shortName: "S&P", type: "Credit", lastRefreshed: "6h ago", status: "Live", recordsUpdated: 1 },
  { name: "Moody's Analytics", shortName: "Moody's", type: "Credit", lastRefreshed: "12h ago", status: "Live", recordsUpdated: 2 },
  { name: "Prewave", shortName: "Prewave", type: "ESG", lastRefreshed: "1h ago", status: "Live", recordsUpdated: 5 },
  { name: "Everstream Analytics", shortName: "ESA", type: "Events", lastRefreshed: "15m ago", status: "Live", recordsUpdated: 8 },
  { name: "project44", shortName: "p44", type: "Logistics", lastRefreshed: "5m ago", status: "Live", recordsUpdated: 4 },
  { name: "LME / Platts", shortName: "LME", type: "Financial", lastRefreshed: "4h ago", status: "Live", recordsUpdated: 6 },
];
