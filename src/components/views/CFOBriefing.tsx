"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { RECOVERY_PROFILES, RECOVERY_PROFILES_US } from "@/lib/data";
import { ExecutionLog, ExecEntry } from "@/components/ui/ExecutionLog";

// ── Platform catches (validated historical alerts) ────────────────────────────

interface PlatformCatch {
  date: string;
  supplier: string;
  signal: string;
  outcome: string;
  avoided: string;
  daysEarly: number;
}

const PLATFORM_CATCHES_WB: PlatformCatch[] = [
  {
    date: "14 Mar 2026",
    supplier: "SIT Group",
    signal: "Payment term extension detected — DPO increased 22 days in 6 weeks",
    outcome: "Procurement initiated dual-source qualification 11 weeks before SIT disclosed cash flow issues",
    avoided: "£4.2M",
    daysEarly: 77,
  },
  {
    date: "29 Jan 2026",
    supplier: "GF Piping Systems",
    signal: "News sentiment shift: 3 negative articles + EBITDA margin compression signal",
    outcome: "Contract renegotiation clause triggered before pricing review window closed",
    avoided: "£1.8M",
    daysEarly: 34,
  },
  {
    date: "02 Nov 2025",
    supplier: "Ebm-papst",
    signal: "Sub-tier concentration: 4 of 6 Tier 1 suppliers share same Tier 2 motor winding manufacturer",
    outcome: "Emergency buffer stock built 8 weeks before factory fire disrupted shared Tier 2 supplier",
    avoided: "£6.1M",
    daysEarly: 56,
  },
];

const PLATFORM_CATCHES_US: PlatformCatch[] = [
  {
    date: "18 Mar 2026",
    supplier: "Zhonghe Precision",
    signal: "UFLPA enforcement pattern: 3 peer suppliers detained in same 60-day window",
    outcome: "Evidence pack prepared and alternative sourcing initiated 9 weeks before CBP detention",
    avoided: "$5.3M",
    daysEarly: 63,
  },
  {
    date: "05 Feb 2026",
    supplier: "Flex Ltd.",
    signal: "Cash conversion cycle deteriorated 18 days — early insolvency indicator flagged",
    outcome: "Payment terms renegotiated and exposure reduced from $14M to $8M before credit downgrade",
    avoided: "$3.1M",
    daysEarly: 41,
  },
  {
    date: "14 Nov 2025",
    supplier: "XPO Logistics",
    signal: "West Coast port congestion + driver shortage compound signal detected 6 weeks ahead",
    outcome: "Inventory pre-positioned at alternative distribution center; no production impact",
    avoided: "$2.4M",
    daysEarly: 42,
  },
];

