"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { InfoTip } from "@/components/ui/InfoTip";

// ── Sub-tier graph data ────────────────────────────────────────────────────────
// Based on industry-derived intelligence for WB's tier-1 supplier base.
// Tier 2 = direct suppliers to our tier-1s. Tier 3 = raw material / foundry level.

interface STNode {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  country: string;
  category: string;
  risk: "low" | "medium" | "high" | "critical";
  parentIds: string[]; // IDs of nodes this node supplies into
  note?: string;
  soloSource?: boolean;
}

// ── WB Tier-1 data ─────────────────────────────────────────────────────────────
const T1_IDS_WB = ["sit", "ebm", "aal", "gru", "dan", "gfp", "dbs", "sen"];
const T1_META_WB: Record<string, { name: string; country: string; category: string }> = {
  sit: { name: "SIT Group",              country: "IT", category: "Gas Controls"     },
  ebm: { name: "Ebm-papst",             country: "DE", category: "EC Motors & Fans"  },
  aal: { name: "Aalberts Industries",   country: "NL", category: "Flow Control"      },
  gru: { name: "Grundfos",              country: "DK", category: "Pumps"             },
  dan: { name: "Danfoss",               country: "DK", category: "Valves & Drives"   },
  gfp: { name: "Georg Fischer",         country: "CH", category: "Piping Systems"    },
  dbs: { name: "DB Schenker",           country: "DE", category: "Logistics"         },
  sen: { name: "Sensata Technologies",  country: "NL", category: "Sensors"           },
};

// ── US Tier-1 data (Meridian Industrial Group) ─────────────────────────────────
const T1_IDS_US = ["flx", "zhp", "hay", "eme", "phn", "hon", "xpo", "mog"];
const T1_META_US: Record<string, { name: string; country: string; category: string }> = {
  flx: { name: "Flex Ltd.",             country: "SG", category: "Electronics"        },
  zhp: { name: "Zhonghe Precision",     country: "CN", category: "Electronics"        },
  hay: { name: "Haynes International",  country: "US", category: "Raw Materials"      },
  eme: { name: "Emerson Electric",      country: "US", category: "Electronic Controls" },
  phn: { name: "Parker Hannifin",       country: "US", category: "Fluid Systems"      },
  hon: { name: "Honeywell Sensing",     country: "US", category: "Sensors & Controls" },
  xpo: { name: "XPO Inc.",              country: "US", category: "Logistics"          },
  mog: { name: "Moog Inc.",             country: "US", category: "Components"         },
};

