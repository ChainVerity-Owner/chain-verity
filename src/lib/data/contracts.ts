import { Contract } from "@/types";

// Today: 2026-06-30
// noticeDays: days notice required to decline auto-renew or open renewal
// renegotiationWindowDays: how far before expiry the contractual renegotiation window opens
// Contracts currently "Under Renegotiation" or "Pending Renewal" are either
//   (a) inside their window, or (b) triggered early by a financial/performance clause.

export const CONTRACTS: Contract[] = [
  {
    id: "co-01", supplierId: "sit", supplierName: "SIT Group",
    title: "GAS-CTRL-MSA-2023", type: "Master Services",
    expires: "2026-08-31", value: "£18.4M",
    status: "Under Renegotiation", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 180,
    // Window opened ~2026-03-04; SIT's FRISK score decline to 3 also triggered early renegotiation
    financialTriggerClause: true, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: false,
  },
  {
    id: "co-02", supplierId: "ebm", supplierName: "Ebm-papst",
    title: "FAN-MOTOR-SLA-2024", type: "Supply & Service",
    expires: "2026-09-30", value: "£11.7M",
    status: "Active", autoRenew: true,
    noticeDays: 60, renegotiationWindowDays: 60,
    // Enters renegotiation window 2026-08-01; notice to decline auto-renew due 2026-08-01
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: false,
  },
  {
    id: "co-03", supplierId: "gru", supplierName: "Grundfos",
    title: "PUMP-FRAME-2024", type: "Framework",
    expires: "2026-12-31", value: "£16.2M",
    status: "Active", autoRenew: true,
    noticeDays: 60, renegotiationWindowDays: 90,
    // Renegotiation window opens 2026-10-02; notice due 2026-11-01
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: true, tariffPassThroughClause: true,
  },
  {
    id: "co-04", supplierId: "aal", supplierName: "Aalberts Industries",
    title: "FLOW-CTRL-LTA-2022", type: "Long-term Agreement",
    expires: "2026-08-31", value: "£8.3M",
    status: "Pending Renewal", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 120,
    // Window opened 2026-05-03; notice required by 2026-06-02 — now overdue
    financialTriggerClause: true, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: true, tariffPassThroughClause: true,
  },
  {
    id: "co-05", supplierId: "dbs", supplierName: "DB Schenker",
    title: "LOG-EU-FRAME-24", type: "Framework",
    expires: "2027-03-31", value: "£9.6M",
    status: "Active", autoRenew: true,
    noticeDays: 60, renegotiationWindowDays: 90,
    // Renegotiation window opens 2026-12-31; no action needed until then
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: true, tariffPassThroughClause: false,
  },
  {
    id: "co-06", supplierId: "dan", supplierName: "Danfoss",
    title: "VALVE-QPA-2024", type: "Quality & Price",
    expires: "2026-07-31", value: "£7.4M",
    status: "Pending Renewal", autoRenew: false,
    noticeDays: 30, renegotiationWindowDays: 45,
    // Window opened 2026-06-16 — in window now; notice due 2026-07-01
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: false, priceIndexationClause: true, tariffPassThroughClause: true,
  },
  {
    id: "co-07", supplierId: "sen", supplierName: "Sensata Technologies",
    title: "SENSOR-MSA-2023", type: "Master Services",
    expires: "2026-11-30", value: "£6.1M",
    status: "Active", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 180,
    // Window opens 2026-06-03 — just entered; no trigger clauses met yet
    financialTriggerClause: true, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: false,
  },
];

export const CONTRACTS_US: Contract[] = [
  {
    id: "us-co-01", supplierId: "flx", supplierName: "Flex Ltd.",
    title: "EMS-FRAME-2023", type: "Master Services",
    expires: "2026-09-30", value: "$14.2M",
    status: "Under Renegotiation", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 180,
    // Window opened 2026-04-03; Flex FRISK decline to 4 also triggered financial clause
    financialTriggerClause: true, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: true,
  },
  {
    id: "us-co-02", supplierId: "eme", supplierName: "Emerson Electric",
    title: "CTRL-SLA-2024", type: "Supply & Service",
    expires: "2026-12-31", value: "$18.5M",
    status: "Active", autoRenew: true,
    noticeDays: 60, renegotiationWindowDays: 60,
    // Renegotiation window opens 2026-11-01; no action needed until then
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: false,
  },
  {
    id: "us-co-03", supplierId: "phn", supplierName: "Parker Hannifin",
    title: "FLUID-QPA-2024", type: "Quality & Price",
    expires: "2026-09-30", value: "$12.2M",
    status: "Active", autoRenew: true,
    noticeDays: 30, renegotiationWindowDays: 45,
    // Window opens 2026-08-16; notice due 2026-08-31 to decline auto-renew
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: false, priceIndexationClause: true, tariffPassThroughClause: true,
  },
  {
    id: "us-co-04", supplierId: "hay", supplierName: "Haynes International",
    title: "ALLOY-LTA-2022", type: "Long-term Agreement",
    expires: "2026-08-31", value: "$5.6M",
    status: "Pending Renewal", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 120,
    // Window opened 2026-05-03; cobalt price spike also allows price-review under indexation clause
    financialTriggerClause: true, performanceTriggerClause: false,
    forceMajeureClause: true, priceIndexationClause: true, tariffPassThroughClause: true,
  },
  {
    id: "us-co-05", supplierId: "xpo", supplierName: "XPO Inc.",
    title: "LOG-NA-FRAME-24", type: "Framework",
    expires: "2027-03-31", value: "$8.4M",
    status: "Active", autoRenew: true,
    noticeDays: 60, renegotiationWindowDays: 90,
    // Window opens 2026-12-31; no action needed
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: true, tariffPassThroughClause: false,
  },
  {
    id: "us-co-06", supplierId: "zhp", supplierName: "Zhonghe Precision",
    title: "PREC-MSA-2023", type: "Master Services",
    expires: "2026-09-30", value: "$4.8M",
    status: "Under Renegotiation", autoRenew: false,
    noticeDays: 90, renegotiationWindowDays: 180,
    // Window opened 2026-04-03; UFLPA detention and financial deterioration both triggered early renegotiation
    financialTriggerClause: true, performanceTriggerClause: true,
    forceMajeureClause: true, priceIndexationClause: false, tariffPassThroughClause: false,
  },
  {
    id: "us-co-07", supplierId: "hon", supplierName: "Honeywell Sensing",
    title: "SENSOR-QPA-2024", type: "Quality & Price",
    expires: "2026-10-31", value: "$9.8M",
    status: "Active", autoRenew: false,
    noticeDays: 30, renegotiationWindowDays: 45,
    // Window opens 2026-09-16; no action needed until then — lead time issues don't breach SLA thresholds yet
    financialTriggerClause: false, performanceTriggerClause: true,
    forceMajeureClause: false, priceIndexationClause: true, tariffPassThroughClause: true,
  },
];
