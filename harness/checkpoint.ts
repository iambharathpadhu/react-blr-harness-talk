// The durable-execution demo's whole trick, in one file: a plan's progress
// gets written to disk the instant a step finishes, BEFORE the next step
// starts. If the process dies mid-plan, the next run reads this file and
// skips everything already marked done — the crash cost nothing but the one
// step that was actually in flight.
//
// Same principle as memory.ts (state outside the engine survives the engine
// turning off), applied to "where am I in this task" instead of "what do I
// know about the user."

import fs from "node:fs";

const CHECKPOINT_FILE = "checkpoint.json";

export interface CheckpointState {
  completedSteps: number;
}

export function loadCheckpoint(): CheckpointState {
  if (!fs.existsSync(CHECKPOINT_FILE)) return { completedSteps: 0 };
  return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf-8")) as CheckpointState;
}

export function markStepDone(stepNumber: number): void {
  const state: CheckpointState = { completedSteps: stepNumber };
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(state, null, 2), "utf-8");
}
