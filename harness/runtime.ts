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
import { chat, type ChatMessage, type ChatUsage } from "./model.js";
import { toolSchemas, runTool, tierOf, type Tier } from "./tools.js";
import { confirm } from "./permissions.js";
import { ui, spinner, preview, INTERACTIVE_JOKES } from "./ui.js";

const MAX_STEPS = 8;

export async function runTurn(
  messages: ChatMessage[],
  rl: readline.Interface,
): Promise<{ answer: string; usage: ChatUsage }> {
  const total: ChatUsage = { promptTokens: 0, completionTokens: 0 };

  for (let step = 0; step < MAX_STEPS; step++) {
    const stop = spinner(INTERACTIVE_JOKES);
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

      // Say the decision out loud before acting on it — the harness picking
      // a tier is its own visible event, not something implied only by
      // which branch runs next.
      console.log(`  ${ui.dim(`[POLICY] ${tier}`)}`);

      if (tier === "blocked") {
        console.log(`  ${ui.blocked("[BLOCKED]")} ${ui.dim(`"${name}" never runs.`)}`);
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