const SUB_TIER_NODES_WB: STNode[] = [
  // ── Tier 2 ─────────────────────────────────────────────────────────────────
  { id: "t2-vacm", name: "Vacuumschmelze",       tier: 2, country: "DE", category: "Permanent Magnets",      risk: "high",   parentIds: ["ebm"],        soloSource: true, note: "Sole EU supplier of sintered NdFeB magnets for EC motors. China controls 90%+ of upstream rare earth." },
  { id: "t2-inf",  name: "Infineon Technologies", tier: 2, country: "DE", category: "Motor Control ICs",     risk: "high",   parentIds: ["ebm"],        note: "~65% of IC production capacity routed via TSMC Taiwan fabs." },
  { id: "t2-tec",  name: "TE Connectivity",       tier: 2, country: "CH", category: "Connectors & Sensors",  risk: "medium", parentIds: ["sen", "ebm"], note: "Shared T2 supplier across 2 of WB's T1 chains." },
  { id: "t2-vis",  name: "Vishay Intertechnology", tier: 2, country: "US", category: "Passive Components",   risk: "medium", parentIds: ["sen"],        note: "Resistors, capacitors, inductors for sensor assemblies." },
  { id: "t2-her",  name: "Heraeus",               tier: 2, country: "DE", category: "Precious Metal Contacts", risk: "low",  parentIds: ["sen"] },
  { id: "t2-elb",  name: "Elbi S.r.l.",           tier: 2, country: "IT", category: "Brass Valve Bodies",    risk: "high",   parentIds: ["sit"],        soloSource: true, note: "Single-source for precision brass valve bodies. No qualified alternative on record." },
  { id: "t2-gcf",  name: "GF Casting Solutions",  tier: 2, country: "CH", category: "Aluminium Die Casting", risk: "low",   parentIds: ["gfp", "sit"], note: "Shared supplier: Georg Fischer and SIT Group both draw on this entity." },
  { id: "t2-com",  name: "Comap",                 tier: 2, country: "FR", category: "Thermostatic Elements", risk: "low",   parentIds: ["aal"] },
  { id: "t2-skf",  name: "SKF",                   tier: 2, country: "SE", category: "Precision Bearings",    risk: "low",   parentIds: ["gru", "dan"], note: "Shared bearing supplier across Grundfos pump assemblies and Danfoss compressor valves." },
  { id: "t2-zie",  name: "Ziehl-Abegg",           tier: 2, country: "DE", category: "Motor Subassemblies",   risk: "low",   parentIds: ["gru"] },
  { id: "t2-sim",  name: "Simona AG",             tier: 2, country: "DE", category: "Polymer Sheet (HDPE/PP)", risk: "low",  parentIds: ["gfp"] },
  { id: "t2-swa",  name: "Swagelok",              tier: 2, country: "US", category: "Tube Fittings",          risk: "low",  parentIds: ["dan"] },
  { id: "t2-lhc",  name: "Lufthansa Cargo",       tier: 2, country: "DE", category: "Air Freight",            risk: "low",  parentIds: ["dbs"] },
  { id: "t2-hhl",  name: "HHLA",                  tier: 2, country: "DE", category: "Port Handling",          risk: "medium", parentIds: ["dbs"], note: "Hamburg port handling — exposed to North Sea weather disruptions." },

  // ── Tier 3 ─────────────────────────────────────────────────────────────────
  { id: "t3-tsmc", name: "TSMC",              tier: 3, country: "TW", category: "Semiconductor Foundry",   risk: "critical", parentIds: ["t2-inf", "t2-vis", "t2-tec"], note: "⚠ Single geographic chokepoint. Taiwan Strait conflict scenario would halt production at Infineon, Vishay, and TE Connectivity simultaneously — affecting Ebm-papst and Sensata T1 chains." },
  { id: "t3-lyn",  name: "Lynas Rare Earths", tier: 3, country: "AU", category: "Rare Earth Processing",   risk: "high",     parentIds: ["t2-vacm"],                    note: "One of only 2 non-China rare earth processors globally. Magnet supply at risk if China restricts exports." },
  { id: "t3-mpm",  name: "MP Materials",      tier: 3, country: "US", category: "NdFeB Magnet Production", risk: "high",     parentIds: ["t2-vacm"],                    note: "US-based backup. Limited production capacity — insufficient to cover a Lynas supply shock." },
  { id: "t3-bol",  name: "Boliden",           tier: 3, country: "SE", category: "Copper Mining & Smelting", risk: "low",     parentIds: ["t2-elb", "t2-com"] },
  { id: "t3-umi",  name: "Umicore",           tier: 3, country: "BE", category: "Precious Metal Refining",  risk: "low",     parentIds: ["t2-her"] },
  { id: "t3-nov",  name: "Novelis",           tier: 3, country: "CH", category: "Aluminium Sheet",          risk: "low",     parentIds: ["t2-gcf", "t2-sim"] },
  { id: "t3-ova",  name: "Ovako",             tier: 3, country: "SE", category: "Specialty Steel",          risk: "low",     parentIds: ["t2-skf"] },
];

