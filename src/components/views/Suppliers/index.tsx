"use client";

import { useApp } from "@/context/AppContext";
import { GovernedView } from "./GovernedView";
import { DirectoryView } from "./DirectoryView";

export function Suppliers() {
  const { suppliersTab, setSuppliersTab } = useApp();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="card">
        <h2>Supplier Directory</h2>
        <div className="card-sub">Governed view (category + lifecycle) and raw directory with filters.</div>
        <div className="tabs" style={{ marginTop: 10 }}>
          <button
            className={`tab ${suppliersTab === "governed" ? "active" : ""}`}
            onClick={() => setSuppliersTab("governed")}
          >
            Governed View
          </button>
          <button
            className={`tab ${suppliersTab === "raw" ? "active" : ""}`}
            onClick={() => setSuppliersTab("raw")}
          >
            Directory + Filters
          </button>
        </div>
      </div>
      {suppliersTab === "governed" ? <GovernedView /> : <DirectoryView />}
    </div>
  );
}
