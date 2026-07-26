// ── Financial Health Intelligence ─────────────────────────────────────────────
export interface EarlyWarningFlag {
  type: "inventory" | "dso" | "dpo" | "leverage" | "revenue" | "capex" | "margin" | "ccc";
  severity: "critical" | "warn" | "info";
  text: string;
}

export interface FinancialHealth {
  score: number;                  // 0–100 composite (Z-Score derived)
  dioTrend: number[];             // Days Inventory Outstanding, 4 quarters
  dsoTrend: number[];             // Days Sales Outstanding, 4 quarters
  dpoTrend: number[];             // Days Payable Outstanding, 4 quarters (rising = cash stress)
  cccTrend: number[];             // Cash Conversion Cycle = DIO + DSO - DPO
  grossMarginTrend: number[];     // Gross margin %, 4 quarters (leading indicator of net margin)
  ocfMarginTrend: number[];       // Operating cash flow / revenue %, 4 quarters
  inventoryGrowthYoY: number;     // decimal e.g. 0.28 = +28%
  revenueGrowthYoY: number;       // decimal e.g. -0.11 = -11%
  netDebtEbitda: number[];        // 8 quarters leverage trajectory
  interestCoverage: number;       // EBIT / interest expense
  capexToDepreciation: number[];  // 4 quarters
  flags: EarlyWarningFlag[];
}

export interface FinancialRatios {
  debtToEquity: number;
  netProfitMargin: number;
  currentRatio: number;
  quickRatio?: number;            // (current assets − inventory) / current liabilities
  grossMargin?: number;           // gross profit / revenue; leading indicator vs net margin
  operatingCashFlowMargin?: number; // OCF / revenue; detects profit-without-cash situations
  // Balance-sheet totals (in $M) — used for Altman Z'-Score computation
  totalAssets?: number;
  retainedEarnings?: number;
  annualRevenue?: number;
  workingCapital?: number;        // current assets − current liabilities (negative = illiquid)
}

export interface AltmanZResult {
  z: number;
  zone: "safe" | "gray" | "distress";
  insolvencyProbability: number;  // 0–1, logistic-mapped from Z'
}

export interface CashData {
  exposureAtRisk: number;
  cashRetained: number;
  safetyStockDays: number;
}

export interface ObservationData {
  day: number;
  total: number;
  progressPct: number;
}

export interface ChecklistData {
  contractExecuted: boolean;
  opsStable: boolean;
  financeRecovery: boolean;
}

export interface ApprovalsData {
  procurement: boolean;
  finance: boolean;
}

export interface SupplierAlert {
  id: string;
  type: "risk" | "contract" | "logistics" | "quality" | "results" | "observation" | string;
  text: string;
  date: string;
}

export interface TimelineEvent {
  date: string;
  text: string;
}

export interface SupplierData {
  updatedLabel: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
}

export type RiskState =
  | "UNDER OBSERVATION"
  | "MITIGATION IN PROGRESS"
  | "ESCALATED"
  | "STABLE"
  | string;

// ── Credit Risk (Resilinc FRISK / Prewave Coface DRA equivalent) ──────────────
export interface CreditRisk {
  friskScore: number;           // 1–10, lower = higher bankruptcy risk
  insolvencyProbability: number; // 0–1 (e.g. 0.04 = 4%)
  creditRating: string;         // e.g. "BB+", "A-"
  paymentBehavior: "Good" | "Moderate" | "Poor";
  bankruptcyRisk12m: "Low" | "Moderate" | "High" | "Critical";
  lastUpdated: string;
  source: string;               // e.g. "CreditRiskMonitor FRISK", "Coface DRA"
}

// ── ESG (Prewave equivalent) ──────────────────────────────────────────────────
export interface ESGProfile {
  score: number;                // 0–100
  grade: "A" | "B" | "C" | "D" | "F";
  environmental: number;
  social: number;
  governance: number;
  eudrCompliant: boolean | "In Progress" | "Not Started";
  csdddStatus: "Compliant" | "In Progress" | "Non-Compliant" | "N/A" | "Not Started";
  lksgStatus: "Compliant" | "In Progress" | "Non-Compliant" | "N/A" | "Not Started";
  csrdStatus: "Compliant" | "In Progress" | "Non-Compliant" | "N/A" | "Not Started";
  // ── US regulatory fields ──────────────────────────────────────────────────────
  uflpaStatus?: "Compliant" | "Under Review" | "Non-Compliant" | "N/A" | "Not Assessed";
  scope3Status?: "Reported" | "In Progress" | "Not Started" | "N/A";
  conflictMineralsStatus?: "Compliant" | "In Progress" | "Non-Compliant" | "N/A";
  laborRisk: "Low" | "Medium" | "High";
  environmentalRisk: "Low" | "Medium" | "High";
  carbonFootprint?: string;     // e.g. "12.4kt CO₂e"
  lastAudit?: string;
}

