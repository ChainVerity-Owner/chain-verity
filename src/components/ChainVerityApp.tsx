"use client";

import { AppProvider, useApp } from "@/context/AppContext";
import { ROLE_ROUTES } from "@/lib/roles";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Modal } from "@/components/layout/Modal";
import { Dashboard } from "@/components/views/Dashboard";
import { Alerts } from "@/components/views/Alerts";
import { Suppliers } from "@/components/views/Suppliers";
import { SupplierDetail } from "@/components/views/SupplierDetail";
import { Contracts } from "@/components/views/Contracts";
import { Analytics } from "@/components/views/Analytics";
import { Reports } from "@/components/views/Reports";
import { Admin } from "@/components/views/Admin";
import { Settings } from "@/components/views/Settings";
import { LiveEvents } from "@/components/views/LiveEvents";
import { NetworkMap } from "@/components/views/NetworkMap";
import { ESGCompliance } from "@/components/views/ESGCompliance";
import { CrisisResponse } from "@/components/views/CrisisResponse";
import { RecoveryIntelligence } from "@/components/views/RecoveryIntelligence";
import { Commodities } from "@/components/views/Commodities";
import { Assessments } from "@/components/views/Assessments";
import { SubTierIntelligence } from "@/components/views/SubTierIntelligence";
import { GeoRiskMap } from "@/components/views/GeoRiskMap";
import { AIChat } from "@/components/ui/AIChat";

function AppContent() {
  const { route, role, mobileSidebarOpen, setMobileSidebarOpen } = useApp();
  const allowed = ROLE_ROUTES[role];
  const activeRoute = allowed.includes(route) ? route : "dashboard";

  const views: Record<string, React.ReactNode> = {
    dashboard: <Dashboard />,
    alerts: <Alerts />,
    suppliers: <Suppliers />,
    supplier: <SupplierDetail />,
    contracts: <Contracts />,
    analytics: <Analytics />,
    reports: <Reports />,
    admin: <Admin />,
    settings: <Settings />,
    events: <LiveEvents />,
    network: <NetworkMap />,
    esg: <ESGCompliance />,
    crisis: <CrisisResponse />,
    recovery: <RecoveryIntelligence />,
    commodities: <Commodities />,
    assessments: <Assessments />,
    subtier: <SubTierIntelligence />,
    geomap: <GeoRiskMap />,
  };

  return (
    <div className="app">
      {mobileSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">{views[activeRoute] ?? <Dashboard />}</div>
      </main>
      <Modal />
      <AIChat />
    </div>
  );
}

export function ChainVerityApp() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
