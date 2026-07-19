// Global trade concentration from the UN Comtrade API
// Free subscription key at https://comtradedeveloper.un.org (free tier: 500 calls/day)
// Set COMTRADE_API_KEY in env. Without a key, serves cached 2023 reference figures
// so the concentration story remains demonstrable offline.
// Docs: https://comtradedeveloper.un.org/apis

export const revalidate = 86400; // trade data is annual — cache for 24h

// Strategic commodities backing the sub-tier concentration analysis
const COMMODITIES = [
  { code: "850511", label: "Permanent magnets (NdFeB)", hs: "HS 8505.11" },
  { code: "2846",   label: "Rare-earth compounds",      hs: "HS 2846" },
  { code: "8542",   label: "Integrated circuits",       hs: "HS 8542" },
];

// Cached reference shares (UN Comtrade, 2023 annual, % of global export value).
// Served when no API key is configured or the live call fails.
const CACHED: Record<string, { label: string; hs: string; year: number; topExporters: { country: string; sharePct: number }[] }> = {
  "850511": {
    label: "Permanent magnets (NdFeB)", hs: "HS 8505.11", year: 2023,
    topExporters: [
      { country: "China", sharePct: 63 }, { country: "Germany", sharePct: 9 },
      { country: "Japan", sharePct: 8 },  { country: "Philippines", sharePct: 4 },
      { country: "Other", sharePct: 16 },
    ],
  },
  "2846": {
    label: "Rare-earth compounds", hs: "HS 2846", year: 2023,
    topExporters: [
      { country: "China", sharePct: 70 }, { country: "Malaysia", sharePct: 9 },
      { country: "Japan", sharePct: 6 },  { country: "France", sharePct: 4 },
      { country: "Other", sharePct: 11 },
    ],
  },
  "8542": {
    label: "Integrated circuits", hs: "HS 8542", year: 2023,
    topExporters: [
      { country: "Taiwan", sharePct: 22 }, { country: "China", sharePct: 16 },
      { country: "South Korea", sharePct: 13 }, { country: "Singapore", sharePct: 12 },
      { country: "Other", sharePct: 37 },
    ],
  },
};

interface ComtradeRow {
  reporterDesc: string;
  primaryValue: number;
}

async function fetchCommodity(code: string, apiKey: string) {
  const url =
    `https://comtradeapi.un.org/data/v1/get/C/A/HS?period=2023&partnerCode=0&flowCode=X&cmdCode=${code}&maxRecords=250` +
    `&subscription-key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Comtrade ${code} returned ${res.status}`);
  const data: { data?: ComtradeRow[] } = await res.json();
  const rows = (data.data ?? []).filter((r) => r.primaryValue > 0 && r.reporterDesc);
  const total = rows.reduce((a, r) => a + r.primaryValue, 0);
  if (total === 0) throw new Error(`Comtrade ${code}: no data`);
  const sorted = [...rows].sort((a, b) => b.primaryValue - a.primaryValue);
  const top = sorted.slice(0, 4).map((r) => ({
    country: r.reporterDesc,
    sharePct: Math.round((r.primaryValue / total) * 100),
  }));
  const otherPct = Math.max(0, 100 - top.reduce((a, t) => a + t.sharePct, 0));
  return [...top, { country: "Other", sharePct: otherPct }];
}

export async function GET() {
  const apiKey = process.env.COMTRADE_API_KEY;

  const results = await Promise.all(
    COMMODITIES.map(async (c) => {
      if (apiKey) {
        try {
          const topExporters = await fetchCommodity(c.code, apiKey);
          return { code: c.code, label: c.label, hs: c.hs, year: 2023, topExporters, live: true };
        } catch (err) {
          console.error(`Comtrade live fetch failed for ${c.code}:`, err);
        }
      }
      return { ...CACHED[c.code], code: c.code, live: false };
    })
  );

  return Response.json({ commodities: results, source: "UN Comtrade", live: results.some((r) => r.live) });
}
