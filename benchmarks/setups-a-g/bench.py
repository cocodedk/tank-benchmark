"""Benchmark graph-loop's build lifecycle (graph-loop issue #463): each combination builds its own Tank Duel.

    python3 bench.py all [N] [X..]  every combination (or those named), N repeats each (default 2), all at once
    python3 bench.py run B-1        one run: combination B, repeat 1
    python3 bench.py status         where every run is, and how it ended
    python3 bench.py brief          the same as JSON, for the Claude Code mod
    python3 bench.py watch          the same, live, with each build's files and last action (Ctrl-C leaves)
    python3 bench.py grade B-1      the hidden checks again, on a finished run

A run builds in its own checkout outside this project, so it never sees `hidden/` or another run, and goes
through the lean loop's stages: build, suite, review, up to two repairs. Its game, its numbers (`run.json`)
and its logs are saved under `runs/<run>/`.
"""
from __future__ import annotations

import datetime
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time

import calls
import progress

HERE = pathlib.Path(__file__).resolve().parent
WORK = pathlib.Path(os.environ.get("BENCH_WORK", "~/lean-tmp/tank-bench/work")).expanduser()
SONNET, OPUS = "claude-sonnet-5-5", "claude-opus-5-5"
WORKERS = {   # graph-loop's models.WORKERS on the held branch; Haiku never below xhigh (the owner)
    "sonnet-worker": {"description": "A capable worker for a larger, well-defined step of the build",
                      "prompt": "Do the step you are given in this checkout and report what you changed.",
                      "model": SONNET, "effort": "xhigh"},
    "haiku-worker": {"description": "A fast worker for a small, well-defined step of the build",
                     "prompt": "Do the step you are given in this checkout and report what you changed.",
                     "model": "claude-haiku-5-5", "effort": "xhigh"},
}
REVIEW = ("gpt-6.1-sol", "medium")   # graph-loop's LEAN review, held fixed
BUDGET = 10.0                        # dollars a run may spend on Claude: the held branch's card budget
REPAIRS = 2
LATE = 75 * 60                       # no repair starts after this many seconds
COMBOS = {
    "A": {"builder": (SONNET, "high"), "workers": (), "repair": (SONNET, "medium"), "fresh": False,
          "says": "Sonnet builds alone; Sonnet repairs in the same session (graph-loop today)"},
    "B": {"builder": (OPUS, "high"), "workers": ("sonnet-worker", "haiku-worker"), "repair": (SONNET, "medium"),
          "fresh": False, "says": "Opus supervises Sonnet and Haiku workers; Sonnet repairs in the same session"},
    "C": {"builder": (OPUS, "high"), "workers": ("sonnet-worker", "haiku-worker"), "repair": (OPUS, "medium"),
          "fresh": False, "says": "Opus supervises Sonnet and Haiku workers; Opus repairs in the same session"},
    "D": {"builder": (SONNET, "high"), "workers": ("haiku-worker",), "repair": (SONNET, "medium"), "fresh": False,
          "says": "Sonnet builds with a Haiku worker; Sonnet repairs in the same session"},
    "E": {"builder": (OPUS, "high"), "workers": (), "repair": (OPUS, "medium"), "fresh": False,
          "says": "Opus builds alone; Opus repairs in the same session"},
    "F": {"builder": (OPUS, "high"), "workers": ("sonnet-worker", "haiku-worker"), "repair": (OPUS, "medium"),
          "fresh": True, "says": "Opus supervises Sonnet and Haiku workers; a fresh Opus session repairs from a brief"},
    "G": {"builder": (OPUS, "high"), "workers": ("haiku-worker",), "repair": (OPUS, "medium"), "fresh": False,
          "says": "Opus supervises a Haiku worker; Opus repairs in the same session",
          "lead": " You supervise Haiku workers: plan the work, split it into the steps you judge best, and start as many "
                  "`haiku-worker` subagents as you decide, one per step and several at once where steps are independent; "
                  "check what each returns, and do a step yourself only when that is quicker than explaining it; the "
                  "result is yours."},
}


