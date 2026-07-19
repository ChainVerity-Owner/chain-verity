"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { RECOVERY_PROFILES, RECOVERY_PROFILES_US } from "@/lib/data";

// ── Platform catches ──────────────────────────────────────────────────────────

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
    signal: "DPO increased 22 days in 6 weeks — supplier extending payment terms to manage cash",
    outcome: "Secondary source qualification initiated 11 weeks before SIT disclosed cash flow issues; continuity maintained",
    avoided: "£4.2M",
    daysEarly: 77,
  },
  {
    date: "02 Nov 2025",
    supplier: "Ebm-papst",
    signal: "Sub-tier concentration: 4 of 6 Tier 1 suppliers share same Tier 2 motor winding manufacturer",
    outcome: "Emergency buffer stock built 8 weeks before factory fire disrupted shared Tier 2 supplier",
    avoided: "£6.1M",
    daysEarly: 56,
  },
  {
    date: "22 Sep 2025",
    supplier: "Grundfos",
    signal: "On-time delivery dropped from 96% to 81% over 6 weeks — operational stress indicator",
    outcome: "Procurement escalated to account manager; root cause identified as logistics partner change; rerouted before line impact",
    avoided: "£1.2M",
    daysEarly: 29,
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
    date: "14 Nov 2025",
    supplier: "XPO Logistics",
    signal: "West Coast port congestion + driver shortage compound signal detected 6 weeks ahead",
    outcome: "Inventory pre-positioned at alternative distribution center; no production impact",
    avoided: "$2.4M",
    daysEarly: 42,
  },
  {
    date: "08 Aug 2025",
    supplier: "Ametek Inc.",
    signal: "Delivery rate fell to 78% — 3 consecutive quarters below 90% OTD threshold",
    outcome: "Dual-sourcing qualification approved and second supplier onboarded before peak season",
    avoided: "$1.9M",
    daysEarly: 38,
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
            background: "var(--card)", overflow: "hidden", cursor: "pointer",
          }}
          onClick={() => setExpanded(expanded === i ? null : i)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: "rgba(0,184,212,.1)", border: "1px solid rgba(0,184,212,.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
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

// ── Decision card ──────────────────────────────────────────────────────────────

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

function DecisionCard({ d, onResolve }: { d: Decision; onResolve: (id: string) => void }) {
  const verbColor = d.severity === "critical" ? "var(--risk)" : "var(--warn)";
  return (
    <div className={`cfo-decision${d.resolved ? " resolved" : ""}`}>
      <div className="cfo-decision-strip" style={{ background: verbColor }} />
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

// ── Risk horizon canvas ────────────────────────────────────────────────────────

interface TimelineEvent {
  day: number;
  label: string;
  sublabel: string;
  color: string;
}

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

    const MUTED = "#5a6478";
    const LINE  = "#1a2030";

    ctx.clearRect(0, 0, W, H);

    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, TRACK_Y);
    ctx.lineTo(W - PAD, TRACK_Y);
    ctx.stroke();

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
  }, [events]);

  useEffect(() => { draw(); }, [draw]);

  return <canvas ref={ref} width={860} height={120} style={{ display: "block", maxWidth: "100%" }} />;
}

// ── Main view ──────────────────────────────────────────────────────────────────

