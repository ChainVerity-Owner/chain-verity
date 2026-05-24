"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Route } from "@/types";

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
}

const AppContext = createContext<AppContextValue | null>(null);

const ROLE_USERS: Record<AppRole, { name: string; title: string; initials: string }> = {
  CFO: { name: "Sarah Renwick", title: "VP Supply Chain", initials: "SR" },
  Procurement: { name: "Marcus Delgado", title: "Head of Procurement", initials: "MD" },
  Analyst: { name: "Priya Nair", title: "Risk Analyst", initials: "PN" },
};

export const ROLE_USERS_MAP = ROLE_USERS;

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRouteState] = useState<Route>("dashboard");
  const [params, setParams] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<RouteEntry[]>([]);
  const [suppliersTab, setSuppliersTab] = useState<"governed" | "raw">("governed");
  const [simulatedEscalation, setSimulatedEscalationState] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalState>({ open: false, title: "", sub: "", body: null });
  const [darkMode, setDarkMode] = useState(false);
  const [role, setRoleState] = useState<AppRole>("CFO");
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});
  const [crisisActionOverrides, setCrisisActionOverrides] = useState<Record<string, boolean>>({});
  const [contractStatuses, setContractStatuses] = useState<Record<string, string>>({});
  const [notificationSettings, setNotificationSettings] = useState<Record<string, boolean>>({
    emailRisk: true,
    slackContracts: true,
    weeklyDigest: false,
  });
  const [riskThresholds, setRiskThresholds] = useState<RiskThresholds>({
    highRisk: 70,
    currentRatio: 1.0,
    deRatio: 1.5,
  });

  const setRoute = useCallback((newRoute: Route, newParams: Record<string, string> = {}) => {
    setHistory((prev) => [...prev, { route, params }]);
    setRouteState(newRoute);
    setParams(newParams);
  }, [route, params]);

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
  }, [darkMode]);

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

  return (
    <AppContext.Provider value={{
      route, params, suppliersTab, simulatedEscalation, modal,
      role, darkMode, dismissedAlerts, crisisActionOverrides, contractStatuses,
      notificationSettings, riskThresholds,
      setRoute, goBack, canGoBack: history.length > 0,
      setSuppliersTab, setSimulatedEscalation,
      openModal, closeModal,
      setRole, toggleDarkMode, dismissAlert, toggleCrisisAction, updateContractStatus,
      toggleNotification, setRiskThreshold,
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
