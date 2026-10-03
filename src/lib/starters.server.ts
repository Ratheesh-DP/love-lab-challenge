import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const RUN = "X-Lovable-AIG-Run-ID";

function runIdFetch() {
  let runId: string | undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN, runId);
    const res = await fetch(input, { ...init, headers });
    runId ??= res.headers.get(RUN)?.trim() || undefined;
    return res;
  };
}

export async function generateStarters(input: {
  interests: string;
  match: string;
  theory: "practical" | "adventurous";
}) {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch(),
  });

  const style =
    input.theory === "practical"
      ? "thoughtful, values-focused openers that reveal compatibility"
      : "playful, spontaneous openers that spark chemistry or propose a fun plan";

  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You write dating-app conversation starters. Be warm, specific, never creepy or generic. Reference concrete overlaps between the two people. Output exactly 5 starters, one per line, no numbering, no quotes, each under 160 characters.",
    prompt: `Style: ${style}.\n\nMy interests:\n${input.interests}\n\nMy match's profile:\n${input.match}`,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const text = await Promise.resolve(result.text).catch((e: unknown) => {
    failure ??= e;
    return "";
  });
  if (!text) {
    const status = (failure as { statusCode?: number })?.statusCode;
    if (status === 429) throw new Error("Too many requests right now. Try again in a minute.");
    if (status === 402) throw new Error("AI credits have run out for this app.");
    throw new Error("Couldn't write starters right now. Please try again.");
  }
  return text
    .split("\n")
    .map((l: string) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/^"|"$/g, "").trim())
    .filter(Boolean)
    .slice(0, 5);
}
