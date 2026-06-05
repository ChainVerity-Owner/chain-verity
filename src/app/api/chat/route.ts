import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an AI supply chain analyst embedded in the Chain Verity platform. You have access to real supplier data, financial metrics, contracts, risk scores, and compliance information.

Be concise and direct. Use specific numbers from the context provided. When asked about a specific supplier or issue, give actionable recommendations. Format responses with short paragraphs — no unnecessary preamble.

You are aware of the current view the user is on and can reference specific data points shown on screen.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response("ANTHROPIC_API_KEY is not set", { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { messages, context } = await request.json();

  const systemWithContext = context
    ? `${SYSTEM_PROMPT}\n\n## Current Platform Context\n${context}`
    : SYSTEM_PROMPT;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
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
