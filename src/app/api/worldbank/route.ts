// World Bank Open Data API — free, no API key required
// Fetches country-level risk indicators for a given ISO-2 country code
//
// Indicators used:
//   NY.GDP.MKTP.KD.ZG — GDP growth (annual %)
//   PV.EST            — Political Stability & Absence of Violence (WGI, -2.5 to +2.5)
//   RQ.EST            — Regulatory Quality (WGI, -2.5 to +2.5)
//   GE.EST            — Government Effectiveness (WGI, -2.5 to +2.5)
//   NE.TRD.GNFS.ZS    — Trade as % of GDP

export const revalidate = 604800; // 7 days — WB data only updates annually

const INDICATORS: Record<string, string> = {
  gdpGrowth: "NY.GDP.MKTP.KD.ZG",
  politicalStability: "PV.EST",
  regulatoryQuality: "RQ.EST",
  govtEffectiveness: "GE.EST",
  tradeOpenness: "NE.TRD.GNFS.ZS",
};

async function fetchIndicator(
  countryCode: string,
  indicator: string
): Promise<{ value: number | null; year: string } | null> {
  const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=3&per_page=3`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const items = (data[1] ?? []) as { value: number | null; date: string }[];
    // Take the most recent non-null value
    const hit = items.find((i) => i.value !== null);
    if (!hit) return null;
    return { value: hit.value, year: hit.date };
  } catch {
    return null;
  }
}

// Normalise World Governance Indicator score (-2.5 to +2.5) → 0–100
function normalise(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(((value + 2.5) / 5) * 100);
}

// Map country code to its full English name
const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria", BE: "Belgium", CH: "Switzerland", CZ: "Czech Republic",
  DE: "Germany", DK: "Denmark", ES: "Spain", FI: "Finland", FR: "France",
  GB: "United Kingdom", HU: "Hungary", IE: "Ireland", IT: "Italy",
  NL: "Netherlands", NO: "Norway", PL: "Poland", PT: "Portugal",
  RO: "Romania", SE: "Sweden", SK: "Slovakia", US: "United States",
  CN: "China", JP: "Japan", KR: "South Korea", IN: "India",
  BR: "Brazil", MX: "Mexico", TR: "Turkey", RU: "Russia",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get("country")?.toUpperCase();

  if (!country) {
    return Response.json({ error: "country param required (ISO-2 code)" }, { status: 400 });
  }

  const [gdp, polStab, regQual, govEff, trade] = await Promise.all([
    fetchIndicator(country, INDICATORS.gdpGrowth),
    fetchIndicator(country, INDICATORS.politicalStability),
    fetchIndicator(country, INDICATORS.regulatoryQuality),
    fetchIndicator(country, INDICATORS.govtEffectiveness),
    fetchIndicator(country, INDICATORS.tradeOpenness),
  ]);

  return Response.json({
    country,
    countryName: COUNTRY_NAMES[country] ?? country,
    gdpGrowth: gdp
      ? { value: Math.round(gdp.value! * 10) / 10, year: gdp.year }
      : null,
    politicalStability: polStab
      ? { raw: polStab.value, score: normalise(polStab.value), year: polStab.year }
      : null,
    regulatoryQuality: regQual
      ? { raw: regQual.value, score: normalise(regQual.value), year: regQual.year }
      : null,
    govtEffectiveness: govEff
      ? { raw: govEff.value, score: normalise(govEff.value), year: govEff.year }
      : null,
    tradeOpenness: trade
      ? { value: Math.round(trade.value! * 10) / 10, year: trade.year }
      : null,
  });
}