// ── US Sub-tier nodes (Meridian Industrial Group) ──────────────────────────────
const SUB_TIER_NODES_US: STNode[] = [
  // ── Tier 2 ─────────────────────────────────────────────────────────────────
  { id: "u2-tsmc", name: "TSMC",                  tier: 2, country: "TW", category: "Semiconductor Foundry",     risk: "critical", parentIds: ["flx"],       note: "⚠ Flex's PCB assemblies rely on TSMC-fab chips. Taiwan Strait conflict scenario would halt Flex EMS production affecting ProControl 2000 and SensorSuite Platform." },
  { id: "u2-mur",  name: "Murata Manufacturing",  tier: 2, country: "JP", category: "Passive Components",        risk: "medium",   parentIds: ["flx"],       note: "MLCCs and inductors for Flex PCB assemblies. Significant Japan earthquake exposure." },
  { id: "u2-zhk",  name: "Zhongke Sanhuan",       tier: 2, country: "CN", category: "Rare Earth Magnets",        risk: "critical", parentIds: ["zhp"],       soloSource: true, note: "⚠ UFLPA Flag: Sources neodymium from Xinjiang mining operations. Single-source for ZHP precision connector magnets. CBP detention risk is active." },
  { id: "u2-lcop", name: "Longhua Copper",         tier: 2, country: "CN", category: "Copper Wire & Rod",         risk: "high",     parentIds: ["zhp"],       note: "Primary copper input for Zhonghe precision components. Subject to US Section 301 tariffs." },
  { id: "u2-vale", name: "Vale",                   tier: 2, country: "BR", category: "Nickel & Cobalt Mining",    risk: "medium",   parentIds: ["hay"],       note: "Primary nickel and cobalt ore supplier to Haynes International. Exposed to Brazilian regulatory and ESG risk." },
  { id: "u2-glen", name: "Glencore",               tier: 2, country: "CH", category: "Cobalt Refining",           risk: "medium",   parentIds: ["hay"],       note: "DRC cobalt supply into Haynes specialty alloy production. Governance risk — ongoing investigations." },
  { id: "u2-ti",   name: "Texas Instruments",      tier: 2, country: "US", category: "Microcontrollers & ICs",    risk: "low",      parentIds: ["eme"],       note: "Embedded controllers for Emerson industrial automation platforms." },
  { id: "u2-mol",  name: "Molex",                  tier: 2, country: "US", category: "Interconnect Systems",      risk: "low",      parentIds: ["eme"] },
  { id: "u2-ren",  name: "Renesas Electronics",    tier: 2, country: "JP", category: "Microcontrollers",          risk: "medium",   parentIds: ["hon"],       note: "Sensing IC supply to Honeywell — Japan natural disaster exposure, single sourced on 2 SKUs." },
  { id: "u2-amp",  name: "Amphenol",               tier: 2, country: "US", category: "Connectors & Sensors",      risk: "low",      parentIds: ["hon"] },
  { id: "u2-eat",  name: "Eaton Corporation",      tier: 2, country: "US", category: "Hydraulic Components",      risk: "low",      parentIds: ["phn"] },
  { id: "u2-fre",  name: "Freudenberg Group",      tier: 2, country: "DE", category: "Sealing Technology",        risk: "low",      parentIds: ["phn"] },
  { id: "u2-up",   name: "Union Pacific",          tier: 2, country: "US", category: "Rail Freight",              risk: "low",      parentIds: ["xpo"],       note: "XPO intermodal rail partner for Midwest distribution lanes." },
  { id: "u2-cw",   name: "Curtiss-Wright",         tier: 2, country: "US", category: "Precision Machining",       risk: "low",      parentIds: ["mog"] },
  { id: "u2-hex",  name: "Hexcel Corporation",     tier: 2, country: "US", category: "Carbon Fiber Composites",   risk: "low",      parentIds: ["mog"] },

  // ── Tier 3 ─────────────────────────────────────────────────────────────────
  { id: "u3-asml", name: "ASML",                   tier: 3, country: "NL", category: "EUV Lithography Equipment", risk: "critical", parentIds: ["u2-tsmc"],   note: "⚠ Sole supplier of EUV machines globally. No alternative exists. Any disruption to ASML halts leading-edge semiconductor production worldwide — including TSMC supply to Flex." },
  { id: "u3-xjm",  name: "Xinjiang Mining Group",  tier: 3, country: "CN", category: "Rare Earth Ore",            risk: "critical", parentIds: ["u2-zhk"],    soloSource: true, note: "⚠ UFLPA Active Enforcement: Raw rare earth ore mined in Xinjiang region. All goods traceable to this source are presumed forced-labor under UFLPA. CBP detention of ZHP shipments directly linked to this Tier 3 relationship." },
  { id: "u3-fmcm", name: "Freeport McMoRan",       tier: 3, country: "US", category: "Copper Mining",             risk: "low",      parentIds: ["u2-lcop"] },
  { id: "u3-nor",  name: "Norilsk Nickel",         tier: 3, country: "RU", category: "Nickel Ore",                risk: "high",     parentIds: ["u2-vale"],   note: "Russian-sourced nickel blended into global LME stocks. Sanction risk — US importers must verify non-Russian origin for Haynes input materials." },
  { id: "u3-gf",   name: "GlobalFoundries",        tier: 3, country: "US", category: "Semiconductor Foundry (Backup)", risk: "medium", parentIds: ["u2-ti"],  note: "Backup foundry for Texas Instruments on mature node chips. Capacity constrained." },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function flag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("");
}

