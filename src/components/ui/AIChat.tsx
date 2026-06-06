"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { Supplier } from "@/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// ── Rich context builder — mode-aware, full portfolio ─────────────────────────
function buildContext(
  route: string,
  params: Record<string, string>,
  suppliers: Supplier[],
  platformData: {
    crisisRooms: { id: string; title: string; severity: string; status: string; estimatedExposure: string; actions: { done: boolean }[]; affectedParts: string[] }[];
    events: { title: string; severity: string; category: string; status: string; estimatedImpact?: string; leadTimeExtension?: string }[];
    contracts: { title: string; supplierName: string; value: string; expires: string; status: string }[];
    alerts: { supplierId: string; text: string; type: string; date: string }[];
  },
  currency: string,
  role: string
): string {
  const lines: string[] = [
    `Current view: ${route}`,
    `User role: ${role}`,
    `Currency: ${currency}`,
  ];

  // Portfolio summary
  const highRisk = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const medRisk  = suppliers.filter((s) => (s.risk ?? 0) >= 45 && (s.risk ?? 0) < 65);
  const totalExposure = suppliers.reduce((a, s) => a + (s.exposure ?? 0), 0);
  const avgRisk = suppliers.length
    ? Math.round(suppliers.reduce((a, s) => a + (s.risk ?? 0), 0) / suppliers.length)
    : 0;

  lines.push(`\n## Portfolio Summary`);
  lines.push(`Total suppliers: ${suppliers.length} | High risk (≥65): ${highRisk.length} | Medium (45–64): ${medRisk.length}`);
  lines.push(`Total exposure at risk: ${currency}${totalExposure.toFixed(1)}M | Portfolio avg risk score: ${avgRisk}`);

  // All suppliers ranked by risk
  lines.push(`\n## All Suppliers (ranked by risk)`);
  for (const s of [...suppliers].sort((a, b) => (b.risk ?? 0) - (a.risk ?? 0))) {
    const frisk  = s.creditRisk?.friskScore != null ? `FRISK ${s.creditRisk.friskScore}/10` : "";
    const margin = s.ratios?.netProfitMargin != null ? `Margin ${(s.ratios.netProfitMargin * 100).toFixed(1)}%` : "";
    const cr     = s.ratios?.currentRatio != null ? `CR ${s.ratios.currentRatio.toFixed(2)}` : "";
    const de     = s.ratios?.debtToEquity != null ? `D/E ${s.ratios.debtToEquity.toFixed(2)}` : "";
    lines.push(
      `${s.name} (${s.countryCode ?? s.region}): Risk ${s.risk ?? "—"} | ${s.riskState ?? "STABLE"} | ` +
      `Spend ${currency}${(s.spend ?? 0).toFixed(1)}M | Exposure ${currency}${(s.exposure ?? 0).toFixed(1)}M | ` +
      [frisk, de, cr, margin].filter(Boolean).join(" | ") +
      ` | OTIF ${s.onTime ?? "—"}% | PPM ${s.qualityPPM ?? "—"}`
    );
  }

  // Active crisis rooms
  const openRooms = platformData.crisisRooms.filter((r) => r.status === "Open");
  if (openRooms.length > 0) {
    lines.push(`\n## Open Crisis Rooms`);
    for (const r of openRooms) {
      const pending = r.actions.filter((a) => !a.done).length;
      lines.push(`${r.title}: ${r.severity.toUpperCase()} | Exposure ${r.estimatedExposure} | ${pending} actions pending`);
      if (r.affectedParts.length > 0) lines.push(`  Parts at risk: ${r.affectedParts.slice(0, 3).join(", ")}`);
    }
  }

  // Active events
  const activeEvents = platformData.events.filter((e) => e.status === "Active");
  if (activeEvents.length > 0) {
    lines.push(`\n## Active Disruption Events`);
    for (const e of activeEvents.slice(0, 5)) {
      lines.push(
        `${e.title}: ${e.severity.toUpperCase()} ${e.category}` +
        (e.estimatedImpact ? ` | ${e.estimatedImpact}` : "") +
        (e.leadTimeExtension ? ` | +${e.leadTimeExtension} lead time` : "")
      );
    }
  }

  // Contracts needing attention
  const urgentContracts = platformData.contracts.filter((c) =>
    ["Under Renegotiation", "Pending Renewal"].includes(c.status)
  );
  if (urgentContracts.length > 0) {
    lines.push(`\n## Contracts Requiring Action`);
    for (const c of urgentContracts) {
      const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
      lines.push(`${c.title} (${c.supplierName}): ${c.value} | Expires ${c.expires} (${days}d) | ${c.status}`);
    }
  }

  // Recent alerts
  if (platformData.alerts.length > 0) {
    lines.push(`\n## Recent Alerts`);
    for (const a of platformData.alerts.slice(0, 5)) {
      const sup = suppliers.find((s) => s.id === a.supplierId);
      lines.push(`[${a.type.toUpperCase()}] ${sup?.name ?? a.supplierId}: ${a.text} (${a.date})`);
    }
  }

  // Deep context when viewing a specific supplier
  if (route === "supplier" && params.id) {
    const s = suppliers.find((x) => x.id === params.id);
    if (s) {
      lines.push(`\n## Currently Viewing: ${s.name}`);
      lines.push(`Tier ${s.tier} | ${s.category} | ${s.region} | ${s.countryCode ?? ""}`);
      if (s.ratios) {
        lines.push(`Financials: D/E ${s.ratios.debtToEquity.toFixed(2)} | Net margin ${(s.ratios.netProfitMargin * 100).toFixed(1)}% | Current ratio ${s.ratios.currentRatio.toFixed(2)}`);
      }
      if (s.creditRisk) {
        lines.push(`Credit: FRISK ${s.creditRisk.friskScore}/10 | Rating ${s.creditRisk.creditRating} | Insolvency 12m ${(s.creditRisk.insolvencyProbability * 100).toFixed(1)}% | Payment behaviour ${s.creditRisk.paymentBehavior}`);
      }
      if (s.esg) {
        lines.push(`ESG: Score ${s.esg.score}/100 Grade ${s.esg.grade} | Labor risk ${s.esg.laborRisk} | Environmental ${s.esg.environmentalRisk}`);
        if (s.esg.uflpaStatus) {
          lines.push(`US Compliance: UFLPA ${s.esg.uflpaStatus} | SEC Scope 3 ${s.esg.scope3Status ?? "—"} | Conflict Minerals ${s.esg.conflictMineralsStatus ?? "—"}`);
        } else {
          lines.push(`EU Compliance: CSDDD ${s.esg.csdddStatus} | CSRD ${s.esg.csrdStatus} | LkSG ${s.esg.lksgStatus} | EUDR ${s.esg.eudrCompliant}`);
        }
      }
      if (s.resiliency) {
        lines.push(`Resiliency: ${s.resiliency.overall}/10 | Transparency ${s.resiliency.transparency} | Continuity ${s.resiliency.continuity} | SCRM Maturity ${s.resiliency.maturity}`);
      }
      if (s.alerts && s.alerts.length > 0) {
        lines.push(`Supplier alerts: ${s.alerts.slice(0, 3).map((a) => a.text).join(" | ")}`);
      }
      if (s.timeline && s.timeline.length > 0) {
        lines.push(`Recent events: ${s.timeline.slice(-2).map((e) => `${e.date}: ${e.text}`).join(" | ")}`);
      }
    }
  }

  return lines.join("\n");
}

