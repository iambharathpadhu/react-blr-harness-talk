#!/usr/bin/env node
// Interactive demo entrypoint.
//
//   npm run demo:brittle   -> no permission gate, no memory (the cold open)
//   npm run demo           -> tiered permissions + persistent memory
//
// Quit with Ctrl-C or "exit", then restart the same command to see what
// survived the process dying.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type { ChatMessage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { recall } from "../harness/memory.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { ui } from "../harness/ui.js";

const BRITTLE = process.argv.includes("--brittle");
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

async function main() {
  const knownFacts = BRITTLE ? [] : recall();
  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt(knownFacts) }];

  console.log(ui.banner(`harness-demo · ${MODEL}${BRITTLE ? "  [BRITTLE MODE — no tiers, no memory]" : ""}`));
  if (!BRITTLE) {
    console.log(
      ui.dim(
        knownFacts.length
          ? `recalled ${knownFacts.length} fact(s) from a previous session`
          : "no saved memory yet"
      )
    );
  }
  console.log(ui.dim("type 'exit' to quit") + "\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  while (true) {
    let input: string;
    try {
      input = await rl.question(`${ui.you("you>")} `);
    } catch {
      break; // stdin closed (piped input ran out, or Ctrl-D)
    }
    if (input.trim() === "exit") break;
    messages.push({ role: "user", content: input });
    const answer = await runTurn(messages, { brittle: BRITTLE, rl });
    console.log(`${ui.agent("agent>")} ${answer}\n`);
  }
  rl.close();
  process.exit(0);
}

main();
