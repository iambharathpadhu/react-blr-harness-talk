// STEP 2: THE SHELL.
//
// This is the car's chassis with no engine bolted to anything yet — a place
// for the conversation loop to live, separate from the REPL's job of
// reading keystrokes. Right now it does nothing a direct chat() call
// couldn't: no tools exist, so there's nothing to loop on. That changes at
// step 3, and this function is exactly where the tool-calling loop gets
// added — not a rewrite, an addition.

import { chat, type ChatMessage, type ChatUsage } from "./model.js";
import { spinner, INTERACTIVE_JOKES } from "./ui.js";

export async function runTurn(
  messages: ChatMessage[],
): Promise<{ answer: string; usage: ChatUsage }> {
  const stop = spinner(INTERACTIVE_JOKES);
  const { message: reply, usage } = await chat(messages);
  stop();
  messages.push(reply);
  return { answer: reply.content, usage };
}
