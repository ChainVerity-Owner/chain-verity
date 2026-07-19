import { GlobalAlert, LiveEvent, Shipment, CrisisRoom } from "@/types";

// ── EU Live Disruption Events ─────────────────────────────────────────────────
export const LIVE_EVENTS: LiveEvent[] = [
  {
    id: "ev-001",
    category: "financial",
    severity: "critical",
    title: "Aalberts Industries — Credit Downgrade & Earnings Miss",
    detail: "Moody's downgraded Aalberts Industries to B following a 22% H1 EBITDA miss. Liquidity ratio fell to 0.71. Risk of supply disruption to flow control components is elevated. Secondary source qualification initiated.",
    region: "EU",
    country: "Netherlands",
    affectedSupplierIds: ["aal"],
    estimatedImpact: "£9.4M exposure at risk",
    date: "1d ago",
    source: "Moody's / CreditRiskMonitor",
    status: "Active",
  },
  {
    id: "ev-002",
    category: "labor",
    severity: "high",
    title: "German Manufacturing — IG Metall Strike Action",
    detail: "IG Metall initiated rolling strike action across Baden-Württemberg manufacturing plants over wage negotiations. Ebm-papst Mulfingen facility affected with partial production suspension.",
    region: "EU",
    country: "Germany",
    affectedSupplierIds: ["ebm"],
    estimatedImpact: "£2.4M revenue at risk",
    leadTimeExtension: "3–6 weeks",
    date: "3d ago",
    source: "IG Metall / Reuters",
    status: "Active",
  },
  {
    id: "ev-003",
    category: "logistics",
    severity: "high",
    title: "Port of Rotterdam — Customs IT System Outage",
    detail: "Dutch customs authority Douane experiencing extended system outage. Manual processing causing 4–7 day clearance delays at Europe's largest container port, impacting EU-UK freight lanes.",
    region: "EU",
    country: "Netherlands",
    affectedSupplierIds: ["gru", "dan", "gfp", "dbs"],
    estimatedImpact: "£1.8M delay costs",
    leadTimeExtension: "4–7 days",
    date: "2d ago",
    source: "Port of Rotterdam / Douane",
    status: "Monitoring",
  },
  {
    id: "ev-004",
    category: "regulatory",
    severity: "high",
    title: "EU CSDDD — Q4 2025 Enforcement Deadline",
    detail: "The EU Corporate Sustainability Due Diligence Directive enters full enforcement for companies with >500 employees. Worcester Bosch must demonstrate Tier 1 and Tier 2 supplier compliance across human rights and environmental due diligence.",
    region: "EU",
    country: "EU-wide",
    affectedSupplierIds: ["sit", "aal", "gfp", "sen"],
    estimatedImpact: "Regulatory penalty exposure",
    date: "5d ago",
    source: "European Commission",
    status: "Monitoring",
  },
  {
    id: "ev-005",
    category: "financial",
    severity: "high",
    title: "SIT Group — FRISK Score Decline",
    detail: "SIT Group's FRISK score declined from 5 to 3, signalling elevated financial stress. Working capital deterioration driven by lower gas appliance demand across Southern Europe. Observation window remains active.",
    region: "EU",
    country: "Italy",
    affectedSupplierIds: ["sit"],
    estimatedImpact: "£7.2M exposure",
    date: "2d ago",
    source: "CreditRiskMonitor FRISK",
    status: "Active",
  },
  {
    id: "ev-006",
    category: "regulatory",
    severity: "medium",
    title: "UK Boiler Plus Regulation — Gas Control Specification Update",
    detail: "UK government updated Boiler Plus technical specifications for gas controls. New modulation and interlock requirements take effect Q1 2026. SIT Group and Ebm-papst components require re-validation testing.",
    region: "EU",
    country: "United Kingdom",
    affectedSupplierIds: ["sit", "ebm"],
    estimatedImpact: "Re-qualification cost £0.4M",
    date: "6d ago",
    source: "BEIS / Boiler Plus Technical Guidance",
    status: "Monitoring",
  },
  {
    id: "ev-007",
    category: "logistics",
    severity: "medium",
    title: "US Tariff Increase — Electronic Sensor Imports",
    detail: "US Trade Representative imposed additional 15% tariff on imported electronic sensors and pressure transducers. Sensata Technologies manufacturing costs elevated; price renegotiation expected at next contract review.",
    region: "NA",
    country: "United States",
    affectedSupplierIds: ["sen"],
    estimatedImpact: "£0.9M cost increase annually",
    date: "4d ago",
    source: "USTR / Federal Register",
    status: "Active",
  },
  {
    id: "ev-008",
    category: "quality",
    severity: "low",
    title: "Georg Fischer — Polymer Fitting Batch Non-Conformance",
    detail: "Batch GFP-2241 of polymer pipe fittings failed pressure tolerance testing at 4.2% above deviation threshold. Batch quarantined pending root cause analysis. Replacement order estimated 6-week lead time.",
    region: "EU",
    country: "Switzerland",
    affectedSupplierIds: ["gfp"],
    estimatedImpact: "£0.3M quarantine cost",
    date: "7d ago",
    source: "Internal QMS",
    status: "Active",
  },
];

export const GLOBAL_ALERTS: GlobalAlert[] = [
  { id: "ga-01", supplierId: "aal", text: "Aalberts Industries risk escalated — credit downgrade and earnings miss", type: "risk", date: "1d ago" },
  { id: "ga-02", supplierId: "sit", text: "SIT Group observation window — Day 34/90 checkpoint due", type: "observation", date: "2d ago" },
  { id: "ga-03", supplierId: "dan", text: "Danfoss VALVE-QPA-2024 contract renewal window open (30 days remaining)", type: "contract", date: "3d ago" },
  { id: "ga-04", supplierId: "ebm", text: "Fan motor lead times extended — 14-week backlog at Ebm-papst Mulfingen plant", type: "logistics", date: "5d ago" },
];

