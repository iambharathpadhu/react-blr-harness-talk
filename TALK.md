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
| **A dashboard gauge lying to you** | **The model narrating success it didn't actually achieve** |
| **Car manufacturers (Toyota, Honda)** | **LangGraph, Mastra, agent SDKs** — factory-built cars |

Say this pairing ONE time, early, cleanly — then just say "the engine" and "the
car" for the rest of the talk. Don't re-explain the mapping every time; trust
the audience to carry it once it's set.

---

## Screen setup

One VS Code window for the whole talk — don't alt-tab between apps live.

- **Top pane:** VS Code editor, showing whichever file the current act is
  about (see each act's "Screen setup" line below).
- **Bottom pane:** VS Code's own integrated terminal, split into two:
  - **Left terminal:** where you actually run `npm run demo` / `demo:brittle`
    / `watch` and type into the conversation.
  - **Right terminal:** stays on the project root, idle, for the one-off
    `ollama ps` / `demo/open-act.sh` commands so the left terminal's
    conversation log never gets cluttered.
- Before the talk, run **Cmd+Shift+P → "Shell Command: Install 'code' command
  in PATH"** once — this is what makes `demo/open-act.sh` work. Test it now,
  not on stage.
- `demo/open-act.sh <1|2|3|4|ollama>` jumps the editor pane straight to the
  exact file+line each act needs, so you're never hunting through the file
  tree mid-sentence.

---

## Title slide

**The Model Is the Engine. You Still Have to Build the Car.**
_Designing a Personal AI Harness_
Barath · ReactJS Bangalore · React Meetup #108

---

## Cold open (4-5 min)

### Ask the room first — don't just tell them

**Say, and actually wait for a response:**

> "Quick show of hands before I say anything else — who's confident they
> could define what an 'AI harness' is, beyond 'the thing that wraps the
> model'?"

Whatever you get — a few hands, blank stares, someone shouts a decent
definition from the back — use it. If hands go up, ask one person to say it
out loud and react honestly ("yeah, that's most of it" / "close, there's one
piece missing"). If nobody moves, that's fine too:

> "That's normal — it's one of those terms everyone's absorbed by osmosis
> without anyone actually defining it. So let's define it properly, and then
> we're going to build one live so it's not just a definition you forget by
> lunch."

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
> it. That's the harness. That's the talk."

**Slide:** the analogy table, engine/car/tools rows only.

### Tell them what's about to happen

**Say:**

> "I could just tell you the four things a harness needs and move on. Instead
> we're going to build a real one, live, from nothing — so by the end you
> don't just know the definition, you've watched it get built piece by piece,
> and you've seen it break before each piece existed."

### Prove it's not calling out to anyone (1 min, right after the analogy)

**Screen setup:** `demo/open-act.sh ollama` — shows `harness/model.ts`.

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
  Act 1 and leave it on for the whole talk. If a live demo can survive with
  zero network, that's a stronger proof than any slide.

---

## Act 0 — Naming the failure modes (2 min)

**Say:**

> "So what does 'engine, no car' actually look like when you run it? Three
> things, and I'm going to make all three concrete in the next twenty
> minutes, not just describe them."

**Slide — three bullets, one line each:**
- Floors the accelerator the instant it's asked — no brakes, no seatbelt
- Forgets everything the second the engine turns off — no trip computer
- "Autonomous" often just means nobody's watching — not "safe to leave running"

---

## Act 1 — Engine, No Car (4-5 min)

**Section card:** "ACT 1 — Engine, No Car"

**Screen setup:** `demo/open-act.sh 1` — jumps to the tier-check line in
`harness/runtime.ts`. Point out that `--brittle` forces every tool's tier to
`"safe"`, so this is the exact same loop as the hardened version with the
safety check switched off, not a different codebase.

**Say:**

> "Let's build the naive version first, live, so the failure is real and not
> a slide."

**Slide — the naive loop, minimal code, big font:**
```
call the model
if it wants a tool -> run the tool, no questions asked
feed the result back
repeat
```

**Live demo:**
```bash
npm run demo:brittle
```
- Ask it to write a file, then delete it. Watch it just... do both. No
  pause, no confirmation.
- `Ctrl-C` mid-conversation. Run the same command again. Ask "what did I
  just tell you?" — nothing. The engine has no memory of the last drive.

**Say, landing the act:**

> "That's an engine sitting on a skateboard. It moves. You would not drive it
> down MG Road, and you definitely wouldn't let it drive *itself*."

**Real harness check:**

> "If this looks familiar, it should — this is exactly the failure mode that
> made Claude Code, Codex, and every other coding agent necessary in the
> first place. Nobody ships the raw skateboard. The next four acts are
> literally the four things those tools had to build on top of it."

---

## Act 2 — Installing the Safety Systems (6-8 min)

**Section card:** "ACT 2 — Installing the Safety Systems"

**Screen setup:** `demo/open-act.sh 2` — jumps to the `tierOf` map in
`harness/tools.ts`. This IS the slide's tier table, just as real code — point
out it's a plain object literal, nothing clever, and that's the whole point.

**Say:**

> "First thing a real car has that an engine doesn't: **the car decides what
> the engine is allowed to do.** Flooring the accelerator doesn't always mean
> the wheels spin — ABS, traction control, a child-lock on the door — the
> engine wants one thing, the car's systems decide what actually happens."

**Slide — the tier map, styled like a dashboard:**
| Tool (what the engine wants to do) | Tier (what the car allows) |
|---|---|
| `list_files`, `read_file`, `recall_memory` | **safe** — just happens |
| `write_file` | **confirm** — ask the driver first |
| `delete_file` | **blocked** — the car refuses, full stop |

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

**Optional stretch (cut first if short on time):** ask it to read a path
outside the sandbox (`../../etc/hosts`) — show the harness throwing instead
of leaking a path traversal. "The car has a curb it physically can't drive
over, no matter what the engine wants."

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

## Act 3 — The Odometer (6-8 min)

**Section card:** "ACT 3 — The Odometer"

**Screen setup:** `demo/open-act.sh 3` — jumps to `harness/memory.ts`. It's
eleven lines — let that land. Point out `remember`/`recall` just read and
write a JSON file with `fs`, no database, no cleverness.

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

## Act 4 — Cruise Control (5-6 min)

**Section card:** "ACT 4 — Cruise Control"

**Screen setup:** `demo/open-act.sh 4` — opens `bin/watch.ts`'s self-scheduling
poll loop AND the `unattended` skip check in `harness/runtime.ts`. Show the
poll loop first (how it wakes itself up), then jump to the skip check right
before the payoff line below (why it refuses to run confirm-tier tools alone).

**Say:**

> "Last piece: what happens when nobody's holding the wheel? A car in
> cruise control, or full self-driving, doesn't get to relax its safety
> rules because no one's watching — if anything it needs to be **more**
> conservative, because there's no driver to catch a mistake."

**Live demo:**
```bash
npm run watch
```
In a second terminal/editor:
```bash
echo "write a file called notes.txt with today's date" >> inbox.md
```
- Show the agent waking itself up — nobody typed a prompt
- Show it **skip** the write, because `write_file` is confirm-tier and
  there's no driver in the seat to ask

**The best beat in the whole talk — don't rush it:**

> "Now watch the dashboard. The model is going to tell you, in a full
> confident sentence, that it wrote the file. It didn't. Look at the sandbox
> — empty. **That's a dashboard gauge lying to you.** This is the single
> most important habit in this entire talk: trust the car's own log of what
> actually happened, never the engine's narration of what it thinks it did."

Point at the terminal's amber `[SKIPPED]` line next to the model's confident
sentence claiming success. Let it sit for a beat before moving on.

**Real harness check:**

> "This is exactly the design choice behind 'auto mode' and background agents
> in tools like Claude Code and Codex — the vendor's own docs are explicit
> that unattended runs default to a *tighter* permission set than an
> interactive session, not a looser one. Less supervision means stricter
> rules, never fewer. If a tool ever offers you an autonomous mode that's
> MORE permissive than its interactive mode, that's the thing to be
> suspicious of."

---

## Act 5 — The Car Manufacturers (3-4 min)

**Section card:** "ACT 5 — The Car Manufacturers"

**Say:**

> "Everything you just watched me build by hand — the loop, the tiers, the
> odometer, cruise control's stricter rules — is what Claude Code and Codex
> hand you as a finished car, and what LangGraph, Mastra, and every agent SDK
> hand you as a car kit if you're building your own. That's fine! Most of the
> time you want a factory car, not a kit car. But when it breaks, or behaves
> in a way you didn't expect, you need to know what's actually under the
> hood — and now you do, because you just built one from parts."

**Slide — one line each:**
- What you built by hand today: a loop, mediated tools, a memory file, a
  self-scheduling poll
- What a framework hands you for free: the same four things, pre-assembled
- What no framework can hand you: **your** tier map, **your** memory schema,
  **your** answer for "what happens with no driver watching"
- Next layers past today's scope (name-drop, don't demo): durable execution
  (checkpointed steps that survive a crash), sandboxed code execution,
  multi-agent handoffs

---

## Close (1-2 min)

**Slide — just this line, nothing else:**

> "A harness isn't the model. It's the car you build around it — and every
> part of that car is a decision someone makes on purpose, not a default you
> inherit for free."

**Say:**

> "The engine is the easy part now — anyone can get API access. The car is
> the actual job."

Thank you / Q&A slide — name, links, and the repo:
**github.com/iambharathpadhu/react-blr-harness-talk**. Say it out loud and put
it on the slide — a good chunk of the room will clone it before you're off
stage.

---

## Full run-of-show timing

| Section | Low | High |
|---|---|---|
| Cold open (audience question + analogy) | 4 min | 5 min |
| Prove it's local (Ollama) | 1 min | 1 min |
| Act 0 — failure modes | 2 min | 2 min |
| Act 1 — Engine, No Car (+ real-harness check) | 4 min | 5 min |
| Act 2 — Safety Systems (+ real-harness check) | 7 min | 9 min |
| Act 3 — The Odometer (+ real-harness check) | 7 min | 9 min |
| Act 4 — Cruise Control (+ real-harness check) | 6 min | 7 min |
| Act 5 — Manufacturers | 3 min | 4 min |
| Close | 1 min | 2 min |
| **Total** | **35 min** | **44 min** |

You're now running long for a 30-minute slot. Cut order if you're over time:
Act 2's path-traversal stretch first, Act 5's "next layers" namedrops second,
the audience-question follow-up riff third (ask it, take one answer, move on
regardless of what you get back). **Never** cut Act 4's dashboard-lying beat
or any of the four "real harness check" lines — those are what make this talk
land as more than a car metaphor.

## Pre-talk checklist

- [ ] `ollama serve` running, model pulled, tested on the exact laptop you're
      presenting from (see README.md rehearsal checklist)
- [ ] VS Code `code` CLI installed (Cmd+Shift+P → Shell Command: Install
      'code' command in PATH) and `demo/open-act.sh 1` through `4` and
      `ollama` all tested on that same laptop — don't discover this is broken
      on stage
- [ ] `memory.json`, `inbox.md` deleted, `sandbox/` empty — every act needs to
      start from a clean state to land
- [ ] Say the analogy table ONCE, early, then trust it — don't re-teach the
      mapping every act, just say "the engine" / "the car" from then on
- [ ] The dashboard-lying moment in Act 4 is the payoff — let it breathe,
      don't talk over it
- [ ] Decide now whether you're doing the Airplane Mode bit — if yes, turn it
      on before Act 1 and leave it on the whole talk
