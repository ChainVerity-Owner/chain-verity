import Anthropic from "@anthropic-ai/sdk";

const SUBTIER_TOOL: Anthropic.Tool = {
  name: "report_subtier_suppliers",
  description: "Report discovered sub-tier suppliers for a given direct supplier.",
  input_schema: {
    type: "object" as const,
    properties: {
      supplierName: { type: "string" },
      discoveredNodes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            tier: { type: "number" },
            country: { type: "string" },
            materials: { type: "array", items: { type: "string" } },
            estimatedRisk: { type: "string", enum: ["Low", "Medium", "High"] },
            confidence: { type: "string", enum: ["Low", "Medium", "High"] },
            rationale: { type: "string" },
          },
          required: ["name", "tier", "country", "materials", "estimatedRisk", "confidence", "rationale"],
        },
      },
      concentrationRisks: { type: "array", items: { type: "string" } },
      dataGaps: { type: "array", items: { type: "string" } },
      recommendedActions: { type: "array", items: { type: "string" } },
    },
    required: ["supplierName", "discoveredNodes", "concentrationRisks", "dataGaps", "recommendedActions"],
  },
};

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { supplierId, supplierName, category, tier, region, materials, criticalParts } =
    await request.json();

  const userMessage = `Discover and map sub-tier suppliers for this Tier ${tier} supplier:

Supplier: ${supplierName} (ID: ${supplierId})
Category: ${category} · Region: ${region}
${materials?.length ? `Materials supplied: ${materials.join(", ")}` : ""}
${criticalParts?.length ? `Critical parts: ${criticalParts.join(", ")}` : ""}

Identify likely Tier ${tier + 1} and Tier ${tier + 2} sub-suppliers based on typical supply chains for ${category} manufacturers in ${region}. Include geographic concentration risks (China, Taiwan, single-source). Return 4–8 realistic nodes.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      tools: [SUBTIER_TOOL],
      tool_choice: { type: "auto" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (toolUse && toolUse.type === "tool_use") {
      return Response.json(toolUse.input);
    }

    return new Response("No tool call returned", { status: 500 });
  } catch (err) {
    console.error("discover-subtier error:", err);
    return new Response("Discovery failed", { status: 500 });
  }
}
