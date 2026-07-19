// Active severe weather alerts from NOAA / National Weather Service
// No API key required — free and open; a User-Agent header is required
// Docs: https://www.weather.gov/documentation/services-web-api

import { suppliersAllUS } from "@/lib/data";
import { supplierCoords, haversineKm } from "@/lib/data/coords";

export const revalidate = 900; // cache for 15 minutes

const PROXIMITY_KM = 250;

interface NWSFeature {
  id: string;
  properties: {
    event: string;
    headline: string | null;
    severity: string; // Extreme | Severe | Moderate | Minor
    areaDesc: string;
    effective: string;
    web?: string;
  };
  geometry: { type: string; coordinates: number[][][] } | null;
}

function polygonCentroid(coords: number[][][]): [number, number] | null {
  const ring = coords?.[0];
  if (!ring || ring.length === 0) return null;
  let lon = 0, lat = 0;
  for (const [x, y] of ring) { lon += x; lat += y; }
  return [lon / ring.length, lat / ring.length];
}

function mapSeverity(s: string): string {
  if (s === "Extreme") return "critical";
  if (s === "Severe") return "high";
  return "medium";
}

export async function GET() {
  try {
    // Note: NWS requires the severity list comma to be URL-encoded, and rejects `limit`
    const res = await fetch(
      "https://api.weather.gov/alerts/active?severity=Extreme%2CSevere",
      { headers: { "User-Agent": "ChainVerity supply chain platform (contact@chainverity.ai)" } }
    );
    if (!res.ok) throw new Error(`NWS returned ${res.status}`);
    const data: { features: NWSFeature[] } = await res.json();

    const events = data.features
      .map((f) => {
        // Only alerts with polygon geometry can be proximity-matched reliably
        const centroid = f.geometry?.type === "Polygon" ? polygonCentroid(f.geometry.coordinates) : null;
        if (!centroid) return null;

        const nearby = suppliersAllUS
          .map((s) => {
            const coords = supplierCoords(s);
            return coords ? { s, km: haversineKm(centroid, coords) } : null;
          })
          .filter((x): x is { s: (typeof suppliersAllUS)[number]; km: number } => x !== null && x.km <= PROXIMITY_KM)
          .sort((a, b) => a.km - b.km);

        if (nearby.length === 0) return null;

        const nearest = nearby[0];
        return {
          id: `nws-${f.id.split("/").pop()}`,
          category: "natural_disaster",
          severity: mapSeverity(f.properties.severity),
          title: `${f.properties.event} — ${nearest.s.name} area`,
          detail: `${f.properties.headline ?? f.properties.event}. Covers ${f.properties.areaDesc}. Nearest supplier: ${nearest.s.name} (~${Math.round(nearest.km)}km).${nearby.length > 1 ? ` ${nearby.length} suppliers within ${PROXIMITY_KM}km.` : ""}`,
          region: "North America",
          affectedSupplierIds: nearby.slice(0, 5).map((x) => x.s.id),
          date: f.properties.effective?.split("T")[0] ?? new Date().toISOString().split("T")[0],
          source: "NOAA National Weather Service",
          status: "Active",
          link: f.properties.web ?? "https://alerts.weather.gov",
          isLive: true,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    return Response.json(events);
  } catch (err) {
    console.error("NWS fetch error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
