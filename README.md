# Designing a Personal AI Harness

> **You're on `step-2-the-car-shell`** — step 2 of a 6-step build.
> A system prompt and a conversation loop, formalized as their own modules. Still zero tools. See the full progression
> table on [`main`](https://github.com/iambharathpadhu/react-blr-harness-talk#the-6-step-build)
> or jump straight to what comes next: `bratcode step3`.

A from-scratch, ~250-line agent harness built for a live conference talk. No
frameworks, no cloud API keys — everything runs against a local model via
[Ollama](https://ollama.com) so the demo works even on bad venue wifi.

The point isn't the code. It's that four small, boring design decisions —
mediated tools, tiered permissions, persistent memory, and durable execution
— are what separate "a script with an LLM in it" from something that
survives being unplugged, told no, and crashed mid-task. (`main` also carries
a bonus fifth decision, a self-scheduling autonomous loop, not part of the
live talk — see below.)

## Setup (do this before the talk, not during it)

```bash
brew install ollama
brew services start ollama
ollama pull qwen2.5:7b      # good tool-calling behavior, ~4.7GB
# ollama pull llama3.2:3b   # faster fallback if qwen is too slow on your laptop

npm install                 # do this BEFORE opening the folder in VS Code —
                            # a fresh clone shows TS squiggles until @types/node
                            # and tsx are installed. They're not real errors.
./demo/install-bratcode.sh  # puts the `bratcode` command on your PATH (no sudo)
bratcode doctor             # node_modules, typecheck, Ollama up, model pulled
```

**Use `qwen2.5:7b` for the live talk. This isn't a mild preference — it's
required.** `llama3.2:3b` is noticeably chattier and looser about calling a
tool exactly once per instruction — in testing it sometimes called the same
tool repeatedly on a single request instead of stopping after one. Step 6's
Ctrl-C timing depends on each step making exactly one predictable tool call
inside its pause window; a model that loops or rambles first blows that
timing. `qwen2.5:7b` runs the three-step script clean, once, correctly,
every time.

`llama3.2:3b` is kept pulled only as a last-resort emergency fallback if
`qwen2.5:7b` is somehow unusable on the presenting machine — and if you do
fall back, raise `HARNESS_STEP_PAUSE_MS` generously so a chattier model still
finishes each step inside the pause.

## Running it

Everything runs through one command, `bratcode` (installed by
`demo/install-bratcode.sh` as a symlink to `bin/bratcode`, so it keeps
working as you `git checkout` between step branches):

```bash
bratcode            # the interactive harness on whatever branch you're on
bratcode durable    # step 6: durable execution — checkpoint + crash + resume
bratcode watch      # bonus, not part of the live talk: autonomous mode
bratcode reset      # wipe memory.json / checkpoint.json / sandbox for a fresh run
bratcode step1      # git checkout step-1-bare-model, then reset (…step2 … step6)
gc1 … gc6           # the same thing, two keystrokes: gc3 == bratcode step3
bratcode doctor     # preflight check — run it before you walk on stage
```

On stage, use the `gc` shortcuts: `gc1` switches to step 1 with a fresh
state, `gc2` to step 2, and so on up to `gc6` for `main`. They're installed
alongside `bratcode` by `demo/install-bratcode.sh`.

`npm run demo` / `npm run durable` / `npm run watch` still work if you'd
rather not install anything.

For the live talk, `demo/open-act.sh ollama` jumps VS Code straight to the
relevant file+line, so the code is visible on screen next to the terminal
instead of just narrated. Requires the `code` CLI (VS Code: Cmd+Shift+P →
"Shell Command: Install 'code' command in PATH") — install and test this
before the talk, not on stage.

`bratcode` and `bratcode durable` both read/write `memory.json`/`checkpoint.json`
and a `sandbox/` directory in the project root — `bratcode reset` clears them
to a "first run" state for a rehearsal. `bratcode durable` runs a fixed 3-step plan
and writes `checkpoint.json` the instant each step finishes — kill the
process (`Ctrl-C`) during the pause before a step runs, then run it again:
completed steps are skipped, not redone. `watch` (bonus, not demoed live)
appends every policy decision to `audit.jsonl` and enforces a session-wide
token + action budget (`HARNESS_TOKEN_BUDGET`, `HARNESS_ACTION_BUDGET`) so
unattended mode can't quietly run forever.

## Project layout

```
harness/
  model.ts          one function: talk to Ollama, get back a message
  tools.ts          tool schemas + THE TIER MAP (safe / confirm / blocked)
  permissions.ts     confirm(): block until a human says yes
  memory.ts          persistent facts, a flat JSON file
  checkpoint.ts       durable execution: which plan steps are already done
  system-prompt.ts    what the agent is told, including recalled memory
  runtime.ts          the loop: model -> tool calls -> tier gate -> repeat
  audit.ts            append-only audit.jsonl of every policy decision
  ui.ts               terminal styling: the boxed header, aligned tags, spinner
bin/
  bratcode            the one CLI: repl / durable / watch / reset / stepN / doctor
  repl.ts            interactive entrypoint (the finished harness)
  durable.ts          step 6: checkpointed plan, survives a mid-run crash
  watch.ts            bonus: autonomous entrypoint (no human typing)
demo/
  install-bratcode.sh symlink bin/bratcode onto your PATH
  check-all-branches.sh typecheck every step branch in talk order
  open-act.sh         jump VS Code to a file:line during the talk
```

Read `harness/runtime.ts` first — it's the whole loop in one screen, and
every other file exists to be called from it. This branch (`main`) is the
finished harness — see below for how it was built up one capability at a
time.

---

## The 6-step build (+ a bonus 7th)

This repo doubles as a self-guided tutorial. Every step below is its own git
branch, each one a real subset of the next — `git diff` between any two
consecutive branches shows exactly what capability was added and why. Steps
1-5 are their own branches; step 6 lives on `main` alongside a bonus,
undemoed autonomous-mode layer (see below).

| Step | Branch | What it adds |
|---|---|---|
| 1 | [`step-1-bare-model`](../../tree/step-1-bare-model) | Just the model. No tools, no loop, no memory — it can't do anything but talk. |
| 2 | [`step-2-the-car-shell`](../../tree/step-2-the-car-shell) | A system prompt and a conversation loop, formalized as their own modules. Still zero tools. |
| 3 | [`step-3-tools-no-permission`](../../tree/step-3-tools-no-permission) | Real file tools. Every call runs the instant it's requested — the naive agent everyone writes first. |
| 4 | [`step-4-tiered-permissions`](../../tree/step-4-tiered-permissions) | A tier map: safe / confirm / blocked. The harness decides what's allowed, not the model. |
| 5 | [`step-5-persistent-memory`](../../tree/step-5-persistent-memory) | A flat file on disk that survives the process exiting — quit and restart, it still remembers. |
| 6 | `main` (this branch) | Durable execution: a fixed multi-step plan checkpoints its progress to disk after every step. Crash mid-plan, restart, and it resumes instead of starting over. |
| 7 (bonus) | `main` (this branch) | Autonomous mode, an audit trail, and a session budget. The agent can act with nobody watching — and gets *stricter* defaults, not looser ones. Not part of the live talk; explore it yourself. |

Try it yourself: `gc1`, then `bratcode`, and work your way up through the
branches one `gcN` at a time. Full talk
script and speaker notes for presenting this live are in [TALK.md](TALK.md).

## Rehearsal checklist

- [ ] `ollama serve` running and reachable before doors open — don't rely on
      venue wifi for anything, this whole demo is offline-capable on purpose
- [ ] `bratcode doctor` green on the presenting laptop, and
      `demo/check-all-branches.sh` clean
- [ ] `memory.json`, `checkpoint.json`, and `inbox.md` deleted, `sandbox/`
      empty, on **every** branch before you start — each step needs a
      genuinely fresh state (`gcN` / `bratcode stepN` does this for you)
- [ ] Step 6's Ctrl-C-then-resume rehearsed at least twice — see TALK.md for
      exact timing
- [ ] test every branch in the sequence you'll actually present them in, on
      the machine you'll actually present from — see TALK.md for the full
      script, timing, and screen-setup notes
