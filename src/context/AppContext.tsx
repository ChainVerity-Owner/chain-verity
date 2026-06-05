"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Route, Supplier, ContractContact, LiveEvent, Shipment, Contract, CrisisRoom, GlobalAlert } from "@/types";
import {
  suppliersAll as _suppliersAll,
  suppliersAllUS as _suppliersAllUS,
  LIVE_EVENTS, LIVE_EVENTS_US,
  SHIPMENTS, SHIPMENTS_US,
  CONTRACTS, CONTRACTS_US,
  CRISIS_ROOMS, CRISIS_ROOMS_US,
  GLOBAL_ALERTS, GLOBAL_ALERTS_US,
  RECOVERY_PROFILES, RECOVERY_PROFILES_US,
  CERTIFICATIONS, CERTIFICATIONS_US,
  PRODUCT_LINES, PRODUCT_LINES_US,
  COMMODITIES, COMMODITIES_US,
  ASSESSMENTS, ASSESSMENTS_US,
  BENCHMARKS, BENCHMARKS_US,
} from "@/lib/data";
import type { RecoveryProfile, Certification, ProductLine, CommodityPrice, Assessment, IndustryBenchmark } from "@/types";

export type ClientMode = "wb" | "generic";

function readClientMode(): ClientMode {
  if (typeof window === "undefined") return "wb";
  return new URLSearchParams(window.location.search).get("client") === "wb" ? "wb" : "generic";
}

export type AppRole = "CFO" | "Procurement" | "Analyst";

interface ModalState {
  open: boolean;
  title: string;
  sub: string;
  body: ReactNode;
}

interface RouteEntry {
  route: Route;
  params: Record<string, string>;
}

export interface RiskThresholds {
  highRisk: number;
  currentRatio: number;
  deRatio: number;
}

interface AppContextValue {
  clientMode: ClientMode;
  currency: "$" | "£";
  companyName: string;
  platformEvents: LiveEvent[];
  platformShipments: Shipment[];
  platformContracts: Contract[];
  platformCrisisRooms: CrisisRoom[];
  platformAlerts: GlobalAlert[];
  platformRecoveryProfiles: Record<string, RecoveryProfile>;
  platformCertifications: Record<string, Certification[]>;
  platformProductLines: ProductLine[];
  platformCommodities: CommodityPrice[];
  platformAssessments: Assessment[];
  platformBenchmarks: IndustryBenchmark[];
  route: Route;
  params: Record<string, string>;
  suppliersTab: "governed" | "raw";
  simulatedEscalation: Record<string, boolean>;
  modal: ModalState;
  role: AppRole;
  dismissedAlerts: Record<string, boolean>;
  crisisActionOverrides: Record<string, boolean>;
  contractStatuses: Record<string, string>;
  notificationSettings: Record<string, boolean>;
  riskThresholds: RiskThresholds;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  customSuppliers: Supplier[];
  addSupplier: (s: Supplier) => void;
  addSuppliers: (s: Supplier[]) => void;
  deleteSupplier: (id: string) => void;
  archivedIds: Record<string, boolean>;
  archiveSupplier: (id: string) => void;
  unarchiveSupplier: (id: string) => void;
  setRoute: (route: Route, params?: Record<string, string>) => void;
  goBack: () => void;
  canGoBack: boolean;
  setSuppliersTab: (tab: "governed" | "raw") => void;
  setSimulatedEscalation: (id: string) => void;
  openModal: (title: string, sub: string, body: ReactNode) => void;
  closeModal: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  setRole: (role: AppRole) => void;
  dismissAlert: (id: string) => void;
  toggleCrisisAction: (actionId: string) => void;
  updateContractStatus: (contractId: string, status: string) => void;
  toggleNotification: (key: string) => void;
  setRiskThreshold: (key: keyof RiskThresholds, value: number) => void;
  contractContacts: Record<string, ContractContact>;
  setContractContact: (supplierId: string, contact: ContractContact) => void;
  clearContractContact: (supplierId: string) => void;
  supplierNotes: Record<string, { text: string; ts: string; author: string }[]>;
  addSupplierNote: (supplierId: string, text: string, author: string) => void;
  deleteSupplierNote: (supplierId: string, index: number) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const ROLE_USERS: Record<AppRole, { name: string; title: string; initials: string }> = {
  CFO: { name: "Sarah Renwick", title: "VP Supply Chain", initials: "SR" },
  Procurement: { name: "Marcus Delgado", title: "Head of Procurement", initials: "MD" },
  Analyst: { name: "Priya Nair", title: "Risk Analyst", initials: "PN" },
};

export const ROLE_USERS_MAP = ROLE_USERS;

function parseHash(): { route: Route; params: Record<string, string> } {
  if (typeof window === "undefined") return { route: "dashboard", params: {} };
  const hash = window.location.hash.slice(1); // strip leading #
  if (!hash) return { route: "dashboard", params: {} };
  const [routePart, queryPart] = hash.split("?");
  const params: Record<string, string> = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => { params[k] = v; });
  }
  return { route: (routePart as Route) || "dashboard", params };
}

