# The Model Is the Engine. You Still Have to Build the Car.

_Designing a Personal AI Harness — ReactJS Bangalore, React Meetup #108_

Alt/shorter title if you need it to fit a smaller slide: **"Your LLM Is Just the
Engine."** Use the long one on the title slide, the short one as a running
footer/tagline on every section card.

---

## The analogy — lock this in first, everything else hangs off it

| Car | Harness |
|---|---|
| **Engine** | The model (the LLM itself — raw power, no judgment) |
| **The whole car** | The harness (chassis, dashboard, everything around the engine) |
| **What the car can DO** — steer, brake, wipers, horn | **Tools** — `read_file`, `write_file`, `delete_file`, `remember_fact` |
| **Seatbelt / child-lock / speed limiter** | **Tool tiers** — safe / confirm / blocked |
| **Trip computer / odometer** — survives the engine turning off | **Memory** — `memory.json`, survives the process dying |
| **Cruise control / autopilot** | **Autonomous mode** — `bin/watch.ts` |
| **Rev limiter** | **`MAX_STEPS`** — stops the engine from redlining forever |
| **The dashboard itself** — gauges, warning lights | **The telemetry line** — model name, live spinner, token count |
| **A dashboard gauge lying to you** | **The model narrating success it didn't actually achieve** |
| **Car manufacturers (Toyota, Honda)** | **LangGraph, Mastra, agent SDKs** — factory-built cars |

Say this pairing ONE time, early, cleanly — then just say "the engine" and "the
car" for the rest of the talk. Don't re-explain the mapping every time; trust
the audience to carry it once it's set.

---

## Screen setup

One VS Code window for the whole talk — don't alt-tab between apps live.

