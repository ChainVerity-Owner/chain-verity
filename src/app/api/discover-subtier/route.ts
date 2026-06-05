import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are a supply chain intelligence analyst at Chain Verity. Your role is to identify and map sub-tier (Tier 2 and Tier 3) suppliers for direct (Tier 1) suppliers to a manufacturing company.

When discovering sub-tier suppliers, always output a structured JSON response with these exact fields:
- supplierName: string (the direct supplier being analysed)
- discoveredNodes: array of {
    name: string,
    tier: 2 | 3,
    country: string,
    materials: string[],
    estimatedRisk: "Low" | "Medium" | "High",
    confidence: "Low" | "Medium" | "High",
    rationale: string
  }
- concentrationRisks: array of strings (geographic or supplier concentration risks identified)
- dataGaps: array of strings (areas where sub-tier mapping is incomplete)
- recommendedActions: array of strings

Focus on realistic sub-tier dependencies relevant to the supplier's category and region. Consider raw materials, components, and critical inputs. Output valid JSON only.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const {
    supplierId,
    supplierName,
    category,
    tier,
    region,
    materials,
    criticalParts,
  } = await request.json();

  const userMessage = `Discover and map sub-tier suppliers for this Tier ${tier} supplier:

Supplier: ${supplierName}
Internal ID: ${supplierId}
Category: ${category}
Current Tier: ${tier}
Region: ${region}
${materials ? `Materials supplied: ${materials.join(", ")}` : ""}
${criticalParts ? `Critical parts: ${criticalParts.join(", ")}` : ""}

Identify likely Tier ${tier + 1} and Tier ${tier + 2} sub-suppliers based on:
1. Typical supply chains for manufacturers in the ${category} category
2. Known major sub-tier suppliers in the relevant regions
3. Raw material and component dependencies
4. Geographic concentration risks (especially China, Taiwan, single-source exposure)

Provide realistic but clearly illustrative sub-tier nodes appropriate for an industrial supply chain demo. Output JSON only.`;

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        supplierName,
        discoveredNodes: [
          {
            name: "Discovery incomplete — retry",
            tier: tier + 1,
            country: region,
            materials: materials ?? [],
            estimatedRisk: "Medium",
            confidence: "Low",
            rationale: "Parse error — manual review required.",
          },
        ],
        concentrationRisks: [],
        dataGaps: ["Full sub-tier data unavailable in demo mode."],
        recommendedActions: ["Run full sub-tier discovery with live data feeds."],
      };
    }

    return Response.json(parsed);
  } catch (err) {
    console.error("discover-subtier error:", err);
    return new Response("Discovery failed", { status: 500 });
  }
}
