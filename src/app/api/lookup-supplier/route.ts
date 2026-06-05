import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });

  const { name } = await request.json();
  if (!name?.trim()) return new Response("Name required", { status: 400 });

  const client = new Anthropic({ apiKey });

  const prompt = `You are a supply chain data analyst. Given a company name, return realistic supplier profile data as a JSON object.

Company: "${name}"

Return ONLY a valid JSON object with these exact fields (no markdown, no explanation):
{
  "name": "official company name",
  "ticker": "stock ticker if public, otherwise null",
  "website": "https://www.company.com (the real corporate website URL — must be accurate for well-known companies)",
  "tier": 1,
  "category": "one of: Raw Materials, Components, Logistics, Services, Packaging, Electronics, Chemicals",
  "region": "one of: NA, EU, APAC, LATAM, MEA",
  "risk": 45,
  "spend": 8.2,
  "exposure": 2.1,
  "onTime": 94,
  "qualityPPM": 120,
  "riskState": "STABLE",
  "duns": "12-345-6789",
  "ratios": {
    "debtToEquity": 0.8,
    "netProfitMargin": 0.12,
    "currentRatio": 1.4
  },
  "creditRisk": {
    "friskScore": 7,
    "insolvencyProbability": 0.03,
    "creditRating": "BBB",
    "paymentBehavior": "Good",
    "bankruptcyRisk12m": "Low"
  },
  "esg": {
    "score": 72,
    "grade": "B",
    "environmental": 68,
    "social": 74,
    "governance": 75,
    "eudrCompliant": "Compliant",
    "csdddStatus": "In Progress",
    "lksgStatus": "Compliant",
    "csrdStatus": "In Progress",
    "laborRisk": "Low",
    "environmentalRisk": "Medium"
  },
  "description": "One sentence description of this supplier's role"
}

Use realistic values based on the actual company if you know it, or plausible estimates if not. Risk score 0-100 (higher = more risk). Spend and exposure in $M. friskScore 1-10 (lower = higher bankruptcy risk). For website, always return the real homepage URL for well-known companies (e.g. "https://www.basf.com" for BASF).`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (msg.content[0] as { type: string; text: string }).text.trim();
    const json = JSON.parse(text.replace(/^```json\n?|```$/g, "").trim());
    return new Response(JSON.stringify(json), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