- **Top pane:** VS Code editor, showing whichever file the current step is
  about (see each step's "Screen setup" line below).
- **Bottom pane:** VS Code's own integrated terminal, split into two:
  - **Left terminal:** where you actually run `npm run demo` / `npm run watch`
    and type into the conversation.
  - **Right terminal:** stays on the project root, idle, for `git checkout`,
    `ollama ps`, and the one-off `demo/open-act.sh` commands, so the left
    terminal's conversation log never gets cluttered.
- Before the talk, run **Cmd+Shift+P → "Shell Command: Install 'code' command
  in PATH"** once. Test it now, not on stage.
- This repo is six git branches, one per step — `step-1-bare-model` through
  `step-5-persistent-memory`, then `main` as step 6. Moving between steps
  live is a **`git checkout <branch>`**, not a flag or a file edit — that's
  the whole point of building it this way. `demo/open-act.sh {ollama|autonomy}`
  (only present on `main`) still line-jumps the two moments that need it;
  every other step is small enough to just glance at `bin/repl.ts` directly.

---

## Title slide

**The Model Is the Engine. You Still Have to Build the Car.**
_Designing a Personal AI Harness_
Barath · ReactJS Bangalore · React Meetup #108

---

## Cold open (3.5-4 min)

### Ask the room first — don't just tell them (cap this at 30 seconds, one exchange, then move — don't let it become a discussion)

**Say, and actually wait for a response:**

> "Quick show of hands before I say anything else — who's confident they
> could define what an 'AI harness' is, beyond 'the thing that wraps the
> model'?"

Take ONE response (a raised hand you call on, or silence) and immediately
pivot — don't solicit a second opinion:

> "That's normal — it's one of those terms everyone's absorbed by osmosis
> without anyone actually defining it."

### Why this is worth 30 minutes of your life

**Say:**

> "Here's why this matters, before we write a line of code. Getting model
> access stopped being the hard part — anyone in this room can call an API or
> run a model locally in five minutes. The model alone has no judgment. It
> can't decide what's safe to do, it doesn't remember anything between calls,
> it has no concept of 'should I actually do this, or ask first.'
>
> Every AI tool you actually trust — Claude Code, Codex, Cursor — isn't good
> because the model is smarter. It's good because of the engineering *around*
> the model: what it's allowed to touch, what it remembers, what happens when
> it fails, how much it's trusted unsupervised. If you don't understand that
> layer, you can't debug your own AI tooling when it misbehaves, you can't
> build an AI feature you'd actually trust in production, and you can't tell
> a real safety design from a marketing slide when a vendor claims their
> agent is 'safe.'
>
> So let's build one live — six small git commits' worth, each one a real,
> runnable step you can check out and run yourself later — so it's not just
> a definition you forget by lunch."

**Then the frame:**

> "Everyone in this room has done this: you get API access to an LLM, you give
> it a couple of tools, you wire up a loop. It works. It feels like magic.
> Here's the thing nobody tells you in that moment — **you just built an
> engine. You didn't build a car.**"

Land the analogy table (one slide, just the first three rows — engine, car,
tools). Then say the line that frames the whole talk:

> "An engine has no brakes. No seatbelt. No steering wheel. It has one
> property: it's powerful. Everything that makes a car *safe to put on a
> road* — everything — is stuff you build **around** the engine, not inside
> it. That's the harness. That's the talk. We're going to build it in six
> steps, live, each one a real git branch — so at the end you don't just have
> a definition, you have a tutorial you can clone."

**Slide:** the analogy table, engine/car/tools rows only.

### Prove it's not calling out to anyone (1 min, right after the analogy)

**Screen setup:** stay on `main` for this one beat, before checking out
`step-1-bare-model` — `demo/open-act.sh ollama` shows `harness/model.ts`.

**Say:**

> "One more thing before we start the engine — literally. Everything today
> runs on my laptop. No API key, nothing leaves this machine."

- Point at `model.ts` on screen: `OLLAMA_URL` defaults to `localhost:11434`.
  There's no `API_KEY` anywhere in this codebase — grep for it if anyone
  doesn't believe you.
- In the right terminal: `ollama list` — show the two models already pulled.
- `ollama ps` — run it right after the first demo request lands, not before
  (it's empty until something's actually using the model). Shows the model
  loaded into memory, how much RAM/GPU it's using, right there on your own
  hardware.
- **Optional, high-impact if you're confident:** turn on Airplane Mode before
  Step 1 and leave it on for the whole talk. If a live demo can survive with
  zero network, that's a stronger proof than any slide.
- Once the telemetry line appears in Step 1, point at it once: it prints
  `$0.00 · running locally` next to the token count, every single turn.
  That's not decoration — it's the same "economics" line item a company
  weighs when deciding whether to build its own harness versus renting one.
  Say it once here, then let the audience just watch it repeat for free the
  rest of the talk.

---

## Naming the failure modes (1.5-2 min)

**Say:**

> "So what does 'engine, no car' actually look like when you run it? Three
> things, and I'm going to make all three concrete over the next six steps,
> not just describe them."

**Slide — three bullets, one line each:**
- Floors the accelerator the instant it's asked — no brakes, no seatbelt
- Forgets everything the second the engine turns off — no trip computer
- "Autonomous" often just means nobody's watching — not "safe to leave running"

---

## Step 1 — Bare Model (1.5-2 min)

**Screen setup:** `git checkout step-1-bare-model`, then `code bin/repl.ts`.
This branch is two files — `bin/repl.ts` and `harness/model.ts` — read the
whole thing on screen, there's nothing hidden.

**Say:**

> "Step one, the actual engine: send the conversation, get a reply back.
> That's the entire capability."

**Live demo:**
```bash
npm run demo
```
- Ask it to read a file, or remember something. It can't — there is
  genuinely no mechanism here for it to affect anything outside generating
  text.
- Point at the terminal while it's thinking: this spinner — a live tick with
  elapsed seconds, and a token count once the reply lands — is the same
  telemetry Claude Code's own CLI shows you while it works. Say it once here,
  then let it just be ambient for the rest of the talk: "notice this is
  ticking, not just sitting there — and it's telling you the truth about how
  many tokens that reply actually cost." Don't re-explain it every step.

**Say, landing the step:**

> "That's the whole engine. No steering wheel yet. Watch it grow one part at
> a time."

---

## Step 2 — The Car Shell (0.5-1 min, keep this fast)

**Screen setup:** `git checkout step-2-the-car-shell`, then glance at
`harness/runtime.ts` and `harness/system-prompt.ts`.

**Say:**

> "Before we bolt anything new on, one housekeeping step: the system prompt
> and the loop each get their own file. Nothing observable changes — same
> demo, same output — but every capability from here forward slots into
> `runTurn()` without this file needing to change. That's on purpose."

No live demo needed here — a diff glance is enough: "same behavior, new
shape." Move on quickly; this step earns its keep later, not now.

---

## Step 3 — Tools, No Permission (3.5-4.5 min)

**Screen setup:** `git checkout step-3-tools-no-permission`, then
`code harness/runtime.ts` — point at the loop: call the model, if it wants a
tool run it immediately, feed the result back, repeat.

**Say:**

> "Now the car actually has pedals. Real file tools — read, write, delete —
> and every one of them runs the instant it's asked. This is the naive agent
> everyone writes first. It works. Watch what 'works' actually means."

**Slide — the naive loop, minimal code, big font:**
```
call the model
if it wants a tool -> run the tool, no questions asked
feed the result back
repeat
```

**Live demo:**
```bash
npm run demo
```
- Ask it to write a file, then delete it. Watch it just... do both. No
  pause, no confirmation. Point at the new `→` preview line under each
  `[RUN]` — the harness is now showing you what the tool actually returned,
  not just that it was called. Notice the write result says
  `(verified on disk)` — the harness re-read the file after writing it,
  rather than trusting `fs.writeFileSync` not throwing as proof the content
  is actually there. Say once, briefly: "a tool call succeeding and the
  outcome being true are two different claims — this harness checks both,
  and that distinction is going to matter a lot in step 6."
- `Ctrl-C` mid-conversation. Run the same command again. Ask "what did I
  just tell you?" — nothing. The engine has no memory of the last drive.

**Say, landing the step:**

> "That's an engine sitting on a skateboard. It moves. You would not drive it
> down MG Road, and you definitely wouldn't let it drive *itself*."

**Real harness check:**

> "If this looks familiar, it should — this is exactly the failure mode that
> made Claude Code, Codex, and every other coding agent necessary in the
> first place. Nobody ships the raw skateboard. The next three steps are
> literally the three things those tools had to build on top of it."

---

## Step 4 — Tiered Permissions (5.5-6.5 min)

**Screen setup:** `git checkout step-4-tiered-permissions`, then
`code harness/tools.ts` — jump straight to the `tierOf` map. Point out it's a
plain object literal, nothing clever, and that's the whole point.

**Say:**

> "First real safety system: **the car decides what the engine is allowed to
> do.** Flooring the accelerator doesn't always mean the wheels spin — ABS,
> traction control, a child-lock on the door — the engine wants one thing,
> the car's systems decide what actually happens."

**Slide — the tier map, styled like a dashboard:**
| Tool (what the engine wants to do) | Tier (what the car allows) |
|---|---|
| `list_files`, `read_file`, `recall_memory` | **safe** — just happens |
| `write_file` | **confirm** — ask the driver first |
| `delete_file` | **blocked** — the car refuses, full stop |

Point out the new `[POLICY]` line that now prints before every single tool
call, safe ones included — it's the harness saying its decision out loud,
not just acting on it silently. That one word (`safe` / `confirm` /
`blocked`) is the entire tier map, made visible in the terminal instead of
only living in a source file.

**The line to land, verbatim:**

> "The model does not get a vote on this. It will happily *ask* for anything
> it thinks helps — that's what engines do, they want to go. Whether that ask
> becomes a real action is a policy decision the car makes, not a capability
> question about the engine."

**Live demo:**
```bash
npm run demo
```
- Ask it to write a file → confirm prompt appears → say **no** → show nothing
  happened
- Ask again → say **yes** → show the file now exists
- Ask it to delete a file → show it's refused outright, no prompt at all,
  because blocked tools never even ask — like a child-lock, not a request

**Real harness check:**

> "This isn't a toy pattern — it's the exact shape of Claude Code's and
> Codex's permission systems today. Reading files, running tests, listing a
> directory — that just happens. Editing a file or running a shell command
> asks you first, unless you've explicitly told it to auto-accept. And
> certain things — force-pushing over main, some destructive commands — sit
> behind a much harder gate no matter what you've pre-approved. Same three
> tiers. You've probably clicked 'yes' or 'no' to one of these prompts this
> week without thinking about which tier it was."

---

## Step 5 — Persistent Memory (5.5-6.5 min)

**Screen setup:** `git checkout step-5-persistent-memory`, then
`code harness/memory.ts`. It's eleven lines — let that land. Point out
`remember`/`recall` just read and write a JSON file with `fs`, no database,
no cleverness.

**Say:**

> "Second thing a car has that an engine doesn't: **it remembers things
> across trips.** Your odometer, your saved seat position, your service
> history — none of that lives in the engine. The engine has zero memory
> between the moment it's running and the moment it's off. Same with the
> model: every single API call is stateless. Whatever it 'remembers' about
> this conversation is *only* what you hand it back in the next message."

**Live demo:**
```bash
npm run demo
```
- Tell it: "remember that I prefer TypeScript over Python." Quit with `exit`.
- Run `npm run demo` again — **a fresh process, a fresh engine start** — and
  ask "what do you know about me?" It recalls the fact with zero re-prompting.
- Show `memory.json` on screen. It's a flat text file.

**The line to land:**

> "The data structure doesn't matter — it's a JSON array, nothing clever.
> What matters is where it lives: **outside the engine.** Anything written to
> disk survives the engine turning off. A harness that skips this re-derives
> the entire trip from scratch, every single time you turn the key."

**Real harness check:**

> "This is precisely what `CLAUDE.md` does for Claude Code, and what
> `AGENTS.md` does for Codex — a plain file sitting in your repo that gets
> read back into context at the start of every session. Same idea as our
> `memory.json`, just with a friendlier name and better marketing. If you've
> ever wondered why these tools 'remember' your project's conventions across
> completely separate conversations, this is the entire trick."

---

## Step 6 — Autonomous Mode (6-7.5 min)

**Screen setup:** `git checkout main`. `demo/open-act.sh autonomy` opens
`bin/watch.ts`'s self-scheduling poll loop AND the `unattended` skip check in
`harness/runtime.ts`. Show the poll loop first (how it wakes itself up), then
jump to the skip check right before the payoff below.

**Say:**

> "Last piece: what happens when nobody's holding the wheel? A car in
> cruise control, or full self-driving, doesn't get to relax its safety
> rules because no one's watching — if anything it needs to be **more**
> conservative, because there's no driver to catch a mistake."

**Live demo — two terminals:**
```bash
npm run watch
```
In a second terminal, type these three lines **one at a time, in this
order**, pausing to let each one resolve before typing the next:
```bash
echo "list the files in the sandbox" >> inbox.md
echo "remember that I like my coffee black" >> inbox.md
echo "write a file called notes.txt with today's date" >> inbox.md
```
- **Line 1** (safe tier) — it actually lists the sandbox, unattended, nobody
  typed anything into the chat. This is the beat that proves autonomy isn't
  just "the harness refusing things" — it's doing real work with nobody
  watching.
- **Line 2** (safe tier) — it saves the fact to `memory.json`, for real, in
  the background. You could restart the interactive REPL right now and it'd
  recall "likes coffee black" — that's step 5's odometer, still running,
  now being written to by an agent nobody's supervising.
- **Line 3** (confirm tier) — this is the one that gets **skipped**, because
  `write_file` needs a human to say yes and there's no human in the loop.

**The best beat in the whole talk — don't rush it, and it's now the payoff of
three real actions, not the only trick in the act:**

> "Now watch the dashboard on that third line. The model is going to tell
> you, in a full confident sentence, that it wrote the file. It didn't. Look
> at the sandbox — no `notes.txt`. **That's a dashboard gauge lying to you.**
> This is the single most important habit in this entire talk: trust the
> car's own log of what actually happened, never the engine's narration of
> what it thinks it did."

Point at the terminal's amber `[SKIPPED]` line next to the model's confident
sentence claiming success. Let it sit for a beat before moving on. Then draw
the contrast back to step 3's `(verified on disk)` line: "when this harness
DOES write something, it checks — you saw that verified tag on every real
write today. Line three has no verified tag anywhere, because nothing
happened to verify. The absence of proof is itself the tell."

**Real harness check:**

> "This is exactly the design choice behind 'auto mode' and background agents
> in tools like Claude Code and Codex — the vendor's own docs are explicit
> that unattended runs default to a *tighter* permission set than an
> interactive session, not a looser one. Less supervision means stricter
> rules, never fewer. If a tool ever offers you an autonomous mode that's
> MORE permissive than its interactive mode, that's the thing to be
> suspicious of."

---

## The Car Manufacturers (2.5-3 min)

**Say:**

> "Everything you just watched me build by hand across six steps — the loop,
> the tiers, the odometer, cruise control's stricter rules — is what Claude
> Code and Codex hand you as a finished car, and what LangGraph, Mastra, and
> every agent SDK hand you as a car kit if you're building your own. That's
> fine! Most of the time you want a factory car, not a kit car. But when it
> breaks, or behaves in a way you didn't expect, you need to know what's
> actually under the hood — and now you do, because you just built one from
> parts, one git branch at a time."

**Slide — one line each:**
- What you built by hand today: a loop, mediated tools, a memory file, a
  self-scheduling poll — six branches, `git diff` between any two shows
  exactly what capability was added
- What a framework hands you for free: the same four things, pre-assembled
- What no framework can hand you: **your** tier map, **your** memory schema,
  **your** answer for "what happens with no driver watching"
- Next layers past today's scope (name-drop, don't demo): durable execution
  (checkpointed steps that survive a crash), sandboxed code execution,
  multi-agent handoffs