export function CPOBriefing() {
  const { setRoute, currency, clientMode, platformContracts, platformAlerts } = useApp();
  const suppliers = useSuppliers();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const profiles = clientMode === "generic" ? RECOVERY_PROFILES_US : RECOVERY_PROFILES;
  const isWB = clientMode === "wb";

  // ── Data derivations ──────────────────────────────────────────────────────────
  const highRisk = suppliers.filter(s => (s.risk ?? 0) >= 65);
  const belowOTD = suppliers.filter(s => (s.onTime ?? 100) < 95);
  const soloSourced = suppliers
    .map(s => ({ s, p: profiles[s.id] }))
    .filter(({ p }) => p && !p.alternativeQualified);
  const contractsAtRisk = platformContracts.filter(c =>
    ["Under Renegotiation", "Pending Renewal", "Holdover", "Expired"].includes(c.status)
  );
  const contractValueAtRisk = contractsAtRisk.reduce((sum, c) => {
    const v = parseFloat(c.value.replace(/[^0-9.]/g, ""));
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const criticalEntry = soloSourced
    .filter(({ p }) => p.timeToSurvive > 0)
    .sort((a, b) => a.p.timeToSurvive - b.p.timeToSurvive)[0];

  // ── Procurement summary (copyable) ────────────────────────────────────────────
  const procSummary = (() => {
    const soloCount = soloSourced.length;
    const otdStr = belowOTD.length > 0
      ? `${belowOTD.length} supplier${belowOTD.length > 1 ? "s are" : " is"} below the 95% OTD threshold`
      : "all suppliers are meeting on-time delivery targets";
    const contractStr = contractsAtRisk.length > 0
      ? `${contractsAtRisk.length} contract${contractsAtRisk.length > 1 ? "s totalling" : " totalling"} ${currency}${contractValueAtRisk.toFixed(1)}M require${contractsAtRisk.length === 1 ? "s" : ""} action`
      : "no contracts require immediate action";

    let body = `Supplier portfolio: ${highRisk.length} high-risk supplier${highRisk.length !== 1 ? "s" : ""} under active management, ${soloCount} sole-sourced component${soloCount !== 1 ? "s" : ""} without a qualified alternative.`;
    body += ` Delivery performance: ${otdStr}.`;
    if (criticalEntry) {
      body += ` Continuity risk: ${criticalEntry.s.name} has a ${criticalEntry.p.timeToSurvive}-day survival window — Time-to-Recover is ${criticalEntry.p.timeToRecover} days. Immediate dual-source action required.`;
    }
    body += ` Contract pipeline: ${contractStr}.`;
    return body;
  })();

  // ── Decision queue ────────────────────────────────────────────────────────────
  const decisions: Decision[] = [];

  if (criticalEntry) {
    const { s, p } = criticalEntry;
    decisions.push({
      id: "d-continuity",
      verb: "Approve",
      title: `Secondary source qualification — ${s.name}`,
      sub: `Sole-sourced. TTR ${p.timeToRecover}d exceeds TTS ${p.timeToSurvive}d — a disruption causes a production halt before an alternative can be qualified. Qualification spend required immediately.`,
      deadline: `${p.timeToSurvive} days`,
      deadlineLabel: "survival window",
      amount: p.estimatedStockIncreaseCostM > 0 ? `${currency}${p.estimatedStockIncreaseCostM.toFixed(1)}M` : "Cost TBC",
      severity: "critical",
    });
  }

  contractsAtRisk.slice(0, 2).forEach((c, i) => {
    decisions.push({
      id: `d-contract-${i}`,
      verb: "Review",
      title: `${c.supplierName} — contract ${c.status.toLowerCase()}`,
      sub: `No commodity indexation clause in force. Pricing exposed to spot-market escalation until new terms are executed. Recommend revised terms or re-tender.`,
      deadline: c.status === "Holdover" ? "23 days" : "45 days",
      deadlineLabel: c.status === "Holdover" ? "in holdover" : "to expiry",
      amount: c.value,
      severity: "high",
    });
  });

  if (belowOTD.length > 0 && decisions.length < 3) {
    const worst = [...belowOTD].sort((a, b) => (a.onTime ?? 100) - (b.onTime ?? 100))[0];
    decisions.push({
      id: "d-otd",
      verb: "Escalate",
      title: `${worst.name} — OTD at ${worst.onTime ?? "?"}%, below threshold`,
      sub: `Three consecutive months below 95% on-time delivery. Operational stress indicator — recommend formal performance review and SLA remediation plan within 14 days.`,
      deadline: "14 days",
      deadlineLabel: "recommended",
      amount: "—",
      severity: "high",
    });
  }

  if (decisions.length < 2 && platformAlerts.length > 0) {
    const alert = platformAlerts.find(a => a.type === "risk");
    if (alert) {
      decisions.push({
        id: "d-alert-0",
        verb: "Review",
        title: alert.text,
        sub: "Escalated for procurement awareness.",
        deadline: "This week",
        deadlineLabel: "recommended",
        amount: "—",
        severity: "high",
      });
    }
  }

  // ── Timeline events ───────────────────────────────────────────────────────────
  const RISK_COLOR = "#e84040";
  const WARN_COLOR = "#f59e0b";
  const ACC_COLOR  = "#00b8d4";

  const timelineEvents: TimelineEvent[] = [];

  soloSourced
    .filter(({ p }) => p.timeToSurvive > 0 && p.timeToSurvive <= 90)
    .sort((a, b) => a.p.timeToSurvive - b.p.timeToSurvive)
    .slice(0, 3)
    .forEach(({ s, p }) => {
      timelineEvents.push({
        day: p.timeToSurvive,
        label: s.name.split(" ")[0],
        sublabel: `${p.timeToSurvive}d window`,
        color: p.timeToSurvive <= 21 ? RISK_COLOR : WARN_COLOR,
      });
    });

  contractsAtRisk.slice(0, 2).forEach((c, i) => {
    timelineEvents.push({
      day: 28 + i * 18,
      label: (c.supplierName ?? "Contract").split(" ")[0],
      sublabel: "contract review",
      color: WARN_COLOR,
    });
  });

  if (belowOTD.length > 0) {
    timelineEvents.push({
      day: 14,
      label: belowOTD[0].name.split(" ")[0],
      sublabel: "OTD review",
      color: ACC_COLOR,
    });
  }

  timelineEvents.sort((a, b) => a.day - b.day);

  const handleResolve = (id: string) => setResolvedIds(prev => new Set([...prev, id]));
  const activeDecisions = decisions.map(d => ({ ...d, resolved: resolvedIds.has(d.id) }));
  const pendingCount = activeDecisions.filter(d => !d.resolved).length;

  const handleCopy = () => {
    navigator.clipboard.writeText(procSummary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Deltas ────────────────────────────────────────────────────────────────────
  const deltas = [
    criticalEntry && {
      color: "var(--risk)",
      text: <><strong>{criticalEntry.s.name} — sole-sourced with {criticalEntry.p.timeToSurvive}-day survival window.</strong>{" "}<span>TTR is {criticalEntry.p.timeToRecover} days — production halt is the base case without a qualified alternative. Requires immediate action.</span></>,
    },
    belowOTD.length > 0 && {
      color: "var(--warn)",
      text: <><strong>{belowOTD.length} supplier{belowOTD.length > 1 ? "s" : ""} below 95% on-time delivery.</strong>{" "}<span>{belowOTD.map(s => s.name).join(", ")}. Persistent underperformance precedes financial stress by 1–2 quarters.</span></>,
    },
    contractsAtRisk.length > 0 && {
      color: "var(--warn)",
      text: <><strong>{contractsAtRisk.length} contract{contractsAtRisk.length > 1 ? "s" : ""} ({currency}{contractValueAtRisk.toFixed(1)}M) require action.</strong>{" "}<span>{contractsAtRisk[0]?.supplierName} — {contractsAtRisk[0]?.status.toLowerCase()}. Pricing unprotected against commodity escalation.</span></>,
    },
    {
      color: "var(--ok)",
      text: <><strong>{suppliers.filter(s => (s.risk ?? 0) < 45).length} suppliers rated Low risk.</strong>{" "}<span>No deterioration versus prior period in lower-risk cohort.</span></>,
    },
  ].filter(Boolean) as { color: string; text: React.ReactNode }[];

  return (
    <div className="cfo-briefing">
      {/* Header */}
      <div className="cfo-header">
        <div className="cfo-header-left">
          <div className="cfo-header-title">CPO Briefing</div>
          <div className="cfo-header-stamp">
            {isWB ? "Worcester Bosch" : "Meridian Industrial"} · {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
        </div>
        <div className="cfo-header-right">
          <div className="cfo-mode-toggle">
            <button className="cfo-mode-btn" onClick={() => setRoute("dashboard")}>Dashboard</button>
            <button className="cfo-mode-btn on">CPO Briefing</button>
          </div>
          {pendingCount > 0 && (
            <div className="cfo-pending-pill">{pendingCount} action{pendingCount !== 1 ? "s" : ""} pending</div>
          )}
        </div>
      </div>

      {/* Since last visit */}
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

      {/* Procurement summary */}
      <div className="cfo-board-summary">
        <div className="cfo-board-eyebrow">Procurement summary</div>
        <div className="cfo-board-body">{procSummary}</div>
        <button className="cfo-board-copy" onClick={handleCopy}>{copied ? "Copied" : "Copy"}</button>
      </div>

      {/* Decision queue */}
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

      {/* Platform catches */}
      <div className="cfo-section-head" style={{ marginTop: 32 }}>
        <span className="cfo-section-lbl">Platform catches · validated early warnings</span>
      </div>
      <PlatformCatches catches={isWB ? PLATFORM_CATCHES_WB : PLATFORM_CATCHES_US} currency={currency} />

      {/* Risk horizon */}
      <div className="cfo-section-head" style={{ marginTop: 32 }}>
        <span className="cfo-section-lbl">Supply risk horizon · next 90 days</span>
      </div>
      <div className="cfo-timeline-card">
        <div style={{ overflowX: "auto" }}>
          <RiskTimeline events={timelineEvents} />
        </div>
        <div className="cfo-timeline-legend">
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#e84040" }} />Continuity / survival window</div>
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#f59e0b" }} />Contract review / expiry</div>
          <div className="cfo-leg"><div className="cfo-leg-dot" style={{ background: "#00b8d4" }} />OTD / performance review</div>
        </div>
      </div>
    </div>
  );
}