const RISK_COLOR: Record<string, string> = {
  critical: "#7c3aed",
  high:     "#dc2626",
  medium:   "#d97706",
  low:      "#16a34a",
};

const RISK_BG: Record<string, string> = {
  critical: "rgba(124,58,237,.1)",
  high:     "rgba(220,38,38,.08)",
  medium:   "rgba(217,119,6,.08)",
  low:      "rgba(22,163,74,.08)",
};

// ── SVG Graph ─────────────────────────────────────────────────────────────────
const NW = 152; // node width
const NH = 46;  // node height
const NR = 8;   // border radius
const GAP_Y = 14;

interface LayoutNode {
  node: STNode | { id: string; name: string; tier: 0; country: string; category: string; risk: "low" };
  cx: number; cy: number;
}

function buildLayout(
  t1Id: string,
  all: STNode[],
  colCX: number[],
  t1MetaMap: Record<string, { name: string; country: string; category: string }>,
  hqName: string,
  hqCountry: string
): LayoutNode[] {
  const colNodes: LayoutNode[][] = [[], [], [], []];

  // Col 0: HQ
  colNodes[0].push({ node: { id: "hq", name: hqName, tier: 0, country: hqCountry, category: "OEM · HQ", risk: "low" }, cx: colCX[0], cy: 0 });

  // Col 1: selected T1
  const t1Meta = t1MetaMap[t1Id];
  colNodes[1].push({
    node: { id: t1Id, name: t1Meta.name, tier: 1, country: t1Meta.country, category: t1Meta.category, risk: "low", parentIds: [] },
    cx: colCX[1], cy: 0,
  });

  // Col 2: T2 nodes whose parentIds include t1Id
  const t2Nodes = all.filter((n) => n.tier === 2 && n.parentIds.includes(t1Id));
  t2Nodes.forEach((n, i) => colNodes[2].push({ node: n, cx: colCX[2], cy: i }));

  // Col 3: T3 nodes whose parentIds include any visible T2
  const t2Ids = new Set(t2Nodes.map((n) => n.id));
  const t3Seen = new Set<string>();
  const t3Nodes: STNode[] = [];
  all.filter((n) => n.tier === 3 && n.parentIds.some((p) => t2Ids.has(p))).forEach((n) => {
    if (!t3Seen.has(n.id)) { t3Seen.add(n.id); t3Nodes.push(n); }
  });
  t3Nodes.forEach((n, i) => colNodes[3].push({ node: n, cx: colCX[3], cy: i }));

  // Assign Y positions — distribute within each column
  const result: LayoutNode[] = [];
  colNodes.forEach((col) => {
    const total = col.length;
    const height = total * NH + (total - 1) * GAP_Y;
    col.forEach((ln, i) => {
      result.push({ ...ln, cy: -(height / 2) + i * (NH + GAP_Y) });
    });
  });
  return result;
}

