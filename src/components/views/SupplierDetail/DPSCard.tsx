"use client";

import { useState } from "react";
import { Supplier, MCResult } from "@/types";
import { calcDPS, runMC, topDrivers } from "@/lib/analytics";
import { InfoTip } from "@/components/ui/InfoTip";

interface DPSCardProps {
  supplier: Supplier;
}

export function DPSCard({ supplier }: DPSCardProps) {
  const det = calcDPS(supplier);
  const [mc, setMc] = useState<MCResult>(() => runMC(supplier));
  const [iters, setIters] = useState(5000);

  // det is the primary score — deterministic, stable, matches the header badge.
  // Monte Carlo is a stress-test overlay shown in the detail grid.
  const pc = det < 25 ? "low" : det < 55 ? "med" : "high";
  const pl = det < 25 ? "LOW RISK" : det < 55 ? "MEDIUM RISK" : "HIGH RISK";

  function rerun(iter: number) {
    setIters(iter);
    setMc(runMC(supplier, iter));
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Disruption Probability Score</h2>
            <InfoTip
              text="Chain Verity's proprietary score estimating the likelihood of an operational supply disruption from this supplier within 12 months. Combines financial health, delivery performance, credit risk, and dependency signals into a single probability estimate."
              width={260}
            />
          </div>
          <div className="muted" style={{ marginTop: 5 }}>
            Operational disruption likelihood. Deterministic model + Monte Carlo stress test.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
          <div className="dps-hero">
            <div>
              <div className="dps-label">DPS (12 mo)</div>
              <div className="dps-score">{det}%</div>
            </div>
            <div className={`dps-pill ${pc}`}>{pl}</div>
          </div>
          <span className="badge info">Model v0.1</span>
        </div>
      </div>

      <div className="kv" style={{ marginTop: 12 }}>
        <div className="box">
          <div style={{ display: "flex", alignItems: "center" }}>
            Deterministic DPS
            <InfoTip text="The primary DPS figure — a reproducible score computed directly from supplier financial, credit, and operational data. This is the score shown on the supplier overview." width={230} />
          </div>
          <b>{det}%</b>
        </div>
        <div className="box">
          <div style={{ display: "flex", alignItems: "center" }}>
            Monte Carlo ({iters.toLocaleString()} sim)
            <InfoTip
              text="Runs thousands of randomised disruption scenarios to model the range of possible outcomes. Used as a stress-test to validate the deterministic score across different future states."
              width={250}
            />
          </div>
          <b>{mc.probability}%</b>
        </div>
        <div className="box">Scenario window<b>12 months</b></div>
        <div className="box">
          <div style={{ display: "flex", alignItems: "center" }}>
            Expected exposure
            <InfoTip text="Average financial exposure across all disruption scenarios where a disruption occurs. Calculated as supplier spend × disruption probability × estimated recovery time factor." width={230} />
          </div>
          <b>${mc.expectedExposure}M</b>
        </div>
        <div className="box">
          <div style={{ display: "flex", alignItems: "center" }}>
            95th pct stress
            <InfoTip text="The exposure level exceeded in only 5% of simulated scenarios — a severe but plausible worst case. Use this figure for contingency planning and safety stock decisions." width={220} />
          </div>
          <b>${mc.stress95}M</b>
        </div>
        <div className="box">Top drivers<b style={{ fontSize: 12 }}>{topDrivers(supplier).join(", ")}</b></div>
      </div>

      <div className="inline" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => rerun(1000)}>Re-run (1,000 sim)</button>
        <button className="btn" onClick={() => rerun(5000)}>Re-run (5,000 sim)</button>
      </div>
      <div className="note">
        Primary DPS is deterministic and matches the supplier overview score. Monte Carlo stress test uses {iters.toLocaleString()} iterations — result: {mc.probability}%, exp. exposure: ${mc.expectedExposure}M.
      </div>
    </div>
  );
}
