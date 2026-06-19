"use client";

import { useState, useEffect, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

// ─────────────────────────────────────────────────────────────────────────────
// Pure SVG / CSS chart primitives — no external dependencies
// ─────────────────────────────────────────────────────────────────────────────

// ── Mini Donut Ring ───────────────────────────────────────────────────────────
export function MiniDonut({
  segments,
  size = 110,
  thickness = 20,
  label,
  sublabel,
}: {
  segments: { value: number; color: string }[];
  size?: number;
  thickness?: number;
  label?: string;
  sublabel?: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cum = 0;
  const parts = segments.flatMap((seg) => {
    const start = (cum / total) * 360;
    cum += seg.value;
    const end = (cum / total) * 360;
    const gap = 1.5;
    return [
      `var(--card) ${start.toFixed(1)}deg ${(start + gap / 2).toFixed(1)}deg`,
      `${seg.color} ${(start + gap / 2).toFixed(1)}deg ${(end - gap / 2).toFixed(1)}deg`,
      `var(--card) ${(end - gap / 2).toFixed(1)}deg ${end.toFixed(1)}deg`,
    ];
  });

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: `conic-gradient(${parts.join(", ")})` }} />
      <div style={{
        position: "absolute", inset: thickness, borderRadius: "50%", background: "var(--card)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        {label && <div style={{ fontSize: size < 90 ? 12 : 16, fontWeight: 800, lineHeight: 1 }}>{label}</div>}
        {sublabel && <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, textAlign: "center", lineHeight: 1.2 }}>{sublabel}</div>}
      </div>
    </div>
  );
}

// ── SVG Sparkline ─────────────────────────────────────────────────────────────
export function Sparkline({
  data,
  color = "var(--accent)",
  height = 30,
  width = 80,
  filled = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  filled?: boolean;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.01);
  const min = Math.min(...data);
  const range = max - min || 0.01;
  const pad = 3;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as [number, number];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      {filled && <path d={area} fill={color} fillOpacity="0.15" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0].toFixed(1)} cy={pts[pts.length - 1][1].toFixed(1)} r="2.5" fill={color} />
    </svg>
  );
}

