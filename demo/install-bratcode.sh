#!/usr/bin/env bash
# One-time setup: put `bratcode` on your PATH as a symlink to bin/bratcode in
# this checkout. Re-running is safe. Uses the first writable dir on PATH out
# of /opt/homebrew/bin, /usr/local/bin, ~/.local/bin — no sudo needed on a
# Homebrew Mac.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
for dir in /opt/homebrew/bin /usr/local/bin "$HOME/.local/bin"; do
  if [ -d "$dir" ] && [ -w "$dir" ] && [[ ":$PATH:" == *":$dir:"* ]]; then
    ln -sfn "$ROOT/bin/bratcode" "$dir/bratcode"
    echo "linked $dir/bratcode -> $ROOT/bin/bratcode"
    echo "try: bratcode doctor"
    exit 0
  fi
done
echo "no writable bin dir on PATH; run manually:  sudo ln -sfn $ROOT/bin/bratcode /usr/local/bin/bratcode" >&2
exit 1
