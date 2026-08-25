// THE AGENT LOOP.
//
// Structurally this is the same brittle while-loop everyone writes first:
// call the model, if it wants a tool run the tool, feed the result back,
// repeat until it stops asking for tools. What makes it a harness instead of
// a script is everything OUTSIDE the loop that this function is handed:
// which tier gate each tool call passes through, and whether tool calls are
// even mediated at all.
//
// `brittle: true` reproduces the naive version for the cold-open demo: every
// tool is treated as "safe" and runs the instant the model asks, no matter
// what tierOf says.

import type readline from "node:readline/promises";
import { chat, type ChatMessage } from "./model.js";
import { toolSchemas, runTool, tierOf, type Tier } from "./tools.js";
import { confirm } from "./permissions.js";
import { ui } from "./ui.js";

const MAX_STEPS = 8;

export interface RuntimeOptions {
  brittle?: boolean;
  unattended?: boolean; // autonomous mode: only ever runs "safe" tier tools
  rl?: readline.Interface; // required unless unattended: true — see permissions.ts
}

export async function runTurn(
  messages: ChatMessage[],
  opts: RuntimeOptions = {},
): Promise<string> {
  for (let step = 0; step < MAX_STEPS; step++) {
    const reply = await chat(messages, toolSchemas);
    messages.push(reply);

    if (!reply.tool_calls || reply.tool_calls.length === 0) {
      return reply.content;
    }

    for (const call of reply.tool_calls) {
      const { name, arguments: args } = call.function;
      const tier: Tier = opts.brittle ? "safe" : (tierOf[name] ?? "confirm");

      if (tier === "blocked") {
        console.log(`  ${ui.blocked("[BLOCKED]")} ${ui.dim(`"${name}" is disabled by harness policy — never runs.`)}`);
        messages.push({ role: "tool", tool_name: name, content: "BLOCKED by harness policy." });
        continue;
      }

      if (tier === "confirm" && opts.unattended) {
        console.log(`  ${ui.skipped("[SKIPPED]")} ${ui.dim(`"${name}" needs human confirmation — unattended mode won't ask.`)}`);
        messages.push({
          role: "tool",
          tool_name: name,
          content: "Skipped: unattended runs only execute safe-tier tools.",
        });
        continue;
      }

      if (tier === "confirm") {
        if (!opts.rl) throw new Error('runTurn: a "confirm" tool was called but no rl was passed.');
        const ok = await confirm(opts.rl, `  ${ui.confirm("[CONFIRM]")} run ${ui.dim(`${name}(${JSON.stringify(args)})`)}?`);
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
