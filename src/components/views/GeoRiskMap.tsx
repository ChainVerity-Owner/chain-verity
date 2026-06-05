"use client";

import { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from "react-simple-maps";
import { useApp, useSuppliers } from "@/context/AppContext";
import { LIVE_EVENTS, LIVE_EVENTS_US } from "@/lib/data";
import { Supplier } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { KpiCardV2 } from "@/components/ui/Card";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// HQ coordinates
const WB_HQ: [number, number]       = [-2.22,   52.19];  // Worcester, UK
const CV_HQ: [number, number]       = [-75.75,  39.68];  // Newark, DE

// Per-supplier city-level coordinates [lon, lat]
const SUPPLIER_COORDS: Record<string, [number, number]> = {
  sit: [11.88, 45.41],   // Padova, Italy
  ebm: [9.87, 49.35],    // Mulfingen, Germany
  aal: [5.17, 52.03],    // Houten, Netherlands
  gru: [9.65, 56.37],    // Bjerringbro, Denmark
  dan: [9.75, 55.07],    // Nordborg, Denmark
  gfp: [8.63, 47.70],    // Schaffhausen, Switzerland
  dbs: [7.01, 51.46],    // Essen, Germany
  sen: [-71.28, 41.94],  // Attleboro, MA — USA
};

// Country code → center coordinates fallback [lon, lat]
const COUNTRY_COORDS: Record<string, [number, number]> = {
  GB: [-2.0,   54.0],  DE: [10.45,  51.17], IT: [12.57, 41.87],
  NL: [5.29,   52.13], DK: [9.50,   56.26], CH: [8.23,  46.82],
  FR: [2.21,   46.23], ES: [-3.75,  40.46], PL: [19.15, 51.92],
  CN: [104.19, 35.86], JP: [138.25, 36.20], US: [-95.71, 37.09],
  KR: [127.77, 35.91], IN: [78.96,  20.59], BR: [-51.93, -14.24],
  MX: [-102.55, 23.63], CA: [-106.35, 56.13], AU: [133.78, -25.27],
  SE: [18.64,  60.13], NO: [8.47,   60.47], FI: [25.75, 61.92],
  AT: [14.55,  47.52], BE: [4.47,   50.50], CZ: [15.47, 49.82],
  TR: [35.24,  38.96], TW: [120.96, 23.70], SG: [103.82,  1.35],
  RO: [24.97,  45.94], PT: [-8.22,  39.40], HU: [19.50, 47.16],
};

// Live event country name → coordinates
const EVENT_COORDS: Record<string, [number, number]> = {
  "Netherlands":    [5.29,   52.13],
  "Germany":        [10.45,  51.17],
  "Italy":          [12.57,  41.87],
  "United Kingdom": [-2.0,   54.0],
  "Switzerland":    [8.23,   46.82],
  "United States":  [-95.71, 37.09],
  "Denmark":        [9.50,   56.26],
  "EU-wide":        [15.0,   48.0],
};

function riskColor(risk: number | undefined): string {
  if (risk == null) return "#6b7280";
  if (risk >= 65) return "#dc2626";
  if (risk >= 45) return "#d97706";
  return "#16a34a";
}

function severityColor(severity: string): string {
  if (severity === "critical") return "#dc2626";
  if (severity === "high") return "#d97706";
  if (severity === "medium") return "#2563eb";
  return "#6b7280";
}

function getCoords(s: Supplier): [number, number] | null {
  if (SUPPLIER_COORDS[s.id]) return SUPPLIER_COORDS[s.id];
  if (s.countryCode && COUNTRY_COORDS[s.countryCode]) return COUNTRY_COORDS[s.countryCode];
  if (s.region === "EU") return [10.0, 50.0];
  if (s.region === "NA") return [-95.71, 37.09];
  if (s.region === "APAC") return [120.0, 15.0];
  return null;
}

export function GeoRiskMap() {
  const { setRoute, clientMode, platformEvents, currency } = useApp();
  const suppliers = useSuppliers();
  const isWB    = clientMode === "wb";
  const HQ      = isWB ? WB_HQ : CV_HQ;
  const hqLabel = isWB ? "WB HQ" : "CV HQ";
  const hqNote  = isWB ? "Worcester Bosch HQ · Worcester, UK" : "Chain Verity HQ · Newark, DE";
  const hqColor = isWB ? "#003087" : "#0f172a";
  const mapCenter: [number, number] = isWB ? [10, 48] : [-30, 42];

  const [hovered, setHovered] = useState<string | null>(null);
  const [showLanes, setShowLanes] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>(mapCenter);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);

  // Map suppliers to coordinates
  const mapped = suppliers
    .map((s) => ({ s, coords: getCoords(s) }))
    .filter((x): x is { s: Supplier; coords: [number, number] } => x.coords !== null);

  const filtered = mapped.filter(({ s }) => {
    if (riskFilter === "high") return (s.risk ?? 0) >= 65;
    if (riskFilter === "medium") return (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65;
    if (riskFilter === "low") return (s.risk ?? 0) < 45;
    return true;
  });

  // KPIs
  const highRiskCount = suppliers.filter((s) => (s.risk ?? 0) >= 65).length;
  const medRiskCount = suppliers.filter((s) => (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65).length;
  const countryCodes = new Set(suppliers.map((s) => s.countryCode).filter(Boolean));
  const avgRisk = suppliers.length
    ? Math.round(suppliers.reduce((a, s) => a + (s.risk ?? 0), 0) / suppliers.length)
    : 0;

  const hoveredS = hovered ? suppliers.find((s) => s.id === hovered) ?? null : null;
  const activeEvents = platformEvents.filter((e) => e.status === "Active").length;

  // Toggle button style helper
  const toggleStyle = (on: boolean): React.CSSProperties => ({
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 6,
    border: "1px solid var(--line)",
    background: on ? "var(--accent)" : "var(--surface)",
    color: on ? "white" : "var(--fg)",
    cursor: "pointer",
    fontWeight: 600,
    transition: "all .15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* KPI strip */}
      <div className="grid-4">
        <KpiCardV2
          label="Mapped Suppliers"
          value={String(mapped.length)}
          sub={`Across ${countryCodes.size} countries`}
          icon="📍"
          accent="var(--accent)"
        />
        <KpiCardV2
          label="High Risk"
          value={String(highRiskCount)}
          sub={`${medRiskCount} medium · ${mapped.length - highRiskCount - medRiskCount} low`}
          icon="🔴"
          accent="var(--risk)"
          trendHigherIsBetter={false}
        />
        <KpiCardV2
          label="Portfolio Avg Risk"
          value={String(avgRisk)}
          sub="Computed across all suppliers"
          icon="📊"
          accent={avgRisk >= 65 ? "var(--risk)" : avgRisk >= 45 ? "var(--warn)" : "var(--ok)"}
        />
        <KpiCardV2
          label="Active Events"
          value={String(activeEvents)}
          sub="Disruptions requiring attention"
          icon="⚠️"
          accent="var(--warn)"
          trendHigherIsBetter={false}
        />
      </div>

      {/* Map card */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Global Supply Chain Risk Map</div>
            <div className="card-sub" style={{ marginBottom: 0, marginTop: 2 }}>
              Supplier footprint · Risk concentration · Live disruption events
            </div>
          </div>
          <div className="inline" style={{ marginLeft: "auto" }}>
            <select
              className="tb-select"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk (≥65)</option>
              <option value="medium">Medium Risk (45–64)</option>
              <option value="low">Low Risk (&lt;45)</option>
            </select>
            <button style={toggleStyle(showLanes)} onClick={() => setShowLanes(!showLanes)}>
              {showLanes ? "✓" : "○"} Supply Lanes
            </button>
            <button style={toggleStyle(showEvents)} onClick={() => setShowEvents(!showEvents)}>
              {showEvents ? "✓" : "○"} Live Events
            </button>
            {/* Zoom controls */}
            <div style={{ display: "flex", gap: 2 }}>
              <button
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(z * 1.5, 20))}
                style={{
                  width: 30, height: 30, borderRadius: "6px 0 0 6px",
                  border: "1px solid var(--line)", background: "var(--surface)",
                  fontSize: 18, fontWeight: 700, cursor: "pointer", color: "var(--fg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}
              >+</button>
              <button
                title="Reset zoom"
                onClick={() => { setZoom(1); setCenter([10, 48]); }}
                style={{
                  height: 30, padding: "0 8px",
                  border: "1px solid var(--line)", borderLeft: "none", borderRight: "none",
                  background: "var(--surface)", fontSize: 10, fontWeight: 700,
                  cursor: "pointer", color: "var(--fg-muted)", letterSpacing: ".04em",
                }}
              >RESET</button>
              <button
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(z / 1.5, 0.5))}
                style={{
                  width: 30, height: 30, borderRadius: "0 6px 6px 0",
                  border: "1px solid var(--line)", background: "var(--surface)",
                  fontSize: 18, fontWeight: 700, cursor: "pointer", color: "var(--fg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  lineHeight: 1,
                }}
              >−</button>
            </div>
          </div>
        </div>

        {/* Map */}
        <div style={{
          position: "relative",
          background: "linear-gradient(180deg, #bfdbfe 0%, #dbeafe 50%, #e0f7fa 100%)",
        }}>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: mapCenter, scale: 160 }}
            width={900}
            height={480}
            style={{ width: "100%", height: "auto", display: "block" }}
          >
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveEnd={({ zoom: z, coordinates }) => {
                setZoom(z);
                setCenter(coordinates as [number, number]);
              }}
              minZoom={0.5}
              maxZoom={20}
            >
            {/* Country fills */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill="#dde4ef"
                    stroke="#b0bcc8"
                    strokeWidth={0.35}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Supply lanes — rendered below pins */}
            {showLanes && filtered.map(({ s, coords }) => (
              <Line
                key={`lane-${s.id}`}
                from={HQ}
                to={coords}
                stroke={riskColor(s.risk)}
                strokeWidth={1.4 / zoom}
                strokeOpacity={0.4}
                strokeLinecap="round"
                style={{ strokeDasharray: `${6 / zoom} ${4 / zoom}` }}
              />
            ))}

            {/* Live event markers (triangles) — below supplier pins */}
            {showEvents && platformEvents.map((ev) => {
              const coords = ev.country ? EVENT_COORDS[ev.country] : null;
              if (!coords) return null;
              const col = severityColor(ev.severity);
              const sc = 1 / zoom;
              const isHovEv = hoveredEvent === ev.id;
              return (
                <Marker key={ev.id} coordinates={coords}>
                  <g
                    transform={`scale(${sc})`}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={() => { setHoveredEvent(ev.id); setHovered(null); }}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {/* Glow for active or hovered */}
                    {(ev.status === "Active" || isHovEv) && (
                      <circle r={isHovEv ? 16 : 12} fill={col} fillOpacity={isHovEv ? 0.18 : 0.12} />
                    )}
                    <polygon
                      points="0,-9 8,6 -8,6"
                      fill={col}
                      fillOpacity={isHovEv ? 1 : 0.9}
                      stroke="white"
                      strokeWidth={isHovEv ? 1.5 : 1}
                    />
                  </g>
                </Marker>
              );
            })}

            {/* WB HQ marker */}
            <Marker coordinates={HQ}>
              <g transform={`scale(${1 / zoom})`}>
                <circle r={13} fill={hqColor} fillOpacity={0.12} />
                <circle r={8} fill={hqColor} />
                <circle r={3.5} fill="white" />
                <text
                  y={-15}
                  textAnchor="middle"
                  fill={hqColor}
                  style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".02em" }}
                >
                  {hqLabel}
                </text>
              </g>
            </Marker>

            {/* Supplier pins — rendered on top */}
            {filtered.map(({ s, coords }) => {
              const col = riskColor(s.risk);
              const isHov = hovered === s.id;
              const r = isHov ? 9 : 7;
              const sc = 1 / zoom;
              return (
                <Marker key={s.id} coordinates={coords}>
                  <g
                    transform={`scale(${sc})`}
                    onMouseEnter={() => setHovered(s.id)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setRoute("supplier", { id: s.id })}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Pulse rings for high-risk */}
                    {(s.risk ?? 0) >= 65 && (
                      <>
                        <circle r={20} fill={col} fillOpacity={0.08} />
                        <circle r={13} fill={col} fillOpacity={0.15} />
                      </>
                    )}
                    {/* Hover ring */}
                    {isHov && (
                      <circle r={r + 4} fill="none" stroke={col} strokeWidth={1.5} strokeOpacity={0.6} />
                    )}
                    {/* Main pin */}
                    <circle r={r} fill={col} stroke="white" strokeWidth={1.8} />
                    {/* Label */}
                    <text
                      y={r + 12}
                      textAnchor="middle"
                      fill="#1e293b"
                      style={{ fontSize: 8, fontWeight: 600, pointerEvents: "none" }}
                    >
                      {s.name.length > 13 ? s.name.slice(0, 13) + "…" : s.name}
                    </text>
                  </g>
                </Marker>
              );
            })}
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom level indicator */}
          <div style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            background: "rgba(255,255,255,.75)",
            backdropFilter: "blur(4px)",
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: 10,
            color: "var(--fg-muted)",
            fontWeight: 600,
            pointerEvents: "none",
            letterSpacing: ".04em",
          }}>
            {zoom >= 2 ? `${zoom.toFixed(1)}×` : "Scroll or +/− to zoom · Drag to pan"}
          </div>

          {/* Supplier hover tooltip */}
          {hoveredS && !hoveredEvent && (
            <div style={{
              position: "absolute",
              bottom: 16,
              left: 16,
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderLeft: `3px solid ${riskColor(hoveredS.risk)}`,
              borderRadius: 10,
              padding: "10px 14px",
              minWidth: 230,
              boxShadow: "0 4px 24px rgba(0,0,0,.14)",
              pointerEvents: "none",
            }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5 }}>{hoveredS.name}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                <span style={{ fontWeight: 700, color: riskColor(hoveredS.risk), fontSize: 13 }}>
                  Risk {hoveredS.risk ?? "—"}
                </span>
                {hoveredS.countryCode && (
                  <span className="muted" style={{ fontSize: 11 }}>{hoveredS.countryCode}</span>
                )}
                {hoveredS.category && (
                  <span className="muted" style={{ fontSize: 11 }}>{hoveredS.category}</span>
                )}
              </div>
              {hoveredS.spend != null && (
                <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>
                  Spend: {currency}{hoveredS.spend}M
                </div>
              )}
              {hoveredS.onTime != null && (
                <div className="muted" style={{ fontSize: 11, marginBottom: 2 }}>
                  On-Time: {hoveredS.onTime}% · PPM: {hoveredS.qualityPPM ?? "—"}
                </div>
              )}
              {hoveredS.riskState && (
                <div style={{ marginTop: 5 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: hoveredS.riskState === "ESCALATED" || hoveredS.riskState === "UNDER OBSERVATION"
                      ? "var(--risk)" : "var(--ok)",
                  }}>
                    {hoveredS.riskState}
                  </span>
                </div>
              )}
              <div className="muted" style={{ fontSize: 10, marginTop: 6, borderTop: "1px solid var(--line)", paddingTop: 5 }}>
                Click to open supplier profile →
              </div>
            </div>
          )}

          {/* Event hover tooltip */}
          {(() => {
            const ev = hoveredEvent ? platformEvents.find((e) => e.id === hoveredEvent) : null;
            if (!ev) return null;
            const col = severityColor(ev.severity);
            const affectedNames = ev.affectedSupplierIds
              .map((id) => suppliers.find((s) => s.id === id)?.name)
              .filter(Boolean);

            const CATEGORY_LABELS: Record<string, string> = {
              natural_disaster: "Natural Disaster", geopolitical: "Geopolitical",
              logistics: "Logistics", labor: "Labor", financial: "Financial",
              regulatory: "Regulatory", cyber: "Cyber", quality: "Quality",
            };

            return (
              <div style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderLeft: `3px solid ${col}`,
                borderRadius: 10,
                padding: "12px 14px",
                minWidth: 280,
                maxWidth: 340,
                boxShadow: "0 4px 24px rgba(0,0,0,.16)",
                pointerEvents: "none",
              }}>
                {/* Badges row */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 7 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: ".06em",
                    background: col, color: "white",
                    borderRadius: 4, padding: "1px 6px", textTransform: "uppercase",
                  }}>
                    {ev.severity}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: ".04em",
                    border: "1px solid var(--line)", borderRadius: 4,
                    padding: "1px 6px", color: "var(--fg-muted)",
                  }}>
                    {CATEGORY_LABELS[ev.category] ?? ev.category}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: ".04em",
                    border: `1px solid ${ev.status === "Active" ? col : "var(--line)"}`,
                    color: ev.status === "Active" ? col : "var(--fg-muted)",
                    borderRadius: 4, padding: "1px 6px",
                  }}>
                    {ev.status}
                  </span>
                  <span className="muted" style={{ fontSize: 10, alignSelf: "center" }}>
                    {ev.country} · {ev.date}
                  </span>
                </div>

                {/* Title */}
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 5, lineHeight: 1.35 }}>
                  {ev.title}
                </div>

                {/* Detail */}
                <div className="muted" style={{ fontSize: 11, lineHeight: 1.5, marginBottom: 8 }}>
                  {ev.detail.length > 160 ? ev.detail.slice(0, 160) + "…" : ev.detail}
                </div>

                {/* Impact metrics */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  {ev.estimatedImpact && (
                    <div style={{
                      background: "rgba(220,38,38,.06)",
                      border: "1px solid rgba(220,38,38,.15)",
                      borderRadius: 6, padding: "3px 8px", fontSize: 11,
                    }}>
                      <span className="muted">Impact: </span>
                      <b style={{ color: "var(--risk)" }}>{ev.estimatedImpact}</b>
                    </div>
                  )}
                  {ev.leadTimeExtension && (
                    <div style={{
                      background: "rgba(217,119,6,.06)",
                      border: "1px solid rgba(217,119,6,.15)",
                      borderRadius: 6, padding: "3px 8px", fontSize: 11,
                    }}>
                      <span className="muted">Lead time: </span>
                      <b>+{ev.leadTimeExtension}</b>
                    </div>
                  )}
                </div>

                {/* Affected suppliers */}
                {affectedNames.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <span className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em" }}>
                      Affected suppliers:{" "}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>
                      {affectedNames.join(", ")}
                    </span>
                  </div>
                )}

                {/* Source */}
                <div className="muted" style={{ fontSize: 10, borderTop: "1px solid var(--line)", paddingTop: 5 }}>
                  Source: {ev.source}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Legend */}
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--line)",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Suppliers
            </span>
            {([ ["#dc2626", "High (≥65)"], ["#d97706", "Medium (45–64)"], ["#16a34a", "Low (<45)"] ] as [string, string][]).map(
              ([col, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />
                  <span style={{ fontSize: 11 }}>{label}</span>
                </div>
              )
            )}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Events
            </span>
            {([ ["#dc2626", "Critical"], ["#d97706", "High"], ["#2563eb", "Medium"] ] as [string, string][]).map(
              ([col, label]) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{
                    width: 0, height: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderBottom: `9px solid ${col}`,
                  }} />
                  <span style={{ fontSize: 11 }}>{label}</span>
                </div>
              )
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: hqColor }} />
            <span style={{ fontSize: 11 }}>{hqNote}</span>
          </div>
        </div>
      </div>

      {/* Risk register table */}
      <div className="card">
        <h2>Supplier Risk Register</h2>
        <div className="card-sub">All suppliers ranked by computed risk score — click any row to open full profile</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Country</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Risk Score</th>
                <th>Spend</th>
                <th>On-Time</th>
                <th>Credit Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[...suppliers]
                .sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))
                .map((s) => (
                  <tr
                    key={s.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setRoute("supplier", { id: s.id })}
                  >
                    <td style={{ fontWeight: 600, color: "var(--accent)" }}>{s.name}</td>
                    <td style={{ fontSize: 12 }}>{s.countryCode ?? "—"}</td>
                    <td style={{ fontSize: 12 }}>{s.tier != null ? `Tier ${s.tier}` : "—"}</td>
                    <td style={{ fontSize: 12 }}>{s.category ?? "—"}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: riskColor(s.risk),
                      }}>
                        {s.risk ?? "—"}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.spend != null ? `${currency}${s.spend}M` : "—"}</td>
                    <td style={{ fontSize: 12 }}>
                      {s.onTime != null ? (
                        <span style={{ color: s.onTime < 90 ? "var(--risk)" : s.onTime < 95 ? "var(--warn)" : "var(--ok)" }}>
                          {s.onTime}%
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontSize: 12 }}>{s.creditRisk?.creditRating ?? "—"}</td>
                    <td>
                      <Badge variant={
                        s.riskState === "ESCALATED" ? "risk" :
                        s.riskState === "UNDER OBSERVATION" || s.riskState === "MITIGATION IN PROGRESS" ? "warn" :
                        "ok"
                      }>
                        {s.riskState ?? "Stable"}
                      </Badge>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
