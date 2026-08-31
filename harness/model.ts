// STEP 1: talk to a local model. Nothing else exists yet.
//
// This is the whole "engine" — send the conversation so far, get a reply
// back. No tools, no memory, no permissions. The model can only ever
// produce text; it has no way to affect anything outside this function call.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

// Low temperature + a fixed seed, not defaults: a live demo needs the same
// prompt to behave the same way on rehearsal and on stage. Default sampling
// on a 7B model is chatty enough to sometimes skip a tool call outright.
const SAMPLING = { temperature: 0.1, seed: 42 };

export async function chat(
  messages: ChatMessage[],
): Promise<{ message: ChatMessage; usage: ChatUsage }> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, stream: false, options: SAMPLING }),
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
