// The permission gate. This is the whole "confirm-required" tier from the
// talk in ~10 lines: block until a human says yes. Everything interesting
// about harness safety is deciding WHICH tools call this — see tools.ts.
//
// Takes the caller's own readline interface rather than creating a new one.
// Two `readline.Interface`s reading the same stdin at once will race each
// other for input — the confirm prompt and the main "you>" prompt must share
// one.

import type readline from "node:readline/promises";

export async function confirm(
  rl: readline.Interface,
  question: string,
): Promise<boolean> {
  const answer = await rl.question(`${question} [y/N] `);
  return answer.trim().toLowerCase() === "y";
}
