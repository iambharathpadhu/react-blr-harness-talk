// STEP 3: the model can now be handed a list of tools and ask to call one.
// The only new thing versus step 1/2 is the `tools` parameter and the
// `tool_calls` / `tool_name` fields — everything else about talking to
// Ollama is unchanged.

export interface ToolCall {
  function: { name: string; arguments: Record<string, unknown> };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_name?: string; // only set on role: "tool" messages
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

export async function chat(
  messages: ChatMessage[],
  tools: unknown[],
): Promise<{ message: ChatMessage; usage: ChatUsage }> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, tools, stream: false }),
  });

  if (!res.ok) {
    throw new Error(
      `Ollama request failed (${res.status}). Is "ollama serve" running and has ` +
        `"ollama pull ${MODEL}" completed? ${await res.text()}`,
    );
  }

  // Ollama's non-streaming /api/chat response already includes real token
  // counts alongside the message — prompt_eval_count/eval_count — so this
  // is free telemetry, not something the harness has to compute itself.
  const data = (await res.json()) as {
    message: ChatMessage;
    prompt_eval_count?: number;
    eval_count?: number;
  };
  return {
    message: data.message,
    usage: {
      promptTokens: data.prompt_eval_count ?? 0,
      completionTokens: data.eval_count ?? 0,
    },
  };
}
