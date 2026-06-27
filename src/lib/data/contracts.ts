import { Contract } from "@/types";

export const CONTRACTS: Contract[] = [
  { id: "co-01", supplierId: "sit", supplierName: "SIT Group", title: "GAS-CTRL-MSA-2023", type: "Master Services", expires: "2025-12-15", value: "£18.4M", status: "Under Renegotiation", autoRenew: false },
  { id: "co-02", supplierId: "ebm", supplierName: "Ebm-papst", title: "FAN-MOTOR-SLA-2024", type: "Supply & Service", expires: "2026-03-31", value: "£11.7M", status: "Active", autoRenew: true },
  { id: "co-03", supplierId: "gru", supplierName: "Grundfos", title: "PUMP-FRAME-2024", type: "Framework", expires: "2026-06-30", value: "£16.2M", status: "Active", autoRenew: true },
  { id: "co-04", supplierId: "aal", supplierName: "Aalberts Industries", title: "FLOW-CTRL-LTA-2022", type: "Long-term Agreement", expires: "2025-11-01", value: "£8.3M", status: "Pending Renewal", autoRenew: false },
  { id: "co-05", supplierId: "dbs", supplierName: "DB Schenker", title: "LOG-EU-FRAME-24", type: "Framework", expires: "2026-09-30", value: "£9.6M", status: "Active", autoRenew: true },
  { id: "co-06", supplierId: "dan", supplierName: "Danfoss", title: "VALVE-QPA-2024", type: "Quality & Price", expires: "2025-10-31", value: "£7.4M", status: "Pending Renewal", autoRenew: false },
  { id: "co-07", supplierId: "sen", supplierName: "Sensata Technologies", title: "SENSOR-MSA-2023", type: "Master Services", expires: "2026-02-28", value: "£6.1M", status: "Active", autoRenew: false },
];

export const CONTRACTS_US: Contract[] = [
  { id: "us-co-01", supplierId: "flx", supplierName: "Flex Ltd.", title: "EMS-FRAME-2023", type: "Master Services", expires: "2025-12-31", value: "$14.2M", status: "Under Renegotiation", autoRenew: false },
  { id: "us-co-02", supplierId: "eme", supplierName: "Emerson Electric", title: "CTRL-SLA-2024", type: "Supply & Service", expires: "2026-06-30", value: "$18.5M", status: "Active", autoRenew: true },
  { id: "us-co-03", supplierId: "phn", supplierName: "Parker Hannifin", title: "FLUID-QPA-2024", type: "Quality & Price", expires: "2026-03-31", value: "$12.2M", status: "Active", autoRenew: true },
  { id: "us-co-04", supplierId: "hay", supplierName: "Haynes International", title: "ALLOY-LTA-2022", type: "Long-term Agreement", expires: "2025-11-15", value: "$5.6M", status: "Pending Renewal", autoRenew: false },
  { id: "us-co-05", supplierId: "xpo", supplierName: "XPO Inc.", title: "LOG-NA-FRAME-24", type: "Framework", expires: "2026-09-30", value: "$8.4M", status: "Active", autoRenew: true },
  { id: "us-co-06", supplierId: "zhp", supplierName: "Zhonghe Precision", title: "PREC-MSA-2023", type: "Master Services", expires: "2025-10-31", value: "$4.8M", status: "Under Renegotiation", autoRenew: false },
  { id: "us-co-07", supplierId: "hon", supplierName: "Honeywell Sensing", title: "SENSOR-QPA-2024", type: "Quality & Price", expires: "2026-02-28", value: "$9.8M", status: "Active", autoRenew: false },
];
