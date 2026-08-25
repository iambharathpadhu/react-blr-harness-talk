#!/usr/bin/env node
// STEP 5: read memory.ts's recall() once at startup and hand it to the
// system prompt. Quit with 'exit', run this again, and whatever was
// remembered is still there — a genuinely separate process, reading state
// that survived the first one exiting.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ChatMessage, ChatUsage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { recall } from "../harness/memory.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { ui, formatTokens } from "../harness/ui.js";

const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

async function main() {
  const knownFacts = recall();
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt(knownFacts) }];
  const session: ChatUsage = { promptTokens: 0, completionTokens: 0 };

  console.log(ui.banner(`harness-demo · step 5 · persistent memory · ${MODEL}`));
  console.log(
    ui.dim(
      knownFacts.length
        ? `recalled ${knownFacts.length} fact(s) from a previous session`
        : "no saved memory yet"
    )
  );
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

    const { answer, usage } = await runTurn(messages, rl);
    session.promptTokens += usage.promptTokens;
    session.completionTokens += usage.completionTokens;

    console.log(`${ui.agent("agent>")} ${answer}`);
    console.log(ui.dim(formatTokens(usage, session)) + "\n");
  }
  rl.close();
  process.exit(0);
}

main();
