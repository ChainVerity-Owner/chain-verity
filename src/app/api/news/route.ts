// NewsAPI — live news headlines per supplier
// Free developer tier: 100 req/day, articles up to 1 month old
// Register at https://newsapi.org and add NEWS_API_KEY to Vercel env vars
//
// GET ?q={supplierName} → returns up to 5 recent articles

export const revalidate = 1800; // 30 minutes

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) return Response.json({ error: "q param required" }, { status: 400 });

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) return Response.json({ noKey: true }, { status: 503 });

  try {
    const url =
      `https://newsapi.org/v2/everything` +
      `?q=${encodeURIComponent(`"${q}"`)}` +
      `&pageSize=5&language=en&sortBy=publishedAt` +
      `&apiKey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return Response.json(
        { error: body.message ?? `NewsAPI ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const articles = ((data.articles ?? []) as Record<string, unknown>[])
      .filter((a) => (a.title as string) && !(a.title as string).includes("[Removed]"))
      .slice(0, 5)
      .map((a) => ({
        title: a.title as string,
        description: (a.description as string | null) ?? null,
        url: a.url as string,
        source: (a.source as Record<string, string>)?.name ?? "Unknown",
        publishedAt: a.publishedAt as string,
        urlToImage: (a.urlToImage as string | null) ?? null,
      }));

    return Response.json({ articles, total: data.totalResults ?? 0 });
  } catch (err) {
    console.error("News API error:", err);
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
