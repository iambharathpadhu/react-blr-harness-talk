#!/usr/bin/env node
// STEP 2: the same bare model, now sitting inside a real (if empty) harness
// shell — a system prompt as its own concern, a runTurn() loop as its own
// concern, instead of both being inlined here. Behavior is identical to
// step 1 from the user's side: still no tools, still nothing it can
// actually do. What's different is the shape of the code that later steps
// will grow into.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ChatMessage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { ui } from "../harness/ui.js";

async function main() {
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt() }];

  console.log(ui.banner("harness-demo · step 2 · the car shell"));
  console.log(ui.dim("type 'exit' to quit") + "\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  while (true) {
    let input: string;
    try {
      input = await rl.question(`${ui.you("you>")} `);
    } catch {
      break;
    }
    if (input.trim() === "exit") break;
    messages.push({ role: "user", content: input });
    const answer = await runTurn(messages);
    console.log(`${ui.agent("agent>")} ${answer}\n`);
  }
  rl.close();
  process.exit(0);
}

main();
