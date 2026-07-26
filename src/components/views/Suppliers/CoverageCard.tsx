"use client";

import { useMemo } from "react";
import { useApp, useSuppliers } from "@/context/AppContext";
import { InfoTip } from "@/components/ui/InfoTip";
import { coverage, PROVENANCE_META, PROVENANCE_ORDER } from "@/lib/data/provenance";

/**
 * Portfolio-level evidence coverage. Sits above the supplier tabs because it
 * describes the whole book, and because the size of the unenriched tail is the
 * first thing a buyer should see rather than something to go looking for.
 */
export function CoverageCard() {
  const { setRoute, currency } = useApp();
  const allSuppliers = useSuppliers();
  const cov = useMemo(() => coverage(allSuppliers), [allSuppliers]);

  const tiles = [
    { k: "Enriched", v: `${cov.enrichedPct}%`, s: `${cov.enriched} of ${cov.total} suppliers`, c: "var(--ok)" },
    { k: "Your data only", v: String(cov.unscoreableCount), s: "No registry presence found", c: PROVENANCE_META.unenriched.color },
    { k: "Unscoreable spend", v: `${currency}${cov.unscoreableSpend.toFixed(1)}M`, s: "Sits behind the unenriched tail", c: "var(--warn)" },
    { k: "Registry-verified", v: String(cov.counts.verified), s: "Ticker/CIK or LEI matched", c: PROVENANCE_META.verified.color },
  ];

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0 }}>
            Evidence coverage
            <InfoTip
              width={280}
              text="Share of suppliers matched to a public registry record. Verified = SEC ticker/CIK or GLEIF LEI. Corroborated = two independent sources agree. Review-accepted = a human confirmed a low-confidence candidate. Unenriched = no registry presence found, so we show your data only and compute no score."
            />
          </h2>
          <div className="card-sub" style={{ marginBottom: 0 }}>
            {cov.enriched} of {cov.total} suppliers carry sourced third-party data
          </div>
        </div>
        <button className="btn" style={{ fontSize: 12, whiteSpace: "nowrap" }} onClick={() => setRoute("import")}>
          Import &amp; Resolve →
        </button>
      </div>

      <div className="grid-4" style={{ marginTop: 14 }}>
        {tiles.map((t) => (
          <div
            key={t.k}
            style={{
              border: "1px solid var(--line)",
              borderLeft: `3px solid ${t.c}`,
              borderRadius: 10,
              background: "var(--surface)",
              padding: "12px 14px",
            }}
          >
            <div style={{ fontSize: 10, letterSpacing: ".09em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>{t.k}</div>
            <div
              className="mono"
              style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.04em", lineHeight: 1.1, marginTop: 4, color: t.c, fontVariantNumeric: "tabular-nums" }}
            >
              {t.v}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 1 }}>{t.s}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", border: "1px solid var(--line)", background: "var(--surface)" }}>
          {PROVENANCE_ORDER.map((p) => (
            <div key={p} style={{ width: `${(cov.counts[p] / (cov.total || 1)) * 100}%`, background: PROVENANCE_META[p].color }} />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
          {PROVENANCE_ORDER.map((p) => (
            <span key={p} title={PROVENANCE_META[p].desc} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <i style={{ width: 9, height: 9, borderRadius: 2, background: PROVENANCE_META[p].color, flexShrink: 0 }} />
              {PROVENANCE_META[p].label} {cov.counts[p]}
            </span>
          ))}
        </div>
      </div>

      {cov.unscoreableCount > 0 && (
        <div className="note" style={{ marginTop: 14 }}>
          <b>The blind spot is reported as a metric, not a footnote.</b> {currency}
          {cov.unscoreableSpend.toFixed(1)}M of annual spend sits with {cov.unscoreableCount} suppliers
          that have no public filing and no LEI — mostly private and division-level entities. We show
          your data for them and decline to compute a score.
        </div>
      )}
    </div>
  );
}