// ── SVG Risk Gauge (Semicircle / Dial) ────────────────────────────────────────
export function RiskGauge({ value, size = 160 }: { value: number; size?: number }) {
  const clamped = Math.min(100, Math.max(0, value));
  const cx = size / 2;
  const cy = size * 0.60;
  const r = size * 0.38;
  const sw = size * 0.10;
  const color = clamped >= 70 ? "#dc2626" : clamped >= 45 ? "#d97706" : "#16a34a";

  function polar(angleDeg: number): [number, number] {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function arc(from: number, to: number) {
    const [sx, sy] = polar(from);
    const [ex, ey] = polar(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  const startAngle = 210;
  const totalSweep = 300;
  const fillAngle = startAngle + (clamped / 100) * totalSweep;
  const endAngle = startAngle + totalSweep;
  const [dotX, dotY] = polar(fillAngle);

  return (
    <div style={{ position: "relative", width: size, height: size * 1.05, flexShrink: 0 }}>
      <svg width={size} height={size * 1.05} viewBox={`0 0 ${size} ${size * 1.05}`}>
        {/* Track zones */}
        <path d={arc(startAngle, startAngle + 135)} fill="none" stroke="rgba(22,163,74,.18)" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(startAngle + 135, startAngle + 210)} fill="none" stroke="rgba(217,119,6,.18)" strokeWidth={sw} strokeLinecap="round" />
        <path d={arc(startAngle + 210, endAngle)} fill="none" stroke="rgba(220,38,38,.18)" strokeWidth={sw} strokeLinecap="round" />
        {/* Track outline */}
        <path d={arc(startAngle, endAngle)} fill="none" stroke="var(--line)" strokeWidth={sw * 0.3} strokeLinecap="round" opacity="0.5" />
        {/* Fill */}
        {clamped > 1 && (
          <path d={arc(startAngle, fillAngle)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        )}
        {/* Needle dot */}
        <circle cx={dotX.toFixed(1)} cy={dotY.toFixed(1)} r={sw / 2 + 1.5} fill={color} stroke="var(--card)" strokeWidth="2.5" />
      </svg>
      <div style={{
        position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)",
        textAlign: "center", lineHeight: 1,
      }}>
        <div style={{ fontSize: size * 0.18, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: size * 0.085, color: "var(--muted)", marginTop: 2, fontWeight: 600, letterSpacing: ".05em", textTransform: "uppercase" }}>Avg Risk</div>
      </div>
    </div>
  );
}

// ── Pulse Dot ─────────────────────────────────────────────────────────────────
export function PulseDot({ color = "var(--risk)", size = 9 }: { color?: string; size?: number }) {
  return (
    <span className="pulse-dot-outer" style={{ width: size, height: size, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <span className="pulse-dot-el" style={{ width: size, height: size, borderRadius: "50%", background: color, display: "block" }} />
    </span>
  );
}

// ── Trend Pill ────────────────────────────────────────────────────────────────
export function TrendPill({ value, suffix = "", higherIsBetter = false }: { value: number; suffix?: string; higherIsBetter?: boolean }) {
  const positive = value >= 0;
  const good = higherIsBetter ? positive : !positive;
  const color = good ? "#16a34a" : "#dc2626";
  const bg = good ? "rgba(22,163,74,.12)" : "rgba(220,38,38,.12)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, fontSize: 11, fontWeight: 700, color, background: bg, borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap" }}>
      {positive ? "↑" : "↓"} {Math.abs(value)}{suffix}
    </span>
  );
}

// ── Gradient Heat Bar ─────────────────────────────────────────────────────────
export function HeatBar({ value, max = 100, showLabel = true, height = 8 }: { value: number; max?: number; showLabel?: boolean; height?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const ratio = pct / 100;
  const color = ratio >= 0.7 ? "#dc2626" : ratio >= 0.45 ? "#d97706" : "#16a34a";
  const fade = ratio >= 0.7 ? "rgba(220,38,38,.35)" : ratio >= 0.45 ? "rgba(217,119,6,.35)" : "rgba(22,163,74,.35)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height, borderRadius: 999, background: "var(--line)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${fade}, ${color})`, transition: "width .5s ease" }} />
      </div>
      {showLabel && <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 28, textAlign: "right" }}>{value}</span>}
    </div>
  );
}

// ── Legend Dot ────────────────────────────────────────────────────────────────
export function LegendDot({ color, label, count }: { color: string; label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
      <span style={{ width: 9, height: 9, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
      <span style={{ color: "var(--muted)" }}>{label}</span>
      {count !== undefined && <span style={{ fontWeight: 700, marginLeft: 1 }}>{count}</span>}
    </div>
  );
}

// ── Europe Supply Chain Map (react-simple-maps — accurate geographic projection)
// Uses Mercator projection centered on Europe with real lat/lon supplier coordinates
// Geographic data: Natural Earth 110m via world-atlas CDN (TopoJSON)

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// WB HQ: Worcester, UK  |  suppliers: verified lat/lon
const WB_COORDS: [number, number] = [-2.22, 52.19];

interface GeoPin {
  id: string;
  name: string;
  city: string;
  country: string;
  coords: [number, number]; // [longitude, latitude]
  risk?: number;
  isHQ?: boolean;
}

const GEO_PINS: GeoPin[] = [
  { id: "wb",  name: "Worcester Bosch HQ",   city: "Worcester",     country: "UK",          coords: WB_COORDS,         isHQ: true },
  { id: "aal", name: "Aalberts Industries",   city: "Houten",        country: "Netherlands", coords: [5.17,  52.03],    risk: 76 },
  { id: "dbs", name: "DB Schenker",           city: "Essen",         country: "Germany",     coords: [7.01,  51.46],    risk: 21 },
  { id: "ebm", name: "Ebm-papst",             city: "Mulfingen",     country: "Germany",     coords: [9.87,  49.35],    risk: 41 },
  { id: "gru", name: "Grundfos",              city: "Bjerringbro",   country: "Denmark",     coords: [9.65,  56.37],    risk: 27 },
  { id: "dan", name: "Danfoss",               city: "Nordborg",      country: "Denmark",     coords: [9.75,  55.07],    risk: 31 },
  { id: "gfp", name: "Georg Fischer",         city: "Schaffhausen",  country: "Switzerland", coords: [8.63,  47.70],    risk: 48 },
  { id: "sit", name: "SIT Group",             city: "Padova",        country: "Italy",       coords: [11.88, 45.41],    risk: 64 },
  { id: "sen", name: "Sensata Technologies",  city: "Almelo",        country: "Netherlands", coords: [6.66,  52.36],    risk: 54 },
];

function geoPinColor(risk?: number, isHQ?: boolean): string {
  if (isHQ) return "#0f4c81";
  if (risk === undefined) return "#16a34a";
  if (risk >= 65) return "#dc2626";
  if (risk >= 45) return "#d97706";
  return "#16a34a";
}

interface WeatherData {
  temp: number;
  conditions: string;
  description: string;
  emoji: string;
  windSpeed: number;
  humidity: number;
  noKey?: boolean;
}

export function EuropeMap({ onSelect }: { onSelect?: (id: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [weatherCache, setWeatherCache] = useState<Record<string, WeatherData | null>>({});
  const fetchingRef = useRef<Set<string>>(new Set());
  const hoveredPin = GEO_PINS.find((p) => p.id === hoveredId) ?? null;

  // Lazy-load weather for hovered pin
  useEffect(() => {
    if (!hoveredId || hoveredId === "wb") return;
    if (hoveredId in weatherCache) return;
    if (fetchingRef.current.has(hoveredId)) return;

    const pin = GEO_PINS.find((p) => p.id === hoveredId);
    if (!pin) return;

    fetchingRef.current.add(hoveredId);
    const [lon, lat] = pin.coords;
    fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WeatherData | null) => {
        setWeatherCache((prev) => ({ ...prev, [hoveredId]: data }));
      })
      .catch(() => {
        setWeatherCache((prev) => ({ ...prev, [hoveredId]: null }));
      })
      .finally(() => {
        fetchingRef.current.delete(hoveredId);
      });
  }, [hoveredId, weatherCache]);

  return (
    <div style={{ position: "relative" }}>
      {/* Map container */}
      <div
        style={{
          background: "linear-gradient(175deg, #93c5fd 0%, #bfdbfe 40%, #dbeafe 100%)",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--line)",
        }}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [14, 52], scale: 800 }}
          width={800}
          height={480}
          style={{ width: "100%", height: "auto", display: "block" }}
        >
          {/* Country fills */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#e9eef5"
                  stroke="#b8c3d0"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Supply lanes from WB HQ */}
          {GEO_PINS.filter((p) => !p.isHQ).map((pin) => (
            <Line
              key={`lane-${pin.id}`}
              from={WB_COORDS}
              to={pin.coords}
              stroke={geoPinColor(pin.risk)}
              strokeWidth={1.5}
              strokeOpacity={0.45}
              strokeLinecap="round"
              style={{ strokeDasharray: "5 4" }}
            />
          ))}

          {/* Supplier markers */}
          {GEO_PINS.map((pin) => {
            const col = geoPinColor(pin.risk, pin.isHQ);
            const isHov = hoveredId === pin.id;
            const r = pin.isHQ ? 10 : isHov ? 9 : 7;
            return (
              <Marker key={pin.id} coordinates={pin.coords}>
                <g
                  onMouseEnter={() => setHoveredId(pin.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => !pin.isHQ && onSelect?.(pin.id)}
                  style={{ cursor: pin.isHQ ? "default" : "pointer" }}
                >
                  {/* Pulse rings for high-risk suppliers */}
                  {(pin.risk ?? 0) >= 65 && (
                    <>
                      <circle r={20} fill={col} fillOpacity={0.08} />
                      <circle r={13} fill={col} fillOpacity={0.14} />
                    </>
                  )}
                  {/* Main pin */}
                  <circle
                    r={r}
                    fill={col}
                    stroke="white"
                    strokeWidth={2}
                    style={{ transition: "r .15s ease" }}
                  />
                  {/* HQ label above pin */}
                  {pin.isHQ && (
                    <text
                      textAnchor="middle"
                      y={-15}
                      style={{
                        fontSize: "10px",
                        fontWeight: 800,
                        fill: "#0f4c81",
                        fontFamily: "system-ui, sans-serif",
                        pointerEvents: "none",
                      }}
                    >
                      WB HQ
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      {/* Hover tooltip — fixed to top-right corner of map */}
      {hoveredPin && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "var(--card)",
            border: `2px solid ${geoPinColor(hoveredPin.risk, hoveredPin.isHQ)}`,
            borderRadius: 10,
            padding: "10px 14px",
            minWidth: 172,
            pointerEvents: "none",
            zIndex: 20,
            boxShadow: "0 4px 16px rgba(0,0,0,.12)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
            {hoveredPin.name}
          </div>
          <div
            className="muted"
            style={{ fontSize: 11, marginBottom: hoveredPin.isHQ ? 0 : 4 }}
          >
            {hoveredPin.city}, {hoveredPin.country}
          </div>
          {!hoveredPin.isHQ && (
            <>
              <div style={{ fontSize: 12, fontWeight: 700, color: geoPinColor(hoveredPin.risk) }}>
                Risk score: {hoveredPin.risk}
              </div>
              {/* Live weather */}
              {weatherCache[hoveredPin.id] === undefined && (
                <div className="muted" style={{ fontSize: 10, marginTop: 4 }}>Loading weather…</div>
              )}
              {weatherCache[hoveredPin.id] && !weatherCache[hoveredPin.id]?.noKey && (
                <div style={{ marginTop: 5, padding: "4px 0", borderTop: "1px solid var(--line)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>
                    {weatherCache[hoveredPin.id]!.emoji} {weatherCache[hoveredPin.id]!.temp}°C
                    <span className="muted" style={{ fontWeight: 400, marginLeft: 4 }}>
                      {weatherCache[hoveredPin.id]!.description}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>
                    💨 {weatherCache[hoveredPin.id]!.windSpeed} km/h · 💧 {weatherCache[hoveredPin.id]!.humidity}%
                  </div>
                </div>
              )}
              <div className="muted" style={{ fontSize: 10, marginTop: 3 }}>
                Click to open supplier →
              </div>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { color: "#0f4c81", label: "Worcester Bosch HQ" },
          { color: "#16a34a", label: "Low risk  (<45)" },
          { color: "#d97706", label: "Medium risk (45–64)" },
          { color: "#dc2626", label: "High risk (≥65)" },
        ].map((l) => (
          <LegendDot key={l.label} color={l.color} label={l.label} />
        ))}
        <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
          Dashed lines = active supply lanes · hover for details · click to open supplier
        </span>
      </div>
    </div>
  );
}
