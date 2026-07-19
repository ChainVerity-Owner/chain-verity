"use client";

import { useState } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { KpiCardV2 } from "@/components/ui/Card";
import { riskStateClass, riskStateLabel } from "@/lib/utils";
import { EuropeMap } from "@/components/ui/Charts";
import { InfoTip } from "@/components/ui/InfoTip";
import { Supplier } from "@/types";
import { RECOVERY_PROFILES, RECOVERY_PROFILES_US } from "@/lib/data";

interface SubtierNode {
  name: string;
  tier: number;
  country: string;
  materials: string[];
  estimatedRisk: string;
  confidence: string;
  rationale: string;
  verification?: "verified" | "corroborated" | "inferred";
  sources?: string[];
}

const VERIFICATION_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  verified:     { label: "Verified",     color: "#0e7490", bg: "rgba(14,116,144,.1)" },
  corroborated: { label: "Corroborated", color: "#4f46e5", bg: "rgba(79,70,229,.1)" },
  inferred:     { label: "AI-Inferred",  color: "#a16207", bg: "rgba(161,98,7,.1)" },
};

interface SubtierResult {
  supplierName: string;
  discoveredNodes: SubtierNode[];
  concentrationRisks: string[];
  dataGaps: string[];
  recommendedActions: string[];
}

function SubtierModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SubtierResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function riskVariant(r: string) {
    if (r === "High") return "risk" as const;
    if (r === "Medium") return "warn" as const;
    return "ok" as const;
  }

  async function runDiscovery() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/discover-subtier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.id,
          supplierName: supplier.name,
          category: supplier.category,
          tier: supplier.tier ?? 1,
          region: supplier.region,
          materials: supplier.networkNodes?.flatMap((n) => n.materials) ?? [],
          criticalParts: supplier.networkNodes?.flatMap((n) => n.sites.flatMap((s) => s.criticalParts)) ?? [],
        }),
      });
      if (!res.ok) throw new Error("Discovery failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Discovery unavailable. Ensure ANTHROPIC_API_KEY is configured.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, maxWidth: 640, width: "100%", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>AI Sub-Tier Discovery</div>
            <div className="muted" style={{ fontSize: 12 }}>{supplier.name} · Tier {supplier.tier} · {supplier.region}</div>
          </div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        {!result && !loading && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🌐</div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Discover sub-tier supply network</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 20 }}>
              Claude AI will map likely Tier {(supplier.tier ?? 1) + 1} and Tier {(supplier.tier ?? 1) + 2} sub-suppliers for {supplier.name} based on industrial supply chain intelligence.
            </div>
            <button className="btn primary" onClick={runDiscovery}>Discover Sub-Tiers</button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div className="muted" style={{ fontSize: 13 }}>Analyzing supply network…</div>
          </div>
        )}

        {error && (
          <div style={{ color: "var(--risk)", fontSize: 13, padding: "12px 0" }}>{error}</div>
        )}

        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {result.discoveredNodes.length} sub-tier nodes discovered
            </div>

            {result.discoveredNodes.map((node, i) => (
              <div key={i} style={{ background: "var(--surface)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{node.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                      Tier {node.tier} · {node.country}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {(() => {
                      const v = VERIFICATION_STYLE[node.verification ?? "inferred"];
                      return (
                        <span style={{
                          fontSize: 10, padding: "3px 8px", borderRadius: 9999, fontWeight: 700,
                          background: v.bg, color: v.color, alignSelf: "center",
                        }}>{v.label}</span>
                      );
                    })()}
                    <Badge variant={riskVariant(node.estimatedRisk)} style={{ fontSize: 10 }}>
                      {node.estimatedRisk} risk
                    </Badge>
                    <Badge variant="muted-b" style={{ fontSize: 10 }}>
                      {node.confidence} confidence
                    </Badge>
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                  Materials: {node.materials.join(", ")}
                </div>
                <div style={{ fontSize: 12 }}>{node.rationale}</div>
                {node.sources && node.sources.length > 0 && (
                  <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                    Sources: {node.sources.join(" · ")}
                  </div>
                )}
              </div>
            ))}

            {result.concentrationRisks.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: "var(--warn)" }}>
                  Concentration Risks
                </div>
                <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  {result.concentrationRisks.map((r, i) => (
                    <li key={i} style={{ fontSize: 12, color: "var(--warn)" }}>{r}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recommendedActions.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Recommended Actions</div>
                <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                  {result.recommendedActions.map((a, i) => (
                    <li key={i} style={{ fontSize: 12 }}>{a}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="note">Sub-tier discovery powered by Claude AI · results are indicative. Validate with supplier questionnaires.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// Static n-tier relationship map
const NETWORK_EDGES: { parentId: string; childId: string; material: string; criticalPart: string }[] = [
  { parentId: "pg", childId: "sup-b", material: "Chemical feedstock", criticalPart: "Resin compound RC-200" },
  { parentId: "pg", childId: "sup-003", material: "Titanium precursor", criticalPart: "Ti alloy TA-4412" },
  { parentId: "sup-001", childId: "sup-002", material: "Precision machined parts", criticalPart: "Precision Part PP-44" },
  { parentId: "sup-001", childId: "sup-003", material: "Raw alloy stock", criticalPart: "Ti alloy TA-4800" },
  { parentId: "sup-a", childId: "sup-005", material: "Polymer precursor", criticalPart: "Base polymer BP-11" },
  { parentId: "sup-b", childId: "sup-005", material: "Steel reinforcement", criticalPart: "Steel rod SR-40" },
];

const SITES = [
  { supplierId: "pg", name: "Meridian Houston Plant", city: "Houston, TX", country: "USA", risk: 58, criticalParts: ["Resin RP-44", "Resin RP-61"] },
  { supplierId: "sup-a", name: "Borealis Singapore Hub", city: "Singapore", country: "SGP", risk: 78, criticalParts: ["Base polymer BP-11", "BP-22"] },
  { supplierId: "sup-001", name: "Halsted Peoria Facility", city: "Peoria, IL", country: "USA", risk: 78, criticalParts: ["Connector Asm C-220", "PCB PA-08"] },
  { supplierId: "sup-b", name: "Apex Frankfurt Plant", city: "Frankfurt", country: "DEU", risk: 41, criticalParts: ["Component CP-118"] },
  { supplierId: "sup-002", name: "Osaka Precision Yokohama", city: "Yokohama", country: "JPN", risk: 41, criticalParts: ["Precision Part PP-44"] },
  { supplierId: "sup-003", name: "Chimera Incheon Works", city: "Incheon", country: "KOR", risk: 62, criticalParts: ["Ti Alloy TA-4412", "TA-4800"] },
  { supplierId: "sup-004", name: "Vantage Antwerp Hub", city: "Antwerp", country: "BEL", risk: 22, criticalParts: ["Logistics SLA"] },
  { supplierId: "sup-005", name: "Durban Steel Durban", city: "Durban", country: "ZAF", risk: 71, criticalParts: ["Steel Rod SR-40", "Base polymer BP-11"] },
];

function riskColor(r: number) {
  return r >= 70 ? "var(--risk)" : r >= 50 ? "var(--warn)" : "var(--ok)";
}

// ── What-if disruption simulation ─────────────────────────────────────────────

type Scenario = { id: string; label: string; outageDays: number | null }; // null = total loss
const SCENARIOS: Scenario[] = [
  { id: "s30",  label: "30-day outage",       outageDays: 30 },
  { id: "s90",  label: "90-day outage",       outageDays: 90 },
  { id: "loss", label: "Total supplier loss", outageDays: null },
];

function DisruptionSimModal({ initialId, onClose }: { initialId: string | null; onClose: () => void }) {
  const { clientMode, currency, setRoute } = useApp();
  const suppliersAll = useSuppliers();
  const profiles = clientMode === "generic" ? RECOVERY_PROFILES_US : RECOVERY_PROFILES;

  // Suppliers with a recovery profile can be simulated with full fidelity
  const simulatable = suppliersAll.filter((s) => profiles[s.id]);
  const [supplierId, setSupplierId] = useState<string>(
    initialId && profiles[initialId] ? initialId : (simulatable[0]?.id ?? "")
  );
  const [scenarioId, setScenarioId] = useState<string>("loss");

  const supplier = suppliersAll.find((s) => s.id === supplierId);
  const profile = profiles[supplierId];
  const scenario = SCENARIOS.find((sc) => sc.id === scenarioId)!;

  if (!supplier || !profile) return null;

  const tts = profile.timeToSurvive;
  const ttr = profile.timeToRecover;
  // Recovery point: for a bounded outage, supply resumes at outage end or when an
  // alternative is qualified — whichever comes first. For total loss, only TTR counts.
  const recoveryDay = scenario.outageDays === null ? ttr : Math.min(scenario.outageDays, ttr);
  const gapDays = Math.max(0, recoveryDay - tts);
  const dailySpendM = (supplier.spend ?? 0) / 365;
  const supplyValueAtRiskM = dailySpendM * gapDays;
  const downstreamEdges = NETWORK_EDGES.filter((e) => e.parentId === supplierId);
  const supplierSites = SITES.filter((s) => s.supplierId === supplierId);

  const severity = gapDays === 0 ? "contained" : gapDays <= 14 ? "elevated" : "critical";
  const sevColor = severity === "contained" ? "var(--ok)" : severity === "elevated" ? "var(--warn)" : "var(--risk)";
  const sevLabel = severity === "contained"
    ? "Contained — existing buffer covers the outage"
    : severity === "elevated"
      ? `Elevated — ${gapDays}-day production gap`
      : `Critical — ${gapDays}-day production halt is the base case`;

  // Timeline geometry (proportional bar, capped at 180 days for display)
  const horizon = Math.max(ttr, scenario.outageDays ?? 0, 60);
  const pct = (d: number) => Math.min(100, (d / horizon) * 100);

  const mitigations: { title: string; detail: string; cost?: string }[] = [];
  if (!profile.alternativeQualified) {
    mitigations.push({
      title: "Qualify secondary source now",
      detail: `No alternative is qualified today. Starting qualification immediately converts a reactive ${ttr}-day scramble into a planned transition.`,
      cost: profile.estimatedStockIncreaseCostM > 0 ? `${currency}${profile.estimatedStockIncreaseCostM.toFixed(1)}M` : undefined,
    });
  }
  if (profile.safetyStockRecommendation > profile.inventoryBufferDays) {
    mitigations.push({
      title: `Increase safety stock ${profile.inventoryBufferDays}d → ${profile.safetyStockRecommendation}d`,
      detail: `Closes ${Math.min(gapDays, profile.safetyStockRecommendation - profile.inventoryBufferDays)} days of the gap. Requires ${profile.additionalStorageM3}m³ additional storage.`,
      cost: `${currency}${profile.estimatedStockIncreaseCostM.toFixed(1)}M`,
    });
  }
  mitigations.push({
    title: "Add business-continuity clause at next renewal",
    detail: "Contractual obligation for the supplier to hold finished-goods buffer and disclose sub-tier dependencies — shifts part of the risk upstream.",
  });

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "var(--card)", borderRadius: 16, padding: 24, maxWidth: 720, width: "100%", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>⚡ Disruption Simulation</div>
            <div className="muted" style={{ fontSize: 12 }}>What happens if this supplier goes down — computed from live TTR/TTS, dependency, and spend data</div>
          </div>
          <button className="btn" onClick={onClose}>✕</button>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <select className="tb-select" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {simulatable.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="tabs" style={{ borderBottom: "none" }}>
            {SCENARIOS.map((sc) => (
              <button key={sc.id} className={`tab ${scenarioId === sc.id ? "active" : ""}`} onClick={() => setScenarioId(sc.id)}>
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Verdict banner */}
        <div style={{
          border: `1px solid ${sevColor}`, borderRadius: 10, padding: "12px 16px", marginBottom: 18,
          background: `color-mix(in srgb, ${sevColor} 8%, var(--card))`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: sevColor, flexShrink: 0 }} />
          <div style={{ fontWeight: 700, fontSize: 14, color: sevColor }}>{sevLabel}</div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Outage timeline
        </div>
        <div style={{ position: "relative", height: 34, borderRadius: 8, background: "var(--surface)", border: "1px solid var(--line)", overflow: "hidden", marginBottom: 6 }}>
          {/* Survival buffer */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct(tts)}%`, background: "rgba(22,163,74,.25)" }} />
          {/* Production gap */}
          {gapDays > 0 && (
            <div style={{ position: "absolute", left: `${pct(tts)}%`, top: 0, bottom: 0, width: `${pct(recoveryDay) - pct(tts)}%`, background: "rgba(220,38,38,.3)" }} />
          )}
          <div style={{ position: "absolute", left: `${pct(tts)}%`, top: 0, bottom: 0, width: 2, background: "var(--risk)" }} />
          <div style={{ position: "absolute", left: `${pct(recoveryDay)}%`, top: 0, bottom: 0, width: 2, background: "var(--accent)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 18 }}>
          <span className="muted">Day 0 — disruption starts</span>
          <span style={{ color: "var(--risk)", fontWeight: 700 }}>Day {tts} — stock exhausted{gapDays > 0 ? ", line stops" : ""}</span>
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>
            Day {recoveryDay} — {scenario.outageDays !== null && scenario.outageDays < ttr ? "supplier restored" : "alternative online"}
          </span>
        </div>

        {/* Impact metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { label: "Time to Survive", value: `${tts}d`, color: "var(--text)" },
            { label: "Production Gap", value: gapDays > 0 ? `${gapDays}d` : "None", color: sevColor },
            { label: "Supply Value at Risk", value: dailySpendM > 0 ? `${currency}${supplyValueAtRiskM.toFixed(1)}M` : "—", color: gapDays > 0 ? "var(--risk)" : "var(--ok)" },
            { label: "Exposure at Risk", value: supplier.exposure != null ? `${currency}${supplier.exposure.toFixed(1)}M` : "—", color: "var(--warn)" },
          ].map((k) => (
            <div key={k.label} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", background: "var(--surface)" }}>
              <div className="muted" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em" }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: k.color, fontFamily: "var(--mono)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Blast radius */}
        <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Blast radius
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "var(--surface)" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Product lines halted</div>
            {profile.affectedProductLines.map((p) => (
              <div key={p} style={{ fontSize: 12, padding: "3px 0", color: "var(--risk)" }}>■ {p}</div>
            ))}
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Critical components lost</div>
            {profile.criticalComponents.map((c) => (
              <div key={c} className="muted" style={{ fontSize: 11, padding: "2px 0" }}>{c}</div>
            ))}
          </div>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "var(--surface)" }}>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Downstream dependencies</div>
            {downstreamEdges.length === 0 && <div className="muted" style={{ fontSize: 12 }}>Direct-to-OEM — no mapped intermediaries</div>}
            {downstreamEdges.map((e) => {
              const dst = suppliersAll.find((s) => s.id === e.childId);
              return (
                <div key={e.childId} style={{ fontSize: 12, padding: "3px 0" }}>
                  → <b>{dst?.name ?? e.childId}</b> <span className="muted">({e.criticalPart})</span>
                </div>
              );
            })}
            <div style={{ fontWeight: 700, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Sites offline</div>
            {supplierSites.length === 0 && <div className="muted" style={{ fontSize: 12 }}>No sites mapped</div>}
            {supplierSites.map((s) => (
              <div key={s.name} className="muted" style={{ fontSize: 11, padding: "2px 0" }}>{s.name} · {s.city}</div>
            ))}
          </div>
        </div>

        {/* Mitigations */}
        <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
          Recommended mitigations
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {mitigations.map((m, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 12px", background: "var(--surface)" }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "var(--accent)", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{m.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{m.detail}</div>
              </div>
              {m.cost && <div style={{ fontWeight: 800, fontSize: 13, flexShrink: 0, fontFamily: "var(--mono)" }}>{m.cost}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={() => { onClose(); setRoute("recovery"); }}>Open Recovery Intel</button>
          <button className="btn primary" onClick={() => { onClose(); setRoute("supplier", { id: supplierId }); }}>Open {supplier.name}</button>
        </div>
      </div>
    </div>
  );
}

export function NetworkMap() {
  const { setRoute, clientMode } = useApp();
  const suppliersAll = useSuppliers();
  const isWB = clientMode === "wb";

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [subtierSupplier, setSubtierSupplier] = useState<Supplier | null>(null);
  const [simOpen, setSimOpen] = useState(false);
  const [simInitialId, setSimInitialId] = useState<string | null>(null);

  const tiers = [1, 2, 3];

  const selectedSupplier = selectedId ? suppliersAll.find((s) => s.id === selectedId) : null;
  const upstreams = NETWORK_EDGES.filter((e) => e.childId === selectedId).map((e) => ({
    edge: e,
    supplier: suppliersAll.find((s) => s.id === e.parentId),
  }));
  const downstreams = NETWORK_EDGES.filter((e) => e.parentId === selectedId).map((e) => ({
    edge: e,
    supplier: suppliersAll.find((s) => s.id === e.childId),
  }));

  const highRiskNodes = suppliersAll.filter((s) => (s.risk || 0) >= 70).length;
  const totalSites = SITES.length;
  const totalParts = SITES.reduce((a, s) => a + s.criticalParts.length, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {subtierSupplier && <SubtierModal supplier={subtierSupplier} onClose={() => setSubtierSupplier(null)} />}
      {simOpen && <DisruptionSimModal initialId={simInitialId} onClose={() => setSimOpen(false)} />}
      <div className="grid-4">
        <KpiCardV2 label="Mapped Suppliers" value={String(suppliersAll.length)} sub="Across all tiers" accent="var(--accent)" icon="🏭" info="Total suppliers mapped across all tiers — Tier 1 (direct), Tier 2 (sub-tier), and Tier 3 (raw material). Select any node in the grid below to view its upstream and downstream connections." />
        <KpiCardV2 label="Production Sites" value={String(totalSites)} sub="Globally mapped" accent="var(--info)" icon="📍" info="Total production facilities mapped across all suppliers in the network. Sites are linked to their parent supplier's risk profile and may carry additional geographic concentration or single-source risk." />
        <KpiCardV2 label="Critical Parts" value={String(totalParts)} sub="Under coverage" accent="var(--ok)" icon="⚙️" info="Distinct critical part numbers tracked across all supply chain edges. A critical part is one where loss of supply would halt production with no immediate substitute — these edges are prioritized in recovery planning." />
        <KpiCardV2 label="High-Risk Nodes" value={String(highRiskNodes)} sub="Risk score ≥ 70" accent="var(--risk)" icon="⚠️" info="Supplier nodes with a risk score ≥ 70 anywhere in the N-tier network. High-risk sub-tier nodes are often invisible to procurement but can cascade disruptions upstream to Tier 1 suppliers." />
      </div>

      {/* Supply Chain Map — WB only */}
      {isWB && (
        <div className="map-card">
          <div className="row" style={{ marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>European Supply Network Map <InfoTip text="Geographic view of the Worcester Bosch supplier footprint across Europe. Pin color indicates risk level. Hover a pin for a quick summary; click to open the full supplier profile." /></h2>
              <div className="card-sub" style={{ marginBottom: 0 }}>Worcester Bosch supplier footprint · hover pins for details · click to open supplier</div>
            </div>
          </div>
          <EuropeMap onSelect={(id) => setRoute("supplier", { id })} />
        </div>
      )}

      {/* Tier grid */}
      <div className="card">
        <div className="row" style={{ marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Supply Chain Network — N-Tier Map <InfoTip text="Structured view of all mapped suppliers across Tier 1 (direct), Tier 2 (sub-tier), and Tier 3 (raw materials). Select a node to reveal upstream suppliers feeding into it and downstream buyers receiving from it." /></h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              Click any supplier node to explore upstream and downstream dependencies.
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn" style={{ fontSize: 12 }} onClick={() => { setSimInitialId(selectedId); setSimOpen(true); }}>
              ⚡ Simulate Disruption
            </button>
            <div className="tabs">
              {["all", "1", "2", "3"].map((t) => (
                <button
                  key={t}
                  className={`tab ${tierFilter === t ? "active" : ""}`}
                  onClick={() => setTierFilter(t)}
                >
                  {t === "all" ? "All Tiers" : `Tier ${t}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
          {tiers.map((tier) => {
            const suppliers = suppliersAll.filter(
              (s) => s.tier === tier && (tierFilter === "all" || String(s.tier) === tierFilter)
            );
            if (tierFilter !== "all" && String(tier) !== tierFilter) return null;
            return (
              <div key={tier}>
                <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", marginBottom: 8 }}>
                  Tier {tier} — {["Direct", "Sub-tier", "Raw material"][tier - 1]}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {suppliers.length === 0 && (
                    <div className="muted" style={{ fontSize: 12 }}>No suppliers at this tier</div>
                  )}
                  {suppliers.map((s) => {
                    const isSelected = selectedId === s.id;
                    const col = riskColor(s.risk || 0);
                    return (
                      <div
                        key={s.id}
                        className="item"
                        style={{
                          border: isSelected ? `2px solid var(--accent)` : undefined,
                          background: isSelected ? "#eff6ff" : undefined,
                        }}
                        onClick={() => setSelectedId(isSelected ? null : s.id)}
                      >
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{s.region} · {s.category}</div>
                        <div className="inline" style={{ marginTop: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: col }}>Risk {s.risk}</span>
                          <Badge variant={riskStateClass(s.riskState, s.risk) as any} style={{ fontSize: 10, padding: "2px 7px" }}>
                            {riskStateLabel(s.riskState, s.risk)}
                          </Badge>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          <button
                            className="btn"
                            style={{ fontSize: 11, padding: "3px 8px" }}
                            onClick={(e) => { e.stopPropagation(); setSubtierSupplier(s); }}
                          >
                            🌐 Discover Sub-Tiers
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dependency panel */}
      {selectedSupplier && (
        <div className="card">
          <div className="row" style={{ marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedSupplier.name} — Dependency Map <InfoTip text="Upstream: companies that supply raw materials or components to this supplier. Downstream: your organization or intermediaries that receive finished goods from them. Site-level detail is shown below." /></h2>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Tier {selectedSupplier.tier} · {selectedSupplier.category} · {selectedSupplier.region}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn" onClick={() => { setSimInitialId(selectedSupplier.id); setSimOpen(true); }}>
                ⚡ Simulate Loss
              </button>
              <button className="btn primary" onClick={() => setRoute("supplier", { id: selectedSupplier.id })}>
                Open Supplier
              </button>
            </div>
          </div>

          <div className="grid-2">
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Upstream (supplies TO this supplier)
              </div>
              {upstreams.length === 0
                ? <div className="muted" style={{ fontSize: 12 }}>No mapped upstream dependencies</div>
                : upstreams.map(({ edge, supplier }) => supplier && (
                  <div key={edge.parentId} className="box" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Material: {edge.material}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Critical part: {edge.criticalPart}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(supplier.risk || 0) }}>
                        Risk {supplier.risk}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Downstream (receives FROM this supplier)
              </div>
              {downstreams.length === 0
                ? <div className="muted" style={{ fontSize: 12 }}>No mapped downstream dependencies</div>
                : downstreams.map(({ edge, supplier }) => supplier && (
                  <div key={edge.childId} className="box" style={{ marginBottom: 8 }}>
                    <div style={{ fontWeight: 600 }}>{supplier.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Material: {edge.material}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Critical part: {edge.criticalPart}</div>
                    <div style={{ marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: riskColor(supplier.risk || 0) }}>
                        Risk {supplier.risk}
                      </span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Sites */}
          <div className="divider" />
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Production Sites</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SITES.filter((s) => s.supplierId === selectedSupplier.id).map((site, i) => (
              <div key={i} className="box">
                <div className="row">
                  <div>
                    <div style={{ fontWeight: 600 }}>{site.name}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>{site.city} · {site.country}</div>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: riskColor(site.risk) }}>Risk {site.risk}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <span className="muted" style={{ fontSize: 11 }}>Critical parts: </span>
                  <span style={{ fontSize: 11 }}>{site.criticalParts.join(", ")}</span>
                </div>
              </div>
            ))}
            {SITES.filter((s) => s.supplierId === selectedSupplier.id).length === 0 && (
              <div className="muted" style={{ fontSize: 12 }}>No sites mapped for this supplier.</div>
            )}
          </div>
        </div>
      )}

      {/* All sites table */}
      <div className="card">
        <h2>All Mapped Sites <InfoTip text="Every production facility in the network, mapped to its supplier and risk score. Sites inherit their parent supplier's risk band but may carry additional geographic or single-source concentration risk." /></h2>
        <div className="card-sub">Global production site coverage across the supply network.</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Site</th>
                <th>Supplier</th>
                <th>Location</th>
                <th>Country</th>
                <th>Risk</th>
                <th>Critical Parts</th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((site, i) => {
                const supplier = suppliersAll.find((s) => s.id === site.supplierId);
                return (
                  <tr key={i}>
                    <td><b>{site.name}</b></td>
                    <td>
                      <span
                        style={{ color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => setRoute("supplier", { id: site.supplierId })}
                      >
                        {supplier?.name}
                      </span>
                    </td>
                    <td>{site.city}</td>
                    <td className="mono">{site.country}</td>
                    <td style={{ color: riskColor(site.risk), fontWeight: 700 }}>{site.risk}</td>
                    <td style={{ fontSize: 12 }}>{site.criticalParts.join(", ")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
