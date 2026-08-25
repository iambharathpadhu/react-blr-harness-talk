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