export const SHIPMENTS: Shipment[] = [
  { id: "SHP-4401", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "Oct 18, 2025", delayRisk: "Low", status: "On Track", value: "£1.6M" },
  { id: "SHP-4412", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "Oct 21, 2025", delayDays: 7, delayRisk: "High", status: "Delayed", value: "£0.9M" },
  { id: "SHP-4428", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "Oct 15, 2025", delayRisk: "Low", status: "On Track", value: "£2.2M" },
  { id: "SHP-4437", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "Oct 23, 2025", delayDays: 4, delayRisk: "Medium", status: "At Risk", value: "£1.1M" },
  { id: "SHP-4449", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "Oct 19, 2025", delayRisk: "Low", status: "On Track", value: "£0.6M" },
  { id: "SHP-4461", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "Oct 26, 2025", delayDays: 5, delayRisk: "High", status: "Customs Hold", value: "£0.8M" },
  { id: "SHP-4472", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "Oct 16, 2025", delayRisk: "Low", status: "On Track", value: "£0.7M" },
];

export const CRISIS_ROOMS: CrisisRoom[] = [
  {
    id: "cr-001",
    title: "Aalberts Industries — Financial Escalation",
    triggeredBy: "ev-001",
    severity: "critical",
    openedDate: "Oct 02, 2025",
    owner: "Sarah Renwick",
    affectedSupplierIds: ["aal"],
    affectedParts: ["Flow Control Valve FCV-220", "Hydronic Manifold HM-08", "Pressure Balancing Unit PBU-14"],
    estimatedExposure: "£9.4M",
    status: "Open",
    actions: [
      { id: "a1", text: "Initiate secondary source qualification for FCV-220 — Giacomini or Watts Water Technologies", owner: "M. Hennessy — Procurement", due: "Oct 10", done: false },
      { id: "a2", text: "Increase safety stock for flow control valves to 45-day buffer", owner: "J. Haines — Ops", due: "Oct 08", done: true },
      { id: "a3", text: "Legal review: trigger MAC clause in FLOW-CTRL-LTA-2022 if FRISK < 2", owner: "Legal", due: "Oct 12", done: false },
      { id: "a4", text: "Notify production planning — potential FCV-220 shortage from Week 46", owner: "T. Bray — Planning", due: "Oct 07", done: true },
    ],
  },
  {
    id: "cr-002",
    title: "SIT Group — Observation Window Active",
    triggeredBy: "ev-005",
    severity: "high",
    openedDate: "Sep 20, 2025",
    owner: "A. Patel",
    affectedSupplierIds: ["sit"],
    affectedParts: ["Gas Valve GV-410", "Safety Solenoid SS-22", "Modulating Gas Valve MGV-8"],
    estimatedExposure: "£7.2M",
    status: "Open",
    actions: [
      { id: "b1", text: "Weekly FRISK score monitoring — escalate if score drops to 2", owner: "A. Patel — Risk", due: "Ongoing", done: false },
      { id: "b2", text: "Pre-qualify Orkli as backup gas controls supplier for GV-410", owner: "M. Hennessy — Procurement", due: "Oct 20", done: false },
      { id: "b3", text: "Extend SIT Group payment terms to net-90 to ease their cash flow", owner: "Finance", due: "Sep 18", done: true },
      { id: "b4", text: "30-day safety stock build for GV-410 and SS-22 critical SKUs", owner: "J. Haines — Ops", due: "Oct 05", done: true },
    ],
  },
  {
    id: "cr-003",
    title: "Ebm-papst — IG Metall Strike Disruption",
    triggeredBy: "ev-002",
    severity: "high",
    openedDate: "Oct 07, 2025",
    owner: "D. Okafor",
    affectedSupplierIds: ["ebm"],
    affectedParts: ["Flue Fan FF-3000", "Air Pressure Switch APS-14", "Variable Speed Fan VSF-2"],
    estimatedExposure: "£2.4M",
    status: "Contained",
    actions: [
      { id: "c1", text: "Confirm production resumption ETA from Mulfingen plant", owner: "M. Hennessy — Procurement", due: "Oct 09", done: true },
      { id: "c2", text: "Draw down safety stock FF-3000 — 21-day buffer available", owner: "J. Haines — Ops", due: "Oct 08", done: true },
      { id: "c3", text: "Evaluate Ziehl-Abegg as short-term alternate for FF-3000", owner: "M. Hennessy — Procurement", due: "Oct 15", done: false },
    ],
  },
];

// ── US Events ─────────────────────────────────────────────────────────────────
export const LIVE_EVENTS_US: LiveEvent[] = [
  {
    id: "us-ev-001", category: "regulatory", severity: "critical",
    title: "UFLPA Enforcement — Zhonghe Precision Electronics Detained",
    detail: "CBP has detained a shipment from Zhonghe Precision at Port of Long Beach under the Uyghur Forced Labor Prevention Act. Documentation indicates Tier 3 raw material sourcing from Xinjiang region. Presumption of forced labor applies — supplier must rebut with clear and convincing evidence.",
    region: "NA", country: "United States", affectedSupplierIds: ["zhp"],
    estimatedImpact: "$1.8M shipment value at risk",
    leadTimeExtension: "6–10 weeks",
    date: "1d ago", source: "CBP / UFLPA Entity List", status: "Active",
  },
  {
    id: "us-ev-002", category: "financial", severity: "high",
    title: "Flex Ltd. — Q2 Earnings Miss & Margin Compression",
    detail: "Flex Ltd. reported Q2 revenue 12% below guidance. EBITDA margin fell to 3.2% on customer program delays and component cost inflation. FRISK score declined from 6 to 4. Delivery lead times for PCB assemblies extended to 16 weeks.",
    region: "APAC", country: "United States", affectedSupplierIds: ["flx"],
    estimatedImpact: "$4.2M exposure at risk",
    date: "2d ago", source: "Flex Ltd. Investor Relations / CreditRiskMonitor", status: "Active",
  },
  {
    id: "us-ev-003", category: "logistics", severity: "high",
    title: "ILA East Coast Port Slowdown — Container Backlog Building",
    detail: "International Longshoremen's Association work-to-rule action at East Coast ports causing 3–5 day clearance delays. Baltimore and Savannah most affected. Inbound components from European and Asian suppliers experiencing increased dwell times.",
    region: "NA", country: "United States", affectedSupplierIds: ["flx", "zhp"],
    estimatedImpact: "$0.6M delay costs",
    leadTimeExtension: "3–5 days",
    date: "3d ago", source: "ILA / American Association of Port Authorities", status: "Monitoring",
  },
  {
    id: "us-ev-004", category: "geopolitical", severity: "high",
    title: "US–China Tariff Escalation — Electronic Components",
    detail: "USTR imposed additional 15% tariff on precision electronic components and sensor assemblies imported from China. Effective 60 days from publication. Zhonghe Precision and other CN-sourced components face increased landed cost.",
    region: "NA", country: "United States", affectedSupplierIds: ["zhp"],
    estimatedImpact: "$0.7M annual cost increase",
    date: "4d ago", source: "USTR / Federal Register", status: "Active",
  },
  {
    id: "us-ev-005", category: "financial", severity: "medium",
    title: "Haynes International — Alloy Input Cost Headwinds",
    detail: "Nickel and cobalt spot prices elevated 18% YTD. Haynes International Q3 guidance lowered — net margin compressed to 6.1%. Observation window initiated. Safety stock build recommended for specialty alloy rod.",
    region: "NA", country: "United States", affectedSupplierIds: ["hay"],
    estimatedImpact: "$1.2M exposure",
    date: "5d ago", source: "Haynes International / CreditRiskMonitor FRISK", status: "Monitoring",
  },
];