// ── Resiliency Score (Resilinc R Score equivalent) ────────────────────────────
export interface ResiliencyScore {
  overall?: number;             // computed by computeResiliency(); do not store
  transparency: number;         // assessed: data-sharing maturity (1–10)
  network: number;              // assessed: sub-tier mapping depth (1–10)
  continuity: number;           // assessed: BCP coverage and test cadence (1–10)
  performance?: number;         // assessed override; if absent, derived from onTime + qualityPPM
  maturity: number;             // assessed: SCRM program maturity (1–10)
  lastUpdated: string;
}

// ── Network Node (multi-tier mapping) ─────────────────────────────────────────
export interface NetworkNode {
  supplierId: string;
  parentId?: string;            // supplier this node reports to (undefined = direct/tier 1)
  materials: string[];
  sites: NetworkSite[];
}

export interface NetworkSite {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  risk: number;
  criticalParts: string[];
}

// ── Live Disruption Events (Everstream equivalent) ────────────────────────────
export type EventSeverity = "critical" | "high" | "medium" | "low";
export type EventCategory =
  | "natural_disaster"
  | "geopolitical"
  | "logistics"
  | "labor"
  | "financial"
  | "regulatory"
  | "cyber"
  | "quality";

export interface LiveEvent {
  id: string;
  category: EventCategory;
  severity: EventSeverity;
  title: string;
  detail: string;
  region: string;
  country?: string;
  affectedSupplierIds: string[];
  estimatedImpact?: string;
  leadTimeExtension?: string;
  date: string;
  source: string;
  status: "Active" | "Monitoring" | "Resolved";
  predictedEnd?: string;
}

// ── Shipment / Logistics ──────────────────────────────────────────────────────
export interface Shipment {
  id: string;
  supplierId: string;
  origin: string;
  destination: string;
  carrier: string;
  eta: string;
  delayDays?: number;
  delayRisk: "Low" | "Medium" | "High";
  status: "On Track" | "Delayed" | "At Risk" | "Customs Hold" | "Delivered";
  value: string;
  // Present on completed (Delivered) shipments — ISO YYYY-MM-DD strings
  scheduledDate?: string;
  actualDeliveryDate?: string;
  // True when supplier proactively flagged a partial shipment and the customer accepted it;
  // counts as on-time regardless of actualDeliveryDate.
  customerAccepted?: boolean;
}

// ── Crisis Room (Resilinc WarRoom equivalent) ─────────────────────────────────
export interface CrisisRoom {
  id: string;
  title: string;
  triggeredBy: string;         // event ID or manual
  severity: EventSeverity;
  openedDate: string;
  owner: string;
  affectedSupplierIds: string[];
  affectedParts: string[];
  estimatedExposure: string;
  status: "Open" | "Contained" | "Resolved";
  actions: CrisisAction[];
}

export interface CrisisAction {
  id: string;
  text: string;
  owner: string;
  due: string;
  done: boolean;
}

// ── Contract Contact ──────────────────────────────────────────────────────────
export interface ContractContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

// ── Evidence provenance ────────────────────────────────────────────────────────
// How we know what we claim about a supplier. Resolved via supplierProvenance()
// in src/lib/data/provenance.ts when not set explicitly on the record.
export type Provenance = "verified" | "corroborated" | "inferred" | "unenriched";

// ── Supplier (extended) ────────────────────────────────────────────────────────
export interface Supplier {
  website?: string;
  id: string;
  name: string;
  provenance?: Provenance;
  ticker?: string;
  tier?: number;
  category?: string;
  categoryConfidence?: "High" | "Medium" | "Low";
  region?: "NA" | "EU" | "APAC" | string;
  duns?: string;
  riskState?: RiskState;
  data?: SupplierData;
  ratios?: FinancialRatios;
  cash?: CashData;
  observation?: ObservationData;
  approvals?: ApprovalsData;
  checklist?: ChecklistData;
  spend?: number;
  exposure?: number;
  risk?: number;
  onTime?: number;
  qualityPPM?: number;
  alerts?: SupplierAlert[];
  timeline?: TimelineEvent[];
  // ── New fields ──
  creditRisk?: CreditRisk;
  esg?: ESGProfile;
  resiliency?: ResiliencyScore;
  networkNodes?: NetworkNode[];
  parentSupplierIds?: string[];  // tier 2+ parents
  riskHistory?: number[];        // 12-month monthly risk score trend
  leadTimeTrend?: number[];      // 4-quarter rolling avg lead time in days (oldest → newest)
  countryCode?: string;          // ISO-2 e.g. "DE", "IT", "NL"
  financialHealth?: FinancialHealth;
  riskForecast?: {
    score30d: number;       // predicted risk score in 30 days
    direction: "up" | "down" | "stable";
    delta: number;          // e.g. +12 or -5
    confidence: "HIGH" | "MEDIUM" | "LOW";
    drivers: string[];      // e.g. ["Payment delays detected", "Port congestion EU"]
  };
}