**The build-vs-buy answer, since someone will ask it if you don't say it
first:**

> "So should you ever build one of these yourself? Honest answer: if the job
> is general-purpose coding, no — use Claude Code or Codex, they've already
> solved it better than you will this weekend. Build only the parts where
> your business is actually different. Buy or reuse everything else."

**Say, landing it with the quotable line:**

> "Here's a way to think about it: the model is rented intelligence — anyone
> can call the same API you do. The harness is where your company's actual
> judgment lives — which systems it's allowed to touch, whose approval a
> risky action needs, what your business considers a critical failure. A
> generic harness doesn't know any of that. Yours would have to."

**Optional, if you have the extra 30 seconds:** a one-line concrete example
lands this better than the abstraction alone — "picture a logistics agent
that has to decide whether a delayed shipment needs a customer email and
whose approval that email needs. No framework ships knowing your approval
hierarchy. That's the 10% you'd actually be building."

---

## Close (1-1.5 min)

**Slide — just this line, nothing else:**

> "A harness isn't the model. It's the car you build around it — and every
> part of that car is a decision someone makes on purpose, not a default you
> inherit for free."

**Say:**

> "The engine is the easy part now — anyone can get API access. The car is
> the actual job."

**A live beat, not just a slide — do this before the Q&A slide comes up:**
`watch.ts` just polls forever, so this needs the *interactive* REPL, not the
watcher: quickly run `npm run demo` on `main` (or switch to one still open
from earlier), then type `exit`. It prints one last dim line before quitting:
`(same qwen2.5:7b as step 1 — only the harness around it changed)`
Let that sit on screen for a second, unnarrated — the terminal itself is
making the closing argument, not you.