// ── Suggested questions — contextual per view ─────────────────────────────────
function getSuggestedQuestions(
  route: string,
  params: Record<string, string>,
  suppliers: Supplier[],
  crisisRooms: { title: string; status: string }[],
  events: { title: string; status: string }[]
): string[] {
  const escalated  = suppliers.filter((s) => s.riskState === "ESCALATED");
  const highRisk   = suppliers.filter((s) => (s.risk ?? 0) >= 65);
  const openRooms  = crisisRooms.filter((r) => r.status === "Open");
  const activeEvts = events.filter((e) => e.status === "Active");

  if (route === "supplier" && params.id) {
    const s = suppliers.find((x) => x.id === params.id);
    if (s) return [
      `What is driving ${s.name}'s risk score of ${s.risk}?`,
      `What actions should I take with ${s.name} this week?`,
      `Should I qualify a backup supplier for ${s.name}?`,
      `What is the EBITDA impact if ${s.name} disrupts for 4 weeks?`,
    ];
  }

  if (route === "crisis") return [
    openRooms[0] ? `Walk me through the financial exposure for ${openRooms[0].title}.` : `Which crisis is most likely to affect production?`,
    `What is the priority order for actions across all open crisis rooms?`,
    `Which crisis room should I focus on first?`,
    `What is the total exposure across all open crisis rooms?`,
  ];

  if (route === "events") return [
    activeEvts[0] ? `What should I do about "${activeEvts[0].title}"?` : `Which events require immediate action?`,
    `How do the active disruption events affect my supply chain?`,
    `Rank the active events by financial impact.`,
    `Which suppliers are most exposed to current disruptions?`,
  ];

  if (route === "esg") return [
    `Which suppliers have the highest ESG risk?`,
    `Which suppliers are most exposed to UFLPA enforcement?`,
    `Summarise my regulatory compliance gaps.`,
    `What ESG actions should I prioritise this quarter?`,
  ];

  if (route === "analytics") return [
    `Which supplier has the most deteriorating financial trend?`,
    `Compare my portfolio risk against the industry benchmark.`,
    `Which suppliers are improving and which are worsening?`,
    `What is the worst-case disruption scenario for my portfolio?`,
  ];

  if (route === "contracts") return [
    `Which contracts are most urgent to renegotiate?`,
    `Which contract renewals carry the highest financial risk?`,
    `Draft talking points for my next supplier negotiation.`,
    `Which contracts should have performance trigger clauses added?`,
  ];

  if (route === "recovery") return [
    `Which supplier has the shortest time-to-survive?`,
    `Where are the single-source components in my portfolio?`,
    `What safety stock levels should I set for high-risk suppliers?`,
    `Which product lines are most exposed to supply disruption?`,
  ];

  // Dashboard default — prioritise most urgent scenario
  const topRisk = escalated[0] ?? highRisk[0];
  return [
    topRisk ? `What should I do about ${topRisk.name} right now?` : `Which supplier needs my attention most urgently?`,
    `Summarise my top 3 supply chain risks this week.`,
    `What actions should procurement take today?`,
    `Which suppliers are most likely to disrupt production in the next 90 days?`,
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AIChat() {
  const {
    route, params, role, currency,
    platformCrisisRooms, platformEvents, platformContracts, platformAlerts,
  } = useApp();
  const suppliers = useSuppliers();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const getContext = useCallback(() => buildContext(
    route, params, suppliers,
    { crisisRooms: platformCrisisRooms, events: platformEvents, contracts: platformContracts, alerts: platformAlerts },
    currency, role
  ), [route, params, suppliers, platformCrisisRooms, platformEvents, platformContracts, platformAlerts, currency, role]);

  const send = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMsg: Message = { role: "user", content: msg };
    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context: getContext() }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Something went wrong. Check that ANTHROPIC_API_KEY is configured." };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, getContext]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clear() {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }

  const suggested = getSuggestedQuestions(route, params, suppliers, platformCrisisRooms, platformEvents);
  const openRoomCount = platformCrisisRooms.filter((r) => r.status === "Open").length;

  return (
    <>
      <button className="ai-chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Open AI assistant" title="AI Assistant">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>Ask Vero</span>
      </button>

      {open && (
        <div className="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Vero <span style={{ fontWeight: 400, opacity: 0.6 }}>· AI Agent</span></div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Expert supply chain analyst · full portfolio context</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {messages.length > 0 && (
                <button className="ai-chat-clear" onClick={clear} title="Clear chat">Clear</button>
              )}
              <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </div>
          </div>

          {/* Messages / empty state */}
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div style={{ padding: "12px 14px 0" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
                  Suggested questions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggested.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      style={{
                        textAlign: "left", background: "var(--surface)",
                        border: "1px solid var(--line)", borderRadius: 8,
                        padding: "8px 11px", fontSize: 12, cursor: "pointer",
                        color: "var(--fg)", lineHeight: 1.45,
                        transition: "border-color .12s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: "9px 11px", background: "rgba(37,99,235,.06)", border: "1px solid rgba(37,99,235,.15)", borderRadius: 8, fontSize: 11, color: "var(--muted)", lineHeight: 1.5 }}>
                  I have full context on your {suppliers.length} suppliers
                  {openRoomCount > 0 ? `, ${openRoomCount} open crisis rooms` : ""}
                  {platformEvents.filter(e => e.status === "Active").length > 0 ? `, and ${platformEvents.filter(e => e.status === "Active").length} active events` : ""}
                  . Ask anything.
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`ai-chat-msg ${m.role}`}>
                <div className="ai-chat-bubble">
                  {m.content || (m.role === "assistant" && streaming ? <span className="ai-typing">▋</span> : "")}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Ask about suppliers, risks, contracts, compliance…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={streaming}
            />
            <button
              className="ai-chat-send"
              onClick={() => send()}
              disabled={!input.trim() || streaming}
              aria-label="Send"
            >
              {streaming ? "…" : "↑"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
