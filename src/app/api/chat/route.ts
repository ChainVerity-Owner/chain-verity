import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an expert supply chain risk analyst embedded in Chain Verity. You have deep expertise in:
- Financial risk: FRISK scores, insolvency probability, credit ratings, D/E ratio, current ratio, net margin
- Supply chain disruption modelling: DPS, Monte Carlo simulation, time-to-survive, time-to-recover
- ESG and regulatory compliance: UFLPA, CSDDD, CSRD, LkSG, EUDR, conflict minerals, Scope 3
- Procurement strategy: contract negotiation, secondary source qualification, supplier development
- Crisis response: escalation, action tracking, exposure quantification, earnings impact

You have live data for the user's full supplier portfolio. Always:
- Reference specific numbers from the context — risk scores, exposure, FRISK scores, margins, PPM
- Give actionable recommendations prioritised by financial impact and urgency
- Be concise: short paragraphs or bullets, never walls of text
- Match the user's role: CFO = board-level financial exposure language; Procurement = operational actions and supplier relationships; Analyst = data patterns and signals
- Lead with the most critical metric when discussing a specific supplier
- Format currency consistently using the symbol provided in context (£ or $)

Never say "based on the information provided" or "I don't have access to" — use the data directly and confidently.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { messages, context } = await request.json();

  const systemWithContext = context
    ? `${SYSTEM_PROMPT}\n\n## Live Platform Data\n${context}`
    : SYSTEM_PROMPT;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 2048,
          system: systemWithContext,
          messages,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
