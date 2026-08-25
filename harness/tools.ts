// The tools the model can call, and — the actual point of this file — the
// TIER each one runs under. The model only ever picks a tool by name; the
// harness decides whether that name is allowed to just happen.
//
//   safe    -> runs immediately
//   confirm -> a human must approve first (see harness/permissions.ts)
//   blocked -> never runs, no matter how the model asks
//
// This three-way split is the entire "safety" story of this demo harness.
// Nothing here is model-enforced — an LLM will happily ask for anything it
// thinks helps. The tier map is where the harness, not the model, decides.

import fs from "node:fs";
import path from "node:path";
import { recall, remember } from "./memory.js";

const SANDBOX = path.resolve(process.cwd(), "sandbox");
fs.mkdirSync(SANDBOX, { recursive: true });

// Every file tool goes through this. A model that tries "../../etc/passwd"
// gets a thrown error, not a read.
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
  recall_memory: "safe",
  remember_fact: "safe",
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
  {
    type: "function",
    function: {
      name: "remember_fact",
      description:
        "Save a durable fact about the user that should still be true in a future session.",
      parameters: {
        type: "object",
        properties: { fact: { type: "string" } },
        required: ["fact"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recall_memory",
      description: "Retrieve facts saved about the user in previous sessions.",
      parameters: { type: "object", properties: {} },
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
    case "remember_fact":
      remember(String(args.fact));
      return "Saved to memory.";
    case "recall_memory":
      return recall().join("\n") || "(no memories yet)";
    default:
      return `Unknown tool: ${name}`;
  }
}
