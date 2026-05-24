"use client";

import { useApp } from "@/context/AppContext";
import { suppliersAll } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { riskStateClass, riskStateLabel } from "@/lib/utils";

export function GovernedView() {
  const { setRoute } = useApp();

  return (
    <div className="card">
      <div className="muted" style={{ marginBottom: 12 }}>
        Click a supplier to open the governed workflow with financial trend charts and disruption modeling.
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Tier</th>
              <th>Category</th>
              <th>Region</th>
              <th>Risk State</th>
              <th>Freshness</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliersAll.map((s) => (
              <tr key={s.id}>
                <td><b>{s.name}</b></td>
                <td>{s.tier ?? "—"}</td>
                <td>{s.category || "—"} <span className="muted">({s.categoryConfidence || "—"})</span></td>
                <td>{s.region || "—"}</td>
                <td>
                  <Badge variant={riskStateClass(s.riskState, s.risk) as any}>
                    {riskStateLabel(s.riskState, s.risk)}
                  </Badge>
                </td>
                <td className="muted" style={{ fontSize: 12 }}>{s.data?.updatedLabel || "—"}</td>
                <td>
                  <button className="btn" onClick={() => setRoute("supplier", { id: s.id })}>Open</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