def prompt(spec: str, combo: dict) -> str:
    """graph-loop's builder prompt for a suite-gated card, with the held branch's supervisor line."""
    lead = {2: " You supervise: plan the work, hand each step to the subagent that suits it (`sonnet-worker`, "
               "`haiku-worker`), check what each returns, and do a step yourself only when that is quicker than "
               "explaining it; the result is yours.",
            1: " You may hand a small, well-defined step to the subagent `haiku-worker`; check what it returns; "
               "the result is yours."}.get(len(combo["workers"]), "")
    lead = combo.get("lead", lead)
    return ("Implement what this spec asks, including its tests. Follow the repository's CLAUDE.md. Choose the "
            "smallest coherent solution: reuse existing code and shared functions, prefer the standard library or "
            "platform, and add an abstraction only when the spec needs it. Check your work with the tests it "
            "touches; the loop runs the full suite (`bash test/gate.sh`) after you finish and hands you any "
            "failure. And never start or wait on a background job: every wait is a paid turn. Do not commit: the "
            "loop commits. Your shell may run `git`, `sed -n`, `cat`, `head`, `tail`, `ls`, `grep`, `wc` and "
            "`bash test/gate.sh`, each as one command on its own (no pipes, `&&` or `;`) on paths inside this "
            "checkout; a refusal refuses only that command, so run the next one." + lead + f"\n\n## Spec\n\n{spec}")


def git(tree, *args) -> str:
    return subprocess.run(["git", "-C", str(tree), *args], capture_output=True, text=True, check=True).stdout


def diff(tree, base: str) -> str:
    git(tree, "add", "-A")
    return git(tree, "diff", "--cached", base)


def now() -> str:
    return datetime.datetime.now().isoformat(timespec="seconds")


class Run:
    def __init__(self, name: str):
        self.name, self.combo = name, COMBOS[name.split("-")[0]]
        self.tree, self.keep = WORK / name, HERE / "runs" / name
        self.record = {"run": name, **{k: v for k, v in self.combo.items()}, "review": REVIEW, "budget": BUDGET,
                       "started": now(), "calls": [], "rounds": []}

    def save(self, doing: str = ""):
        self.record.update(now=doing, updated=now())
        (self.keep / "run.json").write_text(json.dumps(self.record, indent=1))

    def log(self, name: str, text: str):
        (self.keep / "log" / name).write_text(text or "")

    def spent(self) -> float:
        return sum(one["cost"] for one in calls.charged(self.record["calls"]))

    def claude(self, stage: str, round_: int, text: str, use: tuple, resume: str = "") -> dict:
        model, effort = use
        self.save(f"{stage} {round_}: {model} {effort}" + (" (resumed)" if resume else ""))
        agents = {k: WORKERS[k] for k in self.combo["workers"]} or None
        out = calls.claude(text, str(self.tree), model, effort, BUDGET - self.spent(), resume, agents,
                           timeout=2700 if stage == "build" else 1800)
        usage = out.get("modelUsage") or {}
        read = sum(u.get("cacheReadInputTokens", 0) for u in usage.values())
        seen = read + sum(u.get("inputTokens", 0) + u.get("cacheCreationInputTokens", 0) for u in usage.values())
        self.record["calls"].append({
            "stage": stage, "round": round_, "model": model, "effort": effort, "resumed": bool(resume),
            "kind": out.get("subtype"), "error": bool(out.get("is_error")), "cost": out.get("total_cost_usd") or 0,
            "wall_s": out["wall_s"], "turns": out.get("num_turns"), "session": out.get("session_id"),
            "cache_read_share": round(read / seen, 3) if seen else None,
            "by_model": {m: round(u.get("costUSD", 0), 3) for m, u in usage.items()}})
        self.log(f"{stage}-{round_}.txt", str(out.get("result") or ""))
        return out

    def check(self, round_: int, out: dict, spec: str) -> str:
        """Why this round is not done ("" when it is), as the lean loop's `check` words it."""
        if out.get("is_error"):
            return f"The builder did not finish ({out.get('subtype')}): {str(out.get('result'))[:500]}"
        if not diff(self.tree, self.base).strip():
            return "Nothing changed. Make the change the spec asks for, then run the suite."
        self.save(f"suite {round_}")
        gate = calls.gate(str(self.tree))
        self.log(f"suite-{round_}.txt", gate["tail"])
        step = {"round": round_, "green": gate["passed"], "suite_s": gate["wall_s"]}
        self.record["rounds"].append(step)
        if not gate["passed"]:
            return ("Fix the red suite: the failure is shown below. Check your fix with the failing test; the loop "
                    f"runs the full suite after you.\n{gate['tail']}")
        self.save(f"review {round_}: {REVIEW[0]} {REVIEW[1]}")
        said = calls.review(spec, diff(self.tree, self.base), str(self.tree), *REVIEW)
        step.update(review=said["verdict"], findings=said["findings"], review_s=said["wall_s"])
        self.log(f"review-{round_}.txt", "\n".join(said["findings"]))
        if said["verdict"] != "ACCEPT":
            return f"Fix what the reviewer refused ({said['verdict']}): " + "; ".join(said["findings"])
        return ""

    def go(self):
        shutil.rmtree(self.tree, ignore_errors=True)
        shutil.rmtree(self.keep, ignore_errors=True)
        shutil.copytree(HERE / "seed", self.tree)
        (self.keep / "log").mkdir(parents=True)
        git(self.tree, "init", "-q")
        git(self.tree, "add", "-A")
        git(self.tree, "-c", "user.name=bench", "-c", "user.email=bench@localhost", "commit", "-qm", "seed")
        self.base = git(self.tree, "rev-parse", "HEAD").strip()
        spec = (HERE / "spec.md").read_text()
        reviewed = f"{spec}\n\n## The repository's rules\n\n{(self.tree / 'CLAUDE.md').read_text()}"
        first, start = prompt(spec, self.combo), time.time()
        out = self.claude("build", 1, first, self.combo["builder"])
        why = self.check(1, out, reviewed)
        for round_ in range(2, 2 + REPAIRS):
            if not why or out.get("is_error") or self.spent() >= BUDGET:
                break
            if time.time() - start > LATE:
                why = f"Out of time: no repair starts after {LATE // 60} minutes.\n\n{why}"
                break
            before = diff(self.tree, self.base)
            if self.combo["fresh"]:
                out = self.claude("repair", round_, f"{first}\n\n## Your last attempt failed\n\n{why}\n\nThe work so "
                                  "far is in this checkout: fix that, and keep the suite green.", self.combo["repair"])
            else:
                out = self.claude("repair", round_, f"## Your last attempt failed\n\n{why}\n\nRead the affected callers "
                                  "and fix the cause in the function that owns it, once, and keep the suite green.",
                                  self.combo["repair"], resume=out.get("session_id", ""))
            if not out.get("is_error") and diff(self.tree, self.base) == before:
                why = f"The repair changed nothing.\n\n{why}"
                break
            why = self.check(round_, out, reviewed)
        last = self.record["rounds"][-1] if self.record["rounds"] else {}
        self.record["final"] = {
            "done": not why, "green": last.get("green", False), "review": last.get("review"),
            "repairs": sum(call["stage"] == "repair" for call in self.record["calls"]), "cost": round(self.spent(), 2),
            "minutes": round((time.time() - start) / 60, 1),
            "diff_lines": diff(self.tree, self.base).count("\n"), "why": why[:2000],
            "workers": progress.workers(self.tree, {c["session"] for c in self.record["calls"]})}
        shutil.copytree(self.tree, self.keep / "game", ignore=shutil.ignore_patterns(".git", "__pycache__"))
        grade(self.name, self)


