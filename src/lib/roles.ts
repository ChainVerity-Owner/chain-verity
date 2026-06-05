import { AppRole } from "@/context/AppContext";
import { Route } from "@/types";

// Which routes each role can navigate to
export const ROLE_ROUTES: Record<AppRole, Route[]> = {
  CFO: ["dashboard", "alerts", "events", "crisis", "suppliers", "supplier", "contracts", "reports", "geomap", "settings"],
  Procurement: ["dashboard", "alerts", "events", "crisis", "suppliers", "supplier", "network", "subtier", "geomap", "contracts", "analytics", "esg", "recovery", "commodities", "assessments", "reports", "admin", "settings"],
  Analyst: ["dashboard", "alerts", "events", "suppliers", "supplier", "network", "subtier", "geomap", "analytics", "esg", "recovery", "commodities", "assessments", "reports", "settings"],
};

// Feature-level permissions
export const ROLE_PERMS = {
  canEditSuppliers: (role: AppRole) => role === "Procurement",
  canManageContracts: (role: AppRole) => role === "Procurement",
  canAccessCrisis: (role: AppRole) => role === "Procurement",
  canAccessAdmin: (role: AppRole) => role === "Procurement",
  canSeeOperationalKPIs: (role: AppRole) => role === "Procurement",
  canSeeFinancialKPIs: (role: AppRole) => role === "CFO",
  canSeeAnalyticalKPIs: (role: AppRole) => role === "Analyst",
} as const;
