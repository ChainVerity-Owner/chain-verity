"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { GovernedView } from "./GovernedView";
import { DirectoryView } from "./DirectoryView";
import { AddSupplierModal } from "./AddSupplierModal";
import { ROLE_PERMS } from "@/lib/roles";

export function Suppliers() {
  const { suppliersTab, setSuppliersTab, role } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const canEdit = ROLE_PERMS.canEditSuppliers(role);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {showAdd && <AddSupplierModal onClose={() => setShowAdd(false)} />}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0 }}>Supplier Directory</h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>Governed view (category + lifecycle) and raw directory with filters.</div>
          </div>
          {canEdit && <button className="btn primary" onClick={() => setShowAdd(true)}>+ Add Supplier</button>}
        </div>
        <div className="tabs" style={{ marginTop: 12 }}>
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
