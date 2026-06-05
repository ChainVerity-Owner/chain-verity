"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { suppliersAll, CONTRACTS } from "@/lib/data";

interface Message {
  role: "user" | "assistant";
  content: string;
}

function buildContext(route: string, params: Record<string, string>): string {
  const lines: string[] = [`Current view: ${route}`];

  if (route === "supplier" && params.id) {
    const s = suppliersAll.find((x) => x.id === params.id);
    if (s) {
      lines.push(`Viewing supplier: ${s.name} (${s.ticker ?? "—"})`);
      lines.push(`Tier: ${s.tier} | Region: ${s.region} | Category: ${s.category}`);
      lines.push(`Risk score: ${s.risk ?? "—"} | State: ${s.riskState ?? "STABLE"}`);
      lines.push(`Spend: $${((s.spend ?? 0) / 1e6).toFixed(1)}M | Exposure: $${((s.exposure ?? 0) / 1e6).toFixed(1)}M`);
      if (s.ratios) {
        lines.push(`D/E ratio: ${s.ratios.debtToEquity} | Net margin: ${(s.ratios.netProfitMargin * 100).toFixed(1)}% | Current ratio: ${s.ratios.currentRatio}`);
      }
      if (s.creditRisk) {
        lines.push(`FRISK score: ${s.creditRisk.friskScore}/10 | Credit rating: ${s.creditRisk.creditRating} | Bankruptcy risk 12m: ${s.creditRisk.bankruptcyRisk12m}`);
      }
      if (s.esg) {
        lines.push(`ESG score: ${s.esg.score}/100 (${s.esg.grade}) | EUDR: ${s.esg.eudrCompliant} | CSRD: ${s.esg.csrdStatus}`);
      }
    }
  }

  if (route === "dashboard" || route === "alerts") {
    const highRisk = suppliersAll.filter((s) => (s.risk ?? 0) >= 70);
    lines.push(`High-risk suppliers (score ≥70): ${highRisk.map((s) => `${s.name} (${s.risk})`).join(", ")}`);
  }

  if (route === "contracts") {
    const expiringSoon = CONTRACTS.filter((c) => {
      const days = Math.round((new Date(c.expires).getTime() - Date.now()) / 86400000);
      return days < 90;
    });
    lines.push(`Contracts expiring within 90 days: ${expiringSoon.map((c) => `${c.title} — ${c.supplierName} (expires ${c.expires})`).join("; ")}`);
  }

  lines.push(`Total governed suppliers: ${suppliersAll.length}`);

  return lines.join("\n");
}

export function AIChat() {
  const { route, params } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: Message = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: buildContext(route, params),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
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
          copy[copy.length - 1] = { role: "assistant", content: "Sorry, something went wrong. Check that ANTHROPIC_API_KEY is set." };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [input, messages, streaming, route, params]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clear() {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }

  return (
    <>
      <button
        className="ai-chat-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI assistant"
        title="AI Assistant"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span>AI</span>
      </button>

      {open && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Chain Verity AI</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Ask about suppliers, risks, contracts</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {messages.length > 0 && (
                <button className="ai-chat-clear" onClick={clear} title="Clear chat">
                  Clear
                </button>
              )}
              <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
          </div>

          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-chat-empty">
                <div style={{ fontSize: 13, opacity: 0.6, textAlign: "center", padding: "20px 16px" }}>
                  Ask about high-risk suppliers, contract renewals, ESG compliance, or any supply chain question.
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

          <div className="ai-chat-input-row">
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              disabled={streaming}
            />
            <button
              className="ai-chat-send"
              onClick={send}
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
