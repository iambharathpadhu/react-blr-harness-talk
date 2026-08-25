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
import { ui, formatTokens, AUTONOMOUS_JOKES } from "../harness/ui.js";

const INBOX = "inbox.md";
const POLL_MS = 3000;
const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";

async function main() {
  if (!fs.existsSync(INBOX)) fs.writeFileSync(INBOX, "", "utf-8");

  const messages: ChatMessage[] = [{ role: "system", content: systemPrompt(recall()) }];
  const session: ChatUsage = { promptTokens: 0, completionTokens: 0 };
  let seen = fs.readFileSync(INBOX, "utf-8").split("\n").filter(Boolean).length;

  console.log(ui.banner(`harness-demo · step 6 · autonomous (cruise control) · ${MODEL}`));
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
      messages.push({ role: "user", content: line });
      const { answer, usage } = await runTurn(messages, { unattended: true, jokes: AUTONOMOUS_JOKES });
      session.promptTokens += usage.promptTokens;
      session.completionTokens += usage.completionTokens;
      console.log(`${ui.agent("agent (autonomous)>")} ${answer}`);
      console.log(ui.dim(formatTokens(usage, session)));
    }

    setTimeout(poll, POLL_MS);
  }

  poll();
}

main();
