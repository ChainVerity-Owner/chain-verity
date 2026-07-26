"use client";

import type { Provenance } from "@/types";
import { PROVENANCE_META } from "@/lib/data/provenance";

/**
 * Evidence grade badge. Used anywhere a supplier fact is displayed so the user
 * can always see how strongly it is sourced.
 */
export function ProvenanceChip({
  provenance,
  size = "md",
  showTick = true,
}: {
  provenance: Provenance;
  size?: "sm" | "md";
  showTick?: boolean;
}) {
  const meta = PROVENANCE_META[provenance];
  return (
    <span
      title={meta.desc}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: size === "sm" ? 9 : 10,
        fontWeight: 700,
        padding: size === "sm" ? "1px 6px" : "2px 8px",
        borderRadius: 9999,
        whiteSpace: "nowrap",
        color: meta.color,
        background: meta.bg,
      }}
    >
      {showTick && provenance === "verified" ? "✓ " : ""}{meta.label}
    </span>
  );
}

/** Small inline source note, e.g. "EDGAR 10-Q · 2026-05-02". */
export function SourceNote({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>
      {children}
    </span>
  );
}
