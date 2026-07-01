"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line } from "react-simple-maps";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Supplier } from "@/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const WB_HQ: [number, number] = [-2.22, 52.19];
const CV_HQ: [number, number] = [-75.75, 39.68];

const SUPPLIER_COORDS: Record<string, [number, number]> = {
  sit: [11.88, 45.41],
  ebm: [9.87, 49.35],
  aal: [5.17, 52.03],
  gru: [9.65, 56.37],
  dan: [9.75, 55.07],
  gfp: [8.63, 47.70],
  dbs: [7.01, 51.46],
  sen: [-71.28, 41.94],
};

const COUNTRY_COORDS: Record<string, [number, number]> = {
  GB: [-2.0, 54.0],   DE: [10.45, 51.17], IT: [12.57, 41.87],
  NL: [5.29, 52.13],  DK: [9.50, 56.26],  CH: [8.23, 46.82],
  FR: [2.21, 46.23],  ES: [-3.75, 40.46], PL: [19.15, 51.92],
  CN: [104.19, 35.86], JP: [138.25, 36.20], US: [-95.71, 37.09],
  SG: [103.82, 1.35], KR: [127.77, 35.91],
};

function getCoords(s: Supplier): [number, number] | null {
  if (SUPPLIER_COORDS[s.id]) return SUPPLIER_COORDS[s.id];
  if (s.countryCode && COUNTRY_COORDS[s.countryCode]) return COUNTRY_COORDS[s.countryCode];
  return null;
}

function riskColor(risk: number | undefined): string {
  if (risk == null) return "#5a6478";
  if (risk >= 65) return "#e84040";
  if (risk >= 45) return "#f59e0b";
  return "#1fd060";
}

export function DashboardRiskMap() {
  const { setRoute, clientMode, currency } = useApp();
  const suppliers = useSuppliers();
  const isWB = clientMode === "wb";
  const HQ = isWB ? WB_HQ : CV_HQ;
  const mapCenter: [number, number] = isWB ? [12, 50] : [-20, 38];
  const mapScale = isWB ? 900 : 380;

  const [hovered, setHovered] = useState<string | null>(null);

  const mapped = suppliers
    .map(s => ({ s, coords: getCoords(s) }))
    .filter((x): x is { s: Supplier; coords: [number, number] } => x.coords !== null);

  const totalExposure = suppliers.reduce((sum, s) => sum + (s.exposure ?? 0), 0);
  const highRisk = suppliers.filter(s => (s.risk ?? 0) >= 65).length;
  const countries = new Set(suppliers.map(s => s.countryCode).filter(Boolean)).size;

  const hoveredS = hovered ? suppliers.find(s => s.id === hovered) ?? null : null;

  return (
    <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid #1a2030", background: "#080a0f" }}>
      {/* Stat overlay — top left */}
      <div style={{
        position: "absolute", top: 16, left: 20, zIndex: 10,
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#5a6478", fontFamily: "var(--mono)", marginBottom: 4 }}>
          Supply Network · {isWB ? "Worcester Bosch" : "Meridian Industrial"}
        </div>
        <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "var(--mono)", lineHeight: 1, color: "#e2e6f0", letterSpacing: "-.03em", fontVariantNumeric: "tabular-nums" }}>
          {currency}{totalExposure.toFixed(1)}M
        </div>
        <div style={{ fontSize: 11, color: "#5a6478", marginTop: 2 }}>Total exposure at risk</div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e84040" }} />
            <span style={{ fontSize: 11, color: "#e2e6f0", fontFamily: "var(--mono)" }}>{highRisk} critical</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#5a6478" }} />
            <span style={{ fontSize: 11, color: "#5a6478", fontFamily: "var(--mono)" }}>{countries} countries</span>
          </div>
        </div>
      </div>

      {/* "View full map" link */}
      <button
        onClick={() => setRoute("geomap")}
        style={{
          position: "absolute", top: 14, right: 16, zIndex: 10,
          background: "rgba(14,17,24,.8)", border: "1px solid #1a2030",
          borderRadius: 6, padding: "5px 10px", fontSize: 11,
          color: "#5a6478", cursor: "pointer", backdropFilter: "blur(4px)",
          fontFamily: "var(--mono)",
        }}
      >
        Full map →
      </button>

      {/* Hover tooltip */}
      {hoveredS && (
        <div style={{
          position: "absolute", bottom: 16, left: 20, zIndex: 10,
          background: "rgba(14,17,24,.95)", border: "1px solid #1a2030",
          borderRadius: 6, padding: "8px 12px", backdropFilter: "blur(8px)",
          pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e6f0" }}>{hoveredS.name}</div>
          <div style={{ fontSize: 11, color: "#5a6478", marginTop: 2 }}>
            {hoveredS.countryCode} · Risk {hoveredS.risk} · {currency}{(hoveredS.exposure ?? 0).toFixed(1)}M exposure
          </div>
        </div>
      )}

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: mapCenter, scale: mapScale }}
        width={900}
        height={320}
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0e1118"
                stroke="#1a2030"
                strokeWidth={0.5}
                style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
              />
            ))
          }
        </Geographies>

        {/* Supply lanes from HQ to each supplier */}
        {mapped.map(({ s, coords }) => (
          <Line
            key={`lane-${s.id}`}
            from={HQ}
            to={coords}
            stroke={riskColor(s.risk)}
            strokeWidth={0.6}
            strokeOpacity={hovered === s.id ? 0.7 : 0.18}
            strokeDasharray="3 4"
          />
        ))}

        {/* Supplier markers */}
        {mapped.map(({ s, coords }) => {
          const color = riskColor(s.risk);
          const isCritical = (s.risk ?? 0) >= 65;
          const isHov = hovered === s.id;
          const r = isHov ? 7 : isCritical ? 6 : 5;
          return (
            <Marker
              key={s.id}
              coordinates={coords}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setRoute("supplier", { id: s.id })}
            >
              {/* Pulse ring for critical */}
              {isCritical && (
                <circle r={12} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3}>
                  <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              <circle r={r} fill={color} fillOpacity={isHov ? 1 : 0.85} stroke="#080a0f" strokeWidth={1.5} style={{ cursor: "pointer", transition: "r 80ms" }} />
            </Marker>
          );
        })}

        {/* HQ marker */}
        <Marker coordinates={HQ}>
          <circle r={5} fill="#00b8d4" stroke="#080a0f" strokeWidth={2} />
          <circle r={10} fill="none" stroke="#00b8d4" strokeWidth={1} strokeOpacity={0.3} />
          <text textAnchor="middle" y={-12} style={{ fontSize: 9, fill: "#00b8d4", fontFamily: "var(--mono)", fontWeight: 700, letterSpacing: ".06em" }}>
            {isWB ? "WB HQ" : "HQ"}
          </text>
        </Marker>
      </ComposableMap>
    </div>
  );
}
