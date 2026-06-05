"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { Supplier } from "@/types";

// ── Supplier name suggestions ─────────────────────────────────────────────────

const COMPANY_SUGGESTIONS = [
  // Chemicals & Raw Materials
  "BASF", "Dow Chemical", "DuPont", "LyondellBasell", "Sabic", "Eastman Chemical",
  "Huntsman Corporation", "Celanese", "Evonik Industries", "Lanxess", "Solvay",
  "Arkema", "Covestro", "Ineos", "Clariant", "Ashland", "Cabot Corporation",
  // Electronics & Components
  "Foxconn", "Flextronics", "Jabil", "Celestica", "Sanmina", "Benchmark Electronics",
  "Texas Instruments", "Murata Manufacturing", "TDK Corporation", "Vishay", "Molex",
  "TE Connectivity", "Amphenol", "Sensata Technologies", "Keystone Electronics",
  "Samsung SDI", "LG Chem", "Panasonic", "Sony", "Toshiba", "Hitachi",
  // Automotive
  "Bosch", "Magna International", "Denso", "Continental AG", "ZF Friedrichshafen",
  "Aptiv", "BorgWarner", "Valeo", "Faurecia", "Plastic Omnium", "Delphi Technologies",
  "Tenneco", "Dana Incorporated", "Modine Manufacturing",
  // Logistics & Freight
  "Maersk", "DHL", "FedEx", "UPS", "DB Schenker", "Kuehne + Nagel",
  "XPO Logistics", "CH Robinson", "Expeditors International", "Panalpina",
  "Nippon Express", "Sinotrans", "CEVA Logistics", "DSV", "Rhenus Logistics",
  "Geodis", "Agility Logistics", "Kerry Logistics",
  // Packaging
  "Sealed Air", "Sonoco Products", "Silgan Holdings", "AptarGroup", "Berry Global",
  "Greif", "Crown Holdings", "Ball Corporation", "Amcor", "Smurfit Kappa",
  // Industrial & Manufacturing
  "3M", "Honeywell", "Emerson Electric", "Parker Hannifin", "Eaton", "Illinois Tool Works",
  "Roper Technologies", "Watts Water Technologies", "Graco", "Dover Corporation",
  "Kennametal", "Watts Industries", "Rexnord", "Timken", "SKF", "Schaeffler",
  // Consumer Goods
  "Procter & Gamble", "Unilever", "Nestlé", "Henkel", "Reckitt", "Kimberly-Clark",
  "Colgate-Palmolive", "Church & Dwight",
  // Semiconductors
  "TSMC", "Intel", "Qualcomm", "NXP Semiconductors", "STMicroelectronics",
  "Infineon Technologies", "Renesas Electronics", "Microchip Technology",
  "Analog Devices", "Maxim Integrated", "ON Semiconductor",
  // Steel & Metals
  "ArcelorMittal", "Nucor", "Steel Dynamics", "US Steel", "ThyssenKrupp",
  "Outokumpu", "Allegheny Technologies", "Carpenter Technology", "Novelis",
  "Alcoa", "Norsk Hydro", "Constellium",
  // Textiles & Apparel
  "Hanesbrands", "Gildan Activewear", "PVH Corp", "Kontoor Brands",
  // Paper & Forestry
  "International Paper", "Westrock", "Clearwater Paper", "Sappi",
].sort();

function makeId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseCSV(text: string): { rows: Record<string, string>[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], errors: ["CSV must have a header row and at least one data row."] };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  if (!headers.includes("name")) return { rows: [], errors: ['CSV must have a "name" column.'] };

  const rows: Record<string, string>[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cells.every((c) => !c)) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] ?? ""; });
    if (!row.name) { errors.push(`Row ${i}: missing name, skipped.`); continue; }
    rows.push(row);
  }
  return { rows, errors };
}

