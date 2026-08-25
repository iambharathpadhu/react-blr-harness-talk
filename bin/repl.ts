#!/usr/bin/env node
// STEP 4: runTurn now needs the readline interface too, so it can pause and
// ask before a confirm-tier tool runs. It's the same `rl` this file already
// owns for the "you>" prompt — passed through, not duplicated. Two readline
// interfaces reading the same stdin would fight each other for input.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ChatMessage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { ui } from "../harness/ui.js";

async function main() {
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt() }];

  console.log(ui.banner("harness-demo · step 4 · tiered permissions"));
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
    const answer = await runTurn(messages, rl);
    console.log(`${ui.agent("agent>")} ${answer}\n`);
  }
  rl.close();
  process.exit(0);
}

main();
