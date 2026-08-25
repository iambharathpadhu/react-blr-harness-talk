# Designing a Personal AI Harness

> **You're on `step-5-persistent-memory`** — step 5 of a 6-step build. A
> flat `memory.json` file now survives the process exiting — quit and
> restart, and it still remembers. See the full progression table on
> [`main`](https://github.com/iambharathpadhu/react-blr-harness-talk#the-6-step-build)
> or jump to the finished harness: `git checkout main`.

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
npm run demo:brittle   # Act 1 — no permission gate, no memory
npm run demo           # Act 2 & 3 — tiered permissions + persistent memory
npm run watch          # Act 4 — autonomous mode (no human typing)
```

For the live talk, `demo/open-act.sh <1|2|3|4|ollama>` jumps VS Code straight
to the file+line each act is about, so the code is visible on screen next to
the terminal instead of just narrated. Requires the `code` CLI (VS Code:
Cmd+Shift+P → "Shell Command: Install 'code' command in PATH") — install and
test this before the talk, not on stage. See TALK.md's "Screen setup" section
for the full per-act layout, including how to visibly prove the model is
running locally on Ollama (no API key, `ollama ps`, optionally Airplane Mode).

`demo` and `demo:brittle` both read/write `memory.json` and a `sandbox/`
directory in the project root — delete `memory.json` any time to reset the
"first session" state for a rehearsal.

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
  repl.ts            interactive demo entrypoint (Acts 1-3)
  watch.ts            autonomous demo entrypoint (Act 4)
```

Read `harness/runtime.ts` first — it's the whole loop in one screen, and
every other file exists to be called from it.

---

## Talk outline (25-35 min)

### Cold open — the brittle agent (3-4 min)

Don't run anything yet. Put the naive loop on a slide or just say it out loud:

> "Call the model. If it wants a tool, run the tool. Feed the result back.
> Repeat until it stops asking. That's it — that's the agent everyone builds
> first. It works in every demo. Here's what it gets wrong."

Name the failure modes you're about to make concrete, one line each:

- tools run the instant the model asks — no mediation, no approval
- state lives in memory — kill the process, the conversation is gone
- "autonomous" usually just means "nobody's watching," not "safe to leave
  running"

### Act 1 — run the brittle version live (4-5 min)

```bash
npm run demo:brittle
```

Ask it to delete a file it just created. Watch it just... do it. No
confirmation, no pause. Then `Ctrl-C` mid-conversation and run the same
command again — ask "what did I just tell you?" and show it has no idea.
That's the whole cold open made real: two failures, thirty seconds, no
slides needed.

### Act 2 — the permission tier (6-8 min)

Open `harness/tools.ts` and point at `tierOf`:

```ts
export const tierOf: Record<string, Tier> = {
  list_files: "safe",
  read_file: "safe",
  write_file: "confirm",
  delete_file: "blocked",
};
```

The line to land: **the model doesn't decide this — the harness does.** An
LLM will ask for anything it thinks helps; whether that ask turns into a
syscall is a policy question, not a model-capability question.

```bash
npm run demo
```

Ask it to write a file, say no at the confirm prompt, show nothing happened.
Ask it to delete a file — show it's refused outright, no prompt, because
`blocked` tools never even ask. Optional stretch: ask it to read a file
outside the sandbox (`../../etc/hosts`) and show `resolveInSandbox` throwing
instead of leaking a path traversal.

### Act 3 — memory that survives the process dying (6-8 min)

Still in `npm run demo`: tell it a fact about yourself ("remember I prefer
TypeScript over Python"). Quit with `exit`. Run `npm run demo` again — a
fresh process, fresh conversation array, same laptop — and ask "what do you
know about me?" It recalls the fact with no re-prompting.

Show `memory.json` on screen. It's a flat array in a text file. The point
isn't the data structure — it's that **anything written to disk outlives the
process**, and a harness that doesn't do this re-derives everything from
scratch every single session, forever.

### Act 4 — autonomy needs tighter defaults, not looser ones (5-6 min)

```bash
npm run watch
```

In a second terminal or editor, append a line to `inbox.md`:

```bash
echo "write a file called notes.txt with today's date" >> inbox.md
```

Watch the agent wake itself up with no one typing a prompt — then watch it
**skip** the write because it's a `confirm`-tier tool and nobody's at the
keyboard to approve it. This is the beat most people haven't thought about:

> "The moment an agent can trigger itself, every 'confirm' tool needs a real
> answer for what happens with no human to ask — and 'just allow it' is
> almost always the wrong answer."

Bonus gotcha worth calling out live if you hit it (you likely will): the
model may still *claim* success in its text reply even though the harness
logged `[skipped]` and nothing was written. Point at the sandbox directory —
empty — next to the model's confident sentence saying otherwise. **Trust the
harness's own log of what ran, never the model's narration of what it
thinks it did.**

### Zoom out (3-4 min)

Map the four acts back to the bigger picture:

- what you just built by hand — a loop, mediated tools, a memory file, a
  self-scheduling poll — is what LangGraph, Mastra, and every agent SDK give
  you out of the box
- what they *can't* give you out of the box: your actual tier map, your
  actual memory schema, your actual answer for "what does this tool do with
  no human watching." That's harness design, and it's still your job.
- one sentence on what's past this talk's scope but is the natural next
  layer: durable execution (checkpoint each step so a crash resumes instead
  of re-running), sandboxed code execution, and multi-agent handoffs. Namedrop, don't demo — 25 minutes doesn't have room, and naming them signals depth without overrunning.

### Close (1-2 min)

> "A harness isn't the model. It's everything you put around it — and every
> piece of that is a decision someone has to make on purpose, not a default
> you inherit for free."

Q&A.

---

## Timing cheat sheet

| Section | Low end | High end |
|---|---|---|
| Cold open | 3 min | 4 min |
| Act 1 — brittle | 4 min | 5 min |
| Act 2 — tiers | 6 min | 8 min |
| Act 3 — memory | 6 min | 8 min |
| Act 4 — autonomy | 5 min | 6 min |
| Zoom out | 3 min | 4 min |
| Close | 1 min | 2 min |
| **Total** | **28 min** | **37 min** |

Cut Act 4's path-traversal stretch goal first if you're tight on time. Cut
the "zoom out" framework namedrops second. Never cut Act 4's core beat (the
skipped write + the model lying about it) — it's the most memorable moment
in the talk.

## Rehearsal checklist

- [ ] `ollama serve` running and reachable before doors open — don't rely on
      venue wifi for anything, this whole demo is offline-capable on purpose
- [ ] `memory.json` deleted so Act 3's "fresh session" is actually fresh
- [ ] `sandbox/` empty so Act 1/2's "watch it get created" lands
- [ ] `inbox.md` deleted so Act 4 starts with a clean watch
- [ ] run the full script once, start to finish, on the machine you'll
      actually present from — local model speed varies a lot by laptop
