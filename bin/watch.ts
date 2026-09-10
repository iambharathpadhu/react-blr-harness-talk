#!/usr/bin/env node
// The autonomy demo: no human types a prompt. This process polls inbox.md
// and treats each new line as a task the moment it appears.
//
// Run it, then in another window: echo "list files in the sandbox" >> inbox.md
//
// Note the tier map from harness/tools.ts still applies, but `unattended:
// true` means "confirm" tools are skipped rather than prompted -- there's no
// human at the keyboard to ask. That's the point to make live: autonomy
// should make the harness MORE conservative by default, not less.

import fs from "node:fs";
import type { ChatMessage, ChatUsage } from "../harness/model.js";
import { runTurn } from "../harness/runtime.js";
import { recall } from "../harness/memory.js";
import { systemPrompt } from "../harness/system-prompt.js";
import { logAudit } from "../harness/audit.js";
import { ui, header, formatTokens, AUTONOMOUS_JOKES } from "../harness/ui.js";

const INBOX = "inbox.md";
const POLL_MS = 3000;
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

// Nobody's watching in autonomous mode, so nothing stops it from quietly
// spending forever if the inbox keeps getting new lines. A per-turn step
// limit (MAX_STEPS in runtime.ts) caps one conversation turn; this caps the
// whole unattended session — tokens AND actions, whichever runs out first.
// Both are env-overridable so a live demo can set them low enough to trip
// on cue rather than waiting for a real budget to actually run dry.
const SESSION_TOKEN_BUDGET = Number(process.env.HARNESS_TOKEN_BUDGET ?? 4000);
const SESSION_ACTION_BUDGET = Number(process.env.HARNESS_ACTION_BUDGET ?? 5);

async function main() {
  if (!fs.existsSync(INBOX)) fs.writeFileSync(INBOX, "", "utf-8");

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt(recall()) }];
  const session: ChatUsage & { actionsRun: number } = { promptTokens: 0, completionTokens: 0, actionsRun: 0 };
  let seen = fs.readFileSync(INBOX, "utf-8").split("\n").filter(Boolean).length;
  let budgetExceeded = false;

  console.log(header("bonus · autonomous mode (cruise control)", MODEL));
  console.log(ui.dim(`watching ${INBOX} every ${POLL_MS}ms — append a line to trigger the agent`));
  console.log(ui.dim(`e.g.: echo "list files in the sandbox" >> ${INBOX}`) + "\n");

  // A self-scheduling loop, not setInterval: a poll only fires once the
  // previous one has fully finished. setInterval would keep firing on a
  // fixed clock regardless of how long a model call takes, so a slow tool
  // round-trip and the next tick can end up processing the same new line
  // twice before `seen` catches up.
  async function poll() {
    const lines = fs.readFileSync(INBOX, "utf-8").split("\n").filter(Boolean);
    const newLines = lines.slice(seen);
    seen = lines.length; // mark consumed before awaiting anything below

    for (const line of newLines) {
      console.log(`\n${ui.wake("[WAKE]")} ${ui.dim(line)}`);

      const sessionTotal = session.promptTokens + session.completionTokens;
      if (sessionTotal >= SESSION_TOKEN_BUDGET || session.actionsRun >= SESSION_ACTION_BUDGET) {
        // The car won't even turn the key once the budget's spent — this is
        // stricter than a "confirm" skip, which still calls the model and
        // just withholds the action. A blown budget refuses before spending
        // another token on it at all.
        console.log(`  ${ui.blocked("[BUDGET-EXCEEDED]")} ${ui.dim(`session budget spent (${sessionTotal}/${SESSION_TOKEN_BUDGET} tokens, ${session.actionsRun}/${SESSION_ACTION_BUDGET} actions) — not even asking the model.`)}`);
        if (!budgetExceeded) {
          logAudit({ outcome: "budget-exceeded", detail: `${sessionTotal}/${SESSION_TOKEN_BUDGET} tokens, ${session.actionsRun}/${SESSION_ACTION_BUDGET} actions` });
          budgetExceeded = true;
        }
        continue;
      }

      messages.push({ role: "user", content: line });
      const { answer, usage, actionsRun } = await runTurn(messages, { unattended: true, jokes: AUTONOMOUS_JOKES });
      session.promptTokens += usage.promptTokens;
      session.completionTokens += usage.completionTokens;
      session.actionsRun += actionsRun;
      console.log(`${ui.agent("agent (autonomous)>")} ${answer}`);
      console.log(ui.dim(formatTokens(usage, session)) + ui.dim(` · actions ${session.actionsRun}/${SESSION_ACTION_BUDGET}`));
    }

    setTimeout(poll, POLL_MS);
  }

  poll();
}

main();
