// STEP 3: THE LOOP, FOR REAL THIS TIME.
//
// Call the model. If it wants a tool, run the tool — immediately, no
// questions asked — and feed the result back. Repeat until it stops asking.
// This is the naive agent everyone writes first. It works. It also just
// deleted a file the instant it was asked, with nothing in between the
// model's request and the action actually happening.
//
// MAX_STEPS exists because a model that keeps deciding "one more tool call"
// would otherwise loop forever — every iteration is a real network call.

import { chat, type ChatMessage } from "./model.js";
import { toolSchemas, runTool } from "./tools.js";
import { ui } from "./ui.js";

const MAX_STEPS = 8;

export async function runTurn(messages: ChatMessage[]): Promise<string> {
  for (let step = 0; step < MAX_STEPS; step++) {
    const reply = await chat(messages, toolSchemas);
    messages.push(reply);

    if (!reply.tool_calls || reply.tool_calls.length === 0) {
      return reply.content;
    }

    for (const call of reply.tool_calls) {
      const { name, arguments: args } = call.function;

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
