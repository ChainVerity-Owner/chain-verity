// Live earthquake data from USGS FDSN Event Web Service
// No API key required — completely free and open
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

import { suppliersAll, suppliersAllUS } from "@/lib/data";
import { supplierCoords, haversineKm } from "@/lib/data/coords";

export const revalidate = 900; // cache for 15 minutes

const PROXIMITY_KM = 800; // only surface quakes within this range of a supplier

interface USGSFeature {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number;
    url: string;
    title: string;
  };
  geometry: { type: string; coordinates: [number, number, number] };
}

function severityFromMag(mag: number): string {
  if (mag >= 6.5) return "critical";
  if (mag >= 5.5) return "high";
  return "medium";
}

export async function GET() {
  try {
    const url =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=4.0&orderby=time&limit=300" +
      `&starttime=${new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`USGS returned ${res.status}`);
    const data: { features: USGSFeature[] } = await res.json();

    const allSuppliers = [...suppliersAll, ...suppliersAllUS];

    const events = data.features
      .map((f) => {
        const [lon, lat] = f.geometry.coordinates;
        const mag = f.properties.mag ?? 0;

        // Find suppliers within range, nearest first
        const nearby = allSuppliers
          .map((s) => {
            const coords = supplierCoords(s);
            return coords ? { s, km: haversineKm([lon, lat], coords) } : null;
          })
          .filter((x): x is { s: (typeof allSuppliers)[number]; km: number } => x !== null && x.km <= PROXIMITY_KM)
          .sort((a, b) => a.km - b.km);

        if (nearby.length === 0) return null;

        const nearest = nearby[0];
        return {
          id: `usgs-${f.id}`,
          category: "natural_disaster",
          severity: severityFromMag(mag),
          title: f.properties.title ?? `M${mag.toFixed(1)} earthquake`,
          detail: `M${mag.toFixed(1)} earthquake ${f.properties.place ?? ""}. Nearest supplier: ${nearest.s.name} (~${Math.round(nearest.km)}km). ${nearby.length > 1 ? `${nearby.length} suppliers within ${PROXIMITY_KM}km.` : ""} Assess site and logistics impact.`,
          region: nearest.s.region ?? "Global",
          affectedSupplierIds: nearby.slice(0, 5).map((x) => x.s.id),
          date: new Date(f.properties.time).toISOString().split("T")[0],
          source: "USGS Earthquake Hazards Program",
          status: "Active",
          link: f.properties.url,
          isLive: true,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    return Response.json(events);
  } catch (err) {
    console.error("USGS fetch error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