function SupplyGraph({ t1Id, nodes, t1MetaMap, hqName, hqCountry }: {
  t1Id: string;
  nodes: STNode[];
  t1MetaMap: Record<string, { name: string; country: string; category: string }>;
  hqName: string;
  hqCountry: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  const SVG_W = 820;
  const SVG_H = 480;
  const CY = SVG_H / 2;
  const colCX = [70, 210, 420, 660];

  const layout = useMemo(() => buildLayout(t1Id, nodes, colCX, t1MetaMap, hqName, hqCountry), [t1Id, nodes, t1MetaMap, hqName, hqCountry]);
  const nodeMap = useMemo(() => Object.fromEntries(layout.map((ln) => [ln.node.id, ln])), [layout]);

  // Collect all visible edges
  const edges: { from: string; to: string; critical: boolean }[] = [];
  layout.forEach((ln) => {
    if (ln.node.tier === 0) return;
    const n = ln.node as STNode;
    n.parentIds?.forEach((pid) => {
      if (nodeMap[pid]) {
        edges.push({ from: pid, to: n.id, critical: n.risk === "critical" || n.risk === "high" });
      }
    });
    // WB → T1 edge
    if (n.tier === 1) edges.push({ from: "wb", to: n.id, critical: false });
  });

  const hoveredNode = hovered ? layout.find((l) => l.node.id === hovered) : null;

  return (
    <div style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        width="100%"
        style={{ overflow: "visible", display: "block" }}
      >
        {/* Column labels */}
        {[hqName.split(" ")[0], "Tier 1", "Tier 2", "Tier 3"].map((label, i) => (
          <text key={i} x={colCX[i]} y={20} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--muted)" fontFamily="system-ui,sans-serif">
            {label}
          </text>
        ))}

        {/* Edges */}
        {edges.map(({ from, to, critical }) => {
          const src = nodeMap[from]; const dst = nodeMap[to];
          if (!src || !dst) return null;
          const x1 = src.cx + NW / 2;
          const y1 = CY + src.cy + NH / 2;
          const x2 = dst.cx - NW / 2;
          const y2 = CY + dst.cy + NH / 2;
          const mx = (x1 + x2) / 2;
          const isHighlighted = hovered === from || hovered === to;
          const strokeCol = isHighlighted
            ? RISK_COLOR[dst.node.risk ?? "low"]
            : critical ? "rgba(220,38,38,.25)" : "var(--line)";
          return (
            <path
              key={`${from}-${to}`}
              d={`M ${x1} ${y1} C ${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`}
              fill="none"
              stroke={strokeCol}
              strokeWidth={isHighlighted ? 2 : 1.5}
              strokeDasharray={critical && !isHighlighted ? "4 3" : undefined}
            />
          );
        })}

        {/* Nodes */}
        {layout.map(({ node, cx, cy }) => {
          const n = node as STNode & { tier: number };
          const x = cx - NW / 2;
          const y = CY + cy;
          const isHQ = (n.tier as number) === 0;
          const riskCol = isHQ ? "#0f4c81" : RISK_COLOR[n.risk];
          const isHovered = hovered === n.id;
          const hasSolo = (n as STNode).soloSource;

          return (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Shadow on hover */}
              {isHovered && (
                <rect x={x - 2} y={y - 2} width={NW + 4} height={NH + 4} rx={NR + 2}
                  fill="none" stroke={riskCol} strokeWidth={2} opacity={0.4} />
              )}
              {/* Node bg */}
              <rect
                x={x} y={y} width={NW} height={NH} rx={NR}
                fill={isHQ ? "#0f4c81" : "var(--card)"}
                stroke={riskCol}
                strokeWidth={isHQ || hasSolo ? 2 : 1}
              />
              {/* Risk bar (left edge accent) */}
              {!isHQ && (
                <rect x={x} y={y} width={4} height={NH} rx={NR}
                  fill={riskCol} opacity={0.7} />
              )}
              {/* Name */}
              <text x={x + (isHQ ? 12 : 14)} y={y + 17}
                fontSize={11} fontWeight={700}
                fill={isHQ ? "#fff" : "var(--fg)"}
                fontFamily="system-ui,sans-serif"
              >
                {n.name.length > 19 ? n.name.slice(0, 18) + "…" : n.name}
              </text>
              {/* Sub-label */}
              <text x={x + (isHQ ? 12 : 14)} y={y + 31}
                fontSize={9} fill={isHQ ? "rgba(255,255,255,.75)" : "var(--muted)"}
                fontFamily="system-ui,sans-serif"
              >
                {flag(n.country || "GB")} {n.country} · {(n.category || "").length > 18 ? (n.category || "").slice(0, 17) + "…" : (n.category || "")}
              </text>
              {/* Solo-source badge */}
              {hasSolo && (
                <text x={x + NW - 6} y={y + 14} fontSize={8} textAnchor="end"
                  fill="#dc2626" fontWeight={700} fontFamily="system-ui,sans-serif">
                  SOLO
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (hoveredNode.node as STNode).note && (
        <div style={{
          position: "absolute", top: 8, right: 8, maxWidth: 260,
          background: "var(--card)", border: `2px solid ${RISK_COLOR[(hoveredNode.node as STNode).risk ?? "low"]}`,
          borderRadius: 10, padding: "10px 14px", fontSize: 12, lineHeight: 1.5,
          boxShadow: "0 4px 20px rgba(0,0,0,.15)", zIndex: 10, pointerEvents: "none",
        }}>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>{hoveredNode.node.name}</div>
          <div className="muted">{(hoveredNode.node as STNode).note}</div>
        </div>
      )}
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────
export function SubTierIntelligence() {
  const { setRoute, clientMode } = useApp();
  const isWB = clientMode === "wb";
  const T1_IDS     = isWB ? T1_IDS_WB     : T1_IDS_US;
  const T1_META    = isWB ? T1_META_WB    : T1_META_US;
  const SUB_NODES  = isWB ? SUB_TIER_NODES_WB : SUB_TIER_NODES_US;
  const HQ_NAME    = isWB ? "Worcester Bosch" : "Meridian Industrial";
  const HQ_COUNTRY = isWB ? "GB" : "US";

  const [activeTab, setActiveTab] = useState<string>("concentration");

  // Concentration risks: T3 nodes with multiple T1 chains exposed
  const concentrationRisks = useMemo(() => {
    return SUB_NODES
      .filter((n) => n.tier === 3)
      .map((n) => {
        const t2Exposed = SUB_NODES.filter(
          (t2) => t2.tier === 2 && n.parentIds.includes(t2.id)
        );
        const t1Ids = new Set(t2Exposed.flatMap((t2) => t2.parentIds));
        return { node: n, t2Count: t2Exposed.length, t1Ids: [...t1Ids], t2Names: t2Exposed.map((t) => t.name) };
      })
      .filter((r) => r.t1Ids.length > 0)
      .sort((a, b) => {
        const rOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (rOrder[a.node.risk] ?? 3) - (rOrder[b.node.risk] ?? 3);
      });
  }, [SUB_NODES]);

  const soloSourced = SUB_NODES.filter((n) => n.soloSource);
  const t2Count = SUB_NODES.filter((n) => n.tier === 2).length;
  const t3Count = SUB_NODES.filter((n) => n.tier === 3).length;
  const highRiskNodes = SUB_NODES.filter((n) => n.risk === "high" || n.risk === "critical").length;

  const tabs = [
    { id: "concentration", label: "Concentration Risks" },
    ...T1_IDS.map((id) => ({ id, label: T1_META[id]?.name.split(" ")[0] ?? id })),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* KPI row */}
      <div className="grid-4">
        {[
          { label: "Tier 2 Suppliers Mapped", value: t2Count, sub: "Across 8 tier-1 relationships", color: "var(--accent)" },
          { label: "Tier 3 Nodes Identified", value: t3Count, sub: "Raw material & foundry level", color: "var(--accent)" },
          { label: "Concentration Risks", value: concentrationRisks.filter(r => r.t1Ids.length > 1).length, sub: "Shared sub-tier dependencies", color: "var(--warn)" },
          { label: "Solo-Sourced Inputs", value: soloSourced.length, sub: "No qualified alternative", color: "var(--risk)" },
        ].map((k) => (
          <div key={k.label} className="card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontWeight: 700, fontSize: 13, marginTop: 6 }}>{k.label}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
              background: activeTab === t.id ? "var(--accent)" : "var(--surface)",
              color: activeTab === t.id ? "#fff" : "var(--fg)",
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Concentration Risks tab */}
      {activeTab === "concentration" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="card">
            <h2 style={{ marginBottom: 4 }}>Portfolio Concentration Analysis<InfoTip text="Identifies shared sub-tier nodes where a single entity supplies multiple Tier-1 suppliers — hidden concentration risk. A disruption at a shared Tier-2 or Tier-3 node can cascade across your entire portfolio simultaneously." width={260} /></h2>
            <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              Sub-tier nodes shared across multiple tier-1 supply chains represent hidden single points of failure.
              A disruption at any of these nodes has cascading impact beyond what tier-1 contracts can mitigate.
            </div>

            {concentrationRisks.map((r) => {
              const col = RISK_COLOR[r.node.risk];
              const bg = RISK_BG[r.node.risk];
              return (
                <div key={r.node.id} style={{
                  background: bg, border: `1px solid ${col}`, borderRadius: 10,
                  padding: "14px 16px", marginBottom: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <div style={{
                      background: col, color: "#fff", borderRadius: 8, padding: "6px 10px",
                      fontSize: 11, fontWeight: 700, flexShrink: 0, textAlign: "center", minWidth: 64,
                    }}>
                      {r.node.risk.toUpperCase()}
                      <div style={{ fontSize: 16, marginTop: 2 }}>{flag(r.node.country)}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: col }}>
                        {r.node.name}
                        <span className="muted" style={{ fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                          {r.node.category} · {r.node.country}
                        </span>
                      </div>
                      {r.node.note && (
                        <div style={{ fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>{r.node.note}</div>
                      )}
                      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>Feeds into:</span>
                        {r.t2Names.map((n) => (
                          <span key={n} style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 9999,
                            background: "var(--card)", border: "1px solid var(--line)", fontWeight: 600,
                          }}>{n}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)", marginRight: 4 }}>Affects T1 chains:</span>
                        {r.t1Ids.map((id) => (
                          <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 9999, border: "none", cursor: "pointer",
                              background: "var(--accent)", color: "#fff", fontWeight: 600,
                            }}
                          >
                            {T1_META[id]?.name.split(" ")[0] ?? id}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: col }}>{r.t1Ids.length}</div>
                      <div className="muted" style={{ fontSize: 10 }}>T1 chains<br/>exposed</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Solo-sourced inputs */}
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Solo-Sourced Tier-2 Inputs<InfoTip text="Tier-2 or Tier-3 components with no identified alternative supplier. Unhedged single points of failure — even if your Tier-1 supplier is resilient, disruption at the sub-tier level can halt production." width={260} /></h2>
            {soloSourced.map((n) => (
              <div key={n.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 8, background: "var(--surface)", marginBottom: 8,
                borderLeft: "4px solid #dc2626",
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{n.name} <span className="muted" style={{ fontWeight: 400, fontSize: 11 }}>{flag(n.country)} {n.country}</span></div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{n.note}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>SOLO SOURCE</div>
                  <div className="muted" style={{ fontSize: 10 }}>Supplies: {n.parentIds.map((p) => T1_META[p]?.name.split(" ")[0] ?? p).join(", ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-supplier graph tab */}
      {activeTab !== "concentration" && (T1_IDS as string[]).includes(activeTab) && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>
                {T1_META[activeTab].name} — Sub-tier Supply Chain
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                {flag(T1_META[activeTab].country)} {T1_META[activeTab].country} · {T1_META[activeTab].category} · hover nodes for intelligence notes
              </div>
            </div>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => setRoute("supplier", { id: activeTab })}>
              Open Supplier Profile →
            </button>
          </div>

          <SupplyGraph t1Id={activeTab} nodes={SUB_NODES} t1MetaMap={T1_META} hqName={HQ_NAME} hqCountry={HQ_COUNTRY} />

          {/* Legend */}
          <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
            {Object.entries(RISK_COLOR).map(([level, color]) => (
              <div key={level} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                <span className="muted">{level.charAt(0).toUpperCase() + level.slice(1)}</span>
              </div>
            ))}
            <span className="muted" style={{ fontSize: 11 }}>· SOLO = no qualified alternative · dashed line = elevated risk path</span>
          </div>

          {/* T2/T3 node table for this supplier */}
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: "var(--muted)" }}>NODE DETAIL</div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Supplier</th><th>Tier</th><th>Country</th><th>Category</th><th>Risk</th><th>Solo Source</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const t2Nodes = SUB_NODES.filter((n) => n.tier === 2 && n.parentIds.includes(activeTab));
                    const t2Ids = new Set(t2Nodes.map((n) => n.id));
                    const t3Nodes = SUB_NODES.filter((n) => n.tier === 3 && n.parentIds.some((p) => t2Ids.has(p)));
                    return [...t2Nodes, ...t3Nodes].map((n) => (
                      <tr key={n.id}>
                        <td><b>{n.name}</b></td>
                        <td><span className="muted">Tier {n.tier}</span></td>
                        <td>{flag(n.country)} {n.country}</td>
                        <td className="muted">{n.category}</td>
                        <td>
                          <span style={{
                            fontSize: 11, padding: "2px 8px", borderRadius: 9999, fontWeight: 700,
                            background: RISK_BG[n.risk], color: RISK_COLOR[n.risk],
                          }}>
                            {n.risk.charAt(0).toUpperCase() + n.risk.slice(1)}
                          </span>
                        </td>
                        <td>
                          {n.soloSource
                            ? <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 12 }}>⚠ Yes</span>
                            : <span className="muted">No</span>}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