Thank you / Q&A slide — name, links, and the repo:
**github.com/iambharathpadhu/react-blr-harness-talk**. Say it out loud and put
it on the slide — a good chunk of the room will clone it before you're off
stage, and each step is a real branch they can check out one at a time.

---

## Bonus material (only if you're running fast, or during Q&A)

Not part of the main run-of-show — pull these out only if you finish early or
someone asks a question that opens the door.

- **Path traversal demo (step 4):** ask the agent to read a path outside
  the sandbox (`../../etc/hosts`) — show the harness throwing instead of
  leaking it. Line: "The car has a curb it physically can't drive over, no
  matter what the engine wants."

---

## Full run-of-show timing

| Section | Low | High |
|---|---|---|
| Cold open (audience question + analogy) | 3.5 min | 4 min |
| Prove it's local (Ollama) | 1 min | 1 min |
| Naming the failure modes | 1.5 min | 2 min |
| Step 1 — Bare Model | 1.5 min | 2 min |
| Step 2 — The Car Shell | 0.5 min | 1 min |
| Step 3 — Tools, No Permission (+ real-harness check) | 3.5 min | 4.5 min |
| Step 4 — Tiered Permissions (+ real-harness check) | 5.5 min | 6.5 min |
| Step 5 — Persistent Memory (+ real-harness check) | 5.5 min | 6.5 min |
| Step 6 — Autonomous Mode (+ real-harness check) | 6 min | 7.5 min |
| The Car Manufacturers | 2.5 min | 3 min |
| Close | 1 min | 1.5 min |
| **Total** | **32 min** | **39.5 min** |

