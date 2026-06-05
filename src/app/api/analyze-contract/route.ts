import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a senior procurement and legal analyst embedded in the Chain Verity supply chain risk platform. Your role is to analyse supplier contracts and surface risk clauses, gaps, and recommendations for the procurement team at Worcester Bosch.

When analysing a contract, always output a structured JSON response with these exact fields:
- riskLevel: "Low" | "Medium" | "High" | "Critical"
- summary: string (2–3 sentence executive summary)
- keyRisks: array of { clause: string, risk: string, severity: "Low"|"Medium"|"High"|"Critical" }
- missingClauses: array of strings (clause names that should be present but are absent)
- recommendations: array of strings (actionable recommendations)
- favourable: array of strings (clauses that favour Worcester Bosch)

Be concise, specific, and focus on supply chain risk implications. Output valid JSON only.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { contractTitle, contractType, supplierName, expires, value, notes } =
    await request.json();

  const userMessage = `Analyse this contract for supply chain risk:

Contract: ${contractTitle}
Type: ${contractType}
Supplier: ${supplierName}
Expires: ${expires}
Value: ${value}
${notes ? `Additional context: ${notes}` : ""}

Provide a comprehensive risk analysis focused on:
1. Force majeure and business continuity clauses
2. Penalty and SLA enforcement mechanisms
3. Pricing and price escalation provisions
4. IP and data protection
5. Exit and termination rights
6. Supply continuity obligations

Output JSON only.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        riskLevel: "Medium",
        summary:
          "Unable to parse structured response. Please review the contract manually.",
        keyRisks: [],
        missingClauses: ["Force majeure", "Business continuity", "Price escalation cap"],
        recommendations: ["Manual contract review required."],
        favourable: [],
      };
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("analyze-contract error:", err);
    return new Response("Analysis failed", { status: 500 });
  }
}
