#!/usr/bin/env node
// STEP 6 (live): durable execution.
//
// A fixed 3-step plan. Each step is checkpointed to checkpoint.json the
// INSTANT it finishes, before the next step ever starts. Run this, let two
// steps finish, then Ctrl-C during the pause before step 3 (that's the
// point — nothing's in flight yet, so there's a safe multi-second window
// to kill it). Run it again: it reads the checkpoint and skips straight to
// step 3, instead of redoing 1 and 2.
//
// This bypasses the tier gate from harness/permissions.ts on purpose —
// that's step 4's lesson, already taught. This step teaches a different
// one: surviving a crash mid-task, not asking permission for a task.

import { chat, type ChatMessage } from "../harness/model.js";
import { runTool } from "../harness/tools.js";
import { loadCheckpoint, markStepDone } from "../harness/checkpoint.js";
import { logAudit } from "../harness/audit.js";
import { ui, spinner, preview, DURABLE_JOKES } from "../harness/ui.js";

const MODEL = process.env.HARNESS_MODEL ?? "qwen2.5:7b";
const PAUSE_MS = Number(process.env.HARNESS_STEP_PAUSE_MS ?? 4000);

const WRITE_FILE_TOOL = [
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write text to a file in the sandbox directory (creates or overwrites).",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
];

const PLAN = [
  { instruction: "Write a file called step1.txt with the text: step one done." },
  { instruction: "Write a file called step2.txt with the text: step two done." },
  { instruction: "Write a file called step3.txt with the text: step three done." },
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// A visible countdown during the pre-step pause — same idea as the
// thinking spinner, but framed as "safe to crash right now" rather than
// "working."
async function pauseWithCountdown(ms: number): Promise<void> {
  const stop = spinner(DURABLE_JOKES);
  await sleep(ms);
  stop();
}

async function runStep(stepNumber: number, instruction: string): Promise<void> {
  console.log(`\n${ui.checkpoint(`[STEP ${stepNumber}/${PLAN.length}]`)} ${instruction}`);
  await pauseWithCountdown(PAUSE_MS);

  const messages: ChatMessage[] = [
    { role: "system", content: "You have one tool, write_file, scoped to a sandbox directory. Call it once for the user's instruction." },
    { role: "user", content: instruction },
  ];
  const { message: reply } = await chat(messages, WRITE_FILE_TOOL);

  const call = reply.tool_calls?.[0];
  if (!call) {
    console.log(`  ${ui.refused("[NO TOOL CALL]")} ${ui.dim(reply.content)}`);
    return;
  }
  const { name, arguments: args } = call.function;
  console.log(`  ${ui.tool("[RUN]")} ${ui.dim(`${name}(${JSON.stringify(args)})`)}`);
  const result = await runTool(name, args);
  console.log(`      ${ui.dim(`→ ${preview(result)}`)}`);

  // The whole trick: write the checkpoint NOW, before returning to the
  // caller's loop — not batched at the end, not after all three steps.
  markStepDone(stepNumber);
  logAudit({ tool: "checkpoint", outcome: "run", detail: `step ${stepNumber}/${PLAN.length} saved to checkpoint.json` });
  console.log(`  ${ui.checkpoint("[CHECKPOINT SAVED]")} ${ui.dim(`${stepNumber}/${PLAN.length} — safe to crash from here on, this step won't repeat`)}`);
}

async function main() {
  console.log(ui.banner(`harness-demo · step 6 · durable execution · ${MODEL}`));
  const cp = loadCheckpoint();
  console.log(ui.dim(`checkpoint.json says: ${cp.completedSteps}/${PLAN.length} steps already done`) + "\n");

  for (let i = 0; i < PLAN.length; i++) {
    const stepNumber = i + 1;
    if (stepNumber <= cp.completedSteps) {
      console.log(`${ui.dim(`[SKIP] step ${stepNumber} — already completed before a previous exit/crash`)}`);
      continue;
    }
    await runStep(stepNumber, PLAN[i].instruction);
  }

  console.log(`\n${ui.banner("All steps complete.")} ${ui.dim("Nothing left to resume — run `rm checkpoint.json sandbox/step*.txt` to start over.")}`);
  process.exit(0);
}

main();
