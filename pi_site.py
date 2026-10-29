"""The pi benchmark's part of the site: pi/ is served at /pi/, and each Tower Bridge page is playable beside it.

The first benchmark's pages and games are built by gallery.py; this adds to them and never replaces them.
"""
from __future__ import annotations

import pathlib
import shutil

BRIDGES = pathlib.Path("runs") / "pi" / "tower-bridge"
NOT_SERVED = ("test", "__pycache__", "CLAUDE.md", ".gitignore", "metrics.json")
UPDATED = "2026-10-29"


def publish(here: pathlib.Path, site: pathlib.Path) -> None:
    """Copy pi/ to site/pi/, and each model's Tower Bridge page (its tests and notes stay in the repository)."""
    shutil.copytree(here / "pi", site / "pi")
    for page in sorted(p for p in (here / BRIDGES).iterdir() if p.is_dir()):
        shutil.copytree(page, site / "pi" / "tower-bridge" / page.name, ignore=shutil.ignore_patterns(*NOT_SERVED))


def sitemap_entry(origin: str) -> str:
    return f"\n  <url>\n    <loc>{origin}/pi/</loc>\n    <lastmod>{UPDATED}</lastmod>\n  </url>"


def llms(origin: str) -> str:
    return f"""## pi benchmark: {origin}/pi/

Two models, particle-1 and DeepSeek V4.1 Flash, run through the pi agent on OpenRouter at maximum thinking, each building
Tank Duel and a zoomable 2D Tower Bridge, one run each. These runs cannot be compared with setups A to G. The page
declares two read-only tools:

- describe: Says what this page shows: the pi benchmark, its models and tasks, and that it is not comparable with setups A to G.
- list_runs: Lists the four runs: task, model, seconds, tokens per second, output tokens, rounds, dollars, lines of code and tests, checks passed.

## Tower Bridge pages: {origin}/pi/tower-bridge/<model>/index.html

One playable page per model (particle-1, deepseek-v4.1-flash-1017). Each page declares four tools:

- describe: Says what is on the page: the zoom, the centre of the view and the named parts of the bridge.
- zoom_by: Multiplies the zoom about the window centre, with {{"factor": 2}}, clamped to 1 to 20.
- pan: Moves the view by dx, dy in the model's units.
- reset: Zoom 1, centred.

"""
