#!/usr/bin/env bash
# Typecheck every step branch in the order the talk presents them, then come
# back to where you started. Run this on the presenting laptop the day before.
set -euo pipefail
cd "$(dirname "$0")/.."
start="$(git branch --show-current)"
[ -z "$(git status --porcelain --untracked-files=no)" ] || { echo "commit or stash first — working tree is dirty" >&2; exit 1; }
fail=0
for b in step-1-bare-model step-2-the-car-shell step-3-tools-no-permission step-4-tiered-permissions step-5-persistent-memory main; do
  git checkout -q "$b"
  if node_modules/.bin/tsc --noEmit; then printf '  ✔ %-28s typecheck ok\n' "$b"; else printf '  ✘ %-28s typecheck FAILED\n' "$b"; fail=1; fi
  [ -x bin/bratcode ] || { printf '  ✘ %-28s bin/bratcode missing\n' "$b"; fail=1; }
done
git checkout -q "$start"
[ $fail -eq 0 ] && echo "all branches clean" || exit 1
