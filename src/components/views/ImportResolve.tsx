"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { PROVENANCE_META } from "@/lib/data/provenance";

// ── Review-queue fixtures ─────────────────────────────────────────────────────
// Rows a customer's supplier master actually contains: abbreviations, DBA
// aliases, division suffixes, and private companies with no registry presence.

interface Candidate {
  name: string;
  meta: string;
  source: "SEC" | "GLEIF";
  confidence: number;
}

interface ReviewRow {
  id: string;
  raw: string;
  spend: number;
  hint: string;
  candidates: Candidate[];
}

const ROWS_US: ReviewRow[] = [
  {
    id: "r1",
    raw: "PRECISION MACHINING SOLUTIONS LLC",
    spend: 2.4,
    hint: "No identifier supplied · Ohio",
    candidates: [
      { name: "Precision Machining Solutions, LLC", meta: "LEI 5493001KJTIIGC8Y1R12 · US-OH · active", source: "GLEIF", confidence: 0.81 },
      { name: "Precision Machine Solutions Inc", meta: "LEI 549300M7X8ZR4KQ2PL55 · US-MI · active", source: "GLEIF", confidence: 0.74 },
    ],
  },
  {
    id: "r2",
    raw: "ACME IND SUPPLY DBA ACME FASTENERS",
    spend: 0.9,
    hint: "DBA alias detected — matched on legal name",
    candidates: [
      { name: "Acme Industrial Supply Co.", meta: "LEI 549300QF7H2ZKMR8XN04 · US-IL · active", source: "GLEIF", confidence: 0.76 },
    ],
  },
  {
    id: "r3",
    raw: "MIDWEST TOOL GRP — DIV 4",
    spend: 0.6,
    hint: "Division suffix stripped before matching",
    candidates: [
      { name: "Midwest Tool Group Inc", meta: "CIK 0001094285 · ticker MWTG", source: "SEC", confidence: 0.73 },
    ],
  },
  {
    id: "r4",
    raw: "Bob's Tool & Die Co",
    spend: 0.4,
    hint: "No SEC filing, no LEI on record",
    candidates: [],
  },
  {
    id: "r5",
    raw: "KEYSTONE INTL",
    spend: 1.1,
    hint: "Name collides with 4 registered entities",
    candidates: [
      { name: "Keystone International Holdings Corp", meta: "CIK 0000055135 · inactive since 2019", source: "SEC", confidence: 0.79 },
      { name: "Keystone Industries International", meta: "LEI 549300RJ8DK2P7QNXV13 · US-NJ", source: "GLEIF", confidence: 0.77 },
    ],
  },
];

const ROWS_WB: ReviewRow[] = [
  {
    id: "r1",
    raw: "REFLEX WINKELMANN GMBH",
    spend: 1.8,
    hint: "Private GmbH · no LEI on record",
    candidates: [
      { name: "Reflex Winkelmann GmbH", meta: "DE handelsregister HRB 8214 · Ahlen", source: "GLEIF", confidence: 0.83 },
    ],
  },
  {
    id: "r2",
    raw: "ORKLI S COOP",
    spend: 1.2,
    hint: "Spanish cooperative — no LEI issued",
    candidates: [],
  },
  {
    id: "r3",
    raw: "CALEFFI S.P.A. — DIV IDRONICA",
    spend: 3.4,
    hint: "Division suffix stripped before matching",
    candidates: [
      { name: "Caleffi S.p.A.", meta: "LEI 815600A4F0F0C1E5B203 · IT-NO · active", source: "GLEIF", confidence: 0.88 },
    ],
  },
  {
    id: "r4",
    raw: "OVENTROP GMBH & CO KG",
    spend: 0.7,
    hint: "Family-held · no public filings",
    candidates: [
      { name: "Oventrop GmbH & Co. KG", meta: "DE handelsregister HRA 4471 · Olsberg", source: "GLEIF", confidence: 0.79 },
    ],
  },
  {
    id: "r5",
    raw: "UPONOR CORP FI",
    spend: 2.9,
    hint: "Country suffix in source data",
    candidates: [
      { name: "Uponor Corporation", meta: "LEI 743700ZQ2LZ1XFLKZR32 · FI · active", source: "GLEIF", confidence: 0.85 },
    ],
  },
];

