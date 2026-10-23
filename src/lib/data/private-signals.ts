import type { Supplier, PrivateSignals } from "@/types";

// ── Private-company signals ───────────────────────────────────────────────────
// Keyed by supplier id so the one-line supplier records stay readable.
//
// Everything here is a signal class that genuinely exists for a company that
// files no accounts. First-party items come from the customer's own AP and
// procurement systems; public-record items come from state registries that
// publish regardless of whether a company discloses financials.
//
// In the demo these are seeded. In production they would be ingested from
// state Secretary of State UCC indexes, state labour departments (WARN),
// PACER, and the customer's ERP.

const SIGNALS: Record<string, PrivateSignals> = {
  // Brennan Tool & Machine — a supplier under genuine cash stress, visible
  // entirely without a balance sheet. The sequence is the point: a request to
  // shorten terms, then a blanket lien, then receivables assigned to a factor.
  btm: {
    paymentTermsDays: 45,
    termsChangeRequests: [
      {
        date: "2026-08-12",
        fromDays: 45,
        toDays: 30,
        note: "Requested by supplier to “improve cash flow predictability”. Declined — no commercial concession offered.",
        granted: false,
      },
    ],
    factoringNotice: {
      date: "2026-09-29",
      factor: "Midwest Commercial Capital",
      detail:
        "Notice of assignment received by Accounts Payable. Invoices now payable to the factor rather than the supplier — the supplier is borrowing against money you already owe it.",
    },
    publicRecord: [
      {
        kind: "ucc",
        date: "2026-09-24",
        headline: "UCC-1 blanket lien filed",
        detail:
          "Secured party Midwest Commercial Capital. Collateral covers all assets including accounts receivable and proceeds — the filing that normally precedes a factoring arrangement.",
        source: "Ohio Secretary of State",
        severity: "risk",
      },
      {
        kind: "lien",
        date: "2026-06-03",
        headline: "State tax lien — $84,200",
        detail: "Unpaid employer withholding, two quarters. Not yet released.",
        source: "Ohio Department of Taxation",
        severity: "warn",
      },
      {
        kind: "ucc",
        date: "2024-03-18",
        headline: "UCC-1 equipment lien",
        detail:
          "Secured party Huntington National Bank, collateral limited to two CNC machining centres. Routine capital equipment financing — not a distress indicator.",
        source: "Ohio Secretary of State",
        severity: "info",
      },
    ],
    estimatedRevenueSharePct: 18,
    revenueShareBasis:
      "your $4.8M annual spend against an estimated $27M revenue (headcount-based estimate — not a filed figure)",
  },

  // CSP Industries — the common case: private, unremarkable, nothing adverse.
  // Included so the card reads as analysis rather than an alarm that only
  // appears when something is wrong.
  csp: {
    paymentTermsDays: 30,
    publicRecord: [
      {
        kind: "ucc",
        date: "2023-11-09",
        headline: "UCC-1 equipment lien",
        detail: "Secured party PNC Equipment Finance, collateral limited to listed machinery. Routine.",
        source: "Pennsylvania Department of State",
        severity: "info",
      },
    ],
    estimatedRevenueSharePct: 6,
    revenueShareBasis:
      "your $2.1M annual spend against an estimated $35M revenue (headcount-based estimate — not a filed figure)",
  },
};

export function privateSignals(s: Supplier): PrivateSignals | null {
  return s.privateSignals ?? SIGNALS[s.id] ?? null;
}

/** Adverse signals in the trailing window — drives the card's headline read. */
export function adverseSignalCount(sig: PrivateSignals, withinDays = 120): number {
  const cutoff = Date.now() - withinDays * 86400000;
  let n = 0;
  if (sig.factoringNotice && Date.parse(sig.factoringNotice.date) >= cutoff) n++;
  for (const r of sig.termsChangeRequests ?? []) {
    if (r.toDays < r.fromDays && Date.parse(r.date) >= cutoff) n++;
  }
  for (const p of sig.publicRecord ?? []) {
    if (p.severity !== "info" && Date.parse(p.date) >= cutoff) n++;
  }
  return n;
}
