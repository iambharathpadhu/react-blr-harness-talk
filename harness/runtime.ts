// STEP 2: THE SHELL.
//
// This is the car's chassis with no engine bolted to anything yet — a place
// for the conversation loop to live, separate from the REPL's job of
// reading keystrokes. Right now it does nothing a direct chat() call
// couldn't: no tools exist, so there's nothing to loop on. That changes at
// step 3, and this function is exactly where the tool-calling loop gets
// added — not a rewrite, an addition.

import { chat, type ChatMessage } from "./model.js";

export async function runTurn(messages: ChatMessage[]): Promise<string> {
  const reply = await chat(messages);
  messages.push(reply);
  return reply.content;
}
