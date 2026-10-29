#!/usr/bin/env bash
# One pi session, timed: go.sh <workdir> <name> <openrouter model> [image]
# An image is attached to the prompt; @MODEL@ in prompt.txt becomes the model id.
# <workdir> holds prompt.txt, agent/ (a clean pi config with the OpenRouter login, no AGENTS.md) and <name>/ (the checkout).
# Writes <name>.start, <name>.events (every JSON event, stamped with the time it arrived) and <name>.done beside them.
set -u
work=$(cd "$1" && pwd); name=$2; model=$3; image=${4:-}
prompt=$(cat "$work/prompt.txt"); prompt=${prompt//@MODEL@/$model}
attach=(); [ -n "$image" ] && attach=("@$image")
cd "$work/$name"
export PI_CODING_AGENT_DIR=$work/agent
date +%s.%N > "$work/$name.start"
timeout 2700 pi -p --no-session --mode json --model "openrouter/$model" --thinking max "${attach[@]}" "$prompt" < /dev/null \
  2> "$work/$name.err" | python3 -u "$(dirname "$0")/ts.py" > "$work/$name.events"
echo "exit ${PIPESTATUS[0]}" > "$work/$name.done"
date +%s.%N >> "$work/$name.done"
