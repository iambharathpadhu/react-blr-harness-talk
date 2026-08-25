# Designing a Personal AI Harness

A from-scratch, ~250-line agent harness built for a live conference talk. No
frameworks, no cloud API keys — everything runs against a local model via
[Ollama](https://ollama.com) so the demo works even on bad venue wifi.

The point isn't the code. It's that four small, boring design decisions —
mediated tools, tiered permissions, persistent memory, and a self-scheduling
loop — are what separate "a script with an LLM in it" from something that
survives being unplugged, lied to, and left running unattended.

## Setup (do this before the talk, not during it)

```bash
brew install ollama
brew services start ollama
ollama pull qwen2.5:7b      # good tool-calling behavior, ~4.7GB
# ollama pull llama3.2:3b   # faster fallback if qwen is too slow on your laptop

npm install
npm run typecheck           # sanity check
```

Model choice matters more than it should: `qwen2.5:7b` calls tools once and
answers cleanly. `llama3.2:3b` is faster but noticeably chattier — it'll
sometimes call the same tool two or three times before answering, or narrate
a tool call as text instead of actually invoking it. Rehearse with whichever
one you'll actually run live, and don't be afraid to point at that flakiness
on stage — "this is a 3B free model doing its best" is a fine thing to say
out loud, and it's an honest answer to "why not just trust the model."

## Running it

```bash
npm run demo    # tiered permissions + persistent memory
npm run watch   # autonomous mode (no human typing)
```

For the live talk, `demo/open-act.sh {ollama|autonomy}` jumps VS Code
straight to the relevant file+line, so the code is visible on screen next to
the terminal instead of just narrated. Requires the `code` CLI (VS Code:
Cmd+Shift+P → "Shell Command: Install 'code' command in PATH") — install and
test this before the talk, not on stage.

`demo` and `watch` both read/write `memory.json` and a `sandbox/` directory
in the project root — delete `memory.json` any time to reset to a "first
session" state for a rehearsal.

## Project layout

```
harness/
  model.ts          one function: talk to Ollama, get back a message
  tools.ts          tool schemas + THE TIER MAP (safe / confirm / blocked)
  permissions.ts     confirm(): block until a human says yes
  memory.ts          persistent facts, a flat JSON file
  system-prompt.ts    what the agent is told, including recalled memory
  runtime.ts          the loop: model -> tool calls -> tier gate -> repeat
bin/
  repl.ts            interactive entrypoint (the finished harness)
  watch.ts            autonomous entrypoint (no human typing)
```

Read `harness/runtime.ts` first — it's the whole loop in one screen, and
every other file exists to be called from it. This branch (`main`) is the
finished harness — see below for how it was built up one capability at a
time.

---

## The 6-step build

This repo doubles as a self-guided tutorial. Every step below is its own git
branch, each one a real subset of the next — `git diff` between any two
consecutive branches shows exactly what capability was added and why.

| Step | Branch | What it adds |
|---|---|---|
| 1 | [`step-1-bare-model`](../../tree/step-1-bare-model) | Just the model. No tools, no loop, no memory — it can't do anything but talk. |
| 2 | [`step-2-the-car-shell`](../../tree/step-2-the-car-shell) | A system prompt and a conversation loop, formalized as their own modules. Still zero tools. |
| 3 | [`step-3-tools-no-permission`](../../tree/step-3-tools-no-permission) | Real file tools. Every call runs the instant it's requested — the naive agent everyone writes first. |
| 4 | [`step-4-tiered-permissions`](../../tree/step-4-tiered-permissions) | A tier map: safe / confirm / blocked. The harness decides what's allowed, not the model. |
| 5 | [`step-5-persistent-memory`](../../tree/step-5-persistent-memory) | A flat file on disk that survives the process exiting — quit and restart, it still remembers. |
| 6 | `main` (this branch) | Autonomous mode. The agent can act with nobody watching — and gets *stricter* defaults, not looser ones. |

Try it yourself: `git checkout step-1-bare-model`, run `npm run demo`, work
your way up to `main` one `git checkout` at a time. Full talk script and
speaker notes for presenting this live are in [TALK.md](TALK.md).

## Rehearsal checklist

- [ ] `ollama serve` running and reachable before doors open — don't rely on
      venue wifi for anything, this whole demo is offline-capable on purpose
- [ ] `memory.json` and `inbox.md` deleted, `sandbox/` empty, on **every**
      branch before you start — each step needs a genuinely fresh state
- [ ] test every branch in the sequence you'll actually present them in, on
      the machine you'll actually present from — see TALK.md for the full
      script, timing, and screen-setup notes
