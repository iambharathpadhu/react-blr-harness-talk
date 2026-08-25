// STEP 3: real tools the model can call. Every one of them runs the
// instant it's requested — there is no gate here yet, no confirmation, no
// concept of "should this be allowed." That's the whole point of this step:
// this is what "tools" looks like before you've decided a policy for them.
//
// The one safety measure that DOES exist already is resolveInSandbox below
// — a hard physical wall (you cannot touch a path outside this folder, full
// stop) as opposed to a policy decision (should THIS action be allowed).
// Containment and permission are two different concerns; step 4 adds the
// second one without touching the first.

import fs from "node:fs";
import path from "node:path";

const SANDBOX = path.resolve(process.cwd(), "sandbox");
fs.mkdirSync(SANDBOX, { recursive: true });

function resolveInSandbox(relativePath: string): string {
  const full = path.resolve(SANDBOX, relativePath);
  if (full !== SANDBOX && !full.startsWith(SANDBOX + path.sep)) {
    throw new Error(`Refused: "${relativePath}" resolves outside the sandbox.`);
  }
  return full;
}

export const toolSchemas = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List files currently in the sandbox directory.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read a text file from the sandbox directory.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Write text to a file in the sandbox directory (creates or overwrites).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Delete a file in the sandbox directory.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
];

export async function runTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "list_files":
      return fs.readdirSync(SANDBOX).join("\n") || "(sandbox is empty)";
    case "read_file":
      return fs.readFileSync(resolveInSandbox(String(args.path)), "utf-8");
    case "write_file": {
      const content = String(args.content ?? "");
      fs.writeFileSync(resolveInSandbox(String(args.path)), content, "utf-8");
      return `Wrote ${content.length} chars to ${args.path}`;
    }
    case "delete_file":
      fs.unlinkSync(resolveInSandbox(String(args.path)));
      return `Deleted ${args.path}`;
    default:
      return `Unknown tool: ${name}`;
  }
}
