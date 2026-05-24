"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { AppRole } from "@/context/AppContext";
import { suppliersAll, GLOBAL_ALERTS } from "@/lib/data";
import { downloadStub } from "@/lib/utils";

const pageMeta: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Working capital at risk, first." },
  alerts: { title: "Alerts", sub: "Unified alert feed." },
  suppliers: { title: "Suppliers", sub: "Governed workflow + directory." },
  supplier: { title: "Supplier", sub: "" },
  contracts: { title: "Contracts", sub: "Renewal governance and action tracking." },
  analytics: { title: "Analytics", sub: "Disruption what-if modeling." },
  reports: { title: "Reports", sub: "Exportable decision narratives." },
  admin: { title: "Admin", sub: "User management and integrations." },
  settings: { title: "Settings", sub: "Platform configuration." },
  events: { title: "Live Events", sub: "AI-monitored disruptions across 150+ risk categories · 400+ languages." },
  network: { title: "Network Map", sub: "N-tier supply chain mapping · Sites · Dependencies." },
  esg: { title: "ESG & Compliance", sub: "Environmental, Social, Governance · CSDDD · LkSG · EUDR · CSRD." },
  crisis: { title: "Crisis Response", sub: "WarRoom-style incident management · Impact tracking · Action coordination." },
};

export function Topbar() {
  const { route, params, setRoute, goBack, canGoBack, openModal, closeModal, role, setRole, dismissedAlerts } = useApp();
  const [search, setSearch] = useState("");
  const meta = pageMeta[route] || { title: route, sub: "" };

  const title = route === "supplier"
    ? suppliersAll.find((s) => s.id === params.id)?.name || "Supplier"
    : meta.title;

  const sub = route === "supplier"
    ? (() => {
        const s = suppliersAll.find((x) => x.id === params.id);
        return s ? `Tier ${s.tier ?? "—"} · ${s.category || "—"} · ${s.region || "—"}` : "";
      })()
    : meta.sub;

  const allAlerts = [
    ...GLOBAL_ALERTS,
    ...suppliersAll.flatMap((s) => s.alerts || []),
  ];
  const undismissedCount = allAlerts.filter((a) => !dismissedAlerts[a.id]).length;

  function handleSearch(value: string) {
    setSearch(value);
    const t = value.toLowerCase().trim();
    if (!t) return;
    const m = suppliersAll.find((s) => (s.name || "").toLowerCase().includes(t));
    if (m) setRoute("supplier", { id: m.id });
  }

  function handleExport() {
    const csvRows = [
      ["Supplier", "Tier", "Category", "Region", "Risk Score", "Risk State", "Spend", "Exposure"].join(","),
      ...suppliersAll.map((s) =>
        [
          `"${s.name}"`,
          s.tier ?? "",
          `"${s.category ?? ""}"`,
          s.region ?? "",
          s.risk ?? "",
          `"${s.riskState ?? ""}"`,
          s.spend ?? "",
          s.exposure ?? "",
        ].join(",")
      ),
    ].join("\n");

    openModal(
      "Export",
      "Export options",
      <div>
        <div className="inline" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={() => { downloadStub("chain_verity_suppliers.csv", csvRows); closeModal(); }}>
            Download CSV
          </button>
          <button className="btn" onClick={closeModal}>Cancel</button>
        </div>
        <div className="note" style={{ marginTop: 8 }}>CSV includes all {suppliersAll.length} suppliers with risk scores, states, spend, and exposure.</div>
      </div>
    );
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button
          className={`btn back-btn ${!canGoBack ? "hidden" : ""}`}
          onClick={goBack}
        >
          ← Back
        </button>
        <div>
          <div className="page-title">{title}</div>
          <div className="page-sub">{sub}</div>
        </div>
      </div>
      <div className="topbar-right">
        <input
          className="tb-input"
          placeholder="Jump to supplier…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <select
          className="tb-select"
          value={`Role: ${role}`}
          onChange={(e) => setRole(e.target.value.replace("Role: ", "") as AppRole)}
        >
          <option>Role: CFO</option>
          <option>Role: Procurement</option>
          <option>Role: Analyst</option>
        </select>
        <button className="btn" onClick={() => setRoute("alerts")}>
          Alerts{" "}
          <span className="alert-badge" style={{ background: undismissedCount > 0 ? undefined : "var(--muted)" }}>
            {undismissedCount}
          </span>
        </button>
        <button className="btn primary" onClick={handleExport}>Export</button>
      </div>
    </div>
  );
}
