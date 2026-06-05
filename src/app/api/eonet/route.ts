// Live natural disaster events from NASA EONET (Earth Observatory Natural Event Tracker)
// No API key required — completely free and open
// Docs: https://eonet.gsfc.nasa.gov/docs/v3

export const revalidate = 900; // cache for 15 minutes

interface EONETCategory {
  id: string;
  title: string;
}

interface EONETGeometry {
  date: string;
  type: string;
  coordinates: number[] | number[][][];
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
}

interface EONETEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: EONETCategory[];
  sources: { id: string; url: string }[];
  geometry: EONETGeometry[];
}

interface EONETResponse {
  events: EONETEvent[];
}

function categoryMap(catId: string): string {
  const map: Record<string, string> = {
    drought: "natural_disaster",
    dustHaze: "natural_disaster",
    earthquakes: "natural_disaster",
    floods: "natural_disaster",
    landslides: "natural_disaster",
    manmade: "geopolitical",
    seaLakeIce: "natural_disaster",
    severeStorms: "natural_disaster",
    snow: "natural_disaster",
    tempExtremes: "natural_disaster",
    volcanoes: "natural_disaster",
    waterColor: "natural_disaster",
    wildfires: "natural_disaster",
  };
  return map[catId] ?? "natural_disaster";
}

function severityFromCategory(catId: string): string {
  const highCats = new Set(["earthquakes", "severeStorms", "volcanoes", "floods"]);
  const criticalCats = new Set(["tsunamis"]);
  if (criticalCats.has(catId)) return "critical";
  if (highCats.has(catId)) return "high";
  return "medium";
}

function coordsToRegion(lon: number, lat: number): string {
  if (lat > 35 && lon > -12 && lon < 45) return "Europe";
  if (lat > 10 && lon > 45 && lon < 180) return "Asia / Pacific";
  if (lat > -10 && lat <= 35 && lon > -20 && lon < 60) return "Middle East / Africa";
  if (lat >= 15 && lon <= -60 && lon >= -170) return "North America";
  if (lat < 15 && lon <= -35 && lon >= -85) return "South America";
  if (lat < -10 && lon > 100) return "Australia / Pacific";
  return "Global";
}

function getCoords(geometry: EONETGeometry[]): [number, number] | null {
  for (const g of geometry) {
    if (g.type === "Point" && Array.isArray(g.coordinates) && g.coordinates.length >= 2) {
      return g.coordinates as [number, number];
    }
  }
  return null;
}

export async function GET() {
  try {
    const url =
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=25&days=21";

    const res = await fetch(url);
    if (!res.ok) throw new Error(`EONET returned ${res.status}`);

    const data: EONETResponse = await res.json();

    const events = data.events
      .filter((e) => e.geometry && e.geometry.length > 0)
      .map((e) => {
        const cat = e.categories[0];
        const latestGeo = e.geometry[e.geometry.length - 1];
        const coords = getCoords(e.geometry);
        const [lon, lat] = coords ?? [0, 0];
        const region = coords ? coordsToRegion(lon, lat) : "Global";

        const eventDate = latestGeo?.date
          ? new Date(latestGeo.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        const category = cat ? categoryMap(cat.id) : "natural_disaster";
        const severity = cat ? severityFromCategory(cat.id) : "medium";

        const source = e.sources?.[0]?.id ?? "NASA EONET";

        return {
          id: e.id,
          category,
          severity,
          title: e.title,
          detail:
            e.description ??
            `Active ${cat?.title ?? "natural event"} event detected by NASA Earth Observatory. Monitor for supply chain impact in the affected region.`,
          region,
          affectedSupplierIds: [] as string[],
          date: eventDate,
          source: `NASA EONET · ${source}`,
          status: "Active",
          link: e.link,
          isLive: true,
        };
      });

    return Response.json(events);
  } catch (err) {
    console.error("EONET fetch error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
