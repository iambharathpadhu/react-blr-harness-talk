// STEP 2: the system prompt gets its own file — a real piece of the
// harness, not a string typed inline in the REPL. Still says nothing about
// tools or memory, because neither exists yet. This function's signature is
// what grows in later steps (memory gets folded in at step 5).
export function systemPrompt(): string {
  return "You are a small assistant built for a live conference demo.";
}
