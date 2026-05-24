"use client";

import { useState } from "react";
import { Supplier, MCResult } from "@/types";
import { calcDPS, runMC, topDrivers } from "@/lib/analytics";

interface DPSCardProps {
  supplier: Supplier;
}

export function DPSCard({ supplier }: DPSCardProps) {
  const det = calcDPS(supplier);
  const [mc, setMc] = useState<MCResult>(() => runMC(supplier));
  const [iters, setIters] = useState(5000);

  const { probability: p } = mc;
  const pc = p < 25 ? "low" : p < 55 ? "med" : "high";
  const pl = p < 25 ? "LOW RISK" : p < 55 ? "MEDIUM RISK" : "HIGH RISK";

  function rerun(iter: number) {
    setIters(iter);
    setMc(runMC(supplier, iter));
  }

  return (
    <div className="card">
      <div className="row" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Disruption Probability Score</h2>
          <div className="muted" style={{ marginTop: 5 }}>
            Operational disruption likelihood. Deterministic model + Monte Carlo stress test.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexShrink: 0 }}>
          <div className="dps-hero">
            <div>
              <div className="dps-label">DPS (12 mo)</div>
              <div className="dps-score">{p}%</div>
            </div>
            <div className={`dps-pill ${pc}`}>{pl}</div>
          </div>
          <span className="badge info">Model v0.1</span>
        </div>
      </div>

      <div className="kv" style={{ marginTop: 12 }}>
        <div className="box">Deterministic DPS<b>{det}%</b></div>
        <div className="box">Monte Carlo ({iters.toLocaleString()} sim)<b>{p}%</b></div>
        <div className="box">Scenario window<b>12 months</b></div>
        <div className="box">Expected exposure<b>${mc.expectedExposure}M</b></div>
        <div className="box">95th pct stress<b>${mc.stress95}M</b></div>
        <div className="box">Top drivers<b style={{ fontSize: 12 }}>{topDrivers(supplier).join(", ")}</b></div>
      </div>

      <div className="inline" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => rerun(1000)}>Re-run (1,000 sim)</button>
        <button className="btn" onClick={() => rerun(5000)}>Re-run (5,000 sim)</button>
      </div>
      <div className="note">
        {iters === 5000 && p === mc.probability
          ? "Using 5,000 iterations."
          : `Re-run with ${iters.toLocaleString()} iterations — probability: ${p}%, exp. exposure: $${mc.expectedExposure}M.`}
      </div>
    </div>
  );
}
