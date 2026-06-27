// Live commodity prices from FRED (Federal Reserve Economic Data)
// Requires FRED_API_KEY env var — free at https://fred.stlouisfed.org/docs/api/api_key.html
//
// Series used (all World Bank commodity prices, monthly):
//   PCOPPUSDM  – Copper, USD/metric ton
//   PALUMUSDM  – Aluminium, USD/metric ton
//   PNGASEUUSDM – Natural Gas EU, USD/MMBtu
//
// EUR conversion: hardcoded 1 EUR = 1.08 USD (update if needed)

export const revalidate = 3600; // cache for 1 hour

async function fetchEurUsd(): Promise<number> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error("frankfurter non-200");
    const data = await res.json();
    return data.rates?.EUR ?? 1.08;
  } catch {
    return 1.08; // fallback if the free API is unavailable
  }
}

const SERIES: { id: string; fredId: string; toEUR: (v: number, eurUsd: number) => number }[] = [
  {
    id: "copper",
    fredId: "PCOPPUSDM",
    toEUR: (v, r) => Math.round(v * r), // USD/t → EUR/t
  },
  {
    id: "aluminium",
    fredId: "PALUMUSDM",
    toEUR: (v, r) => Math.round(v * r), // USD/t → EUR/t
  },
  {
    id: "natural-gas",
    fredId: "PNGASEUUSDM",
    // USD/MMBtu → EUR/MWh: 1 MMBtu = 0.29307 MWh
    toEUR: (v, r) => Math.round((v / 0.29307) * r * 10) / 10,
  },
];

interface Observation {
  date: string;
  value: string;
}

interface FREDResponse {
  observations: Observation[];
}

export async function GET() {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "FRED_API_KEY not configured", noKey: true },
      { status: 503 }
    );
  }

  try {
    const eurUsd = await fetchEurUsd();

    const results = await Promise.all(
      SERIES.map(async ({ id, fredId, toEUR }) => {
        const url =
          `https://api.stlouisfed.org/fred/series/observations` +
          `?series_id=${fredId}&api_key=${apiKey}&file_type=json` +
          `&limit=12&sort_order=desc`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`FRED ${fredId}: ${res.status}`);

        const data: FREDResponse = await res.json();

        // Filter out missing values ("." placeholder) and convert
        const prices = data.observations
          .filter((o) => o.value !== "." && !isNaN(parseFloat(o.value)))
          .slice(0, 9) // 9 most recent months
          .map((o) => toEUR(parseFloat(o.value), eurUsd))
          .reverse(); // chronological order for sparklines

        if (prices.length < 2) throw new Error(`${fredId}: insufficient data`);

        const currentPrice = prices[prices.length - 1];
        const threeMonthsAgo = prices[Math.max(0, prices.length - 4)];
        const changePercent =
          Math.round(
            ((currentPrice - threeMonthsAgo) / threeMonthsAgo) * 1000
          ) / 10;

        const trend =
          changePercent > 2
            ? "Rising"
            : changePercent < -2
            ? "Falling"
            : "Stable";

        const lastDate = data.observations.find(
          (o) => o.value !== "." && !isNaN(parseFloat(o.value))
        )?.date;

        return { id, currentPrice, priceHistory: prices, changePercent, trend, lastUpdated: lastDate ?? null };
      })
    );

    return Response.json(results);
  } catch (err) {
    console.error("FRED fetch error:", err);
    return Response.json(
      { error: String(err), noKey: false },
      { status: 502 }
    );
  }
}