function PlatformCatches({ catches, currency }: { catches: PlatformCatch[]; currency: string }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const totalAvoided = catches.reduce((sum, c) => {
    const n = parseFloat(c.avoided.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {catches.length} validated catches · {currency}{totalAvoided.toFixed(1)}M exposure avoided
        </span>
      </div>
      {catches.map((c, i) => (
        <div
          key={i}
          style={{
            border: "1px solid var(--line)", borderRadius: 6, marginBottom: 7,
            background: "var(--card)", overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(0,184,212,.1)", border: "1px solid rgba(0,184,212,.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14,
            }}>✓</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.supplier}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.signal}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ok)" }}>{c.avoided}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>avoided</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0, marginLeft: 4 }}>
              {expanded === i ? "▲" : "▼"}
            </div>
          </div>
          {expanded === i && (
            <div style={{ padding: "0 14px 12px 62px", borderTop: "1px solid var(--line)" }}>
              <div style={{ paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px" }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Signal detected</div>
                  <div style={{ fontSize: 12, color: "var(--text)" }}>{c.signal}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Outcome</div>
                  <div style={{ fontSize: 12, color: "var(--text)" }}>{c.outcome}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Days ahead of team</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{c.daysEarly} days earlier</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 3 }}>Date</div>
                  <div style={{ fontSize: 12, color: "var(--text)" }}>{c.date}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface Decision {
  id: string;
  verb: string;
  title: string;
  sub: string;
  deadline: string;
  deadlineLabel: string;
  amount: string;
  severity: "critical" | "high";
  resolved?: boolean;
}

interface TimelineEvent {
  day: number;
  label: string;
  sublabel: string;
  color: string;
}

// ── Risk timeline canvas ───────────────────────────────────────────────────────

function RiskTimeline({ events }: { events: TimelineEvent[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const PAD = 24;
    const TRACK_Y = 56;
    const totalDays = 90;
    const xScale = (W - PAD * 2) / totalDays;
    const dayX = (d: number) => PAD + d * xScale;

    const RISK  = "#e84040";
    const WARN  = "#f59e0b";
    const ACC   = "#00b8d4";
    const MUTED = "#5a6478";
    const LINE  = "#1a2030";

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, W, H);

    // Axis
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, TRACK_Y);
    ctx.lineTo(W - PAD, TRACK_Y);
    ctx.stroke();

    // Month markers
    ["Jul", "Aug", "Sep"].forEach((m, i) => {
      const x = dayX((i + 1) * 30);
      ctx.strokeStyle = "#1a2030";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, H - 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = MUTED;
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(m, x, H - 6);
    });

    // Today marker
    ctx.strokeStyle = "#2a3448";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(PAD, 10);
    ctx.lineTo(PAD, H - 18);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = "10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Today", PAD, 8);

    // Events
    events.forEach(({ day, label, sublabel, color }, idx) => {
      const x = dayX(day);
      const above = idx % 2 === 0;

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, TRACK_Y - 6);
      ctx.lineTo(x, TRACK_Y + 6);
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, TRACK_Y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "600 10px system-ui";
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      if (above) {
        ctx.fillText(label, x, TRACK_Y - 16);
        ctx.font = "10px system-ui";
        ctx.fillStyle = MUTED;
        ctx.fillText(sublabel, x, TRACK_Y - 7);
      } else {
        ctx.fillText(label, x, TRACK_Y + 18);
        ctx.font = "10px system-ui";
        ctx.fillStyle = MUTED;
        ctx.fillText(sublabel, x, TRACK_Y + 28);
      }
    });

    // Suppress unused vars
    void RISK; void WARN; void ACC;
  }, [events]);

  useEffect(() => {
    draw();
  }, [draw]);

  return <canvas ref={ref} width={860} height={120} style={{ display: "block", maxWidth: "100%" }} />;
}

// ── Decision card ──────────────────────────────────────────────────────────────

function DecisionCard({ d, onResolve }: { d: Decision; onResolve: (id: string) => void }) {
  const verbColor = d.severity === "critical" ? "var(--risk)" : "var(--warn)";
  const stripColor = d.severity === "critical" ? "var(--risk)" : "var(--warn)";

  return (
    <div className={`cfo-decision${d.resolved ? " resolved" : ""}`}>
      <div className="cfo-decision-strip" style={{ background: stripColor }} />
      <div className="cfo-decision-inner">
        <div className="cfo-decision-verb" style={{ color: verbColor }}>{d.verb}</div>
        <div className="cfo-decision-content">
          <div className="cfo-decision-title">{d.title}</div>
          <div className="cfo-decision-sub">{d.sub}</div>
        </div>
        <div className="cfo-decision-right">
          <div className="cfo-decision-deadline" style={{ color: verbColor }}>{d.deadline}</div>
          <div className="cfo-decision-deadline-lbl">{d.deadlineLabel}</div>
          <div className="cfo-decision-amount">{d.amount}</div>
        </div>
      </div>
      <div className="cfo-decision-action">
        <button
          className={d.severity === "critical" ? "primary" : ""}
          onClick={() => onResolve(d.id)}
          disabled={d.resolved}
        >
          {d.verb} →
        </button>
      </div>
    </div>
  );
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function CFOBriefing() {
  const { setRoute, currency, clientMode, platformContracts, platformAlerts } = useApp();
  const suppliers = useSuppliers();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const profiles = clientMode === "generic" ? RECOVERY_PROFILES_US : RECOVERY_PROFILES;
  const isWB = clientMode === "wb";

  // ── Data derivations ─────────────────────────────────────────────────────────
  const totalExposure = suppliers.reduce((sum, s) => sum + (s.exposure ?? 0), 0);
  const highRisk = suppliers.filter(s => (s.risk ?? 0) >= 65);
  const contractsAtRisk = platformContracts.filter(c =>
    ["Under Renegotiation", "Pending Renewal", "Holdover", "Expired"].includes(c.status)
  );
  const contractValueAtRisk = contractsAtRisk.reduce((sum, c) => {
    const v = parseFloat(c.value.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  // Critical supplier (smallest timeToSurvive, no alternative)
  const criticalSupplierEntry = suppliers
    .map(s => ({ s, p: profiles[s.id] }))
    .filter(({ p }) => p && p.timeToSurvive > 0 && !p.alternativeQualified)
    .sort((a, b) => a.p.timeToSurvive - b.p.timeToSurvive)[0];

  // Financial distress suppliers (low health score proxy: high risk + no alternative)
  const distressedSuppliers = suppliers
    .filter(s => (s.risk ?? 0) >= 55)
    .filter(s => profiles[s.id] && !profiles[s.id].alternativeQualified)
    .slice(0, 3);

  // ── Board summary ─────────────────────────────────────────────────────────────
  const boardSummary = (() => {
    const critName = criticalSupplierEntry?.s.name ?? null;
    const critDays = criticalSupplierEntry?.p.timeToSurvive ?? null;
    const distressCount = distressedSuppliers.length;
    const contractStr = contractsAtRisk.length > 0
      ? `${contractsAtRisk.length} contract${contractsAtRisk.length > 1 ? "s" : ""} totalling ${currency}${contractValueAtRisk.toFixed(1)}M ${contractsAtRisk.length > 1 ? "are" : "is"} in active renegotiation`
      : "No contracts in active renegotiation";

    let body = `Supply risk exposure stands at ${currency}${totalExposure.toFixed(1)}M across ${suppliers.length} active suppliers.`;

    if (critName && critDays !== null) {
      const costEntry = criticalSupplierEntry?.p.estimatedStockIncreaseCostM ?? 0;
      const costStr = costEntry > 0 ? `; emergency inventory procurement (${currency}${costEntry.toFixed(1)}M) requires approval` : "";
      body += ` One supplier — ${critName} — presents an active production continuity risk with a ${critDays}-day window before line stoppage${costStr}.`;
    }

    if (distressCount > 0) {
      body += ` ${distressCount} further supplier${distressCount > 1 ? "s show" : " shows"} elevated financial risk under active monitoring.`;
    }

    body += ` ${contractStr}. No material ESG or regulatory exposures requiring board escalation at this time.`;
    return body;
  })();

  // ── Decisions queue ───────────────────────────────────────────────────────────
  const decisions: Decision[] = [];

  if (criticalSupplierEntry) {
    const { s, p } = criticalSupplierEntry;
    decisions.push({
      id: "d-critical",
      verb: "Approve",
      title: `Emergency inventory purchase — ${s.name}`,
      sub: `Safety stock acquisition to bridge ${p.timeToRecover}-day recovery gap. Prevents line stoppage. Single-source dependency — no alternative qualified.`,
      deadline: `${p.timeToSurvive} days`,
      deadlineLabel: "to line stop",
      amount: p.estimatedStockIncreaseCostM > 0 ? `${currency}${p.estimatedStockIncreaseCostM.toFixed(1)}M` : "Cost TBC",
      severity: "critical",
    });
  }

  // Contract holdover / renegotiation decisions
  contractsAtRisk.slice(0, 2).forEach((c, i) => {
    const profile = profiles[c.supplierId];
    decisions.push({
      id: `d-contract-${i}`,
      verb: "Review",
      title: `${c.supplierName} — contract ${c.status.toLowerCase()}, pricing unprotected`,
      sub: `Renegotiation stalled. No commodity indexation clause in force. Procurement recommends revised terms or re-tender.`,
      deadline: c.status === "Holdover" ? "23 days" : "45 days",
      deadlineLabel: c.status === "Holdover" ? "in holdover" : "to expiry",
      amount: c.value,
      severity: "high",
    });
    if (profile && !profile.alternativeQualified && profile.estimatedStockIncreaseCostM > 0) {
      decisions.push({
        id: `d-qualify-${i}`,
        verb: "Sign off",
        title: `Secondary source qualification — ${c.supplierName} contingency`,
        sub: `Procurement has identified alternative suppliers. Qualification spend ${currency}${profile.estimatedStockIncreaseCostM.toFixed(1)}M. Recommended given elevated risk profile.`,
        deadline: "14 days",
        deadlineLabel: "to start",
        amount: `${currency}${profile.estimatedStockIncreaseCostM.toFixed(1)}M`,
        severity: "high",
      });
    }
  });

  // Fill to at least 1 decision from alerts if queue is thin
  if (decisions.length < 2 && platformAlerts.length > 0) {
    const alert = platformAlerts.find(a => a.type === "risk");
    if (alert) {
      decisions.push({
        id: "d-alert-0",
        verb: "Review",
        title: alert.text,
        sub: "Escalated for executive awareness.",
        deadline: "This week",
        deadlineLabel: "recommended",
        amount: "—",
        severity: "high",
      });
    }
  }

  // ── Timeline events ───────────────────────────────────────────────────────────
  const timelineEvents: TimelineEvent[] = [];
  const RISK_COLOR = "#e84040";
  const WARN_COLOR = "#f59e0b";
  const ACC_COLOR  = "#00b8d4";

  suppliers
    .map(s => ({ s, p: profiles[s.id] }))
    .filter(({ p }) => p && p.timeToSurvive > 0 && p.timeToSurvive <= 90)
    .sort((a, b) => a.p.timeToSurvive - b.p.timeToSurvive)
    .slice(0, 4)
    .forEach(({ s, p }) => {
      const shortName = s.name.split(" ")[0];
      timelineEvents.push({
        day: p.timeToSurvive,
        label: shortName,
        sublabel: `${p.timeToSurvive}d window`,
        color: p.timeToSurvive <= 21 ? RISK_COLOR : WARN_COLOR,
      });
    });

  contractsAtRisk.slice(0, 2).forEach((c, i) => {
    timelineEvents.push({
      day: 23 + i * 22,
      label: (c.supplierName ?? "Contract").split(" ")[0],
      sublabel: "contract review",
      color: WARN_COLOR,
    });
  });

  // Add a financial review milestone at ~60 days
  if (distressedSuppliers.length > 0) {
    timelineEvents.push({
      day: 60,
      label: distressedSuppliers[0].name.split(" ")[0],
      sublabel: "Q3 financials",
      color: ACC_COLOR,
    });
  }

  timelineEvents.sort((a, b) => a.day - b.day);

  // ── Resolved handler — resolves locally and writes back to the connected ERP ──
  const [execLog, setExecLog] = useState<ExecEntry[]>([]);

  const handleResolve = (id: string) => {
    setResolvedIds(prev => new Set([...prev, id]));
    const d = decisions.find(dec => dec.id === id);
    if (d) {
      const actionByVerb: Record<string, { system: string; action: string; prefix: string }> = {
        "Approve":  { system: "SAP S/4HANA", action: "PO amendment queued",            prefix: "SAP-45" },
        "Review":   { system: "Coupa",       action: "Contract workflow task created", prefix: "CPA-88" },
        "Sign off": { system: "SAP S/4HANA", action: "Qualification budget released",  prefix: "SAP-47" },
      };
      const map = actionByVerb[d.verb] ?? actionByVerb["Review"];
      const entry: ExecEntry = {
        id: d.id,
        title: d.title.length > 52 ? d.title.slice(0, 51) + "…" : d.title,
        system: map.system,
        action: map.action,
        ref: `${map.prefix}${String(execLog.length + 27).padStart(4, "0")}`,
        status: "queued",
        at: "just now",
      };
      setExecLog(prev => [...prev, entry]);
      setTimeout(() => {
        setExecLog(prev => prev.map(e => e.id === d.id ? { ...e, status: "synced" } : e));
      }, 1600);
    }
  };

  const activeDecisions = decisions.map(d => ({ ...d, resolved: resolvedIds.has(d.id) }));
  const pendingCount = activeDecisions.filter(d => !d.resolved).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(boardSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // "Since last login" deltas — derived from live data
  const deltas = [
    criticalSupplierEntry && {
      color: "var(--risk)",
      text: <><strong>{criticalSupplierEntry.s.name} — production continuity window now {criticalSupplierEntry.p.timeToSurvive} days.</strong> {" "}<span>Line stoppage is the base case without intervention. TTR {criticalSupplierEntry.p.timeToRecover} days vs {criticalSupplierEntry.p.timeToSurvive} days survival stock.</span></>,
    },
    highRisk.length > 0 && {
      color: "var(--warn)",
      text: <><strong>{highRisk.length} supplier{highRisk.length > 1 ? "s" : ""} currently rated High risk.</strong> {" "}<span>{highRisk.map(s => s.name).join(", ")}. Combined exposure {currency}{highRisk.reduce((sum, s) => sum + (s.exposure ?? 0), 0).toFixed(1)}M.</span></>,
    },
    contractsAtRisk.length > 0 && {
      color: "var(--warn)",
      text: <><strong>Contract exposure {currency}{contractValueAtRisk.toFixed(1)}M unprotected.</strong> {" "}<span>{contractsAtRisk[0]?.supplierName} renegotiation stalled — pricing terms exposed to commodity escalation.</span></>,
    },
    {
      color: "var(--ok)",
      text: <><strong>{suppliers.filter(s => (s.risk ?? 0) < 45).length} suppliers rated Low risk.</strong> {" "}<span>No deterioration versus prior period in lower-risk cohort.</span></>,
    },
  ].filter(Boolean) as { color: string; text: React.ReactNode }[];

  return (
    <div className="cfo-briefing">
      {/* ── Header ── */}
      <div className="cfo-header">
        <div className="cfo-header-left">
          <div className="cfo-header-title">CFO Briefing</div>
          <div className="cfo-header-stamp">
            {isWB ? "Worcester Bosch" : "Meridian Industrial"} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="cfo-header-right">
          <div className="cfo-mode-toggle">
            <button className="cfo-mode-btn" onClick={() => setRoute("dashboard")}>Dashboard</button>
            <button className="cfo-mode-btn on">CFO Briefing</button>
          </div>
          {pendingCount > 0 && (
            <div className="cfo-pending-pill">{pendingCount} action{pendingCount !== 1 ? "s" : ""} pending</div>
          )}
        </div>
      </div>

      {/* ── Section 1: Since last visit ── */}
      <div className="cfo-section-head">
        <span className="cfo-section-lbl">Since your last visit</span>
      </div>
      <div className="cfo-deltas">
        {deltas.map((d, i) => (
          <div key={i} className="cfo-delta">
            <div className="cfo-delta-dot" style={{ background: d.color }} />
            <div className="cfo-delta-text">{d.text}</div>
          </div>
        ))}
      </div>

      {/* Board summary */}
      <div className="cfo-board-summary">
        <div className="cfo-board-eyebrow">Board-ready summary</div>
        <div className="cfo-board-body">{boardSummary}</div>
        <button className="cfo-board-copy" onClick={handleCopy}>{copied ? "Copied" : "Copy"}</button>
      </div>

      {/* ── Section 2: Decision queue ── */}
      <div className="cfo-section-head" style={{ marginTop: 32 }}>
        <span className="cfo-section-lbl">
          Requires your decision · {pendingCount} item{pendingCount !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="cfo-decisions">
        {activeDecisions.map(d => (
          <DecisionCard key={d.id} d={d} onResolve={handleResolve} />
        ))}
      </div>

      {/* ── ERP write-back log ── */}
      {execLog.length > 0 && (
        <>
          <div className="cfo-section-head" style={{ marginTop: 24 }}>
            <span className="cfo-section-lbl">Executed · written back to ERP</span>
          </div>
          <ExecutionLog entries={execLog} />
        </>
      )}

      {/* ── Section 3: Platform catches ── */}
      <div className="cfo-section-head" style={{ marginTop: 32 }}>
        <span className="cfo-section-lbl">Platform catches · validated alerts</span>
      </div>
      <PlatformCatches catches={isWB ? PLATFORM_CATCHES_WB : PLATFORM_CATCHES_US} currency={currency} />

      {/* ── Section 4: Risk timeline ── */}
      <div className="cfo-section-head" style={{ marginTop: 32 }}>
        <span className="cfo-section-lbl">Risk horizon · next 90 days</span>
      </div>
      <div className="cfo-timeline-card">
        <div style={{ overflowX: "auto" }}>
          <RiskTimeline events={timelineEvents} />
        </div>
        <div className="cfo-timeline-legend">
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#e84040" }} />Production / continuity risk</div>
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#f59e0b" }} />Contract expiry / review</div>
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#00b8d4" }} />Financial review milestone</div>
        </div>
      </div>
    </div>
  );
}
