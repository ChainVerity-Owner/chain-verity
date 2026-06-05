import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });

  const { category, region, supplierName } = await request.json();
  if (!category) return new Response("category required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are a senior supply chain advisor. A company's supplier "${supplierName}" in the "${category}" category has been flagged as high-risk and needs a secondary source.

Identify up to 10 reputable, real-world companies that could serve as alternative suppliers in the "${category}" category${region ? ` (with operations in ${region} or globally)` : ""}.

Rank them from MOST viable (#1) to LEAST viable based on:
1. Financial stability and creditworthiness
2. Proven capability and scale in this category
3. Geographic proximity to ${region ?? "the buyer"}
4. ESG and compliance standing
5. Ease and speed of onboarding as a new supplier

For each, include a viability score (1–10) reflecting how strong a fit they are.

Choose companies that are diverse in geography or business model where possible. Exclude the at-risk supplier "${supplierName}" itself.

Return ONLY a valid JSON array of up to 10 objects, ranked best-to-worst, no markdown, no explanation:
[
  {
    "name": "Exact company name",
    "headquarters": "City, Country",
    "viability": 9,
    "description": "One sentence: what they do and why they are reputable in this space",
    "why": "One sentence: specific reason they rank at this position as an alternative for ${category} sourcing"
  }
]`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return new Response(JSON.stringify(suggestions.slice(0, 10)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