type RowState = "pending" | "confirmed" | "rejected";

const STEPS = ["Upload", "Map columns", "Resolve", "Review", "Commit"];

function confColor(c: number) {
  if (c >= 0.92) return "var(--ok)";
  if (c >= 0.78) return "var(--warn)";
  return "var(--muted)";
}

export function ImportResolve() {
  const { clientMode, currency, setRoute } = useApp();
  const isWB = clientMode === "wb";

  const rows = isWB ? ROWS_WB : ROWS_US;
  const fileName = isWB
    ? "worcester_supplier_master_Q3.csv"
    : "meridian_supplier_master_Q3.csv";

  // Baseline resolution outcome for the whole file (the queue below is a sample)
  const base = { total: 312, verified: 118, corroborated: 41, review: 96, unmatched: 57 };

  const [state, setState] = useState<Record<string, RowState>>({});
  const [chosen, setChosen] = useState<Record<string, number>>({});

  const decided = Object.values(state).filter((s) => s !== "pending").length;
  const accepted = Object.values(state).filter((s) => s === "confirmed").length;
  const rejected = Object.values(state).filter((s) => s === "rejected").length;

  const live = useMemo(() => ({
    verified: base.verified,
    corroborated: base.corroborated,
    inferred: accepted,
    review: base.review - decided,
    unmatched: base.unmatched + rejected,
  }), [accepted, rejected, decided, base.verified, base.corroborated, base.review, base.unmatched]);

  const enriched = live.verified + live.corroborated + live.inferred;
  const enrichedPct = Math.round((enriched / base.total) * 100);
  const autoPct = Math.round(((base.verified + base.corroborated) / base.total) * 100);

  const segments = [
    { key: "verified", n: live.verified, color: PROVENANCE_META.verified.color, label: "Verified" },
    { key: "corroborated", n: live.corroborated, color: PROVENANCE_META.corroborated.color, label: "Corroborated" },
    { key: "inferred", n: live.inferred, color: PROVENANCE_META.inferred.color, label: "Review-accepted" },
    { key: "review", n: live.review, color: "var(--accent)", label: "Awaiting review" },
    { key: "unmatched", n: live.unmatched, color: PROVENANCE_META.unenriched.color, label: "Unmatched" },
  ];

  function decide(id: string, s: RowState, candidateIdx?: number) {
    setState((p) => ({ ...p, [id]: s }));
    if (candidateIdx != null) setChosen((p) => ({ ...p, [id]: candidateIdx }));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Stepper */}
      <div className="card">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12 }}>
          {STEPS.map((label, i) => {
            const done = i < 3;
            const now = i === 3;
            const col = done ? "var(--ok)" : now ? "var(--accent)" : "var(--muted)";
            return (
              <span key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "5px 11px", borderRadius: 20, fontWeight: now ? 700 : 500,
                  border: `1px solid ${done || now ? `color-mix(in srgb, ${col} 34%, transparent)` : "var(--line)"}`,
                  background: done || now ? `color-mix(in srgb, ${col} 9%, var(--card))` : "var(--surface)",
                  color: col,
                }}>
                  <span className="mono" style={{
                    width: 16, height: 16, borderRadius: "50%", display: "grid", placeItems: "center",
                    fontSize: 9, background: done || now ? col : "var(--surface-hover)",
                    color: done || now ? "#fff" : "var(--muted)",
                  }}>{done ? "✓" : i + 1}</span>
                  {label}{now ? ` ${live.review}` : ""}
                </span>
                {i < STEPS.length - 1 && <span style={{ color: "var(--line)" }}>→</span>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Resolution summary */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>Resolution result <InfoTip width={280} text="Deterministic identifiers are tried first (ticker → SEC CIK, LEI → GLEIF). Only unresolved names go to fuzzy candidate matching. Anything below 0.70 confidence is left unmatched rather than guessed." /></h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              {fileName} · {base.total} rows · identifiers first, then SEC + GLEIF candidates
            </div>
          </div>
          <div className="inline">
            <button className="btn" style={{ fontSize: 12 }}>Export unmatched</button>
            <button className="btn primary" style={{ fontSize: 12 }} onClick={() => setRoute("suppliers")}>
              Commit {enriched} matched →
            </button>
          </div>
        </div>

        <div className="grid-4">
          {[
            { k: "Verified", v: live.verified, s: "Ticker/CIK or LEI hit", c: PROVENANCE_META.verified.color },
            { k: "Corroborated", v: live.corroborated, s: "SEC + GLEIF agree", c: PROVENANCE_META.corroborated.color },
            { k: "Needs review", v: live.review, s: "Confidence 0.70–0.92", c: "var(--accent)" },
            { k: "Unmatched", v: live.unmatched, s: "Imports as unenriched", c: PROVENANCE_META.unenriched.color },
          ].map((t) => (
            <div key={t.k} style={{
              border: "1px solid var(--line)", borderLeft: `3px solid ${t.c}`,
              borderRadius: 10, background: "var(--surface)", padding: "12px 14px",
            }}>
              <div style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{t.k}</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1.1, marginTop: 4, color: t.c, fontVariantNumeric: "tabular-nums" }}>{t.v}</div>
              <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>{t.s}</div>
            </div>
          ))}
        </div>

        {/* Segmented coverage bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)" }}>
            {segments.map((s) => (
              <div key={s.key} style={{ width: `${(s.n / base.total) * 100}%`, background: s.color }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {segments.map((s) => (
              <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <i style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                {s.label} {s.n}
              </span>
            ))}
            <span style={{ marginLeft: "auto" }}>
              <b className="mono" style={{ color: "var(--text)" }}>{autoPct}%</b> auto-resolved
              {decided > 0 && <> · <b className="mono" style={{ color: "var(--text)" }}>{enrichedPct}%</b> after review</>}
            </span>
          </div>
        </div>

        <div className="note" style={{ marginTop: 14 }}>
          <b>{autoPct}% auto-match is the number to design around, not celebrate.</b> A real supplier
          master is mostly private machine shops, distributors and regional fabricators with no public
          filing and often no LEI. Large listed suppliers resolve almost perfectly — which is exactly
          why the auto-match rate has to be measured against a private-weighted sample.
        </div>
      </div>

      {/* Review queue */}
      <div className="card">
        <div className="row" style={{ alignItems: "flex-start", marginBottom: 4 }}>
          <div>
            <h2 style={{ margin: 0 }}>Review queue <InfoTip width={270} text="Candidates scored on name similarity, country agreement and distinctive-token overlap. Confirming sets the supplier's evidence grade to Review-accepted; rejecting imports it as unenriched with your data only." /></h2>
            <div className="card-sub" style={{ marginBottom: 0 }}>
              Sorted by spend at risk · {decided} of {rows.length} sampled rows decided
            </div>
          </div>
          {decided > 0 && (
            <button className="btn" style={{ fontSize: 12 }} onClick={() => { setState({}); setChosen({}); }}>
              Reset sample
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
          {rows.map((r) => {
            const st = state[r.id] ?? "pending";
            const pickedIdx = chosen[r.id];
            const picked = pickedIdx != null ? r.candidates[pickedIdx] : undefined;
            const top = r.candidates[0];

            return (
              <div key={r.id} style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                {/* header */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", padding: "11px 13px", background: "var(--surface)" }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, flex: 1, minWidth: 190 }}>{r.raw}</span>

                  {st === "confirmed" && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, color: PROVENANCE_META.inferred.color, background: PROVENANCE_META.inferred.bg }}>
                      Review-accepted
                    </span>
                  )}
                  {st === "rejected" && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, color: PROVENANCE_META.unenriched.color, background: PROVENANCE_META.unenriched.bg }}>
                      Imported unenriched
                    </span>
                  )}
                  {st === "pending" && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 9999, color: r.candidates.length ? "var(--warn)" : "var(--muted)", background: r.candidates.length ? "rgba(208,128,0,.14)" : "rgba(123,135,152,.16)" }}>
                      {r.candidates.length ? "Needs review" : "No candidate"}
                    </span>
                  )}

                  <span className="muted mono" style={{ fontSize: 11 }}>{currency}{r.spend.toFixed(1)}M spend</span>
                  {top && (
                    <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ width: 74, height: 5, borderRadius: 3, background: "var(--surface-hover)", overflow: "hidden" }}>
                        <i style={{ display: "block", height: "100%", width: `${top.confidence * 100}%`, background: confColor(top.confidence), borderRadius: 3 }} />
                      </span>
                      <span className="mono" style={{ fontSize: 11, fontWeight: 700, width: 30, textAlign: "right" }}>{top.confidence.toFixed(2)}</span>
                    </span>
                  )}
                </div>

                {/* body */}
                <div style={{ padding: "11px 13px", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <div className="muted" style={{ fontSize: 11 }}>{r.hint}</div>

                  {st === "confirmed" && picked && (
                    <div className="box" style={{ borderLeft: `3px solid ${PROVENANCE_META.inferred.color}` }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{picked.name}</div>
                      <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{picked.meta} · via {picked.source}</div>
                    </div>
                  )}

                  {st === "rejected" && (
                    <div className="box">
                      <div style={{ fontSize: 12 }}>
                        Imported with your data only — spend, on-time delivery and sites. No score will be
                        computed and no financial fields will be shown.
                      </div>
                    </div>
                  )}

                  {st === "pending" && r.candidates.length === 0 && (
                    <div style={{ border: "1px dashed var(--line)", borderRadius: 8, padding: 13, textAlign: "center", background: "var(--surface)" }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>No candidate scored above 0.70</div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                        We will not guess. Import it as unenriched and add data manually if it matters.
                      </div>
                    </div>
                  )}

                  {st === "pending" && r.candidates.map((c, i) => (
                    <div key={c.name} className="box" style={{
                      display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
                      borderColor: i === 0 ? "color-mix(in srgb, var(--accent) 40%, transparent)" : undefined,
                      background: i === 0 ? "color-mix(in srgb, var(--accent) 5%, var(--card))" : undefined,
                    }}>
                      <div style={{ flex: 1, minWidth: 190 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                        <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>{c.meta} · {c.source}</div>
                      </div>
                      <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ width: 74, height: 5, borderRadius: 3, background: "var(--surface-hover)", overflow: "hidden" }}>
                          <i style={{ display: "block", height: "100%", width: `${c.confidence * 100}%`, background: confColor(c.confidence), borderRadius: 3 }} />
                        </span>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 700, width: 30, textAlign: "right" }}>{c.confidence.toFixed(2)}</span>
                      </span>
                      <button
                        className={i === 0 ? "btn primary" : "btn"}
                        style={{ fontSize: 11, padding: "4px 10px" }}
                        onClick={() => decide(r.id, "confirmed", i)}
                      >
                        {i === 0 ? "Confirm" : "Choose"}
                      </button>
                    </div>
                  ))}

                  {st === "pending" && (
                    <div className="inline" style={{ justifyContent: "flex-end" }}>
                      <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => decide(r.id, "rejected")}>
                        {r.candidates.length ? "None of these — import unenriched" : "Import unenriched"}
                      </button>
                    </div>
                  )}

                  {st !== "pending" && (
                    <div className="inline" style={{ justifyContent: "flex-end" }}>
                      <button className="btn" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => decide(r.id, "pending")}>
                        Undo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="note" style={{ marginTop: 13 }}>
          <b>Low confidence never blocks the import and never silently guesses.</b> An unmatched supplier
          still lands in the register — it simply carries no enrichment, and every screen says so.
        </div>
      </div>
    </div>
  );
}
