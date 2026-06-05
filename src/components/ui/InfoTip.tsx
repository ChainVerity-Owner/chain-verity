"use client";

interface InfoTipProps {
  text: string;
  width?: number;
}

/**
 * Inline ℹ icon with hover tooltip.
 * Pure CSS — no external library.
 * Usage: <InfoTip text="Definition of the term goes here." />
 */
export function InfoTip({ text, width = 220 }: InfoTipProps) {
  return (
    <span className="info-tip" style={{ display: "inline-flex", alignItems: "center", position: "relative" }}>
      <span className="info-tip-icon" aria-label="More information">ℹ</span>
      <span className="info-tip-bubble" style={{ width }}>
        {text}
      </span>
    </span>
  );
}
