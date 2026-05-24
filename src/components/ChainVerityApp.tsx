"use client";

import { AppProvider, useApp } from "@/context/AppContext";
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

function AppContent() {
  const { route } = useApp();

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
  };

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content">{views[route] ?? <Dashboard />}</div>
      </main>
      <Modal />
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
