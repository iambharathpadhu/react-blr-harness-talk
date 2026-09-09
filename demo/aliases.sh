#!/usr/bin/env bash
# Source this ONCE, right at the start, while still on `main`:
#   source demo/aliases.sh
#
# These are shell aliases, not files — they stay active for the rest of
# this terminal session even after `git checkout` moves you off main, so
# you only need to do this once before the talk, not per-branch.

alias step1="git checkout step-1-bare-model"
alias step2="git checkout step-2-the-car-shell"
alias step3="git checkout step-3-tools-no-permission"
alias step4="git checkout step-4-tiered-permissions"
alias step5="git checkout step-5-persistent-memory"
alias step-back="git checkout main"
alias reset-demo='rm -f memory.json inbox.md audit.jsonl; rm -f sandbox/*.txt 2>/dev/null; true'

echo "Loaded: step1 step2 step3 step4 step5 step-back reset-demo"