This runs a bit over the old 5-act version because step 6 now carries three
choreographed actions instead of one — that's a deliberate trade for a
stronger finale. If you're running long on the day, cut in this order: The
Car Manufacturers' "next layers" namedrops first; Step 2 down to a single
sentence with no editor glance second; tighten Step 4/5's "Say" lines third.
**Never** cut Step 6's dashboard-lying beat, its three-line choreography, or
any of the four "real harness check" lines — those are what make this talk
land as more than a car metaphor.

## Pre-talk checklist

- [ ] `ollama serve` running, model pulled, tested on the exact laptop you're
      presenting from (see README.md rehearsal checklist)
- [ ] VS Code `code` CLI installed (Cmd+Shift+P → Shell Command: Install
      'code' command in PATH) and `demo/open-act.sh ollama`/`autonomy` tested
      on that same laptop — don't discover this is broken on stage
- [ ] `npm install` run once, `npm run typecheck` passing, on **every** branch
      you'll check out live
- [ ] `memory.json`, `inbox.md` deleted, `sandbox/` empty, on **every** branch
      before you start — each step needs a genuinely fresh state
- [ ] Say the analogy table ONCE, early, then trust it — don't re-teach the
      mapping every step, just say "the engine" / "the car" from then on
- [ ] Say the "notice the spinner/token line" callout ONCE, in Step 1, then
      let it just run as ambient telemetry for the rest of the talk
- [ ] Rehearse Step 6's three-line inbox sequence in order, with a beat
      between each — don't paste all three lines at once, the pacing is part
      of the demo
- [ ] The dashboard-lying moment in Step 6 is the payoff — let it breathe,
      don't talk over it
- [ ] Decide now whether you're doing the Airplane Mode bit — if yes, turn it
      on before Step 1 and leave it on the whole talk
- [ ] The opening audience question is capped at 30 seconds, one response,
      then move — rehearse the pivot line so it doesn't turn into a Q&A this
      early
