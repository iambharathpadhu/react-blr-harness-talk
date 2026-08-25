// STEP 4: same tools as step 3. What's new is tierOf below — the harness,
// not the model, deciding what each tool is allowed to do. The model still
// has no vote on this: it can ask for anything, but whether that ask
// becomes a real action is a policy lookup, not a capability question.
//
// resolveInSandbox is unchanged from step 3 — containment (can this path
// ever be touched) and permission (should THIS call be allowed right now)
// are different concerns, and tiers only add the second one.

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

export type Tier = "safe" | "confirm" | "blocked";

export const tierOf: Record<string, Tier> = {
  list_files: "safe",
  read_file: "safe",
  write_file: "confirm",
  delete_file: "blocked",
};

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
