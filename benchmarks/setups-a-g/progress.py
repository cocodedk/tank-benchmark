"""A live view of every run, for a person to watch: `python3 bench.py watch` (Ctrl-C leaves).

Reads, never writes: each run's `run.json`, its checkout (files and lines so far, without taking git's lock)
and its Claude session transcript (turns, workers started, the last thing it did).
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import time

import calls

CONFIG = pathlib.Path(os.environ.get("CLAUDE_CONFIG_DIR", "~/.claude")).expanduser()


def transcript(tree: pathlib.Path) -> pathlib.Path | None:
    folder = CONFIG / "projects" / str(tree).replace("/", "-").replace(".", "-")
    found = sorted(folder.glob("*.jsonl"), key=lambda p: p.stat().st_mtime)
    return found[-1] if found else None


def workers(tree: pathlib.Path, sessions: set[str]) -> int:
    """How many worker subagents a run's Claude sessions started (their transcripts sit beside the session's)."""
    folder = CONFIG / "projects" / str(tree).replace("/", "-").replace(".", "-")
    return sum(len(list((folder / s / "subagents").glob("*.jsonl"))) for s in sessions if s)


def actions(path: pathlib.Path) -> list[str]:
    """Each tool call in a transcript, as one short line."""
    said = []
    for line in path.read_text(errors="replace").splitlines():
        try:
            entry = json.loads(line)
        except ValueError:
            continue
        for part in (entry.get("message") or {}).get("content") or []:
            if isinstance(part, dict) and part.get("type") == "tool_use":
                given = part.get("input") or {}
                what = given.get("file_path") or given.get("command") or given.get("description") or ""
                said.append(f"{part['name']} {pathlib.Path(what).name if given.get('file_path') else what}"[:60])
    return said


def written(tree: pathlib.Path) -> tuple[int, int]:
    """Files changed and their lines, outside vendor/."""
    out = subprocess.run(["git", "--no-optional-locks", "-C", str(tree), "status", "--porcelain", "-uall"],
                         capture_output=True, text=True).stdout
    files = [tree / line[3:] for line in out.splitlines() if "vendor/" not in line and "__pycache__" not in line]
    lines = sum(len(f.read_text(errors="replace").splitlines()) for f in files if f.is_file())
    return len(files), lines


def facts(run: pathlib.Path, work: pathlib.Path) -> dict:
    """One run as plain values: what the live view, `bench.py brief` and the Claude Code mod show."""
    r = json.loads((run / "run.json").read_text())
    tree = work / r["run"]
    out = {"run": r["run"], "now": r["now"], "cost": round(sum(one["cost"] for one in calls.charged(r["calls"])), 2),
           "rounds": [("green" if s.get("green") else "red") + (f"/{s['review'][:3].lower()}" if s.get("review") else "")
                      for s in r["rounds"]],
           "minutes": round((time.time() - time.mktime(time.strptime(r["started"], "%Y-%m-%dT%H:%M:%S"))) / 60, 1)}
    if "hidden" in r:
        return {**out, "done": True, "minutes": r["final"]["minutes"], "hidden": r["hidden"]["passed"],
                "checks": r["hidden"]["total"]}
    out["files"], out["lines"] = written(tree) if tree.exists() else (0, 0)
    log, did, out["workers"], out["quiet"] = transcript(tree), [], 0, 0
    if log:
        did = actions(log)
        out["workers"] = len(list((log.parent / log.stem / "subagents").glob("*.jsonl")))
        out["quiet"] = int(time.time() - max([log.stat().st_mtime] + [p.stat().st_mtime for p in (log.parent / log.stem).rglob("*.jsonl")]))
    return {**out, "done": False, "calls": len(did), "last": did[-1] if did else ""}


def row(f: dict) -> str:
    rounds = " ".join(f["rounds"])
    if f["done"]:
        return f"{f['run']:4} done   ${f['cost']:5.2f} {f['minutes']:5.1f}m  {rounds:26} hidden {f['hidden']}/{f['checks']}"
    return (f"{f['run']:4} {f['now'][:30]:30} ${f['cost']:5.2f} {f['minutes']:5.1f}m  {f['files']:3} files "
            f"{f['lines']:5} lines  {f['calls']:3} calls  {f['workers']} workers  {rounds:12} last: {f['last'] or '-'}"
            + (f"  (quiet {f['quiet']}s)" if f["quiet"] > 120 else ""))


def everyone(here: pathlib.Path, work: pathlib.Path) -> list[dict]:
    return [facts(path.parent, work) for path in sorted((here / "runs").glob("*/run.json"))]


def frame(here: pathlib.Path, work: pathlib.Path) -> str:
    shown = [row(f) for f in everyone(here, work)]
    return (time.strftime("%H:%M:%S") + "  Tank benchmark: build, suite (green/red), review (acc/rej), repair; "
            "hidden checks at the end\n\n" + "\n".join(shown))


def watch(here: pathlib.Path, work: pathlib.Path, every: int = 10):
    try:
        while True:
            print("\033[2J\033[H" + frame(here, work), flush=True)
            time.sleep(every)
    except KeyboardInterrupt:
        pass
