export interface FinancialRatios {
  debtToEquity: number;
  netProfitMargin: number;
  currentRatio: number;
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
  laborRisk: "Low" | "Medium" | "High";
  environmentalRisk: "Low" | "Medium" | "High";
  carbonFootprint?: string;     // e.g. "12.4kt CO₂e"
  lastAudit?: string;
}

// ── Resiliency Score (Resilinc R Score equivalent) ────────────────────────────
export interface ResiliencyScore {
  overall: number;              // 1–10
  transparency: number;
  network: number;
  continuity: number;
  performance: number;
  maturity: number;
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
  status: "On Track" | "Delayed" | "At Risk" | "Customs Hold";
  value: string;
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

// ── Supplier (extended) ────────────────────────────────────────────────────────
export interface Supplier {
  id: string;
  name: string;
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
  | "crisis";

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
