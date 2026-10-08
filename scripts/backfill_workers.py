"""One-off: store each finished run's worker count in its run.json, as `final.workers`.

    python3 scripts/backfill_workers.py

Counts the subagent transcripts of the run's Claude sessions in the way gallery.py used to, so the page can
read the number from run.json and no longer from one machine's transcripts. A run without `hidden` is still
in progress and is left alone. Files keep their one-space indent and their lack of a final newline.
"""
from __future__ import annotations

import json
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
import progress  # noqa: E402 — after the path line above

WORK = pathlib.Path(os.environ.get("BENCH_WORK", "~/lean-tmp/tank-bench/work")).expanduser()


def main():
    for path in sorted((HERE / "runs").glob("*/run.json")):
        run = json.loads(path.read_text())
        if "hidden" not in run:
            print(f"{run['run']}: in progress, left alone")
            continue
        run["final"]["workers"] = progress.workers(WORK / run["run"], {c["session"] for c in run["calls"]})
        path.write_text(json.dumps(run, indent=1))
        print(f"{run['run']}: {run['final']['workers']} workers")


if __name__ == "__main__":
    main()
