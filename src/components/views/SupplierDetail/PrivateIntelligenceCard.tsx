"use client";

import type { Supplier, PublicRecordItem, RecoveryProfile } from "@/types";
import { privateSignals, adverseSignalCount } from "@/lib/data/private-signals";
import { calcDPS, dpsBand, computeLeadTimeDrift } from "@/lib/analytics";
import { InfoTip } from "@/components/ui/InfoTip";

/**
 * What we know about a supplier that files nothing.
 *
 * The earlier treatment listed what was withheld, which is honest but inert —
 * a confession rather than an assessment. The useful content is the evidence
 * that survives the absence of statements: first-party AP behaviour and public
 * registry filings, ordered so the sequence tells the story.
 */

const KIND_LABEL: Record<string, string> = {
  ucc: "UCC filing",
  warn: "WARN notice",
  lien: "Lien",
  judgment: "Judgment",
  bankruptcy: "Bankruptcy",
};

const SEV = {
  risk: { color: "var(--risk)", tint: "color-mix(in srgb, var(--risk) 10%, transparent)" },
  warn: { color: "var(--warn)", tint: "color-mix(in srgb, var(--warn) 12%, transparent)" },
  info: { color: "var(--muted)", tint: "color-mix(in srgb, var(--muted) 10%, transparent)" },
} as const;

/** Parse a date-only ISO string as local. `new Date("2026-09-29")` is parsed as
 *  UTC midnight and renders a day earlier in western time zones. */
function localDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const fmtDate = (iso: string) =>
  localDate(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });

/** "August 2026" — for prose, where a precise day adds nothing. */
const fmtMonth = (iso: string) =>
  localDate(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

function Evidence({
  severity,
  date,
  tag,
  headline,
  detail,
  source,
}: {
  severity: "info" | "warn" | "risk";
  date: string;
  tag: string;
  headline: string;
  detail: string;
  source: string;
}) {
  const s = SEV[severity];
  return (
    <div style={{ display: "flex", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
      <div style={{ width: 8, flexShrink: 0, display: "flex", justifyContent: "center", paddingTop: 5 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>{headline}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 7px", borderRadius: 9999, color: s.color, background: s.tint }}>
            {tag}
          </span>
          <span className="muted mono" style={{ fontSize: 11, marginLeft: "auto" }}>{fmtDate(date)}</span>
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 3, lineHeight: 1.55 }}>{detail}</div>
        <div className="mono" style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Source: {source}</div>
      </div>
    </div>
  );
}

export function PrivateIntelligenceCard({
  supplier: s,
  recoveryProfile,
  currency,
}: {
  supplier: Supplier;
  recoveryProfile?: RecoveryProfile;
  currency: string;
}) {
  const sig = privateSignals(s);
  if (!sig) return null;

  const adverse = adverseSignalCount(sig);
  const dps = calcDPS(s);
  const band = dpsBand(dps);
  const drift = computeLeadTimeDrift(s);

  const shortenRequests = (sig.termsChangeRequests ?? []).filter((r) => r.toDays < r.fromDays);
  const hasFactoring = !!sig.factoringNotice;
  const canRequireFinancials = (sig.estimatedRevenueSharePct ?? 0) >= 10;

  // Order the evidence newest-first so the sequence reads as a narrative
  const items: { date: string; node: React.ReactNode }[] = [];

  if (sig.factoringNotice) {
    items.push({
      date: sig.factoringNotice.date,
      node: (
        <Evidence
          key="fact"
          severity="risk"
          date={sig.factoringNotice.date}
          tag="Your AP ledger"
          headline={`Receivables assigned to ${sig.factoringNotice.factor}`}
          detail={sig.factoringNotice.detail}
          source="Notice of assignment received by Accounts Payable"
        />
      ),
    });
  }

  for (const r of sig.termsChangeRequests ?? []) {
    items.push({
      date: r.date,
      node: (
        <Evidence
          key={`terms-${r.date}`}
          severity={r.toDays < r.fromDays ? "warn" : "info"}
          date={r.date}
          tag="Your AP ledger"
          headline={`Requested payment terms ${r.fromDays} → ${r.toDays} days`}
          detail={`${r.note} ${r.granted ? "Granted." : ""}`}
          source="Procurement correspondence"
        />
      ),
    });
  }

  for (const p of sig.publicRecord ?? []) {
    items.push({
      date: p.date,
      node: (
        <Evidence
          key={`pr-${p.date}-${p.headline}`}
          severity={p.severity}
          date={p.date}
          tag={KIND_LABEL[p.kind] ?? "Public record"}
          headline={p.headline}
          detail={p.detail}
          source={p.source}
        />
      ),
    });
  }

  items.sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  // Headline read — synthesised, and explicitly reasoned rather than scored
  const verdict =
    adverse >= 3
      ? { color: "var(--risk)", text: `${adverse} independent stress signals in the last 120 days` }
      : adverse > 0
        ? { color: "var(--warn)", text: `${adverse} adverse signal${adverse > 1 ? "s" : ""} in the last 120 days` }
        : { color: "var(--ok)", text: "No adverse filings or payment-behaviour signals on record" };

  return (
    <div className="card" style={{ borderTop: "3px solid var(--accent)" }}>
      <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>
            What we know without financials
            <InfoTip
              width={290}
              text="A private company files no accounts, but the balance sheet is neither the only nor the earliest evidence of financial stress. Two classes of signal survive: facts already in your AP and procurement systems, and public registry filings that require no disclosure from the supplier."
            />
          </h2>
          <div className="card-sub" style={{ marginBottom: 0 }}>
            First-party payment behaviour and public registry filings · no statements required
          </div>
        </div>
        <span
          style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 9999,
            color: verdict.color, background: `color-mix(in srgb, ${verdict.color} 12%, transparent)`,
          }}
        >
          {verdict.text}
        </span>
      </div>

      {/* The synthesised read — the thing a buyer actually wants */}
      {adverse > 0 && (
        <div className="note" style={{ marginTop: 13, borderLeft: `3px solid ${verdict.color}` }}>
          <b>Read.</b>{" "}
          {hasFactoring && shortenRequests.length > 0 ? (
            <>
              This supplier asked to shorten your payment terms in {fmtMonth(shortenRequests[0].date)},
              then assigned its receivables to a factor{sig.factoringNotice ? ` in ${fmtMonth(sig.factoringNotice.date)}` : ""}.
              A company borrowing against invoices you have already approved is managing a cash gap, not a growth plan.
              A balance sheet would show this two to three quarters later — if it existed.
            </>
          ) : hasFactoring ? (
            <>Receivables have been assigned to a factor. A company borrowing against invoices you have already approved is managing a cash gap.</>
          ) : (
            <>Adverse filings are on record against this entity. Treat as an early indicator and verify directly with the supplier.</>
          )}
        </div>
      )}

      {/* Evidence timeline */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>
          Evidence · newest first
        </div>
        {items.map((i) => i.node)}
      </div>

      {/* What is independently knowable, scored */}
      <div className="grid-4" style={{ marginTop: 16 }}>
        {[
          {
            k: "Disruption score",
            v: `${dps}%`,
            s: `${band} band · operational basis`,
            c: band === "high" ? "var(--risk)" : band === "medium" ? "var(--warn)" : "var(--ok)",
          },
          {
            k: "Delivery trend",
            v: `${s.onTime ?? "—"}%`,
            s: drift?.worsening
              ? `lead time ${drift.latest}d, +${Math.round(drift.driftPct * 100)}% and rising`
              : "within tolerance",
            c: (s.onTime ?? 100) < 95 ? "var(--warn)" : "var(--ok)",
          },
          {
            k: "Continuity gap",
            v: recoveryProfile ? `${Math.max(0, recoveryProfile.timeToRecover - recoveryProfile.timeToSurvive)}d` : "—",
            s: recoveryProfile ? `TTR ${recoveryProfile.timeToRecover}d vs TTS ${recoveryProfile.timeToSurvive}d` : "no profile",
            c: "var(--risk)",
          },
          {
            k: "Your leverage",
            v: sig.estimatedRevenueSharePct != null ? `${sig.estimatedRevenueSharePct}%` : "—",
            s: "of their estimated revenue",
            c: canRequireFinancials ? "var(--ok)" : "var(--muted)",
          },
        ].map((t) => (
          <div key={t.k} style={{ border: "1px solid var(--line)", borderLeft: `3px solid ${t.c}`, borderRadius: 10, background: "var(--surface)", padding: "12px 14px" }}>
            <div style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{t.k}</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1.1, marginTop: 4, color: t.c, fontVariantNumeric: "tabular-nums" }}>{t.v}</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>{t.s}</div>
          </div>
        ))}
      </div>

      {/* Close the gap — the action, not just the diagnosis */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700, marginBottom: 8 }}>
          Closing the gap
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {canRequireFinancials && (
            <div className="box">
              <div style={{ fontWeight: 650, fontSize: 13 }}>Require annual financials at renewal</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                You represent roughly {sig.estimatedRevenueSharePct}% of this supplier&apos;s revenue —
                {" "}{sig.revenueShareBasis}. Above about 10%, audited or reviewed statements under NDA is a
                reasonable contract term, and most procurement teams simply never ask.
              </div>
            </div>
          )}
          <div className="box">
            <div style={{ fontWeight: 650, fontSize: 13 }}>Supply a DUNS or LEI to re-run resolution</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
              If this entity holds an identifier we did not find, resolution will pick up any registry
              record attached to it and the financial component becomes scoreable.
            </div>
          </div>
          {hasFactoring && (
            <div className="box" style={{ borderLeft: "3px solid var(--risk)" }}>
              <div style={{ fontWeight: 650, fontSize: 13 }}>Confirm payment routing and re-check continuity cover</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Payments now route to the factor. Verify remittance details independently — assignment
                notices are a known fraud vector — and review safety stock against the{" "}
                {recoveryProfile ? `${recoveryProfile.timeToSurvive}-day` : "current"} survival window
                {recoveryProfile?.estimatedStockIncreaseCostM
                  ? `, estimated at ${currency}${recoveryProfile.estimatedStockIncreaseCostM.toFixed(1)}M to close`
                  : ""}.
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="muted" style={{ fontSize: 11, marginTop: 14, paddingTop: 11, borderTop: "1px solid var(--line)" }}>
        Still unavailable for this entity, and not estimated: financial ratios, credit rating,
        insolvency probability. Revenue share above is a headcount-based estimate used only to size
        your negotiating position — it is not an input to any score.
      </div>
    </div>
  );
}