function pushHash(route: Route, params: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const qs = new URLSearchParams(params).toString();
  window.location.hash = qs ? `${route}?${qs}` : route;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const clientMode = readClientMode();
  const currency = clientMode === "wb" ? "£" as const : "$" as const;
  const companyName = clientMode === "wb" ? "Worcester Bosch" : "Meridian Industrial Group";
  const platformEvents = clientMode === "wb" ? LIVE_EVENTS : LIVE_EVENTS_US;
  const platformShipments = clientMode === "wb" ? SHIPMENTS : SHIPMENTS_US;
  const platformContracts = clientMode === "wb" ? CONTRACTS : CONTRACTS_US;
  const platformCrisisRooms = clientMode === "wb" ? CRISIS_ROOMS : CRISIS_ROOMS_US;
  const platformAlerts = clientMode === "wb" ? GLOBAL_ALERTS : GLOBAL_ALERTS_US;
  const platformRecoveryProfiles = clientMode === "wb" ? RECOVERY_PROFILES : RECOVERY_PROFILES_US;
  const platformCertifications = clientMode === "wb" ? CERTIFICATIONS : CERTIFICATIONS_US;
  const platformProductLines = clientMode === "wb" ? PRODUCT_LINES : PRODUCT_LINES_US;
  const platformCommodities = clientMode === "wb" ? COMMODITIES : COMMODITIES_US;
  const platformAssessments = clientMode === "wb" ? ASSESSMENTS : ASSESSMENTS_US;
  const platformBenchmarks = clientMode === "wb" ? BENCHMARKS : BENCHMARKS_US;
  const initial = parseHash();
  const [route, setRouteState] = useState<Route>(initial.route);
  const [params, setParams] = useState<Record<string, string>>(initial.params);
  const [history, setHistory] = useState<RouteEntry[]>([]);
  const [suppliersTab, setSuppliersTab] = useState<"governed" | "raw">("governed");
  const [simulatedEscalation, setSimulatedEscalationState] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalState>({ open: false, title: "", sub: "", body: null });
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem("cv_dark_mode") === "true"; } catch { return false; }
  });
  const [role, setRoleState] = useState<AppRole>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cv_role") : null;
      return (saved as AppRole) || "CFO";
    } catch { return "CFO"; }
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [crisisActionOverrides, setCrisisActionOverrides] = useState<Record<string, boolean>>({});
  const [contractStatuses, setContractStatuses] = useState<Record<string, string>>({});
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    emailRisk: true,
    slackContracts: true,
    weeklyDigest: false,
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [customSuppliers, setCustomSuppliers] = useState<Supplier[]>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cv_custom_suppliers") : null;
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("cv_custom_suppliers", JSON.stringify(customSuppliers)); } catch {}
  }, [customSuppliers]);

  const addSupplier = useCallback((s: Supplier) => setCustomSuppliers((prev) => [...prev, s]), []);
  const addSuppliers = useCallback((arr: Supplier[]) => setCustomSuppliers((prev) => [...prev, ...arr]), []);
  const deleteSupplier = useCallback((id: string) => setCustomSuppliers((prev) => prev.filter((s) => s.id !== id)), []);

  const [archivedIds, setArchivedIds] = useState<Record<string, boolean>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cv_archived_suppliers") : null;
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("cv_archived_suppliers", JSON.stringify(archivedIds)); } catch {}
  }, [archivedIds]);
  const archiveSupplier = useCallback((id: string) => setArchivedIds((prev) => ({ ...prev, [id]: true })), []);
  const unarchiveSupplier = useCallback((id: string) => setArchivedIds((prev) => { const n = { ...prev }; delete n[id]; return n; }), []);
  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds>({
    highRisk: 70,
    currentRatio: 1.0,
    deRatio: 1.5,
  });

  const setRoute = useCallback((newRoute: Route, newParams: Record<string, string> = {}) => {
    setHistory((prev) => [...prev, { route, params }]);
    setRouteState(newRoute);
    setParams(newParams);
    setMobileSidebarOpen(false);
    pushHash(newRoute, newParams);
  }, [route, params]);

  // Sync state if user navigates via browser back/forward (hash changes externally)
  useEffect(() => {
    function onHashChange() {
      const { route: r, params: p } = parseHash();
      setRouteState(r);
      setParams(p);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setRouteState(last.route);
      setParams(last.params);
      return next;
    });
  }, []);

  const setSimulatedEscalation = useCallback((id: string) => {
    setSimulatedEscalationState((prev) => ({ ...prev, [id]: true }));
  }, []);

  const openModal = useCallback((title: string, sub: string, body: ReactNode) => {
    setModal({ open: true, title, sub, body });
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try { localStorage.setItem("cv_dark_mode", String(darkMode)); } catch {}
  }, [darkMode]);

  useEffect(() => {
    try { localStorage.setItem("cv_role", role); } catch {}
  }, [role]);

  const toggleDarkMode = useCallback(() => setDarkMode((d) => !d), []);
  const setRole = useCallback((r: AppRole) => setRoleState(r), []);

  const dismissAlert = useCallback((id: string) => {
    setDismissedAlerts((prev) => ({ ...prev, [id]: true }));
  }, []);

  const toggleCrisisAction = useCallback((actionId: string) => {
    setCrisisActionOverrides((prev) => ({ ...prev, [actionId]: !prev[actionId] }));
  }, []);

  const updateContractStatus = useCallback((contractId: string, status: string) => {
    setContractStatuses((prev) => ({ ...prev, [contractId]: status }));
  }, []);

  const toggleNotification = useCallback((key: string) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const setRiskThreshold = useCallback((key: keyof RiskThresholds, value: number) => {
    setRiskThresholds((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [contractContacts, setContractContactsState] = useState<Record<string, ContractContact>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cv_contract_contacts") : null;
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("cv_contract_contacts", JSON.stringify(contractContacts)); } catch {}
  }, [contractContacts]);
  const setContractContact = useCallback((supplierId: string, contact: ContractContact) => {
    setContractContactsState((prev) => ({ ...prev, [supplierId]: contact }));
  }, []);
  const clearContractContact = useCallback((supplierId: string) => {
    setContractContactsState((prev) => { const n = { ...prev }; delete n[supplierId]; return n; });
  }, []);

  const [supplierNotes, setSupplierNotes] = useState<Record<string, { text: string; ts: string; author: string }[]>>(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("cv_supplier_notes") : null;
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try { localStorage.setItem("cv_supplier_notes", JSON.stringify(supplierNotes)); } catch {}
  }, [supplierNotes]);
  const addSupplierNote = useCallback((supplierId: string, text: string, author: string) => {
    setSupplierNotes((prev) => ({
      ...prev,
      [supplierId]: [...(prev[supplierId] || []), { text, ts: new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), author }],
    }));
  }, []);
  const deleteSupplierNote = useCallback((supplierId: string, index: number) => {
    setSupplierNotes((prev) => ({
      ...prev,
      [supplierId]: (prev[supplierId] || []).filter((_, i) => i !== index),
    }));
  }, []);

  return (
    <AppContext.Provider value={{
      clientMode, currency, companyName,
      platformEvents, platformShipments, platformContracts, platformCrisisRooms, platformAlerts,
      platformRecoveryProfiles, platformCertifications, platformProductLines,
      platformCommodities, platformAssessments, platformBenchmarks,
      route, params, suppliersTab, simulatedEscalation, modal,
      role, darkMode, dismissedAlerts, crisisActionOverrides, contractStatuses,
      notificationSettings, riskThresholds,
      mobileSidebarOpen, setMobileSidebarOpen,
      customSuppliers, addSupplier, addSuppliers, deleteSupplier,
      archivedIds, archiveSupplier, unarchiveSupplier,
      setRoute, goBack, canGoBack: history.length > 0,
      setSuppliersTab, setSimulatedEscalation,
      openModal, closeModal,
      setRole, toggleDarkMode, dismissAlert, toggleCrisisAction, updateContractStatus,
      toggleNotification, setRiskThreshold,
      contractContacts, setContractContact, clearContractContact,
      supplierNotes, addSupplierNote, deleteSupplierNote,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useSuppliers(includeArchived = false) {
  const { customSuppliers, archivedIds, clientMode } = useApp();
  const baseSuppliers = clientMode === "wb" ? _suppliersAll : _suppliersAllUS;
  const all = [...baseSuppliers, ...customSuppliers];
  return includeArchived ? all : all.filter((s) => !archivedIds[s.id]);
}
