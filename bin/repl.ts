#!/usr/bin/env node
// STEP 1: the bare engine. Type something, get a reply back. That's it.
//
// Try asking it to read a file, remember something, or do anything to your
// actual machine. It can't — there's no mechanism here for the model to
// affect anything outside of generating text. This is the "engine with no
// car" starting point every later step builds on.

import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { chat, type ChatMessage } from "../harness/model.js";
import { ui } from "../harness/ui.js";

async function main() {
  const messages: ChatMessage[] = [
    { role: "system", content: "You are a small assistant with no tools and no memory." },
  ];

  console.log(ui.banner("harness-demo · step 1 · bare model"));
  console.log(ui.dim("type 'exit' to quit") + "\n");

  const rl = readline.createInterface({ input: stdin, output: stdout });
  while (true) {
    let input: string;
    try {
      input = await rl.question(`${ui.you("you>")} `);
    } catch {
      break;
    }
    if (input.trim() === "exit") break;
    messages.push({ role: "user", content: input });
    const reply = await chat(messages);
    messages.push(reply);
    console.log(`${ui.agent("agent>")} ${reply.content}\n`);
  }
  rl.close();
  process.exit(0);
}

main();
