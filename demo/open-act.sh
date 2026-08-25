#!/usr/bin/env bash
# Jump VS Code to the exact file+line for a given act, so on stage you run
# one command instead of hunting through the file tree while talking.
#
# Requires the `code` CLI: in VS Code, Cmd+Shift+P -> "Shell Command: Install
# 'code' command in PATH" (one-time setup, do this before the talk).
#
# Usage: demo/open-act.sh 1   (or 2, 3, 4, ollama)

set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  1)
    # Act 1 — Engine, No Car: the tier check that --brittle bypasses
    code -g harness/runtime.ts:42
    ;;
  2)
    # Act 2 — Safety Systems: the tier map itself
    code -g harness/tools.ts:32
    ;;
  3)
    # Act 3 — The Odometer: persistent memory, outside the process
    code -g harness/memory.ts:1
    ;;
  4)
    # Act 4 — Cruise Control: the self-scheduling poll loop, plus the
    # unattended skip in runtime.ts
    code -g bin/watch.ts:37
    code -g harness/runtime.ts:50
    ;;
  ollama)
    # Cold open proof: the model config has no API key, only a local URL
    code -g harness/model.ts:1
    ;;
  *)
    echo "Usage: $0 {1|2|3|4|ollama}"
    exit 1
    ;;
esac
