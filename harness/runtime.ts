// STEP 4: INSTALLING THE SAFETY SYSTEMS.
//
// Same loop shape as step 3 — call the model, run requested tools, feed
// results back, repeat. The only change is what happens the instant a tool
// call is about to become a real side effect: look up its tier, and let
// that decide what happens next, instead of just running it.
//
//   safe    -> runs immediately
//   confirm -> a human must approve first (harness/permissions.ts)
//   blocked -> never runs, no matter how the model asks
//
// This is the entire difference between a script and a harness: one
// inserted decision point in an otherwise identical loop.

import type readline from "node:readline/promises";
import { chat, type ChatMessage } from "./model.js";
import { toolSchemas, runTool, tierOf, type Tier } from "./tools.js";
import { confirm } from "./permissions.js";
import { ui } from "./ui.js";

const MAX_STEPS = 8;

export async function runTurn(
  messages: ChatMessage[],
  rl: readline.Interface,
): Promise<string> {
  for (let step = 0; step < MAX_STEPS; step++) {
    // A local model can take several seconds per round-trip. Print
    // something immediately so a live demo never looks like it's hung —
    // silence during a real wait reads as "broken" from the audience.
    // (Clear width is hardcoded, not derived from the styled string's
    // .length — ANSI color codes inflate that count past what's visible.)
    process.stdout.write(ui.dim("  ..."));
    const reply = await chat(messages, toolSchemas);
    process.stdout.write("\r" + " ".repeat(10) + "\r");
    messages.push(reply);

    if (!reply.tool_calls || reply.tool_calls.length === 0) {
      return reply.content;
    }

    for (const call of reply.tool_calls) {
      const { name, arguments: args } = call.function;
      const tier: Tier = tierOf[name] ?? "confirm";

      if (tier === "blocked") {
        console.log(`  ${ui.blocked("[BLOCKED]")} ${ui.dim(`"${name}" is disabled by harness policy — never runs.`)}`);
        messages.push({ role: "tool", tool_name: name, content: "BLOCKED by harness policy." });
        continue;
      }

      if (tier === "confirm") {
        const ok = await confirm(rl, `  ${ui.confirm("[CONFIRM]")} run ${ui.dim(`${name}(${JSON.stringify(args)})`)}?`);
        if (!ok) {
          console.log(`  ${ui.denied("[DENIED]")}`);
          messages.push({ role: "tool", tool_name: name, content: "Denied by user." });
          continue;
        }
      }

      console.log(`  ${ui.tool("[RUN]")} ${ui.dim(`${name}(${JSON.stringify(args)})`)}`);
      try {
        const result = await runTool(name, args);
        messages.push({ role: "tool", tool_name: name, content: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`  ${ui.refused("[REFUSED]")} ${ui.dim(message)}`);
        messages.push({ role: "tool", tool_name: name, content: `Refused: ${message}` });
      }
    }
  }

  return `(hit the ${MAX_STEPS}-step limit without finishing)`;
}
