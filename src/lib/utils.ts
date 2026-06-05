export function moneyM(v: number | undefined, curr = "£"): string {
  return curr + Number(v || 0).toFixed(1) + "M";
}

export function fmt2(v: number | undefined): string {
  return typeof v === "number" ? v.toFixed(2) : "—";
}

export function fmtPct(v: number | undefined): string {
  return typeof v === "number" ? (v * 100).toFixed(1) + "%" : "—";
}

export function downloadStub(name: string, content: string): void {
  const b = new Blob([content], { type: "text/plain" });
  const u = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  URL.revokeObjectURL(u);
}

export function alertBadgeClass(type: string): string {
  switch (type) {
    case "risk": return "risk";
    case "contract": return "warn";
    case "observation": return "obs";
    default: return "info";
  }
}

export function riskStateClass(riskState: string | undefined, risk: number | undefined): string {
  if (!riskState) return (risk ?? 0) >= 70 ? "risk" : "ok";
  if (riskState.includes("OBSERVATION")) return "obs";
  if (riskState.includes("MITIGATION")) return "warn";
  if (riskState.includes("ESCALATED")) return "risk";
  return "ok";
}

export function riskStateLabel(riskState: string | undefined, risk: number | undefined): string {
  if (!riskState) return (risk ?? 0) >= 70 ? "High Risk" : "Stable";
  if (riskState.includes("OBSERVATION")) return "Under Observation";
  if (riskState.includes("MITIGATION")) return "Mitigation in Progress";
  if (riskState.includes("ESCALATED")) return "High Risk";
  return "Stable";
}
