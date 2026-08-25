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

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

export async function chat(
  messages: ChatMessage[],
  tools: unknown[],
): Promise<ChatMessage> {
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

  const data = (await res.json()) as { message: ChatMessage };
  return data.message;
}
