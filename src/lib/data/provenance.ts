import type { Supplier, Provenance } from "@/types";

// ── Evidence provenance ───────────────────────────────────────────────────────
// Every supplier fact carries a grade describing how we know it:
//   verified     — matched to a registry record (SEC ticker/CIK, or GLEIF LEI)
//   corroborated — two independent public sources agree
//   inferred     — accepted by a human reviewer from a low-confidence candidate
//   unenriched   — no registry presence found; customer-supplied data only
//
// Governed suppliers carry a ticker + DUNS, so they resolve deterministically.
// The lists below cover the interesting cases: entities that are divisions,
// subsidiaries, recent acquisitions, or ambiguously named — precisely the ones
// that fail automated resolution in the real world.

const UNENRICHED = new Set([
  // US — divisions, subsidiaries and ambiguous names with no clean registry hit
  "csp",  // CSP Industries — private, no filings
  "pxi",  // Paladin Labs (Precision Parts) — division of a foreign parent
  "kic",  // Keystone International — name collides with several entities
  "gcf",  // Glacier Bancorp (Metals Div.) — division, not a filing entity
  "bdn",  // Baldor Electric (ABB) — acquired, files under parent
  "eby",  // Ebara Elliott Energy — JV, no standalone filing
  "esb",  // Esterline Technologies — acquired by TransDigm
  "uft",  // Unifirst Corporation — ambiguous against Unifirst Corp entities
  // EU
  "ork",  // Orkli S. Coop — Spanish cooperative, no LEI on record
  "rfl",  // Reflex Winkelmann — private GmbH
  "ovn",  // Oventrop GmbH — private, family-held
  "kst",  // no registry presence found
]);

const INFERRED = new Set([
  // Accepted by a reviewer from a 0.70–0.92 candidate; no filings behind them
  "kwn", "lbo", "npc", "mkf", "tri", "awi",
  "cmp", "zeh", "sbt",
]);

const CORROBORATED = new Set([
  // Two independent sources agree, but no SEC filing to verify against
  "wfw", "rxi", "cvi", "brs", "trx", "lxt", "cts", "mxm", "gff", "rpm", "wst", "wkc",
  "wil", "bel", "imi", "cal", "rha", "upo", "wav", "nrm",
]);

/** Resolve a supplier's evidence grade. Explicit field wins; otherwise derived. */
export function supplierProvenance(s: Supplier): Provenance {
  if (s.provenance) return s.provenance;
  if (UNENRICHED.has(s.id)) return "unenriched";
  if (INFERRED.has(s.id)) return "inferred";
  if (CORROBORATED.has(s.id)) return "corroborated";
  // Governed suppliers carry registry identifiers and resolve deterministically
  if (s.ticker || s.duns) return "verified";
  return "corroborated";
}

/** True when we hold enough sourced data to compute and defend a risk score. */
export function isEnriched(s: Supplier): boolean {
  return supplierProvenance(s) !== "unenriched";
}

export const PROVENANCE_META: Record<
  Provenance,
  { label: string; color: string; bg: string; desc: string }
> = {
  verified: {
    label: "Verified",
    color: "#0e7490",
    bg: "rgba(14,116,144,.12)",
    desc: "Matched to a registry record — SEC ticker/CIK or GLEIF LEI",
  },
  corroborated: {
    label: "Corroborated",
    color: "#4f46e5",
    bg: "rgba(79,70,229,.12)",
    desc: "Two independent public sources agree",
  },
  inferred: {
    label: "Review-accepted",
    color: "#a16207",
    bg: "rgba(161,98,7,.14)",
    desc: "Accepted by a reviewer from a low-confidence candidate",
  },
  unenriched: {
    label: "Unenriched",
    color: "#7b8798",
    bg: "rgba(123,135,152,.16)",
    desc: "No registry presence found — your data only",
  },
};

export const PROVENANCE_ORDER: Provenance[] = ["verified", "corroborated", "inferred", "unenriched"];

export interface CoverageSummary {
  total: number;
  counts: Record<Provenance, number>;
  enriched: number;
  enrichedPct: number;
  /** Annual spend sitting behind suppliers we cannot score. */
  unscoreableSpend: number;
  unscoreableCount: number;
}

export function coverage(suppliers: Supplier[]): CoverageSummary {
  const counts: Record<Provenance, number> = {
    verified: 0, corroborated: 0, inferred: 0, unenriched: 0,
  };
  let unscoreableSpend = 0;
  for (const s of suppliers) {
    const p = supplierProvenance(s);
    counts[p]++;
    if (p === "unenriched") unscoreableSpend += s.spend ?? 0;
  }
  const total = suppliers.length || 1;
  const enriched = total - counts.unenriched;
  return {
    total: suppliers.length,
    counts,
    enriched,
    enrichedPct: Math.round((enriched / total) * 100),
    unscoreableSpend,
    unscoreableCount: counts.unenriched,
  };
}