export interface Contract {
  id: string;
  supplierId: string;
  supplierName: string;
  title: string;
  type: string;
  expires: string;
  value: string;
  status: string;
  autoRenew: boolean;
  // Negotiation mechanics
  noticeDays: number;               // days notice required to decline auto-renew or trigger renewal process
  renegotiationWindowDays: number;  // how far before expiry the renegotiation window opens
  // Contractual triggers permitting early or mid-term renegotiation
  financialTriggerClause: boolean;  // allows renegotiation if supplier breaches defined financial thresholds
  performanceTriggerClause: boolean; // allows renegotiation if OTIF / quality falls below contracted SLA
  // Key protective terms
  forceMajeureClause: boolean;
  priceIndexationClause: boolean;   // pricing linked to commodity or inflation index; auto-adjusts at review dates
  tariffPassThroughClause: boolean; // tariff changes can be passed through by either party
}

export interface GlobalAlert {
  id: string;
  supplierId: string;
  text: string;
  type: string;
  date: string;
  scope?: string;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

// ── Certification tracking ────────────────────────────────────────────────────
export interface Certification {
  name: string;         // e.g. "ISO 9001:2015"
  standard: string;     // short code e.g. "ISO 9001"
  issuer: string;
  issued: string;       // YYYY-MM-DD
  expires: string;      // YYYY-MM-DD
  status: "Valid" | "Expiring Soon" | "Expired" | "In Renewal";
  scope?: string;
}

// ── Business Continuity / Recovery Modeling ───────────────────────────────────
export interface RecoveryProfile {
  inventoryBufferDays: number;   // days of stock on hand
  timeToSurvive: number;         // days before production line stops
  timeToRecover: number;         // days to qualify an alternative
  criticalComponents: string[];  // part names this supplier provides
  affectedProductLines: string[];
  alternativeQualified: boolean;
  safetyStockRecommendation: number; // recommended buffer days
  // Feasibility of reaching the recommendation
  estimatedStockIncreaseCostM: number; // cost in local currency (M) to acquire additional stock up to recommendation; 0 if already at or above recommendation
  additionalStorageM3: number;         // warehouse volume (m³) needed to house the additional stock; 0 if no increase needed
  lastReviewed: string;
}

// ── BOM / Part-level risk ─────────────────────────────────────────────────────
// sourcingType:
//   "sole"   — only one supplier exists in the market (patent, unique IP, proprietary tooling)
//   "single" — only one supplier is currently qualified; alternatives exist in the market
//   "multi"  — two or more qualified suppliers
export type SourcingType = "sole" | "single" | "multi";

export interface BOMItem {
  partNumber: string;
  partName: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  leadTimeDays: number;
  sourcingType: SourcingType;
  riskScore: number;
}

export interface ProductLine {
  id: string;
  name: string;
  model: string;
  annualVolume: number;
  bomItems: BOMItem[];
}

// ── Commodity price intelligence ──────────────────────────────────────────────
export interface CommodityPrice {
  id: string;
  name: string;
  unit: string;
  currentPrice: number;
  currency: string;
  priceHistory: number[];   // 9 quarterly data points
  changePercent: number;    // vs 3 months ago
  trend: "Rising" | "Falling" | "Stable";
  volatility: "Low" | "Medium" | "High";
  affectedCategories: string[];
  affectedSupplierIds: string[];
  alert?: string;
}

// ── Supplier self-assessment ──────────────────────────────────────────────────
export type AssessmentStatus = "Not Sent" | "Sent" | "In Progress" | "Completed" | "Overdue";

export interface Assessment {
  supplierId: string;
  supplierName: string;
  templateId: string;
  templateName: string;
  sentDate?: string;
  dueDate?: string;
  completedDate?: string;
  status: AssessmentStatus;
  completionPct: number;
  riskFlags: number;
  responses?: Record<string, string>;
}

// ── Industry benchmark ────────────────────────────────────────────────────────
export interface IndustryBenchmark {
  sector: string;
  avgRiskScore: number;
  avgDPS: number;
  avgOnTime: number;
  avgESGScore: number;
  sampleSize: number;
}

// ── Data source feed ──────────────────────────────────────────────────────────
export interface DataFeed {
  name: string;        // e.g. "Dun & Bradstreet"
  shortName: string;   // e.g. "D&B"
  type: "Financial" | "ESG" | "Events" | "Logistics" | "Credit";
  lastRefreshed: string;
  status: "Live" | "Delayed" | "Offline";
  recordsUpdated: number;
}

export type Route =
  | "dashboard"
  | "alerts"
  | "suppliers"
  | "supplier"
  | "contracts"
  | "analytics"
  | "reports"
  | "admin"
  | "settings"
  | "events"
  | "network"
  | "esg"
  | "crisis"
  | "recovery"
  | "commodities"
  | "assessments"
  | "subtier"
  | "geomap"
  | "cfo"
  | "cpo"
  | "import";

export interface RouteState {
  route: Route;
  params: Record<string, string>;
}

export interface Recommendation {
  action: string;
  reason: string;
  guidance: string[];
}

export interface MCResult {
  probability: number;
  expectedExposure: string;
  stress95: string;
}
