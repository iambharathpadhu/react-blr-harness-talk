#!/usr/bin/env node
// STEP 3: the shell now has real tools wired into it — see
// harness/tools.ts and the loop in harness/runtime.ts. Nothing in this file
// changed to make that happen; runTurn's signature is exactly what it was
// in step 2. That's the payoff of formalizing the shell early: capability
// grew without this file needing to know or care.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ChatMessage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { ui } from "../harness/ui.js";

async function main() {
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt() }];

  console.log(ui.banner("harness-demo · step 3 · tools, no permission"));
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
