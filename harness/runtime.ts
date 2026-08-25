// THE AGENT LOOP.
//
// Call the model, run any requested tools through the tier gate, feed
// results back, repeat until no tool_calls. This is the whole loop — see
// the step-by-step build in this repo's git history/branches
// (step-1-bare-model through step-5-persistent-memory) for how each piece
// of this got added one at a time.
//
// `unattended: true` is the one behavior this final step adds: confirm-tier
// tools are skipped rather than prompted, because there's no human to ask.
// Autonomy makes the harness MORE conservative here, not less.

import type readline from "node:readline/promises";
import { chat, type ChatMessage, type ChatUsage } from "./model.js";
import { toolSchemas, runTool, tierOf, type Tier } from "./tools.js";
import { confirm } from "./permissions.js";
import { ui, spinner, preview, INTERACTIVE_JOKES } from "./ui.js";

const MAX_STEPS = 8;

export interface RuntimeOptions {
  unattended?: boolean; // autonomous mode: only ever runs "safe" tier tools
  rl?: readline.Interface; // required unless unattended: true — see permissions.ts
  jokes?: string[]; // which spinner flavor-text pool to draw from — repl.ts and watch.ts pass different ones
}

export async function runTurn(
  messages: ChatMessage[],
  opts: RuntimeOptions = {},
): Promise<{ answer: string; usage: ChatUsage }> {
  const jokes = opts.jokes ?? INTERACTIVE_JOKES;
  const total: ChatUsage = { promptTokens: 0, completionTokens: 0 };

  for (let step = 0; step < MAX_STEPS; step++) {
    const stop = spinner(jokes);
    const { message: reply, usage } = await chat(messages, toolSchemas);
    stop();
    total.promptTokens += usage.promptTokens;
    total.completionTokens += usage.completionTokens;
    messages.push(reply);

    if (!reply.tool_calls || reply.tool_calls.length === 0) {
      return { answer: reply.content, usage: total };
    }

    for (const call of reply.tool_calls) {
      const { name, arguments: args } = call.function;
      const tier: Tier = tierOf[name] ?? "confirm";

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
        console.log(`      ${ui.dim(`→ ${preview(result)}`)}`);
        messages.push({ role: "tool", tool_name: name, content: result });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.log(`  ${ui.refused("[REFUSED]")} ${ui.dim(message)}`);
        messages.push({ role: "tool", tool_name: name, content: `Refused: ${message}` });
      }
    }
  }

  return { answer: `(hit the ${MAX_STEPS}-step limit without finishing)`, usage: total };
}
