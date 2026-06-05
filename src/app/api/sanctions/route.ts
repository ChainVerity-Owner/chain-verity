// Sanctions screening via OpenSanctions
// Free for non-commercial use — no API key required
// Docs: https://www.opensanctions.org/docs/api/
//
// Screens against: OFAC SDN, EU sanctions, UN sanctions,
// FATF blacklist, UK HM Treasury, and 100+ other lists

export async function POST(request: Request) {
  const { name, country } = await request.json();

  if (!name) {
    return Response.json({ error: "name is required" }, { status: 400 });
  }

  try {
    const body = {
      queries: {
        q1: {
          schema: "Organization",
          properties: {
            name: [name],
            ...(country ? { country: [country.toLowerCase()] } : {}),
          },
        },
      },
    };

    const res = await fetch("https://api.opensanctions.org/match/default", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`OpenSanctions returned ${res.status}`);
    }

    const data = await res.json();
    const response = data.responses?.q1;

    if (!response) {
      return Response.json({ match: false, results: [], screened: true });
    }

    const results = (response.results ?? []).map((r: Record<string, unknown>) => ({
      id: r.id,
      caption: r.caption,
      score: r.score,
      match: r.match,
      datasets: r.datasets,
      properties: {
        name: (r.properties as Record<string, string[]>)?.name ?? [],
        country: (r.properties as Record<string, string[]>)?.country ?? [],
        topics: (r.properties as Record<string, string[]>)?.topics ?? [],
        alias: (r.properties as Record<string, string[]>)?.alias ?? [],
      },
    }));

    const hasMatch = results.some(
      (r: { match: boolean; score: number }) => r.match === true || r.score > 0.8
    );
    const topScore =
      results.length > 0 ? Math.max(...results.map((r: { score: number }) => r.score)) : 0;

    return Response.json({
      match: hasMatch,
      topScore: Math.round(topScore * 100),
      results: results.slice(0, 5), // top 5 matches
      screened: true,
      lists: [
        "OFAC SDN", "EU Sanctions", "UN Sanctions",
        "UK HM Treasury", "FATF", "Swiss SECO",
      ],
    });
  } catch (err) {
    console.error("OpenSanctions error:", err);
    return Response.json(
      { error: String(err), screened: false },
      { status: 502 }
    );
  }
}
