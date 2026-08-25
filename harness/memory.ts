// The harness's persistent memory. Deliberately dumb — a flat JSON array on
// disk — because the point of this demo is that ANY persistence outlives the
// process, not that the data structure is clever.

import fs from "node:fs";

const MEMORY_FILE = "memory.json";

function load(): string[] {
  if (!fs.existsSync(MEMORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(MEMORY_FILE, "utf-8")) as string[];
}

export function remember(fact: string): void {
  const facts = load();
  facts.push(fact);
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(facts, null, 2), "utf-8");
}

export function recall(): string[] {
  return load();
}
