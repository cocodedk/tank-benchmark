"""The three calls a run makes, as graph-loop's lean loop makes them: a claude session, the suite, a codex review.

Each returns what it measured. The claude argv mirrors graph-loop's `providers.claude` (dontAsk, the builder's
tools, the push deny, Agent denied unless workers are given, a budget cap); the review mirrors `lean_judge`.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import time

SHELL = ("Bash(git *),Bash(sed -n *),Bash(cat *),Bash(head *),Bash(tail *),Bash(ls *),Bash(grep *),Bash(wc *),"
         "Bash(bash test/gate.sh)")
PUSH_DENY = "Bash(git push *)"
SHAPE = ('Answer with exactly one JSON object on one line and no other text: '
         '{"review":"ACCEPT|REJECT","accept":true,"findings":["what is wrong, in one sentence"]}. '
         'Exactly those three keys. `findings` lists every finding, at most ten plain strings, never objects. '
         'ACCEPT requires accept=true and may list findings that block nothing; REJECT requires '
         'accept=false and at least one finding.')


def _env() -> dict:
    """This session's own variables stay here: a builder gets the account, not the session that started it."""
    return {k: v for k, v in os.environ.items()
            if not (k.startswith("CLAUDE_CODE_") or k in ("CLAUDECODE", "CLAUDE_PID", "CLAUDE_EFFORT"))}


def claude(prompt: str, cwd: str, model: str, effort: str, budget: float, resume: str = "",
           agents: dict | None = None, timeout: int = 2700) -> dict:
    """One session; its JSON answer (cost, usage per model, session id) plus `wall_s`."""
    argv = ["claude", "--permission-mode", "dontAsk", "--strict-mcp-config", "-p", "--output-format", "json",
            "--model", model, "--effort", effort, "--max-budget-usd", f"{budget:.2f}",
            "--disallowedTools", ",".join(name for name in ("" if agents else "Agent", PUSH_DENY) if name),
            "--allowedTools", f"Read,Grep,Glob,Edit,Write,{SHELL}" + (",Agent" if agents else "")]
    if resume:
        argv += ["--resume", resume]
    if agents:
        argv += ["--agents", json.dumps(agents)]
    start = time.time()
    try:
        done = subprocess.run(argv, input=prompt, capture_output=True, text=True, cwd=cwd, timeout=timeout, env=_env())
        body = json.loads(done.stdout)
    except subprocess.TimeoutExpired:
        body = {"is_error": True, "subtype": "timeout", "result": f"no answer within {timeout}s"}
    except ValueError:
        body = {"is_error": True, "subtype": "unreadable", "result": (done.stdout + done.stderr)[-2000:]}
    body["wall_s"] = round(time.time() - start)
    return body


def gate(cwd: str, timeout: int = 600) -> dict:
    start = time.time()
    try:
        done = subprocess.run(["bash", "test/gate.sh"], cwd=cwd, capture_output=True, text=True, timeout=timeout)
        passed, tail = done.returncode == 0, (done.stdout + done.stderr)[-4000:]
    except subprocess.TimeoutExpired:
        passed, tail = False, f"The suite did not finish within {timeout}s."
    return {"passed": passed, "tail": tail, "wall_s": round(time.time() - start)}


def review(spec: str, diff: str, cwd: str, model: str, effort: str, timeout: int = 1800) -> dict:
    """The lean reviewer's question, read-only in the checkout; its verdict, findings and `wall_s`."""
    prompt = (f"You review one change to this repository, read-only. It should implement the "
              f"spec below, with tests. Refuse only for: something the spec's 'Done when' or "
              f"acceptance tests name that does not hold, any defect you can name (wrong for some "
              f"real input or use), a security hole, behaviour added without tests, or a file the spec "
              f"does not call for that nothing uses (name it). Accept, listing findings, only for "
              f"style, a stated limit or a suggestion, and among those name any existing function the "
              f"change should reuse instead of its own, and why; such a finding never refuses.\n\n"
              f"## Spec\n\n{spec}\n\n## The diff against main\n\n{diff}\n\n{SHAPE}")
    argv = ["codex", "exec", "--model", model, "-c", f'model_reasoning_effort="{effort}"', "--sandbox", "read-only", "--skip-git-repo-check",
            "--cd", cwd, "-"]
    start = time.time()
    try:
        done = subprocess.run(argv, input=prompt, capture_output=True, text=True, timeout=timeout)
        said = done.stdout
    except subprocess.TimeoutExpired:
        said = ""
    found = re.findall(r'\{"review".*\}', said)
    try:
        verdict = json.loads(found[-1])
    except (IndexError, ValueError):
        verdict = {"review": "UNREADABLE", "findings": [said[-1500:] or "no answer"]}
    return {"verdict": verdict.get("review"), "findings": verdict.get("findings") or [],
            "wall_s": round(time.time() - start)}


def charged(calls: list[dict]) -> list[dict]:
    """What each call itself cost, overall and per model. A resumed session reports its running total (graph-loop's
    `lean_budget` counts each session once, at its largest, for the same reason), so a resumed call is charged
    only what it added to the call it resumed."""
    out, last = [], {"cost": 0, "by_model": {}}
    for call in calls:
        before = last if call.get("resumed") else {"cost": 0, "by_model": {}}
        out.append({"cost": round(call["cost"] - before["cost"], 4),
                    "by_model": {m: round(v - before["by_model"].get(m, 0), 4) for m, v in call["by_model"].items()}})
        last = call
    return out
