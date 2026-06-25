"use client";

import { useEffect, useState } from "react";
import { KpiCardV2 } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkline, TrendPill } from "@/components/ui/Charts";
import { useApp, useSuppliers } from "@/context/AppContext";
import { CommodityPrice } from "@/types";
import { InfoTip } from "@/components/ui/InfoTip";

interface FredLive {
  id: string;
  currentPrice: number;
  priceHistory: number[];
  changePercent: number;
  trend: string;
  lastUpdated: string | null;
}

function trendColor(t: string) {
  if (t === "Rising") return "var(--risk)";
  if (t === "Falling") return "var(--ok)";
  return "var(--info)";
}

function volVariant(v: string) {
  if (v === "High") return "risk" as const;
  if (v === "Medium") return "warn" as const;
  return "ok" as const;
}

export function Commodities() {
  const { setRoute, platformCommodities } = useApp();
  const suppliers = useSuppliers();
  const [liveData, setLiveData] = useState<Record<string, FredLive>>({});
  const [liveStatus, setLiveStatus] = useState<"loading" | "live" | "static">("loading");

  useEffect(() => {
    fetch("/api/fred")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: FredLive[] | null) => {
        if (data && Array.isArray(data)) {
          const map: Record<string, FredLive> = {};
          data.forEach((item) => { map[item.id] = item; });
          setLiveData(map);
          setLiveStatus("live");
        } else {
          setLiveStatus("static");
        }
      })
      .catch(() => setLiveStatus("static"));
  }, []);

  // Merge static data with live FRED data where available
  const commodities: (CommodityPrice & { isLive?: boolean; lastUpdated?: string | null })[] =
    platformCommodities.map((c) => {
      const live = liveData[c.id];
      if (!live) return c;
      return {
        ...c,
        currentPrice: live.currentPrice,
        priceHistory: live.priceHistory,
        changePercent: live.changePercent,
        trend: live.trend as CommodityPrice["trend"],
        isLive: true,
        lastUpdated: live.lastUpdated,
      };
    });

  const alerting = commodities.filter((c) => c.alert).length;
  const rising = commodities.filter((c) => c.trend === "Rising").length;
  const biggestMover = commodities.reduce((prev, curr) =>
    Math.abs(curr.changePercent) > Math.abs(prev.changePercent) ? curr : prev
  );
  const avgChange =
    commodities.reduce((a, c) => a + c.changePercent, 0) / commodities.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPIs */}
      <div className="grid-4">
        <KpiCardV2
          label="Price Alerts Active"
          value={String(alerting)}
          sub="Commodities above threshold"
          accent="var(--risk)"
          icon="🚨"
        />
        <KpiCardV2
          label="Rising Commodities"
          value={String(rising)}
          sub="vs. 3 months prior"
          accent="var(--warn)"
          icon="📈"
        />
        <KpiCardV2
          label="Biggest Mover"
          value={biggestMover.name}
          sub={`${biggestMover.changePercent > 0 ? "+" : ""}${biggestMover.changePercent}% QoQ`}
          accent="var(--warn)"
          icon="⚡"
        />
        <KpiCardV2
          label="Portfolio Avg Change"
          value={`${avgChange > 0 ? "+" : ""}${avgChange.toFixed(1)}%`}
          sub="Blended commodity basket"
          accent={avgChange > 0 ? "var(--warn)" : "var(--ok)"}
          icon="📊"
        />
      </div>

      {/* Alert banner */}
      {platformCommodities.filter((c) => c.alert).length > 0 && (
        <div
          style={{
            background: "rgba(220,38,38,.07)",
            border: "1px solid rgba(220,38,38,.2)",
            borderRadius: 12,
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--risk)",
              marginBottom: 6,
              fontSize: 13,
            }}
          >
            ⚡ Active Commodity Alerts
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {platformCommodities.filter((c) => c.alert).map((c) => (
              <div key={c.id} style={{ fontSize: 13, color: "var(--text)" }}>
                <b>{c.name}</b> — {c.alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live status bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: liveStatus === "live" ? "var(--ok)" : liveStatus === "loading" ? "var(--warn)" : "var(--muted)", flexShrink: 0 }} />
        <span className="muted" style={{ fontSize: 12 }}>
          {liveStatus === "live"
            ? "Commodity prices live via FRED (Federal Reserve) · USD denominated"
            : liveStatus === "loading"
            ? "Fetching live commodity prices from FRED…"
            : "Using indicative prices — add FRED_API_KEY to enable live data"}
        </span>
      </div>

      {/* Commodity cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {commodities.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{ padding: 16, margin: 0 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {c.unit} · {c.currency}
                </div>
              </div>
              <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                <Badge variant={volVariant(c.volatility)} style={{ fontSize: 10 }}>
                  {c.volatility} vol.
                </Badge>
                {(c as { isLive?: boolean }).isLive && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "var(--ok)", letterSpacing: ".06em" }}>● LIVE</span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: trendColor(c.trend),
                  }}
                >
                  {c.currentPrice.toLocaleString()}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: trendColor(c.trend),
                    }}
                  >
                    {c.trend === "Rising" ? "↑" : c.trend === "Falling" ? "↓" : "→"}{" "}
                    {c.trend}
                  </span>
                  <TrendPill value={c.changePercent} higherIsBetter={false} />
                </div>
              </div>
              <Sparkline
                data={c.priceHistory}
                color={trendColor(c.trend)}
                height={40}
                width={80}
                filled
              />
            </div>

            <div
              style={{
                borderTop: "1px solid var(--line)",
                paddingTop: 10,
                marginTop: 4,
              }}
            >
              <div
                className="muted"
                style={{ fontSize: 11, marginBottom: 6 }}
              >
                Affected categories: {c.affectedCategories.join(", ")}
              </div>
              {c.alert && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--risk)",
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  ⚠ {c.alert}
                </div>
              )}
              <div className="muted" style={{ fontSize: 11 }}>
                Affected suppliers:{" "}
                {c.affectedSupplierIds.map((id, idx) => {
                  const s = suppliers.find((x) => x.id === id);
                  return s ? (
                    <span
                      key={id}
                      style={{
                        color: "var(--accent)",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onClick={() => setRoute("supplier", { id })}
                    >
                      {s.name}
                      {idx < c.affectedSupplierIds.length - 1 ? ", " : ""}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cross-impact table */}
      <div className="card">
        <h2>Supplier Commodity Exposure<InfoTip text="Maps raw material commodity prices to the suppliers that depend on them. Rising input costs squeeze supplier margins and may trigger credit deterioration, cost pass-through requests, or delivery delays." width={240} /></h2>
        <div className="card-sub">
          Which suppliers are exposed to rising commodities · sorted by total commodity exposures
        </div>
        <div className="table-wrap" style={{ marginTop: 14 }}>
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Exposed Commodities</th>
                <th>Rising Exposure</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {suppliers
                .map((s) => {
                  const exposed = commodities.filter((c) =>
                    c.affectedSupplierIds.includes(s.id)
                  );
                  if (exposed.length === 0) return null;
                  const risingExp = exposed.filter((c) => c.trend === "Rising");
                  return { s, exposed, risingExp };
                })
                .filter(Boolean)
                .sort((a, b) => b!.risingExp.length - a!.risingExp.length)
                .map((row) => {
                  if (!row) return null;
                  const { s, exposed, risingExp } = row;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{s.name}</div>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {s.region}
                        </div>
                      </td>
                      <td>Tier {s.tier}</td>
                      <td style={{ fontSize: 12 }}>{s.category}</td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 4,
                          }}
                        >
                          {exposed.map((c) => (
                            <span
                              key={c.id}
                              style={{
                                fontSize: 10,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background:
                                  c.trend === "Rising"
                                    ? "rgba(220,38,38,.1)"
                                    : "var(--surface)",
                                color:
                                  c.trend === "Rising"
                                    ? "var(--risk)"
                                    : "var(--text)",
                                border: "1px solid var(--line)",
                              }}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              risingExp.length > 0
                                ? "var(--risk)"
                                : "var(--ok)",
                          }}
                        >
                          {risingExp.length} / {exposed.length}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn"
                          style={{ fontSize: 12 }}
                          onClick={() => setRoute("supplier", { id: s.id })}
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="note">
          Commodity prices sourced from LME, Platts, and TTF spot markets · refreshed every 4 hours.
        </div>
      </div>
    </div>
  );
}
