#!/usr/bin/env bash
# The suite: every test/test_*.py, in Chrome with WebMCP on (test/page.py), and exactly 31 tests.
set -uo pipefail
cd "$(dirname "$0")/.."
out=$(uvx --quiet --with playwright python -m unittest discover -s test -p 'test_*.py' 2>&1)
code=$?
echo "$out"
[ "$code" -eq 0 ] || exit "$code"
grep -q '^Ran 31 tests' <<<"$out" || { echo "expected 31 tests"; exit 1; }
