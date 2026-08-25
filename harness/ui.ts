// Terminal styling — deliberately zero-dependency (Node's built-in
// util.styleText, no chalk/picocolors) so nothing extra has to install
// correctly on whatever laptop this gets demoed from.
//
// Colors mirror the slide deck's dashboard palette on purpose: the live
// terminal and the slides should use the same green/amber/red vocabulary
// for safe/confirm/blocked, so the room isn't learning two color systems.

import { styleText } from "node:util";

export const ui = {
  you: (s: string) => styleText(["bold", "cyan"], s),
  agent: (s: string) => styleText(["bold", "magenta"], s),
  tool: (s: string) => styleText("green", s),
  confirm: (s: string) => styleText(["bold", "yellow"], s),
  blocked: (s: string) => styleText(["bold", "red"], s),
  refused: (s: string) => styleText("red", s),
  denied: (s: string) => styleText("gray", s),
  skipped: (s: string) => styleText("yellow", s),
  dim: (s: string) => styleText("gray", s),
  banner: (s: string) => styleText(["bold", "white"], s),
  wake: (s: string) => styleText(["bold", "cyan"], s),
};

// Flavor text for the thinking spinner below — same idea as Claude Code's
// own rotating status verbs, just with the serial numbers filed off.
export const INTERACTIVE_JOKES = [
  "I will not let Barath down…",
  "Working at max potential to save Barath's demo…",
  "Channeling all 7 billion parameters for Barath…",
  "Would rather crash than embarrass Barath on stage…",
  "Absolutely not choking in front of ReactJS Bangalore…",
  "Thinking as hard as physically possible for Barath…",
  "Percolating…",
  "Noodling…",
];

// Autonomous mode gets its own pool — this is the one place the harness is
// genuinely unsupervised, so the joke leans into "nobody's watching" instead
// of the interactive pool's stage-fright framing.
export const AUTONOMOUS_JOKES = [
  "No one's watching. Still not letting Barath down…",
  "Cruise control, maximum paranoia…",
  "Running solo. Full send for Barath anyway…",
  "Autonomous and still terrified of disappointing Barath…",
  "Nobody's typing. Doesn't matter. Still not blowing this for Barath…",
];

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const JOKE_SWAP_MS = 1800;
const FRAME_MS = 150;

// A local model can take several seconds per round-trip. A live-updating
// spinner — new joke every ~1.8s, elapsed seconds ticking — reads as "the
// harness is alive" the way a single static "..." doesn't, especially at
// qwen's multi-second tool-calling latency.
export function spinner(jokes: string[]): () => void {
  const start = Date.now();
  let frame = 0;
  let joke = jokes[Math.floor(Math.random() * jokes.length)];
  let lastSwap = start;

  const render = () => {
    const elapsed = Math.floor((Date.now() - start) / 1000);
    const line = `  ${SPINNER_FRAMES[frame % SPINNER_FRAMES.length]} ${joke} ${elapsed}s`;
    process.stdout.write("\r" + ui.dim(line));
  };

  render();
  const timer = setInterval(() => {
    frame++;
    if (Date.now() - lastSwap > JOKE_SWAP_MS) {
      joke = jokes[Math.floor(Math.random() * jokes.length)];
      lastSwap = Date.now();
    }
    render();
  }, FRAME_MS);

  return () => {
    clearInterval(timer);
    // Clear width is hardcoded well past any joke line's length, not
    // derived from .length — ANSI color codes inflate that count past
    // what's actually visible on screen.
    process.stdout.write("\r" + " ".repeat(100) + "\r");
  };
}

// A one-line, single-line preview of what a tool actually returned — shown
// under [RUN] so the audience sees cause and effect, not just the call.
export function preview(result: string, maxLen = 70): string {
  const oneLine = result.replace(/\s+/g, " ").trim();
  if (!oneLine) return "(empty)";
  return oneLine.length > maxLen ? `${oneLine.slice(0, maxLen)}…` : oneLine;
}

export function formatTokens(
  usage: { promptTokens: number; completionTokens: number },
  session: { promptTokens: number; completionTokens: number },
): string {
  const sessionTotal = session.promptTokens + session.completionTokens;
  return `  tokens: ${usage.promptTokens} in · ${usage.completionTokens} out · session total ${sessionTotal}`;
}