function buildFromCSVRow(fields: Record<string, string>): Supplier {
  return {
    id: makeId(),
    name: fields.name?.trim() || "Unnamed Supplier",
    tier: fields.tier ? (parseInt(fields.tier) as 1 | 2 | 3) : undefined,
    category: fields.category || undefined,
    region: fields.region || undefined,
    risk: fields.risk ? parseFloat(fields.risk) : undefined,
    spend: fields.spend ? parseFloat(fields.spend) : undefined,
    exposure: fields.exposure ? parseFloat(fields.exposure) : undefined,
    riskState: "STABLE",
    data: { updatedLabel: "Just added", confidence: "LOW" },
  };
}

// ── Single supplier lookup form ───────────────────────────────────────────────

function SingleForm({ onDone }: { onDone: () => void }) {
  const { addSupplier } = useApp();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [saved, setSaved] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions on every keystroke
  const updateSuggestions = useCallback((val: string) => {
    if (!val.trim() || val.length < 1) { setSuggestions([]); return; }
    const lower = val.toLowerCase();
    const filtered = COMPANY_SUGGESTIONS.filter((c) =>
      c.toLowerCase().includes(lower)
    ).slice(0, 8);
    setSuggestions(filtered);
    setActiveIdx(-1);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLookup(nameOverride?: string) {
    const name = nameOverride ?? query;
    if (!name.trim()) return;
    setSuggestions([]);
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch("/api/lookup-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError((e as Error).message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!data) return;
    const supplier: Supplier = {
      id: makeId(),
      name: String(data.name || query),
      ticker: data.ticker ? String(data.ticker) : undefined,
      tier: data.tier ? (Number(data.tier) as 1 | 2 | 3) : undefined,
      category: data.category ? String(data.category) : undefined,
      region: data.region ? String(data.region) : undefined,
      risk: data.risk ? Number(data.risk) : undefined,
      spend: data.spend ? Number(data.spend) : undefined,
      exposure: data.exposure ? Number(data.exposure) : undefined,
      onTime: data.onTime ? Number(data.onTime) : undefined,
      qualityPPM: data.qualityPPM ? Number(data.qualityPPM) : undefined,
      duns: data.duns ? String(data.duns) : undefined,
      website: data.website ? String(data.website) : undefined,
      riskState: data.riskState ? String(data.riskState) : "STABLE",
      ratios: data.ratios as Supplier["ratios"],
      creditRisk: data.creditRisk ? {
        ...(data.creditRisk as object),
        lastUpdated: "Just added",
        source: "AI estimate",
      } as Supplier["creditRisk"] : undefined,
      esg: data.esg as Supplier["esg"],
      data: { updatedLabel: "Just added", confidence: "LOW" },
    };
    addSupplier(supplier);
    setSaved(true);
    setTimeout(() => { onDone(); }, 1000);
  }

  const f = (key: string) => data?.[key] != null ? String(data[key]) : "—";
  const riskVal = data?.risk ? Number(data.risk) : null;
  const riskColor = riskVal == null ? "var(--text)" : riskVal >= 70 ? "var(--risk)" : riskVal >= 50 ? "var(--warn)" : "var(--ok)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
      {/* Search bar with typeahead */}
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            className="tb-input"
            style={{ flex: 1, fontSize: 15 }}
            placeholder="Enter company name (e.g. BASF, Foxconn, Maersk…)"
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              setData(null);
              setError("");
              updateSuggestions(v);
            }}
            onKeyDown={(e) => {
              if (suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(i - 1, -1));
                } else if (e.key === "Enter" && activeIdx >= 0) {
                  e.preventDefault();
                  const chosen = suggestions[activeIdx];
                  setQuery(chosen);
                  setSuggestions([]);
                  handleLookup(chosen);
                  return;
                } else if (e.key === "Escape") {
                  setSuggestions([]);
                }
              }
              if (e.key === "Enter" && activeIdx < 0) handleLookup();
            }}
            onFocus={() => updateSuggestions(query)}
            disabled={loading}
            autoFocus
            autoComplete="off"
          />
          <button className="btn primary" onClick={() => handleLookup()} disabled={loading || !query.trim()} style={{ whiteSpace: "nowrap" }}>
            {loading ? "Looking up…" : "Look up"}
          </button>
        </div>

        {/* Typeahead dropdown */}
        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0,
              right: 48, zIndex: 50,
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
              overflow: "hidden",
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(s);
                  setSuggestions([]);
                  handleLookup(s);
                }}
                style={{
                  padding: "9px 14px", fontSize: 13, fontWeight: 500,
                  cursor: "pointer",
                  background: i === activeIdx ? "var(--accent-subtle, rgba(99,102,241,0.08))" : "transparent",
                  borderBottom: i < suggestions.length - 1 ? "1px solid var(--line)" : "none",
                }}
                onMouseEnter={() => setActiveIdx(i)}
              >
                {/* Bold-match the typed portion */}
                {(() => {
                  const idx = s.toLowerCase().indexOf(query.toLowerCase());
                  if (idx === -1) return s;
                  return (
                    <>
                      {s.slice(0, idx)}
                      <b>{s.slice(idx, idx + query.length)}</b>
                      {s.slice(idx + query.length)}
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading && (
        <div className="callout" style={{ fontSize: 13 }}>
          Looking up <b>{query}</b>…
        </div>
      )}

      {error && (
        <div className="callout risk" style={{ fontSize: 13 }}>{error}</div>
      )}

      {data && (
        <>
          {/* Company header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{f("name")}</div>
              {!!(data.ticker && String(data.ticker) !== "null") && (
                <div className="muted mono" style={{ fontSize: 12 }}>{f("ticker")}</div>
              )}
              {!!data.description && (
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{String(data.description)}</div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: riskColor }}>{f("risk")}</div>
              <div className="muted" style={{ fontSize: 11 }}>Risk Score</div>
            </div>
          </div>

          {/* Data grid */}
          <div className="grid-2" style={{ gap: 10 }}>
            <DataRow label="Tier" value={`Tier ${f("tier")}`} />
            <DataRow label="Category" value={f("category")} />
            <DataRow label="Region" value={f("region")} />
            <DataRow label="Risk State" value={f("riskState")} />
            <DataRow label="Annual Spend" value={`$${f("spend")}M`} />
            <DataRow label="Exposure" value={`$${f("exposure")}M`} />
            <DataRow label="On-Time Delivery" value={`${f("onTime")}%`} />
            <DataRow label="Quality (PPM)" value={f("qualityPPM")} />
          </div>

          {data.ratios && (
            <div className="grid-3" style={{ gap: 10 }}>
              <DataRow label="D/E Ratio" value={f("ratios") !== "—" ? String((data.ratios as Record<string, number>).debtToEquity) : "—"} />
              <DataRow label="Net Margin" value={data.ratios ? `${((data.ratios as Record<string, number>).netProfitMargin * 100).toFixed(1)}%` : "—"} />
              <DataRow label="Current Ratio" value={data.ratios ? String((data.ratios as Record<string, number>).currentRatio) : "—"} />
            </div>
          )}

          {data.creditRisk && (
            <div className="grid-2" style={{ gap: 10 }}>
              <DataRow label="FRISK Score" value={`${(data.creditRisk as Record<string, unknown>).friskScore}/10`} />
              <DataRow label="Credit Rating" value={String((data.creditRisk as Record<string, unknown>).creditRating)} />
              <DataRow label="Bankruptcy Risk 12m" value={String((data.creditRisk as Record<string, unknown>).bankruptcyRisk12m)} />
              <DataRow label="Payment Behavior" value={String((data.creditRisk as Record<string, unknown>).paymentBehavior)} />
            </div>
          )}

          {data.esg && (
            <div className="grid-3" style={{ gap: 10 }}>
              <DataRow label="ESG Score" value={`${(data.esg as Record<string, unknown>).score}/100`} />
              <DataRow label="ESG Grade" value={String((data.esg as Record<string, unknown>).grade)} />
              <DataRow label="Labor Risk" value={String((data.esg as Record<string, unknown>).laborRisk)} />
            </div>
          )}

          <div className="note">Data is AI-generated based on publicly available information. Review before adding.</div>

          <div className="inline">
            <button className="btn primary" onClick={handleSave} disabled={saved}>
              {saved ? "✓ Supplier added" : `Add ${f("name")} to directory`}
            </button>
            <button className="btn" onClick={() => { setData(null); setQuery(""); setSuggestions([]); setTimeout(() => inputRef.current?.focus(), 50); }}>Search again</button>
            <button className="btn" onClick={onDone}>Cancel</button>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <div className="note" style={{ textAlign: "center", padding: "12px 0" }}>
          Type any company name and press Look up — AI will fill in tier, risk score, financials, ESG data, and more.
        </div>
      )}
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="box" style={{ padding: "10px 12px" }}>
      <div className="muted" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
    </div>
  );
}

// ── Batch CSV upload ──────────────────────────────────────────────────────────

function BatchForm({ onDone }: { onDone: () => void }) {
  const { addSuppliers } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [added, setAdded] = useState(false);

  function handleFile(file: File) {
    setFileName(file.name);
    setAdded(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, errors } = parseCSV(e.target?.result as string);
      setPreview(rows);
      setErrors(errors);
    };
    reader.readAsText(file);
  }

  function handleConfirm() {
    addSuppliers(preview.map(buildFromCSVRow));
    setAdded(true);
    setTimeout(onDone, 1000);
  }

  const COLS = ["name", "tier", "category", "region", "risk", "spend", "exposure"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 16 }}>
      <div
        className="csv-drop-zone"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        {fileName ? (
          <>
            <div style={{ fontWeight: 600 }}>{fileName}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{preview.length} row{preview.length !== 1 ? "s" : ""} parsed — click to replace</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop CSV here or click to upload</div>
            <div className="muted" style={{ fontSize: 12 }}>Required: <code>name</code> — Optional: <code>tier, category, region, risk, spend, exposure</code></div>
          </>
        )}
      </div>

      {errors.length > 0 && (
        <div className="callout warn" style={{ fontSize: 12 }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{preview.length} suppliers to import</div>
          <div className="table-wrap" style={{ maxHeight: 240, overflow: "auto" }}>
            <table>
              <thead><tr>{COLS.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>{COLS.map((c) => <td key={c}>{row[c] || <span className="muted">—</span>}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="inline">
            <button className="btn primary" onClick={handleConfirm} disabled={added}>
              {added ? `✓ ${preview.length} suppliers added` : `Import ${preview.length} suppliers`}
            </button>
            <button className="btn" onClick={() => { setPreview([]); setFileName(""); setErrors([]); }}>Clear</button>
          </div>
        </>
      )}

      {!fileName && (
        <div className="note">
          CSV format: <code style={{ fontSize: 11 }}>name,tier,category,region,risk,spend,exposure</code>
        </div>
      )}

      <button className="btn" style={{ alignSelf: "flex-start" }} onClick={onDone}>Done</button>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

export function AddSupplierModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"single" | "batch">("single");

  return (
    <div id="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div id="modal-card" style={{ maxWidth: 680 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Add Supplier</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>Search by name or bulk import via CSV</div>
          </div>
          <button className="ai-chat-close" style={{ fontSize: 20 }} onClick={onClose}>✕</button>
        </div>

        <div className="tabs" style={{ marginTop: 12 }}>
          <button className={`tab ${tab === "single" ? "active" : ""}`} onClick={() => setTab("single")}>Single Supplier</button>
          <button className={`tab ${tab === "batch" ? "active" : ""}`} onClick={() => setTab("batch")}>Bulk CSV Upload</button>
        </div>

        {tab === "single" ? <SingleForm onDone={onClose} /> : <BatchForm onDone={onClose} />}
      </div>
    </div>
  );
}
