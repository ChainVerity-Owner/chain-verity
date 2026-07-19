// Global news from the GDELT Project DOC 2.0 API
// No API key required — free and open, ~15-minute latency
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
//
// Two modes:
//   GET (no query)     → sector-wide disruption events for Live Events
//   GET ?q={supplier}  → recent articles for one supplier (SupplierDetail news feed)

import { suppliersAll, suppliersAllUS } from "@/lib/data";

export const revalidate = 900; // cache for 15 minutes

interface GDELTArticle {
  url: string;
  title: string;
  seendate: string;   // YYYYMMDDTHHMMSSZ
  domain: string;
  sourcecountry: string;
  socialimage?: string;
}

// Parse GDELT's YYYYMMDDTHHMMSSZ into an ISO timestamp
function parseSeenDate(d: string): string {
  if (!d || d.length < 15) return new Date().toISOString();
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}Z`;
}

// Shared fetch with retry — GDELT connections are flaky and it rate-limits with
// plain-text HTTP 200 bodies, so callers must guard against non-JSON responses.
async function fetchGDELT(query: string, params: string): Promise<{ articles?: GDELTArticle[] }> {
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?query=" +
    encodeURIComponent(query) + params + "&format=json";

  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, {
        headers: { "User-Agent": "ChainVerity supply chain platform" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) break;
    } catch (e) {
      if (attempt === 1) throw e;
    }
  }
  if (!res || !res.ok) throw new Error(`GDELT returned ${res?.status ?? "no response"}`);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`GDELT non-JSON response: ${text.slice(0, 80)}`);
  }
}

const QUERY =
  '("supply chain" OR factory OR port OR semiconductor) (strike OR fire OR closure OR shortage OR disruption OR bankruptcy OR sanctions)';

function categorize(title: string): { category: string; severity: string } {
  const t = title.toLowerCase();
  if (/strike|union|walkout|labor dispute/.test(t)) return { category: "labor", severity: "high" };
  if (/port|shipping|freight|logistics|container/.test(t)) return { category: "logistics", severity: "high" };
  if (/sanction|tariff|export control|geopolit/.test(t)) return { category: "geopolitical", severity: "high" };
  if (/bankrupt|insolven|default|liquidat/.test(t)) return { category: "financial", severity: "critical" };
  if (/fire|explosion|flood|earthquake/.test(t)) return { category: "natural_disaster", severity: "high" };
  return { category: "geopolitical", severity: "medium" };
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q");

  // ── Per-supplier news mode (SupplierDetail feed) ──────────────────────────
  if (q) {
    try {
      const data = await fetchGDELT(
        `"${q}"`,
        "&mode=artlist&maxrecords=10&timespan=1m&sort=datedesc"
      );
      const seen = new Set<string>();
      const articles = (data.articles ?? [])
        .filter((a) => {
          const key = a.title?.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .slice(0, 5)
        .map((a) => ({
          title: a.title,
          description: null as string | null, // GDELT artlist provides no snippet
          url: a.url,
          source: a.domain,
          publishedAt: parseSeenDate(a.seendate),
          urlToImage: a.socialimage || null,
        }));
      return Response.json({ articles, total: articles.length });
    } catch (err) {
      console.error("GDELT supplier-news error:", err);
      return Response.json({ articles: [], total: 0 }, { status: 200 });
    }
  }

  // ── Sector-wide disruption events (Live Events) ───────────────────────────
  try {
    const data = await fetchGDELT(
      QUERY,
      "&mode=artlist&maxrecords=40&timespan=3d&sort=hybridrel"
    );

    const allSuppliers = [...suppliersAll, ...suppliersAllUS];
    const seenTitles = new Set<string>();

    const events = (data.articles ?? [])
      .map((a) => {
        // Dedupe syndicated copies by normalized title
        const key = a.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
        if (seenTitles.has(key)) return null;
        seenTitles.add(key);

        // Match suppliers mentioned by name (first word ≥ 4 chars to avoid false hits)
        const titleLower = a.title.toLowerCase();
        const matched = allSuppliers.filter((s) => {
          const first = s.name.split(" ")[0].toLowerCase();
          return first.length >= 4 && titleLower.includes(first);
        });

        const { category, severity } = categorize(a.title);
        const d = a.seendate;
        const date = d ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : new Date().toISOString().split("T")[0];

        return {
          id: `gdelt-${key.slice(0, 24)}`,
          category,
          severity: matched.length > 0 ? severity : "medium",
          title: a.title,
          detail: `Reported by ${a.domain} (${a.sourcecountry || "intl"}). ${matched.length > 0 ? `Mentions supplier${matched.length > 1 ? "s" : ""}: ${matched.map((m) => m.name).join(", ")}.` : "Sector-level signal — no direct supplier match."} Verify before acting.`,
          region: "Global",
          affectedSupplierIds: matched.slice(0, 5).map((m) => m.id),
          date,
          source: `GDELT · ${a.domain}`,
          status: "Active",
          link: a.url,
          isLive: true,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null)
      // Supplier-matched articles first, then the freshest sector signals
      .sort((a, b) => b.affectedSupplierIds.length - a.affectedSupplierIds.length)
      .slice(0, 10);

    return Response.json(events);
  } catch (err) {
    console.error("GDELT fetch error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
