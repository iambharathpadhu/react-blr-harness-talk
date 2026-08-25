#!/usr/bin/env bash
# Jump VS Code to a specific file+line on the FINISHED harness (this
# branch, main / step 6). Steps 1-5 each live on their own branch with only
# a handful of files — just open bin/repl.ts there, no line-jump needed.
#
# Requires the `code` CLI: in VS Code, Cmd+Shift+P -> "Shell Command: Install
# 'code' command in PATH" (one-time setup, do this before the talk).
#
# Usage: demo/open-act.sh {ollama|autonomy}

set -euo pipefail
cd "$(dirname "$0")/.."

case "${1:-}" in
  ollama)
    # Prove it's local: no API key, just a localhost URL
    code -g harness/model.ts:1
    ;;
  autonomy)
    # The self-scheduling poll loop, plus the unattended skip in runtime.ts
    code -g bin/watch.ts:37
    code -g harness/runtime.ts:48
    ;;
  *)
    echo "Usage: $0 {ollama|autonomy}"
    exit 1
    ;;
esac