def grade(name: str, run: Run | None = None):
    run = run or Run(name)
    if run.record["calls"] == [] and (run.keep / "run.json").exists():
        run.record = json.loads((run.keep / "run.json").read_text())
    run.save("hidden checks")
    subprocess.run(["uvx", "--quiet", "--with", "playwright", "python", str(HERE / "hidden" / "checks.py"),
                    str(run.keep / "game"), "--out", str(run.keep)], capture_output=True, text=True)
    hidden = run.keep / "hidden.json"
    run.record["hidden"] = json.loads(hidden.read_text()) if hidden.exists() else {"passed": 0, "total": 0}
    run.save("finished")


def status():
    print(progress.frame(HERE, WORK))


def everything(args: list[str]):
    repeats = int(args.pop(0)) if args and args[0].isdigit() else 2
    WORK.mkdir(parents=True, exist_ok=True)
    names = [f"{combo}-{n}" for n in range(1, repeats + 1) for combo in (args or COMBOS)]
    children = [subprocess.Popen([sys.executable, __file__, "run", name], stdout=open(WORK / f"{name}.console", "w"),
                                 stderr=subprocess.STDOUT) for name in names]
    for child in children:
        child.wait()
    status()


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "status"
    if what == "all":
        everything(sys.argv[2:])
    elif what == "run":
        Run(sys.argv[2]).go()
    elif what == "brief":
        print(json.dumps(progress.everyone(HERE, WORK)))
    elif what == "watch":
        progress.watch(HERE, WORK)
    elif what == "grade":
        grade(sys.argv[2])
    else:
        status()
