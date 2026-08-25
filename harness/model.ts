// STEP 1: talk to a local model. Nothing else exists yet.
//
// This is the whole "engine" — send the conversation so far, get a reply
// back. No tools, no memory, no permissions. The model can only ever
// produce text; it has no way to affect anything outside this function call.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

export async function chat(messages: ChatMessage[]): Promise<ChatMessage> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false }),
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