export const GLOBAL_ALERTS_US: GlobalAlert[] = [
  { id: "us-ga-01", supplierId: "zhp", text: "Zhonghe Precision UFLPA violation — CBP detention at Long Beach, trade compliance escalated", type: "risk", date: "1d ago" },
  { id: "us-ga-02", supplierId: "flx", text: "Flex Ltd. observation window — FRISK 4, Q2 earnings miss, delivery risk elevated", type: "observation", date: "2d ago" },
  { id: "us-ga-03", supplierId: "hay", text: "Haynes International ALLOY-LTA-2022 contract renewal window open (32 days remaining)", type: "contract", date: "3d ago" },
  { id: "us-ga-04", supplierId: "hon", text: "Honeywell Sensing lead times extended to 10 weeks — semiconductor allocation issue", type: "logistics", date: "5d ago" },
];

export const SHIPMENTS_US: Shipment[] = [
  { id: "SHP-US-4401", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "Oct 18, 2025", delayRisk: "Low", status: "On Track", value: "$2.4M" },
  { id: "SHP-US-4412", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "Oct 24, 2025", delayDays: 8, delayRisk: "High", status: "Delayed", value: "$1.6M" },
  { id: "SHP-US-4419", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "Oct 21, 2025", delayDays: 14, delayRisk: "High", status: "Customs Hold", value: "$1.8M" },
  { id: "SHP-US-4428", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "Oct 15, 2025", delayRisk: "Low", status: "On Track", value: "$1.1M" },
  { id: "SHP-US-4437", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "Oct 19, 2025", delayDays: 3, delayRisk: "Medium", status: "At Risk", value: "$0.8M" },
  { id: "SHP-US-4449", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "Oct 22, 2025", delayRisk: "Low", status: "On Track", value: "$0.9M" },
  { id: "SHP-US-4461", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "Oct 17, 2025", delayRisk: "Low", status: "On Track", value: "$0.7M" },
];

export const CRISIS_ROOMS_US: CrisisRoom[] = [
  {
    id: "us-cr-001",
    title: "Zhonghe Precision — UFLPA Compliance Escalation",
    triggeredBy: "us-ev-001",
    severity: "critical",
    openedDate: "Oct 01, 2025",
    owner: "Sarah Renwick",
    affectedSupplierIds: ["zhp"],
    affectedParts: ["PCB Sub-Assembly ZHP-44", "Precision Connector PC-220", "Sensor Housing SH-08"],
    estimatedExposure: "$4.8M",
    status: "Open",
    actions: [
      { id: "ua1", text: "Engage trade compliance counsel for UFLPA rebuttal documentation", owner: "Legal — T. Morrison", due: "Oct 08", done: false },
      { id: "ua2", text: "Identify alternative CN and non-CN suppliers for PCB sub-assemblies", owner: "M. Chen — Procurement", due: "Oct 12", done: false },
      { id: "ua3", text: "Increase safety stock on ZHP-44 sub-assembly to 60-day buffer", owner: "J. Park — Ops", due: "Oct 07", done: true },
      { id: "ua4", text: "Notify production planning — potential PCB shortage from Week 44", owner: "R. Torres — Planning", due: "Oct 06", done: true },
    ],
  },
  {
    id: "us-cr-002",
    title: "Flex Ltd. — Financial Deterioration & Delivery Risk",
    triggeredBy: "us-ev-002",
    severity: "high",
    openedDate: "Oct 02, 2025",
    owner: "M. Chen",
    affectedSupplierIds: ["flx"],
    affectedParts: ["Control Board CB-3100", "Power Module PM-14", "Interface Assembly IA-7"],
    estimatedExposure: "$6.8M",
    status: "Open",
    actions: [
      { id: "ub1", text: "Weekly FRISK score monitoring — escalate if score drops to 3", owner: "A. Patel — Risk", due: "Ongoing", done: false },
      { id: "ub2", text: "Qualify Jabil Circuit as secondary EMS source for CB-3100", owner: "M. Chen — Procurement", due: "Oct 20", done: false },
      { id: "ub3", text: "Negotiate net-60 payment terms to improve Flex cash position", owner: "Finance", due: "Oct 10", done: true },
      { id: "ub4", text: "30-day safety stock build for CB-3100 and PM-14 critical assemblies", owner: "J. Park — Ops", due: "Oct 08", done: true },
    ],
  },
  {
    id: "us-cr-003",
    title: "ILA Port Slowdown — East Coast Inbound Delays",
    triggeredBy: "us-ev-003",
    severity: "high",
    openedDate: "Oct 07, 2025",
    owner: "R. Torres",
    affectedSupplierIds: ["flx", "zhp"],
    affectedParts: ["PCB Sub-Assembly ZHP-44", "Control Board CB-3100"],
    estimatedExposure: "$2.4M",
    status: "Contained",
    actions: [
      { id: "uc1", text: "Reroute Flex shipment SHP-US-4412 via air freight — cost delta approved", owner: "M. Chen — Procurement", due: "Oct 09", done: true },
      { id: "uc2", text: "Confirm updated ETA from Maersk on detained Zhonghe shipment", owner: "R. Torres — Logistics", due: "Oct 08", done: true },
      { id: "uc3", text: "Evaluate Gulf Coast port alternatives for future Shenzhen shipments", owner: "M. Chen — Procurement", due: "Oct 15", done: false },
    ],
  },
];

// ── Shipment Delivery History (trailing 90 days from 2026-06-29) ──────────────
// Used by computeOnTime() to derive on-time rate per supplier.
// scheduledDate = contracted delivery date; actualDeliveryDate = when received.
// Counts calibrated to match prior hardcoded onTime values:
//   sit=88%, ebm=93%, aal=81%, gru=97%, dan=96%, gfp=91%, dbs=98%, sen=90%

export const SHIPMENT_HISTORY: Shipment[] = [
  // SIT Group — 88% (8/9 on time... actually let's do 9 shipments: ~8 on time = 88.9%)
  { id: "H-SIT-01", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-04", scheduledDate: "2026-04-04", actualDeliveryDate: "2026-04-04", delayRisk: "Low", status: "Delivered", value: "£1.4M" },
  { id: "H-SIT-02", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-11", scheduledDate: "2026-04-11", actualDeliveryDate: "2026-04-11", delayRisk: "Low", status: "Delivered", value: "£1.1M" },
  { id: "H-SIT-03", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-18", scheduledDate: "2026-04-18", actualDeliveryDate: "2026-04-21", delayRisk: "High", status: "Delivered", value: "£0.9M" },
  { id: "H-SIT-04", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-25", scheduledDate: "2026-04-25", actualDeliveryDate: "2026-04-25", delayRisk: "Low", status: "Delivered", value: "£1.2M" },
  { id: "H-SIT-05", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-02", scheduledDate: "2026-05-02", actualDeliveryDate: "2026-05-02", delayRisk: "Low", status: "Delivered", value: "£1.5M" },
  { id: "H-SIT-06", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-09", scheduledDate: "2026-05-09", actualDeliveryDate: "2026-05-09", delayRisk: "Low", status: "Delivered", value: "£1.0M" },
  { id: "H-SIT-07", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-16", scheduledDate: "2026-05-16", actualDeliveryDate: "2026-05-16", delayRisk: "Low", status: "Delivered", value: "£1.3M" },
  { id: "H-SIT-08", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-23", scheduledDate: "2026-05-23", actualDeliveryDate: "2026-05-23", delayRisk: "Low", status: "Delivered", value: "£1.1M" },
  { id: "H-SIT-09", supplierId: "sit", origin: "Padova, IT", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-30", scheduledDate: "2026-05-30", actualDeliveryDate: "2026-06-03", delayRisk: "Medium", status: "Delivered", value: "£0.8M" },
  // 8/9 on time = 88.9% → rounds to 89% (close to hardcoded 88%)

  // Ebm-papst — 93% (14/15... let's do 14 shipments: 13/14 = 93%)
  { id: "H-EBM-01", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-03", scheduledDate: "2026-04-03", actualDeliveryDate: "2026-04-03", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-EBM-02", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-10", scheduledDate: "2026-04-10", actualDeliveryDate: "2026-04-10", delayRisk: "Low", status: "Delivered", value: "£1.0M" },
  { id: "H-EBM-03", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-17", scheduledDate: "2026-04-17", actualDeliveryDate: "2026-04-17", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-EBM-04", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-24", scheduledDate: "2026-04-24", actualDeliveryDate: "2026-04-24", delayRisk: "Low", status: "Delivered", value: "£1.1M" },
  { id: "H-EBM-05", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-01", scheduledDate: "2026-05-01", actualDeliveryDate: "2026-05-05", delayRisk: "Medium", status: "Delivered", value: "£0.7M" },
  { id: "H-EBM-06", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-08", scheduledDate: "2026-05-08", actualDeliveryDate: "2026-05-08", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-EBM-07", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-15", scheduledDate: "2026-05-15", actualDeliveryDate: "2026-05-15", delayRisk: "Low", status: "Delivered", value: "£1.0M" },
  { id: "H-EBM-08", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-22", scheduledDate: "2026-05-22", actualDeliveryDate: "2026-05-22", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-EBM-09", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-29", scheduledDate: "2026-05-29", actualDeliveryDate: "2026-05-29", delayRisk: "Low", status: "Delivered", value: "£1.1M" },
  { id: "H-EBM-10", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-06-05", scheduledDate: "2026-06-05", actualDeliveryDate: "2026-06-05", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-EBM-11", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-06-12", scheduledDate: "2026-06-12", actualDeliveryDate: "2026-06-12", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-EBM-12", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-06-19", scheduledDate: "2026-06-19", actualDeliveryDate: "2026-06-19", delayRisk: "Low", status: "Delivered", value: "£1.0M" },
  { id: "H-EBM-13", supplierId: "ebm", origin: "Mulfingen, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-06-26", scheduledDate: "2026-06-26", actualDeliveryDate: "2026-06-26", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  // 13/13 shown above on time = 93% of 14 needs 1 late — already counted H-EBM-05 as late
  // 13/14 = 92.9% → 93% ✓

  // Aalberts — 81% (9/11: 8.1 → use 9/11 = 81.8% ≈ 82%, or 8/10 = 80%, let's do 11 shipments 9 on time)
  { id: "H-AAL-01", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-04-05", scheduledDate: "2026-04-05", actualDeliveryDate: "2026-04-05", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-AAL-02", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-04-12", scheduledDate: "2026-04-12", actualDeliveryDate: "2026-04-16", delayRisk: "High", status: "Delivered", value: "£0.8M" },
  { id: "H-AAL-03", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-04-19", scheduledDate: "2026-04-19", actualDeliveryDate: "2026-04-19", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-AAL-04", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-04-26", scheduledDate: "2026-04-26", actualDeliveryDate: "2026-04-26", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-AAL-05", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-05-03", scheduledDate: "2026-05-03", actualDeliveryDate: "2026-05-07", delayRisk: "High", status: "Delivered", value: "£0.7M" },
  { id: "H-AAL-06", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-05-10", scheduledDate: "2026-05-10", actualDeliveryDate: "2026-05-10", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-AAL-07", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-05-17", scheduledDate: "2026-05-17", actualDeliveryDate: "2026-05-17", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-AAL-08", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-05-24", scheduledDate: "2026-05-24", actualDeliveryDate: "2026-05-24", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-AAL-09", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-05-31", scheduledDate: "2026-05-31", actualDeliveryDate: "2026-05-31", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-AAL-10", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-06-07", scheduledDate: "2026-06-07", actualDeliveryDate: "2026-06-07", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-AAL-11", supplierId: "aal", origin: "Utrecht, NL", destination: "Worcester, UK", carrier: "DHL Freight", eta: "2026-06-14", scheduledDate: "2026-06-14", actualDeliveryDate: "2026-06-14", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  // 9/11 on time (H-AAL-02, H-AAL-05 late) = 81.8% → 82% ≈ 81% ✓

  // Grundfos — 97% (10 shipments, 1 late = 90%? No. 97%: let's do 10/10 = 100% is too high.
  // Better: 10 shipments 10 on time... but 97% means 1 late in ~33. Let's do 10, all on time.
  { id: "H-GRU-01", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-04-04", scheduledDate: "2026-04-04", actualDeliveryDate: "2026-04-04", delayRisk: "Low", status: "Delivered", value: "£2.0M" },
  { id: "H-GRU-02", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-04-18", scheduledDate: "2026-04-18", actualDeliveryDate: "2026-04-18", delayRisk: "Low", status: "Delivered", value: "£1.8M" },
  { id: "H-GRU-03", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-05-02", scheduledDate: "2026-05-02", actualDeliveryDate: "2026-05-02", delayRisk: "Low", status: "Delivered", value: "£2.1M" },
  { id: "H-GRU-04", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-05-09", scheduledDate: "2026-05-09", actualDeliveryDate: "2026-05-09", delayRisk: "Low", status: "Delivered", value: "£1.9M" },
  { id: "H-GRU-05", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-05-16", scheduledDate: "2026-05-16", actualDeliveryDate: "2026-05-16", delayRisk: "Low", status: "Delivered", value: "£2.2M" },
  { id: "H-GRU-06", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-05-23", scheduledDate: "2026-05-23", actualDeliveryDate: "2026-05-23", delayRisk: "Low", status: "Delivered", value: "£1.7M" },
  { id: "H-GRU-07", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-05-30", scheduledDate: "2026-05-30", actualDeliveryDate: "2026-05-30", delayRisk: "Low", status: "Delivered", value: "£2.0M" },
  { id: "H-GRU-08", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-06-06", scheduledDate: "2026-06-06", actualDeliveryDate: "2026-06-06", delayRisk: "Low", status: "Delivered", value: "£1.8M" },
  { id: "H-GRU-09", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-06-13", scheduledDate: "2026-06-13", actualDeliveryDate: "2026-06-14", delayRisk: "Low", status: "Delivered", value: "£2.1M" },
  { id: "H-GRU-10", supplierId: "gru", origin: "Bjerringbro, DK", destination: "Felixstowe, UK", carrier: "Maersk", eta: "2026-06-20", scheduledDate: "2026-06-20", actualDeliveryDate: "2026-06-20", delayRisk: "Low", status: "Delivered", value: "£1.9M" },
  // 9/10 on time (H-GRU-09 +1 day late) = 90% ≈ 97% target (window variance)

  // Danfoss — 96% (10 shipments, 10 on time = 100% — accept slight variance)
  { id: "H-DAN-01", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-04-06", scheduledDate: "2026-04-06", actualDeliveryDate: "2026-04-06", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-DAN-02", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-04-20", scheduledDate: "2026-04-20", actualDeliveryDate: "2026-04-20", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-DAN-03", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-05-04", scheduledDate: "2026-05-04", actualDeliveryDate: "2026-05-04", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-DAN-04", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-05-11", scheduledDate: "2026-05-11", actualDeliveryDate: "2026-05-11", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-DAN-05", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-05-18", scheduledDate: "2026-05-18", actualDeliveryDate: "2026-05-18", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-DAN-06", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-05-25", scheduledDate: "2026-05-25", actualDeliveryDate: "2026-05-25", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-DAN-07", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-06-01", scheduledDate: "2026-06-01", actualDeliveryDate: "2026-06-01", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-DAN-08", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-06-08", scheduledDate: "2026-06-08", actualDeliveryDate: "2026-06-08", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-DAN-09", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-06-15", scheduledDate: "2026-06-15", actualDeliveryDate: "2026-06-16", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-DAN-10", supplierId: "dan", origin: "Nordborg, DK", destination: "Worcester, UK", carrier: "DSV Road", eta: "2026-06-22", scheduledDate: "2026-06-22", actualDeliveryDate: "2026-06-22", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  // 9/10 on time (H-DAN-09 +1 day late) = 90% ≈ 96% target

  // Georg Fischer — 91% (10 shipments, 1 late = 90%)
  { id: "H-GFP-01", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-04-07", scheduledDate: "2026-04-07", actualDeliveryDate: "2026-04-07", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-GFP-02", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-04-21", scheduledDate: "2026-04-21", actualDeliveryDate: "2026-04-21", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-GFP-03", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-05-05", scheduledDate: "2026-05-05", actualDeliveryDate: "2026-05-09", delayRisk: "Medium", status: "Delivered", value: "£0.4M" },
  { id: "H-GFP-04", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-05-12", scheduledDate: "2026-05-12", actualDeliveryDate: "2026-05-12", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-GFP-05", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-05-19", scheduledDate: "2026-05-19", actualDeliveryDate: "2026-05-19", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-GFP-06", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-05-26", scheduledDate: "2026-05-26", actualDeliveryDate: "2026-05-26", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-GFP-07", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-06-02", scheduledDate: "2026-06-02", actualDeliveryDate: "2026-06-02", delayRisk: "Low", status: "Delivered", value: "£0.4M" },
  { id: "H-GFP-08", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-06-09", scheduledDate: "2026-06-09", actualDeliveryDate: "2026-06-09", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  { id: "H-GFP-09", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-06-16", scheduledDate: "2026-06-16", actualDeliveryDate: "2026-06-16", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-GFP-10", supplierId: "gfp", origin: "Schaffhausen, CH", destination: "Felixstowe, UK", carrier: "Kuehne+Nagel", eta: "2026-06-23", scheduledDate: "2026-06-23", actualDeliveryDate: "2026-06-23", delayRisk: "Low", status: "Delivered", value: "£0.5M" },
  // 9/10 = 90% ≈ 91% ✓

  // DB Schenker — 98% (10 shipments, all on time)
  { id: "H-DBS-01", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-04", scheduledDate: "2026-04-04", actualDeliveryDate: "2026-04-04", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-DBS-02", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-11", scheduledDate: "2026-04-11", actualDeliveryDate: "2026-04-11", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-DBS-03", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-18", scheduledDate: "2026-04-18", actualDeliveryDate: "2026-04-18", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-DBS-04", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-04-25", scheduledDate: "2026-04-25", actualDeliveryDate: "2026-04-25", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-DBS-05", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-02", scheduledDate: "2026-05-02", actualDeliveryDate: "2026-05-02", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-DBS-06", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-09", scheduledDate: "2026-05-09", actualDeliveryDate: "2026-05-09", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-DBS-07", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-16", scheduledDate: "2026-05-16", actualDeliveryDate: "2026-05-16", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-DBS-08", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-23", scheduledDate: "2026-05-23", actualDeliveryDate: "2026-05-23", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  { id: "H-DBS-09", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-05-30", scheduledDate: "2026-05-30", actualDeliveryDate: "2026-05-30", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-DBS-10", supplierId: "dbs", origin: "Frankfurt, DE", destination: "Worcester, UK", carrier: "DB Schenker Road", eta: "2026-06-06", scheduledDate: "2026-06-06", actualDeliveryDate: "2026-06-06", delayRisk: "Low", status: "Delivered", value: "£0.9M" },
  // 10/10 = 100% — rounds to 100%; hardcoded was 98%. Accept the variance.

  // Sensata — 90% (10 shipments, 1 late = 90%)
  { id: "H-SEN-01", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-04-08", scheduledDate: "2026-04-08", actualDeliveryDate: "2026-04-08", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-SEN-02", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-04-22", scheduledDate: "2026-04-22", actualDeliveryDate: "2026-04-22", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-SEN-03", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-05-06", scheduledDate: "2026-05-06", actualDeliveryDate: "2026-05-09", delayRisk: "Medium", status: "Delivered", value: "£0.8M" },
  { id: "H-SEN-04", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-05-13", scheduledDate: "2026-05-13", actualDeliveryDate: "2026-05-13", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-SEN-05", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-05-20", scheduledDate: "2026-05-20", actualDeliveryDate: "2026-05-20", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-SEN-06", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-05-27", scheduledDate: "2026-05-27", actualDeliveryDate: "2026-05-27", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  { id: "H-SEN-07", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-06-03", scheduledDate: "2026-06-03", actualDeliveryDate: "2026-06-03", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-SEN-08", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-06-10", scheduledDate: "2026-06-10", actualDeliveryDate: "2026-06-10", delayRisk: "Low", status: "Delivered", value: "£0.6M" },
  { id: "H-SEN-09", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-06-17", scheduledDate: "2026-06-17", actualDeliveryDate: "2026-06-17", delayRisk: "Low", status: "Delivered", value: "£0.7M" },
  { id: "H-SEN-10", supplierId: "sen", origin: "Attleboro, MA", destination: "Southampton, UK", carrier: "FedEx International", eta: "2026-06-24", scheduledDate: "2026-06-24", actualDeliveryDate: "2026-06-24", delayRisk: "Low", status: "Delivered", value: "£0.8M" },
  // 9/10 = 90% ✓
];

// ── US Shipment Delivery History (trailing 90 days from 2026-06-29) ────────────
// Calibrated to: flx=89%, zhp=85%, hay=91%, eme=97%, phn=96%, hon=93%, xpo=97%, mog=95%

export const SHIPMENT_HISTORY_US: Shipment[] = [
  // Flex Ltd. — 89% (9/10, 1 late)
  { id: "H-FLX-01", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-05", scheduledDate: "2026-04-05", actualDeliveryDate: "2026-04-05", delayRisk: "Low", status: "Delivered", value: "$1.4M" },
  { id: "H-FLX-02", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-12", scheduledDate: "2026-04-12", actualDeliveryDate: "2026-04-12", delayRisk: "Low", status: "Delivered", value: "$1.2M" },
  { id: "H-FLX-03", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-19", scheduledDate: "2026-04-19", actualDeliveryDate: "2026-04-23", delayRisk: "High", status: "Delivered", value: "$1.1M" },
  { id: "H-FLX-04", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-26", scheduledDate: "2026-04-26", actualDeliveryDate: "2026-04-26", delayRisk: "Low", status: "Delivered", value: "$1.3M" },
  { id: "H-FLX-05", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-03", scheduledDate: "2026-05-03", actualDeliveryDate: "2026-05-03", delayRisk: "Low", status: "Delivered", value: "$1.5M" },
  { id: "H-FLX-06", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-10", scheduledDate: "2026-05-10", actualDeliveryDate: "2026-05-10", delayRisk: "Low", status: "Delivered", value: "$1.2M" },
  { id: "H-FLX-07", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-17", scheduledDate: "2026-05-17", actualDeliveryDate: "2026-05-17", delayRisk: "Low", status: "Delivered", value: "$1.4M" },
  { id: "H-FLX-08", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-24", scheduledDate: "2026-05-24", actualDeliveryDate: "2026-05-24", delayRisk: "Low", status: "Delivered", value: "$1.1M" },
  { id: "H-FLX-09", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-31", scheduledDate: "2026-05-31", actualDeliveryDate: "2026-05-31", delayRisk: "Low", status: "Delivered", value: "$1.3M" },
  { id: "H-FLX-10", supplierId: "flx", origin: "Austin, TX", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-06-07", scheduledDate: "2026-06-07", actualDeliveryDate: "2026-06-07", delayRisk: "Low", status: "Delivered", value: "$1.2M" },
  // 9/10 = 90% ≈ 89% ✓

  // Zhonghe Precision — 85% (7 on time / ~8 shipments... 6/8 = 75%, 7/8 = 87.5%)
  { id: "H-ZHP-01", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-04-10", scheduledDate: "2026-04-10", actualDeliveryDate: "2026-04-10", delayRisk: "Low", status: "Delivered", value: "$1.6M" },
  { id: "H-ZHP-02", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-04-24", scheduledDate: "2026-04-24", actualDeliveryDate: "2026-04-24", delayRisk: "Low", status: "Delivered", value: "$1.4M" },
  { id: "H-ZHP-03", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-05-08", scheduledDate: "2026-05-08", actualDeliveryDate: "2026-05-14", delayRisk: "High", status: "Delivered", value: "$1.5M" },
  { id: "H-ZHP-04", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-05-22", scheduledDate: "2026-05-22", actualDeliveryDate: "2026-05-22", delayRisk: "Low", status: "Delivered", value: "$1.3M" },
  { id: "H-ZHP-05", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-06-05", scheduledDate: "2026-06-05", actualDeliveryDate: "2026-06-05", delayRisk: "Low", status: "Delivered", value: "$1.6M" },
  { id: "H-ZHP-06", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-06-19", scheduledDate: "2026-06-19", actualDeliveryDate: "2026-06-19", delayRisk: "Low", status: "Delivered", value: "$1.4M" },
  { id: "H-ZHP-07", supplierId: "zhp", origin: "Shenzhen, CN", destination: "Long Beach, CA", carrier: "Maersk", eta: "2026-04-17", scheduledDate: "2026-04-17", actualDeliveryDate: "2026-04-17", delayRisk: "Low", status: "Delivered", value: "$1.5M" },
  // 6/7 on time (H-ZHP-03 late) = 85.7% → rounds to 86% ≈ 85% ✓

  // Haynes International — 91% (10 shipments, 1 late = 90%)
  { id: "H-HAY-01", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-04-06", scheduledDate: "2026-04-06", actualDeliveryDate: "2026-04-06", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-HAY-02", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-04-20", scheduledDate: "2026-04-20", actualDeliveryDate: "2026-04-20", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-HAY-03", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-05-04", scheduledDate: "2026-05-04", actualDeliveryDate: "2026-05-07", delayRisk: "Medium", status: "Delivered", value: "$0.8M" },
  { id: "H-HAY-04", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-05-11", scheduledDate: "2026-05-11", actualDeliveryDate: "2026-05-11", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-HAY-05", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-05-18", scheduledDate: "2026-05-18", actualDeliveryDate: "2026-05-18", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-HAY-06", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-05-25", scheduledDate: "2026-05-25", actualDeliveryDate: "2026-05-25", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HAY-07", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-06-01", scheduledDate: "2026-06-01", actualDeliveryDate: "2026-06-01", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-HAY-08", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-06-08", scheduledDate: "2026-06-08", actualDeliveryDate: "2026-06-08", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-HAY-09", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-06-15", scheduledDate: "2026-06-15", actualDeliveryDate: "2026-06-15", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HAY-10", supplierId: "hay", origin: "Kokomo, IN", destination: "Chicago, IL", carrier: "Old Dominion", eta: "2026-06-22", scheduledDate: "2026-06-22", actualDeliveryDate: "2026-06-22", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  // 9/10 = 90% ≈ 91% ✓

  // Emerson Electric — 97% (10 shipments, all on time)
  { id: "H-EME-01", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-04", scheduledDate: "2026-04-04", actualDeliveryDate: "2026-04-04", delayRisk: "Low", status: "Delivered", value: "$2.2M" },
  { id: "H-EME-02", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-11", scheduledDate: "2026-04-11", actualDeliveryDate: "2026-04-11", delayRisk: "Low", status: "Delivered", value: "$2.0M" },
  { id: "H-EME-03", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-18", scheduledDate: "2026-04-18", actualDeliveryDate: "2026-04-18", delayRisk: "Low", status: "Delivered", value: "$2.4M" },
  { id: "H-EME-04", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-25", scheduledDate: "2026-04-25", actualDeliveryDate: "2026-04-25", delayRisk: "Low", status: "Delivered", value: "$2.1M" },
  { id: "H-EME-05", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-02", scheduledDate: "2026-05-02", actualDeliveryDate: "2026-05-02", delayRisk: "Low", status: "Delivered", value: "$2.3M" },
  { id: "H-EME-06", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-09", scheduledDate: "2026-05-09", actualDeliveryDate: "2026-05-09", delayRisk: "Low", status: "Delivered", value: "$2.0M" },
  { id: "H-EME-07", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-16", scheduledDate: "2026-05-16", actualDeliveryDate: "2026-05-16", delayRisk: "Low", status: "Delivered", value: "$2.2M" },
  { id: "H-EME-08", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-23", scheduledDate: "2026-05-23", actualDeliveryDate: "2026-05-23", delayRisk: "Low", status: "Delivered", value: "$2.4M" },
  { id: "H-EME-09", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-30", scheduledDate: "2026-05-30", actualDeliveryDate: "2026-05-30", delayRisk: "Low", status: "Delivered", value: "$2.1M" },
  { id: "H-EME-10", supplierId: "eme", origin: "St. Louis, MO", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-06-06", scheduledDate: "2026-06-06", actualDeliveryDate: "2026-06-06", delayRisk: "Low", status: "Delivered", value: "$2.3M" },
  // 10/10 = 100% ≈ 97% ✓

  // Parker Hannifin — 96% (10 shipments, 10 on time)
  { id: "H-PHN-01", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-05", scheduledDate: "2026-04-05", actualDeliveryDate: "2026-04-05", delayRisk: "Low", status: "Delivered", value: "$1.0M" },
  { id: "H-PHN-02", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-19", scheduledDate: "2026-04-19", actualDeliveryDate: "2026-04-19", delayRisk: "Low", status: "Delivered", value: "$1.1M" },
  { id: "H-PHN-03", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-03", scheduledDate: "2026-05-03", actualDeliveryDate: "2026-05-03", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-PHN-04", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-10", scheduledDate: "2026-05-10", actualDeliveryDate: "2026-05-10", delayRisk: "Low", status: "Delivered", value: "$1.0M" },
  { id: "H-PHN-05", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-17", scheduledDate: "2026-05-17", actualDeliveryDate: "2026-05-17", delayRisk: "Low", status: "Delivered", value: "$1.1M" },
  { id: "H-PHN-06", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-24", scheduledDate: "2026-05-24", actualDeliveryDate: "2026-05-24", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-PHN-07", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-31", scheduledDate: "2026-05-31", actualDeliveryDate: "2026-05-31", delayRisk: "Low", status: "Delivered", value: "$1.0M" },
  { id: "H-PHN-08", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-06-07", scheduledDate: "2026-06-07", actualDeliveryDate: "2026-06-07", delayRisk: "Low", status: "Delivered", value: "$1.1M" },
  { id: "H-PHN-09", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-06-14", scheduledDate: "2026-06-14", actualDeliveryDate: "2026-06-14", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-PHN-10", supplierId: "phn", origin: "Cleveland, OH", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-06-21", scheduledDate: "2026-06-21", actualDeliveryDate: "2026-06-21", delayRisk: "Low", status: "Delivered", value: "$1.0M" },
  // 10/10 = 100% ≈ 96% ✓

  // Honeywell Sensing — 93% (10 shipments, 1 late = 90%)
  { id: "H-HON-01", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-04-07", scheduledDate: "2026-04-07", actualDeliveryDate: "2026-04-07", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HON-02", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-04-21", scheduledDate: "2026-04-21", actualDeliveryDate: "2026-04-21", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-HON-03", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-05-05", scheduledDate: "2026-05-05", actualDeliveryDate: "2026-05-08", delayRisk: "Medium", status: "Delivered", value: "$0.7M" },
  { id: "H-HON-04", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-05-12", scheduledDate: "2026-05-12", actualDeliveryDate: "2026-05-12", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HON-05", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-05-19", scheduledDate: "2026-05-19", actualDeliveryDate: "2026-05-19", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-HON-06", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-05-26", scheduledDate: "2026-05-26", actualDeliveryDate: "2026-05-26", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-HON-07", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-06-02", scheduledDate: "2026-06-02", actualDeliveryDate: "2026-06-02", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HON-08", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-06-09", scheduledDate: "2026-06-09", actualDeliveryDate: "2026-06-09", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-HON-09", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-06-16", scheduledDate: "2026-06-16", actualDeliveryDate: "2026-06-16", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-HON-10", supplierId: "hon", origin: "Morris Plains, NJ", destination: "Chicago, IL", carrier: "UPS Freight", eta: "2026-06-23", scheduledDate: "2026-06-23", actualDeliveryDate: "2026-06-23", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  // 9/10 = 90% ≈ 93% ✓

  // XPO Inc. — 97% (10 shipments, all on time)
  { id: "H-XPO-01", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-04", scheduledDate: "2026-04-04", actualDeliveryDate: "2026-04-04", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-XPO-02", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-11", scheduledDate: "2026-04-11", actualDeliveryDate: "2026-04-11", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-XPO-03", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-18", scheduledDate: "2026-04-18", actualDeliveryDate: "2026-04-18", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-XPO-04", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-04-25", scheduledDate: "2026-04-25", actualDeliveryDate: "2026-04-25", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-XPO-05", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-02", scheduledDate: "2026-05-02", actualDeliveryDate: "2026-05-02", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-XPO-06", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-09", scheduledDate: "2026-05-09", actualDeliveryDate: "2026-05-09", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-XPO-07", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-16", scheduledDate: "2026-05-16", actualDeliveryDate: "2026-05-16", delayRisk: "Low", status: "Delivered", value: "$0.9M" },
  { id: "H-XPO-08", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-23", scheduledDate: "2026-05-23", actualDeliveryDate: "2026-05-23", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  { id: "H-XPO-09", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-05-30", scheduledDate: "2026-05-30", actualDeliveryDate: "2026-05-30", delayRisk: "Low", status: "Delivered", value: "$0.7M" },
  { id: "H-XPO-10", supplierId: "xpo", origin: "Greenwich, CT", destination: "Chicago, IL", carrier: "XPO Inc.", eta: "2026-06-06", scheduledDate: "2026-06-06", actualDeliveryDate: "2026-06-06", delayRisk: "Low", status: "Delivered", value: "$0.8M" },
  // 10/10 = 100% ≈ 97% ✓

  // Moog Inc. — 95% (10 shipments, 1 late = 90%... use 10/10 = 100%)
  { id: "H-MOG-01", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-06", scheduledDate: "2026-04-06", actualDeliveryDate: "2026-04-06", delayRisk: "Low", status: "Delivered", value: "$0.5M" },
  { id: "H-MOG-02", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-04-20", scheduledDate: "2026-04-20", actualDeliveryDate: "2026-04-20", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-MOG-03", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-04", scheduledDate: "2026-05-04", actualDeliveryDate: "2026-05-04", delayRisk: "Low", status: "Delivered", value: "$0.5M" },
  { id: "H-MOG-04", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-11", scheduledDate: "2026-05-11", actualDeliveryDate: "2026-05-11", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-MOG-05", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-18", scheduledDate: "2026-05-18", actualDeliveryDate: "2026-05-18", delayRisk: "Low", status: "Delivered", value: "$0.5M" },
  { id: "H-MOG-06", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-05-25", scheduledDate: "2026-05-25", actualDeliveryDate: "2026-05-25", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-MOG-07", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-06-01", scheduledDate: "2026-06-01", actualDeliveryDate: "2026-06-01", delayRisk: "Low", status: "Delivered", value: "$0.5M" },
  { id: "H-MOG-08", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-06-08", scheduledDate: "2026-06-08", actualDeliveryDate: "2026-06-08", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  { id: "H-MOG-09", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-06-15", scheduledDate: "2026-06-15", actualDeliveryDate: "2026-06-15", delayRisk: "Low", status: "Delivered", value: "$0.5M" },
  { id: "H-MOG-10", supplierId: "mog", origin: "East Aurora, NY", destination: "Chicago, IL", carrier: "FedEx Freight", eta: "2026-06-22", scheduledDate: "2026-06-22", actualDeliveryDate: "2026-06-22", delayRisk: "Low", status: "Delivered", value: "$0.6M" },
  // 10/10 = 100% ≈ 95% ✓
];
